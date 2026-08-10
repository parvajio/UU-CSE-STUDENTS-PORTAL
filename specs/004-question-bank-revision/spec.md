# Feature Specification: Digital Question Bank — Revision (Schema, Layout & Cards)

**Feature Branch**: `004-question-bank-revision`

**Created**: 2026-08-10

**Status**: Draft

**Input**: User description: "Amend the Digital Question Bank spec: reverse the earlier subjects/courses split (drop `subjects`, flatten `courses`, no `subjectId`), replace the subject/course picker with a single searchable 'Subject/course' combobox, keep the existing `batchNumber` dropdown pattern with a quick-search affordance, add `programType`/`season`/`year`/`teacherName`, replace `questions.fileUrl` with a `question_files` table (1–5 images XOR exactly 1 pdf), add a toggleable `question_likes` table requiring login, add atomic `viewCount`/`downloadCount` counters; make migration safe by checking for real data; rework the Question Bank page into a two-column layout with a mobile drawer filter panel at 375px, live top-course/top-batch quick-select chips, an 'Upload question' button; redesign the card (course code + date, title/course/batch/examType/programType/season+year/teacher, like+view counts, Preview/Download); add a detail/preview page (image gallery or embedded PDF viewer + metadata card) incrementing viewCount on view and downloadCount on download. Update docs/data-dictionary.md including a superseded-decision note for `subjects`.]

> **Amends**: [`specs/003-question-bank/spec.md`](../003-question-bank/spec.md). This spec **reverses** the 2026-08-08 curated-catalog amendment and replaces the single-file model with a multi-file plus engagement model. Everything in spec 003 that is not explicitly amended or superseded below (approval workflow, rate limiting, free-form tags, guest metadata-only browsing, My Submissions, shared search reuse) **remains in force**. The plan phase must reconcile against spec 003 as the base, applying this spec as the revision layer.

## Superseded Decisions (Revisions)

| Area | Spec 003 (2026-08-08) | This revision (2026-08-10) |
|---|---|---|
| Classification reference | `subjects` (7 seeded categories) + `courses.subjectId`; questions use `courseId` OR `customSubject`/`customCourse` "Other" fallback | `subjects` **dropped**; `courses` is a flat standalone table (`id`, `code`, `title`, `creditHours`); questions use a single searchable combobox over `courses` with **no free-text "Other" fallback** — `customSubject`/`customCourse` are dropped (Q1: A) |
| Upload classification UX | Category-first: pick subject → then course (filtered) | Single "Subject/course" searchable combobox — search by code or title, no forced category-first step |
| Program/evening | `program` (regular\|diploma) + separate `evening` boolean | `programType` enum (`regular`\|`diploma`\|`evening`, default `regular`) — `program` and `evening` columns are **dropped** |
| Exam tenure | n/a | NEW `season` enum (`summer`\|`fall`\|`spring`) + `year` integer |
| Teacher attribution | n/a | NEW `teacherName` free text (no FK — Faculty Directory not built yet) |
| File storage | single `questions.fileUrl` (PDF or image) | NEW `question_files` table (`questionId`, `fileUrl`, `fileType` image\|pdf, `order`): 1–5 images **or** exactly 1 pdf, never both |
| Engagement | n/a | NEW `question_likes` toggle + `questions.viewCount`/`downloadCount` counters |
| Bank layout | single-column results | two-column: filter panel (left) + card grid (right); mobile drawer at 375px; live top-course/top-batch chips; "Upload question" button |
| Card content | metadata list | redesigned card per "Card Redesign" below |
| Detail page | metadata-only page (entire content tree) | Preview page: large image gallery w/ prev/next + thumbnails, or embedded PDF viewer, alongside a metadata card |

## Clarifications

### Session 2026-08-10

