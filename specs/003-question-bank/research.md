# Research & Design Notes: Digital Question Bank

**Phase**: 0 — Outline & Research | **Date**: 2026-08-08

## Purpose

Resolve the technical unknowns surfaced in `plan.md`'s Technical Context before producing data-model, contracts, and quickstart artifacts. Focus areas per user directives: (1) schema exactly per `docs/data-dictionary.md`, (2) guest-no-download enforced at the query/route layer, (3) UploadThing integration points, (4) guest detail-page pattern parity.

---

## 1. UploadThing v7 integration — where the upload happens and how `fileUrl` reaches the Server Action

### Decision
Upload happens **client-side via UploadThing React components** (`UploadDropzone`/`UploadButton`), directly browser → UploadThing presigned infrastructure, gated server-side by our file router's `.middleware()` auth check. The client's `onClientUploadComplete` callback hands the uploaded file descriptor (`{ url, ufsUrl, key, etc. }`) to the component state, and the final `fileUrl` string is then passed as a **plain form field** into the `createQuestion` Server Action. No file bytes ever go through our Server Action; the Server Action only receives the resulting URL string.

### Rationale
- UploadThing's model is purpose-built exactly for this split: middleware authorizes (throws `UploadThingError` for guests/unauthorized → message reaches client), browser streams bytes directly to UploadThing, and our server never touches the file body.
- Matches Foundation reality: `uploadthing@^7.7.4` + `@uploadthing/react@^7.3.3` are already installed but unwired; `.env` already carries `UPLOADTHING_SECRET` + `UPLOADTHING_APP_ID`. UploadThing is the constitution-sanctioned storage option ("Cloudflare R2 or UploadThing").
- Server-side proxying (utapi `uploadFiles` inside the Server Action) would double the upload bandwidth through Vercel and lose progress callbacks — rejected as the primary path.

