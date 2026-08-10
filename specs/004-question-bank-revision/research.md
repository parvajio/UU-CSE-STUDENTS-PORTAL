# Research & Design Notes: Digital Question Bank — Revision

**Phase**: 0 — Outline & Research | **Date**: 2026-08-10

## Purpose

Resolve the technical unknowns introduced by the 004 revision before producing data-model, contracts, and quickstart artifacts. The 003 research that still applies (UploadThing browser-direct upload, guest-URL denial discipline, batch dropdown parity, shared rate limit, approval dashboard reuse) is adopted by reference — this file covers only the NEW questions: multi-file model, client-side ZIP, embedded PDF viewing, searchable comboboxes, live top-N chips, engagement counters, and the migration of the shipped 003 schema.

---

## 1. Multi-file upload: 1–5 images XOR exactly 1 pdf

### Decision
UploadThing router `questionFile` is reconfigured to allow **multiple** files, and the exclusive rule (images-only 1–5, or a single pdf) is enforced **above** the router:

- **Router** (`src/lib/uploadthing.ts`): `image: { maxFileSize: "10MB", maxFileCount: 5 }`, `pdf: { maxFileSize: "10MB", maxFileCount: 1 }`. The router rejects >5 images or >1 pdf at the upload step.
- **Client** (`UploadForm`): before upload, the selected file set is validated — all images (1–5) XOR exactly 1 pdf, else a clear inline error and no upload starts. The UploadThing `onClientUploadComplete` collects each uploaded file's `url`/`ufsUrl` + the order the user sees.
- **Server Action** (`createQuestion`): Zod schema validates a `files` array (1–5 items all `fileType: "image"`, or exactly 1 item `fileType: "pdf"`), then inserts the question row + `question_files` rows (with `order` 0..n) in one `db.batch` — mirroring the existing question+tags batch.

### Rationale
UploadThing's `maxFileCount` is per-type but cannot express cross-type XOR; the app layer (client pre-check + Zod in the action) owns that rule. A DB constraint can't cleanly express "1–5 images OR 1 pdf" either, so the spec's "enforce at the app/validation layer" is the correct and simplest seat.

### Alternatives considered
- Two separate router endpoints (`questionImages`, `questionPdf`) — rejected: more surface for no gain; the XOR still needs app-side enforcement.

---

## 2. Client-side ZIP bundling for multi-image downloads

### Decision
For image papers, the "Download paper" action (card + detail) bundles all images into a single ZIP **in the browser** using `jszip` (new dependency): the client fetches each image URL (public ACL, authed context only) and triggers a blob download. Per-image download links remain available on the detail page. Each actual download click (ZIP or per-image) calls a `downloadCount` increment (FR-021).

### Rationale
- No serverless streaming dependency on Vercel; the fetch+zip happens on the user's machine.
- Keeps download gating intact: the download *route* that increments the counter and authorizes is still required; for ZIP, the client calls the authorized route (or a lightweight `recordDownload` action) and separately fetches the public CDN URLs that only an authed server component ever disclosed.
- If `jszip` proves problematic at implementation (bundle size, memory on very large scans), the clarified fallback is per-image downloads only.

### Alternatives considered
- Server-side archiver (e.g. `archiver`/`yazl` in the Route Handler) — rejected: Vercel serverless functions have request-time limits; streaming external CDN fetch → zip through a function adds latency/cold-start cost with no user benefit.
- Single-page image download only — rejected by clarification (user chose A+B).

---

## 3. Embedded PDF viewer