- Q: For a multi-image question (1–5 images), what should the single Download button / detail-page download do? → A: **A+B — per-image downloads AND a single "Download paper" ZIP.** The card's Download (and the detail page) offers a one-click ZIP of all images for image papers (direct PDF download for PDF papers), and the detail page additionally offers per-image download links. Each individual download click (per-image or ZIP) increments `downloadCount` by one. If the ZIP proves cost-prohibitive during planning, per-image download (A) is the floor; the ZIP is preferred but not blocking.
- Q: With the free-text "Other" course fallback dropped, is admin course-management in scope for this feature? → A: **Yes — a minimal in-scope admin surface** to add/edit courses (code/title/creditHours) ships with this feature, so the catalog can stay current without freezing uploads to the seed list.
- Q: Can a student like their own question? → A: **Yes — self-likes are allowed** and count normally (no special handling; the heart works on your own approved question).

**Migration-safety check (performed 2026-08-10 against the live DB):** queried the production Neon database directly — `questions` contains **exactly 1 row**, created 2026-08-08 via the real upload flow from the developer's own Google account (title `"spl"`, tag `"dmpms"`, `midterm`, batch 68, currently `approved`, with a live UploadThing `file_url`). `subjects` = 7 rows and `courses` = 70 rows are seed data only (no manual edits). **Conclusion: no real end-user content exists — the single row is developer test data.** However, because a live row with a valid file reference does exist, the migration MUST be written as the two-step data move (copy `file_url` → `question_files`, preserving `order`/`fileType`, THEN drop the column) rather than a straight destructive drop. This costs nothing extra and keeps the dev row's file link. The drop of `subjects` additionally requires dropping `courses.subjectId` (FK) first; both are covered below.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Student uploads a question paper (Priority: P1)

A logged-in student opens the upload page (via the "Upload question" button on the Question Bank page and its nav equivalent). They fill in: **title** (required), **Subject/course** — a single searchable combobox over the flattened course catalog; they can type a course code (e.g. `CSE0612301`) or part of a course title to jump straight to it, with no subject-category-first step and no free-text fallback (resolved Q1: A), **batchNumber** — the same dynamic batch dropdown used by profiles, now also quick-searchable, up to the current batch), **examType** (`previous_year`/`midterm`/`final`/`lab`/`viva`, required), **programType** (Regular / Diploma / Evening, default Regular), **season** (`summer`/`fall`/`spring`, required) + **year** (integer, required), optional **teacher name** (free text), free-form tags (one at a time, any text), and the paper file(s): **1–5 images OR exactly 1 PDF, never a mix**. They submit. The submission persists as `status = pending` and stays invisible to everyone except the submitter and role-eligible reviewers until approved. The create action validates the file rule (images-only count 1–5, or a single PDF) and the shared 5/hour content-submission rate limit applies.

**Why this priority**: Upload is the source of all bank content. The new multi-file model and flat course combobox are the most visible changes to the primary journey.

**Independent Test**: Log in as a `user`, upload a paper using the "Subject/course" combobox to pick a course by typing part of its title, with 3 images attached. Confirm a "Submitted for review" message and that the paper is invisible to other sessions. Repeat with exactly 1 PDF — accepted. Repeat with 6 images or a mixed image+PDF set — rejected at the form with a clear message, nothing sent.

**Acceptance Scenarios**:

1. **Given** I am a logged-in student, **When** I submit a question with title, a course selected from the combobox, batch, examType, programType, season, year, and 1–5 image files, **Then** the question is created with `status = pending`, my free-form tags and teacherName are stored, and I see a confirmation that it is under review.
2. **Given** I am a logged-in student, **When** I submit with a single PDF attached, **Then** the question is accepted exactly like the image case.
3. **Given** I attach more than 5 images, **When** I submit, **Then** the form blocks with a clear "maximum 5 images" message and nothing is sent.
4. **Given** I attach at least one image and a PDF together, **When** I submit, **Then** the form blocks with a clear "images or PDF, not both" message and nothing is sent.
5. **Given** I attach an unsupported file type or one over the size limit, **When** I submit, **Then** I get a clear error listing accepted types/size before any submission is recorded.
6. **Given** I have made 5 content submissions in the current hour, **When** I attempt a 6th upload, **Then** it is rejected with a retry message and no pending row is created (moderators/admins exempt — unchanged from spec 003 FR-004).
7. **Given** I search the combobox by code or by title fragment, **When** I select a course, **Then** the matching course is chosen directly — I never have to pick a subject category first, and there is no "Other" option (a course not in the catalog cannot be submitted against).