### Details / gotchas (verified against UploadThing v7 docs)
- **File router** is created server-side: `src/lib/uploadthing.ts` using `createUploadthing` + `f({ pdf: { maxFileSize: "10MB", maxFileCount: 1 }, image: { maxFileSize: "10MB", maxFileCount: 1 } })` (v7: `f(["pdf","image"], {...})` — confirm exact v7 API at implementation; the installed major is 7.x). Endpoint export type `OurFileRouter`.
- **`middleware({ req })`** must run an auth check and return `{ userId }` metadata. It must reuse the existing `auth()` session read (Auth.js v5). Throw `UploadThingError("not-authenticated")` when no session — reject uploads for guests. **Note**: the router middleware runs in the API route's request context, so `auth()` directly works (same as `notifications` route).
- **Route handler**: `src/app/api/uploadthing/route.ts` exporting `{ GET, POST }` = `createRouteHandler({ router })`. Per docs, do NOT protect the whole route behind middleware (it's called as a webhook by UploadThing); the per-endpoint `.middleware()` provides the authorization.
- **UtilityTypes** (`generateReactHelpers` / client components) in `src/lib/uploadthing.ts`; Form uses `<UploadDropzone endpoint="questionFile" onClientUploadComplete={...} />` inside the client `UploadForm`.
- **Env vars**: use the existing `UPLOADTHING_SECRET` + `UPLOADTHING_APP_ID` names already in `.env.example` (v7 supports both token & legacy naming; confirm at implementation — v7 docs mention `UPLOADTHING_TOKEN`, keep whatever the installed 7.7.4 SDK expects and update `.env.example`).

### Alternatives considered
- Server-Action-proxied upload via `utapi.uploadFiles` — rejected (double bandwidth, no progress, larger cold-start window, Server Action body limit risk).
- Pure `<a href={fileUrl}>` download without a route handler — rejected below (doesn't satisfy access-layer rule).

---

## 2. Guest-no-download enforcement at the query/route layer (never UI hiding)

### Decision (two enforcement points, mirroring the Foundation directory discipline)
1. **Query layer (SELECT whitelist)**: the question-search query functions take a `viewerRole` argument (`"guest" | Role`, same `ViewerRole` type as `searchDirectory`). For guests, the `columns:` whitelist excludes `fileUrl` entirely — the raw URL object never exists in the guest response payload. Exactly the `searchDirectory` pattern (`profile` columns whitelist verified by `scripts/verify-guest-sql.ts`).
2. **Route layer (download delivery)**: the actual file is served through an **authenticated Route Handler** `GET /api/questions/[id]/download`, which re-reads `auth()` and `canApprove`-style role check; for guests returns 401/redirect to login *before* touching the file. The download button/href always points at this route, never directly at the UploadThing CDN URL. So even a guest who guesses `/api/questions/{id}/download` is denied at the access layer. (Matches spec US-4 acceptance 2 & SC-004.)

### Why
- Constitution §II: guest access rules "MUST be enforced at the query level, never by frontend hiding" — the whitelist mechanism already proven in `searchDirectory` + `verify:guest-sql`. Extending the same discipline to questions keeps one consistent codebase story.
- UploadThing with public ACL (chosen option): files live on a hard-to-guess CDN URL. A guest must not even *receive* that URL; the app-route enforcement is the second gate that stops both URL-guessing consumers and payload leakage.

### Consequences
- `fileUrl` stored in DB cannot be the only artifact a download uses without an access check — hence the dedicated Route Handler. Detail page for guests renders metadata + "Log in to download" prompt; no `fileUrl` in the guest data payload.
- `verify-guest` style script should assert the guest question response lacks the `fileUrl` key (extend Foundation precedent — new `scripts/verify-guest-question-sql.ts`).

---

## 3. Guest question-detail page parity with the directory guest pattern

### Decision
The primary bank page (`/question-bank`) is the guest list surface (metadata cards). The guest detail page `[id]` reads `searchQuestions`-derived detail with `viewerRole="guest"`, so `fileUrl` is excluded there too, and the card shows the "Log in to download" CTA instead of a download link.

- This deliberately diverges from the *directory* guest pattern's "cards-only" rule — the spec Clarification (2026-08-08) says question detail metadata carries no contact risk, so a guest detail page is safe and serves conversion. The divergence is for the *metadata shape*, not the *access discipline*: the access-layer rule (never hand guests a file URL) is identical.

---

## 4. Batch dropdown parity (`getCurrentBatch`)

### Decision
`batchNumber` in the upload form is an integer from a dynamic dropdown `Array.from({ length: currentBatch })` using the existing `getCurrentBatch()` from `src/lib/db/queries/site-config.ts` + `CURRENT_BATCH` fallback — identical to `ProfileForm`. Batch rollover edge (changing `CURRENT_BATCH` extends dropdown; existing rows unchanged) is inherent.

---

## 5. Search & filter composition

Reuses the Foundation `buildSearchQuery`-adjacent approach but with Postgres GIN tsvector generated column for `title` (+ tags via join). Because `searchQuestions` needs AND-combined multi-filter (subject→grouped courses, batchNumber, examType, program, evening, tag existence) plus university-regular text search, the query is a **single `db.query` with `where: and(terms...)`** — not a separate language-level search layer. Tag filtering becomes `inArray`/`exists` on `question_tags.tag` where the question must match *all* tags provided. For scale (~10k rows), a tsvector generated column GIN index covers FR-006's "same shared search capability" while the multi-filter AND + pagination reuses the SC-002 target.

---

## 6. Rate limiting (reuse, no new work)

`createQuestion` must call the existing `enforceSubmissionLimit(userId)` (5/hour, from `src/lib/rate-limit.ts`) at the top — **not** the `profile-upsert` 1/hour exception. Moderators/admins bypass (same wrapper doesn't gate exempt roles at the wrapper level — the wrapper checks identity only; exemption happens because we check `canSubmitContent` first, exactly like the approve-exempt pattern). Returns retryAfter seconds on `allowed:false`.

---

## 7. Approval dashboard extension (reuse, no bespoke flow)

Register `question` in `approvalQueries` (`src/lib/db/queries/approval.ts`) and `decisionHandlers` (`approve/actions.ts`); `canApprove("question")` already resolves `["moderator","admin"]`. Handlers pass question JSON details (title, subject/program/evening, batch, examType, tags, fileUrl-for-review) into `PendingItem.details` per the existing `PendingItem` contract, and call the shared `insertNotification` on decide. No changes to `visibleResourceTypes` logic beyond the existing `question` entry.

---

## 8. Seed of `subjects`/`courses`

`src/lib/db/seed.ts` gains `seedQuestionBank()` following the existing idempotent-by-key pattern (`seedAdmin`, `seedSkills`): read `uu-cse-courses-seed.json`, dedupe `courses` by `code` (keep one row under real subject), and skip `_CHECK`-flagged rows, insert `subjects` by unique `slug`, `courses` by unique `code`, then rethrow on duplicates. `npm run db:seed` seeds them with the current batch and skills. Verified data file already has 7 subjects/71 courses/dedupe note (post-prune).

---

All unknowns resolved. No [NEEDS CLARIFICATION] remain. Constitution gates pass (see plan.md).