### Decision
The detail page renders a PDF paper in an embedded viewer **only for authorized viewers** using a plain `<iframe>`/`<object data={fileUrl}>` pointing at the public CDN URL, plus a "Download" CTA fallback (some browsers/in-app viewers don't render). The server component decides by `viewerRole`: guests get the "Log in to download/preview" prompt and never receive the URL; logged-in users get the viewer.

### Rationale
- The CDN URL is public-ACL, so a browser embed works without a proxy. The gating requirement (SC-004) is that the URL must never reach a guest — satisfied because the URL is only present in the authed server-component payload.
- No heavy client PDF library needed for MVP; `<iframe>` handles modern mobile browsers acceptably. Revisit pdf.js if print/annotation needs appear (out of scope).

### Alternatives considered
- `pdfjs-dist` canvas renderer — rejected for MVP (bundle weight, no feature need beyond viewing).

---

## 4. Searchable comboboxes (course + batch quick-search)

### Decision
Build a small `CourseCombobox` component from the already-installed `@radix-ui/react-popover` + `Popover`/`Command`-style list: a text input that filters the flat `courses` list by `code` OR `title` (substring, case-insensitive), arrow-key navigation, click-to-select. Reused in the upload form and the filter panel. The batch filter gets the same quick-search treatment over `Array.from({ length: currentBatch })`.

### Rationale
- The repo has no `combobox`/`command` shadcn primitive; Radix Popover is already a dependency, so this adds no new UI dependency. A controlled input + memoized filter is ~80 lines and matches the design system's flat minimal inputs.
- No category-first step (FR-015) falls out naturally: the list is flat courses only.

### Alternatives considered
- shadcn `Command`/cmdk dependency — rejected: new dependency for a list we can render ourselves.

---

## 5. Live top-N chips (courses + batches)

### Decision
The bank page runs two aggregate queries over **approved** questions, uncached (FR-023):
`SELECT courseId, COUNT(*) FROM questions WHERE status='approved' GROUP BY courseId ORDER BY COUNT(*) DESC, MAX(createdAt) DESC LIMIT 5` (course title/code joined for labels) and the analogous `GROUP BY batchNumber`. Run in parallel with the main search query via `Promise.all`.

### Rationale
- Live `COUNT+GROUP BY` on ~10k rows is cheap; no cache layer per the explicit no-cache decision (mirrors `getCurrentBatch`).
- Index `(status, courseId)` and `(status, batchNumber)` serve both the chips and the filtered listing.

### Alternatives considered
- Cached counters table — rejected (no-cache requirement, premature complexity).

---

## 6. Engagement counters & like toggle

### Decision
- `viewCount`: the server detail component runs `UPDATE questions SET view_count = view_count + 1 WHERE id = ?` (atomic) on page reach, before/alongside the read. No dedup (A-17); bots inflate — accepted.
- `downloadCount`: incremented by the authorized download path on each actual click. For direct (non-ZIP) downloads, the existing Route Handler increments before redirecting. For the client-side ZIP, the client calls a thin `recordDownload` server action (auth-gated) that increments, then bundles.
- Like toggle: `POST /api/questions/[id]/like` Route Handler — `auth()` required (else 401/redirect), toggles row presence in `question_likes` (insert on like, delete on unlike), relies on the unique `(questionId, userId)` constraint for race safety (insert conflict → treat as already-liked, no error), returns `{ liked, count }`. Not rate-limited (a like is not a content submission).

### Rationale
- Atomic `SET x = x + 1` satisfies SC-010 without per-user tracking. The like route returns fresh counts so the heart can update without a full revalidation.

### Alternatives considered
- Server Actions for like — rejected: the toggle needs a fresh count response for an optimistic UI and is a non-form mutation; a small Route Handler is the cleaner HTTP contract.
- Deferring `downloadCount` for ZIPs — rejected: FR-021 says every actual download click counts.

---

## 7. Migration of the shipped 003 schema (verified live state)

### Decision — one migration `0005_*` (two-step, data-preserving)
Verified 2026-08-10: live DB has exactly 1 question row (developer test, `file_url` set, approved), 7 subjects / 70 courses seed rows. Migration steps, in order:

1. `CREATE TYPE question_program_type AS ENUM ('regular','diploma','evening')`, `question_season AS ENUM ('summer','fall','spring')`, `question_file_type AS ENUM ('image','pdf')`.
2. `CREATE TABLE question_files (id uuid pk default gen_random_uuid(), question_id uuid NOT NULL REFERENCES questions(id) ON DELETE CASCADE, file_url text NOT NULL, file_type question_file_type NOT NULL, order_ int NOT NULL)`; btree `(question_id, order_)`.
3. **Two-step data move**: `INSERT INTO question_files (question_id, file_url, file_type, order_) SELECT id, file_url, CASE WHEN file_url ~* '\.(png|jpe?g|webp|gif)' THEN 'image' ELSE 'pdf' END, 0 FROM questions WHERE file_url IS NOT NULL AND file_url <> ''` — copies the existing row's URL before any drop.
4. `CREATE TABLE question_likes (id uuid pk, question_id uuid NOT NULL REFERENCES questions(id) ON DELETE CASCADE, user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE, created_at timestamptz not null default now(), UNIQUE (question_id, user_id))`.
5. `ALTER TABLE questions ADD COLUMN program_type question_program_type NOT NULL DEFAULT 'regular'`, `season question_season`, `year int`, `teacher_name text`, `view_count int NOT NULL DEFAULT 0`, `download_count int NOT NULL DEFAULT 0`. Backfill: `year`/`season` from the single dev row if derivable, else NULL-tolerant NOT NULL is a problem — **use NULLable `season`/`year` in the migration, set `NOT NULL` at app level** if needed, or backfill from `created_at`. Simplest safe path: add nullable, backfill the one row, then enforce NOT NULL at app layer (matches the `studentId` nullable-but-required precedent).
6. Drop obsolete columns AFTER the data move: `questions.file_url`, `questions.custom_subject`, `questions.custom_course`, `questions.program`, `questions.evening` — with their indexes (`idx_questions_program_evening`, any custom-column indexes). Drop `courses.subject_id` + its index, then `DROP TABLE subjects` (and its relations only in code).
7. Drop now-unused enum `question_program` only after `questions.program` is gone.

### Rationale
- The spec requires the two-step move whenever any row exists; the verified single test row is preserved rather than destroyed.
- `year`/`season` backfill is unknowable for the test row — nullable-at-DB + app-required matches the established `studentId` precedent and avoids a destructive default.
- Order matters for FK/enum dependencies; Drizzle `generate` won't emit step 3 automatically — the migration SQL is manually edited (like the `pg_trgm` precedent) to insert the `INSERT...SELECT` between create and drop.

### Alternatives considered
- Clean destructive drop (spec allowed it for "no real data") — rejected conservatively: a live row exists, the two-step costs nothing.
- Squashing 0004 into 0005 — rejected: additive-only history is the repo convention (see `0003` note).

---

## 8. Data dictionary sync (FR-029)

`docs/data-dictionary.md` gains: `subjects` as a **superseded/reversed decision** history note (mirroring the alumni-table note, not a silent delete); `courses` flattened (no `subjectId`); `questions` updated (new fields, `fileUrl` → `question_files`); new `question_files` + `question_likes` tables; `resolved decisions` entry for this revision. This happens before implementation (single source of truth).

---

All unknowns resolved. No [NEEDS CLARIFICATION] remain. Constitution gates pass (see plan.md).