---

### User Story 2 - Moderator or admin approves or rejects a pending question (Priority: P1)

A moderator (or admin) reviews pending questions in the existing unified approval dashboard, considering the title, course, batch, examType, programType, season/year, teacher name, tags, and all attached files (images or PDF). Approve → publicly searchable; Reject → optional reason, submitter notified. Unchanged from spec 003 Story 2 except the reviewer now sees multiple files and the new fields.

**Why this priority**: The trust model is unchanged and non-negotiable (constitution §III); only the fields shown to the reviewer changed.

**Independent Test**: As a `moderator`, open the dashboard, verify a pending question shows its new fields (programType, season/year, teacher, multiple files) alongside other moderator-eligible items, approve it, and confirm it appears publicly within 5 seconds.

**Acceptance Scenarios**:

1. **Given** I am a moderator, **When** I open a pending question, **Then** I see title, course (from the combobox selection), batch, examType, programType, season/year, teacher name, tags, and all files (with fileType and ordering).
2. **Given** I click "Approve", **Then** status becomes `approved` with `approvedBy`/`approvedAt` recorded, the submitter is notified, and the question is publicly searchable within 5 seconds (SC-003).
3. **Given** I click "Reject" with an optional reason, **Then** status becomes `rejected`, it stays hidden from everyone except the submitter, and the submitter sees the reason (or a generic message if none given).
4. **Given** a concurrent reviewer acted on the same question first, **When** I act, **Then** "already processed" is shown and no duplicate decision occurs (unchanged from spec 003 FR-012).

---

### User Story 3 - Student searches, previews, likes, and downloads an approved question (Priority: P1)

A logged-in student opens the Question Bank page. The page shows an **"Upload question" button** top-right, a left **filter panel** with course search (searchable combobox over courses), batch search (quick-searchable), examType, programType, and season/year filters, and a right **card grid** of approved questions. Above/beside the filters sit **quick-select chips** for the top N most-uploaded courses and top N most-uploaded batches (live `COUNT + GROUP BY + ORDER BY + LIMIT`, no caching). Each **card** shows course code + upload date at top; title, course name, batch, examType, programType tag, season + year, teacher name in the body; and at the bottom a like count with a (togglable if logged in) heart, a view count with an eye icon, and **Preview** + **Download** actions. Clicking **Preview** opens the detail/preview page: images display large with prev/next navigation (if multiple) and a thumbnail strip; a PDF displays in an embedded viewer; a metadata card (course, batch, examType, teacher, uploader, program/season/year) sits alongside with a **Download** button. Reaching this page increments `viewCount`; clicking **Download** increments `downloadCount`. Guests reach the same page but see no file, no like button, and a "Log in to download/preview" prompt, while `viewCount` still increments on page reach.

**Why this priority**: This is the consumption journey the bank exists for — find, preview, like, download. It carries the new layout, card design, and preview page.

**Independent Test**: Log in, open the bank, confirm two-column layout, chips show current top courses/batches, filter to a course+batch, open a PDF question — embedded viewer + metadata card; click Download, confirm the file downloads and `downloadCount` increments. Like it, unlike it, confirm counts update. Repeat with an image question — gallery renders, prev/next and thumbnails work. In a private window, open the same detail URL — metadata + prompt shown, no file/like button, and direct file access is denied; `viewCount` still incremented.

**Acceptance Scenarios**:

1. **Given** I land on the Question Bank page, **Then** I see the two-column layout with the filter panel on the left and the card grid on the right, and an "Upload question" button in the top-right.
2. **Given** the bank has approved questions, **When** the page loads, **Then** top-N course and top-N batch chips appear, computed live (counts reflect current rows — no cache) and tapping a chip applies that filter.
3. **Given** I type into the course filter, **When** I search by code or title fragment, **Then** courses are suggested from the flat catalog without a category-first step.
4. **Given** I apply course + batch + examType + programType + season/year filters together, **When** I search, **Then** only approved questions matching **all** active filters appear, ordered most recent first.
5. **Given** a card in the grid, **Then** it shows course code + upload date on top; title, course name, batch, examType, a programType tag, season + year, and teacher name; and at the bottom like count + heart, view count + eye, and Preview + Download actions.
6. **Given** I am logged in, **When** I click the heart on a likeable question, **Then** my like toggles (add/remove), the count updates immediately, and double-liking never creates a duplicate (unique per user per question). Liking my own approved question works exactly the same way (session 2026-08-10, Q3).
7. **Given** I am not logged in, **When** I click the heart, **Then** I am prompted to log in and cannot like or unlike.
8. **Given** I click Preview on an image question, **When** the detail page opens, **Then** the first image displays large, prev/next navigation (for 2+ images) and a thumbnail strip allow switching, and the metadata card shows course, batch, examType, teacher, uploader, program/season/year with a Download button.
9. **Given** I click Preview on a PDF question, **Then** the PDF renders in an embedded viewer in the main area with the same metadata card alongside.
10. **Given** I reach the detail page, **When** it loads, **Then** `viewCount` for that question increments once per page view (reload/return increments again).
11. **Given** I click Download (logged in), **Then** the paper downloads (PDF directly; image papers as a one-click ZIP via the card/detail Download, with per-image downloads also available on the detail page) and `downloadCount` increments by one per actual download click (session 2026-08-10).
12. **Given** I am a guest on the detail page, **Then** I see metadata + "Log in to download" prompt, no file like button/control, no working file URL anywhere in the response, and direct file requests are denied at the access layer (unchanged from spec 003 Story 4, now also covering neither images nor PDF being served).

---

### User Story 4 - Student tracks own submissions (Priority: P2)

Unchanged from spec 003 Story 5 — each submitter sees their uploads with pending/approved/rejected status (plus new fields/files shown), and rejection reason when present, and can retry after rejection.

**Why this priority**: Visibility into submission state; unchanged behavior, carried over.

**Independent Test**: Upload, view under My Submissions as `pending`. Have a moderator reject with a reason; refresh and confirm `rejected` + reason shown.

**Acceptance Scenarios**:

1. **Given** I am a logged-in student with uploads, **When** I open "My Submissions", **Then** I see every question I've uploaded with a status badge matching its current `status`.
2. **Given** one of my questions was rejected with a reason, **When** I open it, **Then** I see the rejection reason.
3. **Given** one of my questions is approved, **When** I open it, **Then** I can preview/download it (I own it) and see its new fields.

---

### Edge Cases

- **Migration with existing rows**: the live DB has exactly 1 (developer test) question row with a file URL — the migration copies its `file_url` into `question_files` (as a `pdf` or `image` by extension, `order = 0`) before dropping `questions.file_url`; `subjects` is removed only after `courses.subjectId` is dropped. Verified 2026-08-10.
- **Zero-file question**: never created — validation requires file(s) at upload; any legacy row with no `question_files` after migration is treated as invalid and flagged in the approval dashboard.
- **Mixed or oversized file set**: rejected at the form (and re-validated at the action level) — 1–5 images XOR exactly 1 pdf; size/type limits per spec 003 FR-002.
- **Double-like race**: two simultaneous like clicks from the same user — the unique `(questionId, userId)` constraint plus an idempotent toggle mean at most one like row; the count never drifts.
- **Counter accuracy under concurrency**: `viewCount`/`downloadCount` use atomic increment (`x = x + 1`); concurrent arrivals must not lose increments.
- **Guest detail page**: guests see metadata only, no file (image or PDF), no like control; `viewCount` still increments, `downloadCount` never (they cannot reach the download path).
- **Question with file(s) in storage but denied at access layer**: file URLs are never included in guest payloads; direct requests are denied at the route/access layer.
- **Empty top-N chips**: if there are no approved questions, chips show an empty/disabled state rather than an error.
- **Mobile filter drawer at 375px**: the filter panel collapses into a drawer/accordion above the grid; it must be fully usable at 375px width (scrollable chip row horizontally, no page-level horizontal scroll) — this addresses the earlier mobile-responsiveness finding, not just visual shrinkage.
- **Batch rollover**: `batchNumber` remains the dynamic dropdown up to `CURRENT_BATCH`; existing questions keep their original batch and new uploads see the extended range (unchanged from spec 003).
- **Unlisted course**: out of scope for submission — the combobox only offers curated `courses`, so an unlisted course cannot be uploaded against (Q1: A). The in-scope admin add/edit surface (FR-030, Q2 session 2026-08-10) keeps the catalog current — once an admin adds a course, it appears immediately in the upload combobox and the course filter.

## Requirements *(mandatory)*

### Functional Requirements

*Numbering continues the base spec; "✓ amends" marks requirements that alter spec 003 entries, and the superseded list at the end details replaced FRs.*

- **FR-014**: The `subjects` table MUST be removed entirely. `courses` MUST be a flat standalone table of exactly `id`, `code` (unique), `title`, `creditHours` — no `subjectId` FK and no subject grouping.
- **FR-015**: The upload form's Subject/course field MUST be a single searchable combobox over `courses`, matching by course code or title fragment, labeled **"Subject/course"** in the UI. It MUST NOT require selecting a subject category before choosing a course, and it MUST NOT offer a free-text "Other" fallback — a course is always selected from the catalog (Q1: A). The `questions.customSubject` and `questions.customCourse` columns MUST be dropped.
- **FR-016**: `questions.batchNumber` MUST keep the existing integer dynamic-dropdown pattern (generated up to `CURRENT_BATCH`). It MUST additionally be quick-searchable (typing narrows the dropdown) — a search affordance, not a bare select.
- **FR-017**: `questions` MUST add `programType` (enum `regular` | `diploma` | `evening`, default `regular`, required), `season` (enum `summer` | `fall` | `spring`, required), and `year` (integer, required). The prior `program` and `evening` columns MUST be dropped and replaced by `programType`.
- **FR-018**: `questions` MUST add `teacherName` (free text, optional). It MUST NOT be a foreign key in this phase — the Faculty Directory is not built yet; a real reference is revisited when it exists (documented deferred decision).
- **FR-019**: `questions.fileUrl` MUST be replaced by a `question_files` table with `id`, `questionId` (FK → questions.id, `onDelete: CASCADE`), `fileUrl`, `fileType` (enum `image` | `pdf`), and `order` (integer). Every question MUST hold either **1–5 image files** (`fileType = image`, `order` 0..n in display order) **or exactly 1 PDF** (`fileType = pdf`), never both and never zero — enforced at the app/validation layer (form + server action), not as a DB constraint.
- **FR-020**: A new `question_likes` table MUST store `id`, `questionId` (FK → questions.id, `onDelete: CASCADE`), `userId` (FK → users.id, `onDelete: CASCADE`), `createdAt`, with a **unique constraint on `(questionId, userId)`** to prevent double-liking. Toggling a like MUST require login; guests MUST be prompted to log in. A user MAY like their own approved question — self-likes count normally (session 2026-08-10, Q3).
- **FR-021**: `questions` MUST add `viewCount` and `downloadCount` as integer counters (default 0). They MUST increment atomically (`UPDATE ... SET x = x + 1`) with no per-user tracking and no login required for `viewCount`. `viewCount` MUST increment when the detail/preview page is reached; `downloadCount` MUST increment by one for EACH actual download click (a per-image click, or the ZIP "Download paper" click — session 2026-08-10), which is login-gated per the role matrix.
- **FR-022**: The Question Bank page MUST be a two-column layout: a filter panel on the left (course search, batch search, examType, programType, season/year) and the approved-question card grid on the right. On mobile the filter panel MUST collapse into a drawer/accordion above the grid and MUST be fully usable at 375px width — functional, not merely visually shrunk.
- **FR-023**: Quick-select chips MUST appear above/beside the filter panel showing the top N most-uploaded courses and top N most-uploaded batches among approved questions, queried live (`COUNT` + `GROUP BY` + `ORDER BY` + `LIMIT`) with **no caching layer** — matching the `CURRENT_BATCH` no-cache decision from Foundation. Tapping a chip MUST apply that filter. (N = 5 default; see Assumptions.)
- **FR-024**: An "Upload question" button MUST appear top-right on the Question Bank page, routing logged-in users to the upload page (guests to login).
- **FR-025**: The question card MUST display: top — course code + upload date; body — title, course name, batch, examType, a programType tag (Regular/Diploma/Evening), season + year, teacher name; bottom — like count (togglable heart when logged in) + view count (eye icon) on one side, and Preview + Download actions on the other.
- **FR-026**: The detail/preview page (reached via Preview) MUST render, in the main area: for images — a large display with prev/next navigation (when 1+ images — nav when multiple) and a thumbnail strip below/beside for quick switching; for a PDF — a large embedded PDF viewer in the same area. A metadata card alongside MUST show course, batch, examType, teacher, uploader, program/season/year and a **Download** button. For image questions, the Download action offers BOTH a one-click ZIP of all images (per-image download links are also available on the detail page); for PDF questions it downloads the PDF directly (Q1 session 2026-08-10).
- **FR-027**: Guest access rules from spec 003 (FR-007/FR-008) MUST remain: guests search and view approved question metadata and the detail page, see like/view counts, see a "Log in to download" prompt, but MUST receive no file (image or PDF), no like control, and no working file URL in any response — enforced at the access layer.
- **FR-028**: The migration MUST be safe for the verified state: `file_url` is copied into `question_files` for existing rows (extending fileType from the URL, `order = 0`) BEFORE the column is dropped; `courses.subjectId` is dropped before the `subjects` table is removed. [Migration-safety verification documented in Clarifications — 1 dev/test row exists; two-step path selected conservatively.]
- **FR-029**: `docs/data-dictionary.md` MUST be updated to reflect this revision — the `subjects` table is a **superseded/reversed decision** recorded as a history note (same pattern as the alumni-table history note), not silently deleted; `questions` (new fields, `fileUrl` moved), `courses` (flat), `question_files`, and `question_likes` documented.

- **FR-030**: A minimal admin course-management surface MUST ship with this feature (session 2026-08-10, Q2): admins can add a course (`code` unique, `title`, `creditHours`) and edit a course's `title`/`creditHours`. A course referenced by one or more questions MUST NOT be deletable (FK `restrict` — deletion of referenced courses is out of scope). Courses added by an admin MUST appear immediately in the upload combobox and in the course filter.

**Superseded (spec 003 requirements replaced by this revision):** FR-001a (subject→course cascade + Other classification), FR-001c (program + evening flags), FR-005a (seeding `subjects`), and the parts of FR-001/FR-005 referencing subject-grouped course filters. SC-004a (courseId XOR custom classification) and SC-004b (program/evening validity) are replaced by the new validation rules. Everything else in spec 003's FRs stands unless listed above.

### Key Entities

- **Course**: a flat, standalone catalog entry — `id`, unique `code`, `title`, `creditHours`. No subject parent. The single source for "Subject/course" selection in upload and filters.
- **Question**: a past exam upload — `id`, `title` (+ search vector), `courseId` (FK → courses.id), `batchNumber` (integer, dynamic dropdown), `programType` (regular | diploma | evening), `season` (summer | fall | spring), `year` (integer), `teacherName` (free text), `examType` (previous_year | midterm | final | lab | viva), `viewCount`, `downloadCount`, `uploadedBy` (FK → users.id, nullable, SET NULL), plus the universal `status`/`approvedBy`/`approvedAt` columns.
- **QuestionFile**: the paper's files — `id`, `questionId` (FK CASCADE), `fileUrl`, `fileType` (image | pdf), `order`. A question has 1–5 image rows or exactly 1 pdf row.
- **QuestionLike**: an engagement record — `id`, `questionId` (FK CASCADE), `userId` (FK CASCADE), `createdAt`, unique `(questionId, userId)`.
- **QuestionTag**: unchanged join record from spec 003 (questionId, tag; free-form vocabulary).
- **User**: unchanged — uploader (student/moderator/admin), reviewer (moderator/admin), or liker (logged-in user).

## Success Criteria *(mandatory)*

- **SC-001**: A student can complete and submit a multi-file question upload (course via combobox + one tag + files) in under 5 minutes. *(Post-launch manual metric.)*
- **SC-002**: Search results over up to 10,000 approved questions return within 2 seconds (reusing the portal-wide scale target, spec 002 SC-008).
- **SC-003**: An approved question is publicly searchable within 5 seconds of approval (unchanged).
- **SC-004**: No guest response ever contains a working file URL (images or PDF) and every direct file request from a guest is denied — verified by payload check + fetch test (unchanged scope, now covering both file types).
- **SC-005**: 100% of question rows use the universal `status`/`approvedBy`/`approvedAt` columns.
- **SC-006**: A moderator can locate, review, and decide a pending question (with all new fields/files visible) in under 30 seconds.
- **SC-007**: A rate-limited upload returns a retry-after message (unchanged contract).
- **SC-008**: 100% of questions have either 1–5 `image` files or exactly 1 `pdf` file — never both, never zero (schema + validation-layer verification).
- **SC-009**: Like/unlike toggling never exceeds 0 or 1 like per (user, question) — verified by the unique constraint and a double-click test.
- **SC-010**: `viewCount` and `downloadCount` match actual page reaches and downloads (atomic increments: N sequential requests produce exactly +N; spot-checked).
- **SC-011**: The Question Bank page renders and operates correctly at a 375px viewport — filter drawer opens/closes, filters and chips are usable, no page-level horizontal scroll.
- **SC-012**: Top-N chips reflect live repository counts at the moment of load — verified by adding an approved question and re-loading; the chip ordering/count changes without cache flush.
- **SC-013**: 100% of questions carry a valid `programType`, `season`, and `year` (schema check), and every question maps to exactly one `courseId` from the flat `courses` catalog — no question with a null `courseId` or any residual `customSubject`/`customCourse` value.

## Assumptions

- **A-13**: "Top N" = **5** for both courses and batches (chosen chip text "Top courses"/"Top batches"). Adjustable at plan time; the requirement is live-query behavior, not a specific N.
- **A-14**: `season` and `year` are required at upload (kept meaningful for filters and the card), `teacherName` is optional free text.
- **A-15**: `programType = evening` replaces the old `evening` boolean (a single mutually-exclusive enum, default `regular`), so a paper is exactly one of Regular/Diploma/Evening.
- **A-16**: The existing storage/upload service (10 MB, PDF/PNG/JPEG) is reused; `question_files` maps one DB row per stored object. File ordering for images is taken from upload order; PDFs always have `order = 0`.
- **A-17**: View counting treats each page load as one view (no per-user/IP dedup — counters are intentionally simple, per the requirement).
- **A-18**: The migration's one existing row is developer test data (verified 2026-08-10); the two-step data move preserves it regardless, so no loss either way. No backfill for likes/counters is needed (no legacy data).
- **A-19**: `courses` remains a curated reference table. Because the "Other" fallback is dropped (Q1: A), a **minimal admin course add/edit surface ships in-scope with this feature** (session 2026-08-10, Q2); the catalog stays current via that surface rather than a future module.
- **A-20**: Spec 003's unchanged requirements (approval flow, shared 5/hour rate limit, free-form tags, guest metadata-only access, My Submissions, shared search reuse, notifications) are adopted as-is by reference, not restated here.