# Tasks: Digital Question Bank — Revision (Schema, Layout & Cards)

**Input**: Design documents from `/specs/004-question-bank-revision/` (plan.md, spec.md, research.md, data-model.md, contracts/)

**Prerequisites**: 003 Question Bank shipped (migration `0004` applied, seed run, `subjects`/`courses`/`questions`/`question_tags` schema, UploadThing wired, approve dashboard + `question` handler live, guest-download discipline in place). Live DB has exactly 1 dev/test question row (`file_url` set) — the migration preserves it via a two-step data move.

**Organization**: Tasks are grouped by user story so each story can be implemented and tested independently. Schema/migration revision (Setup) and the shared query/types layer (Foundational) block every story.

**Tests**: No TDD test suite is requested by the spec. Verification is functional via `specs/004-question-bank-revision/quickstart.md` scenarios + the access-layer script `scripts/verify-guest-question-sql.ts` (extended in T041). Playwright e2e for SC-004/008/009/010/011/012 is run as part of the final Polish validation task (T043).

## Path Conventions

- Single Next.js app, `src/` at repo root. Server Actions in `src/app/(route-group)/<feature>/actions.ts`; Route Handlers in `src/app/api/...`; DB queries in `src/lib/db/queries/`; schema in `src/lib/db/schema/` (relations centralized in `relations.ts`).
- Migration `0005` is generated with `drizzle-kit` then **manually edited** (like the `pg_trgm` precedent): the `file_url` → `question_files` `INSERT…SELECT` MUST sit between the new-table creates and the column drops.
- Guest gating: `searchQuestions`/`getQuestionDetail` take `viewerRole` and exclude the `files` array + `isLikedByViewer` from guest payloads; downloads/likes only via authed Route Handlers.
- `docs/data-dictionary.md` is the schema source of truth — update it FIRST (FR-029), then code.

---

## Phase 1: Setup (Schema & Migration Revision)

**Purpose**: Apply the 004 schema deltas per `data-model.md` — flatten `courses`, revise `questions`, add `question_files` + `question_likes`, remove `subjects`, migrate `0005` with the two-step data move, reseed, and sync the data dictionary.

- [X] T001 [P] Rework `src/lib/db/schema/courses.ts` — remove `subjectId` FK + import (drop the column in migration); `courses` = id (uuid PK), code (text unique notNull), title (text notNull), creditHours (numeric notNull), createdAt; drop the `subjectIdIdx` index
- [X] T002 [P] Rework `src/lib/db/schema/questions.ts` — add pgEnums `question_program_type` (`regular|diploma|evening`, default `regular`) and `question_season` (`summer|fall|spring`); add columns `programType`, `season`, `year` (integer) — all nullable at DB, app-required (studentId precedent) — plus `teacherName` (text, nullable), `viewCount` + `downloadCount` (integer notNull default 0); DROP columns `customSubject`, `customCourse`, `program`, `evening`, `fileUrl`; drop `idx_questions_program_evening`; keep `title_tsv` GIN index and `(status, batchNumber)`; keep `courseId` FK (old columns removed from module)
- [X] T003 [P] Create `src/lib/db/schema/question-files.ts` — `questionFiles` per data-model.md: id (uuid PK), questionId (uuid FK → questions.id `onDelete: "cascade"`), fileUrl (text notNull), fileType (pgEnum `question_file_type` `image|pdf`), order (integer notNull), createdAt; btree `(questionId, order)`
- [X] T004 [P] Create `src/lib/db/schema/question-likes.ts` — `questionLikes` per data-model.md: id (uuid PK), questionId (uuid FK → questions.id `onDelete: "cascade"`), userId (uuid FK → users.id `onDelete: "cascade"`), createdAt; **uniqueIndex `(questionId, userId)`** (double-like prevention, SC-009)
- [X] T005 [P] Delete `src/lib/db/schema/subjects.ts`; update `src/lib/db/schema/index.ts` — remove `./subjects` export, add `./question-files`, `./question-likes`
- [X] T006 Rework `src/lib/db/schema/relations.ts` — delete `subjectsRelations`; `coursesRelations` loses `subject`; `questionsRelations` adds `many(questionFiles)` + `many(questionLikes)` (keep `course`, `uploader`, `approver`, `questionTags`); add `questionFilesRelations` (one question) and `questionLikesRelations` (one question, one user); remove dead imports (T001/T005)
- [X] T007 Run `npm run db:generate`, then **manually edit** the generated `0005_*` migration and run `npm run db:migrate`: (a) after creating `question_files`, INSERT `INSERT INTO question_files (question_id, file_url, file_type, order_) SELECT id, file_url, CASE WHEN file_url ~* '\.(png|jpe?g|webp|gif)$' THEN 'image'::question_file_type ELSE 'pdf'::question_file_type END, 0 FROM questions WHERE file_url IS NOT NULL AND file_url <> ''` (two-step data move BEFORE any drop); (b) `ALTER TABLE questions ALTER COLUMN course_id SET NOT NULL` (safe: no null rows verified); (c) drop `questions.file_url/custom_subject/custom_course/program/evening`, drop `courses.subject_id` + its index, `DROP TABLE subjects`, then drop enum `question_program`. Verify in psql: `question_files` populated from the existing dev row, `subjects` gone, dropped columns gone, `course_id` NOT NULL
- [X] T008 Rework `src/lib/db/seed.ts` — remove subjects seeding from `seedQuestionBank()`; keep courses idempotent-by-`code` (dedupe rule unchanged); log `[seed] subjects: removed, courses: N`; run `npm run db:seed` and verify 0 subjects / 70 courses in psql
- [X] T009 Update `docs/data-dictionary.md` (FR-029) — `subjects` becomes a **superseded/reversed decision history note** (mirror the alumni-table note, not a silent delete); `courses` flattened (no `subjectId`); `questions` gains programType/season/year/teacherName/viewCount/downloadCount and drops customSubject/customCourse/program/evening/fileUrl; add `question_files` + `question_likes` tables; add a Resolved Decisions entry referencing `specs/004-question-bank-revision/spec.md` (classification combobox-only, admin course management FR-030, per-image+ZIP downloads)

**Checkpoint**: Schema migrated + reseeded safely (existing row preserved); data dictionary authoritative for the revision. Story work can begin.

---

## Phase 2: Foundational (Shared Types & Query Layer)

**⚠️ CRITICAL**: No user story UI can render until these exist.

- [X] T010 Rework `src/types/question-bank.ts` — `ProgramType` (regular|diploma|evening), `Season` (summer|fall|spring); `QuestionFilterParams` drops `subjectId`/`program`/`evening` and adds `programType`/`season`/`year`; `QuestionCardBase`/`QuestionDetail` add programType, season, year, teacherName, likeCount, viewCount, downloadCount, courseCode/courseTitle always present; `isLikedByViewer` + `files: QuestionFileDraft[]` only on non-guest variants; drop `customCourse`/`subjectName`-option types
- [X] T011 [P] Rework `src/lib/question-bank/constants.ts` — remove `OTHER_COURSE`, `EVENING_TRUE/FALSE`; add `TOP_CHIPS_N = 5`, `PROGRAM_TYPE_LABELS`, `SEASON_LABELS`, `FILE_TYPE_LABELS`
- [X] T012 [P] Rework `src/lib/question-bank/filters.ts` — parse `programType` (validated against the new enum), `season`, `year`; drop `subjectId`/`program`/`evening`/custom parsing
- [X] T013 Rework `src/lib/question-bank/validation.ts` — Zod: `courseId` REQUIRED (uuid), `programType` enum (default `regular`), `season` enum, `year` integer, `teacherName` optional string; **`files` array rule (Q-004)**: 1–5 items all `fileType="image"` XOR exactly 1 item `fileType="pdf"` (superRefine), each `{ fileUrl: https-url, fileType, order }`; drop customSubject/customCourse/program/evening/fileUrl fields
- [X] T014 [P] Rework `src/lib/uploadthing.ts` — `questionFile` router: `image: { maxFileSize: "10MB", maxFileCount: 5 }`, `pdf: { maxFileSize: "10MB", maxFileCount: 1 }` (cross-type XOR enforced app-side per research §1); `.middleware()` auth unchanged; `.onUploadComplete()` aggregates uploaded descriptors back to the client (no DB write)
- [X] T015 [P] Rework `src/lib/db/queries/catalog.ts` — `getCourses(): Promise<CourseOption[]>` flat (id, code, title, creditHours; sort by title); drop `getSubjectsWithCourses`/subject grouping; keep `getCatalog()` alias → `getCourses`
- [X] T016 Rework `src/lib/db/queries/question-bank.ts` — `searchQuestions(params, viewerRole, viewerUserId?)`: filters `courseId` (joined course code/title), `batchNumber`, `examType`, `programType`, `season`, `year`, tags (EXISTS), free text via `buildUniversalTerm` (OR of title `title_tsv` tsvector, course code/title + tag + submitter-name EXISTS `ilike`, `teacherName` `ilike`, season/program label matches, and year/batch for numeric terms); select likeCount (COUNT over `question_likes`), viewCount, downloadCount, and — for non-guests only — `isLikedByViewer` (EXISTS on `question_likes` by viewerUserId) and `files`; **guest columns exclude `question_files` entirely**; order by createdAt desc; paginate. Add `getTopCoursesAndBatches(n = TOP_CHIPS_N)`: live `COUNT+GROUP BY` over `status='approved'` by `courseId` and `batchNumber`, `ORDER BY count DESC, MAX(createdAt) DESC LIMIT n`, courses joined for code/title label. Add `incrementViewCount(id)` atomic `UPDATE questions SET viewCount = viewCount + 1 WHERE id = ?`
- [X] T017 Rework `src/lib/db/queries/question-bank.ts` `getQuestionDetail(id, viewerRole, viewerUserId?)` — new columns + course code/title/creditHours, likeCount/viewCount/downloadCount, `isLikedByViewer` (non-guest), `files` array ordered by `order` (non-guest only), tags, submitter name; guest payload excludes files; `null` unless `status='approved'`. `viewCount` increments at the page boundary (T032) exactly once per request to preserve SC-010 with `generateMetadata` reading detail without double counting.

**Checkpoint**: Shared types + queries ready (search, detail, chips, counters); stories can be built in parallel.

---

## Phase 3: User Story 1 - Student Uploads a Question Paper (Priority: P1) 🎯 MVP

**Goal**: A logged-in student uploads a paper with the "Subject/course" combobox (flat catalog), batch quick-search, programType/season/year, optional teacherName, free tags, and a 1–5 images XOR 1 pdf file set → `pending`, invisible to others, under the shared 5/hour limit.

**Independent Test**: Upload as `user`: pick a course by typing code OR title (no subject step, no "Other"); attach 3 images → "Submitted for review", row `status='pending'` (psql), invisible to guests/other users. Repeat with 1 pdf → accepted (1 `question_files` `pdf` row). 6 images, 2 pdfs, or image+pdf mix → inline rejection, nothing sent. Wrong type/>10MB → UploadThing error. 6th upload in the hour → retryAfter. `courseId`, `programType`, `season`, `year` populated correctly.

### Implementation for User Story 1

- [X] T018 [US1] Rework `src/app/(user)/upload-question/actions.ts` — `createQuestion(input)`: `auth()` or redirect; Zod-validate the revised schema (T013) incl. the files XOR rule; re-verify course exists + `batchNumber ≤ getCurrentBatch()`; `enforceSubmissionLimit(userId)` (staff exempt); single `db.batch` inserting `questions` (status pending, new columns) + `question_files` rows (ordered) + `question_tags` rows (case-insensitive dedupe); revalidatePath('/my-submissions'); return `{success:true, questionId, status:"pending"}`
- [X] T019 [P] [US1] Create `src/components/question-bank/CourseCombobox.tsx` (client) — searchable combobox on `@radix-ui/react-popover`: input filters flat `courses` by `code` OR `title` (substring, case-insensitive), arrow-key navigation, code + title per row, controlled value/onChange; shared by UploadForm and the filter panel
- [X] T020 [P] [US1] Rework `src/components/question-bank/UploadForm.tsx` (client) — replace subject→course cascade + "Other" with `CourseCombobox` labeled "Subject/course"; batch quick-search select over `Array.from({length: currentBatch})` (type-to-narrow); programType segmented Select (Regular default / Diploma / Evening); season Select + year input; teacherName input; tag chips unchanged; multi-file dropzone with pre-upload validation (all-images 1–5 XOR exactly 1 pdf, inline errors, thumbnail reorder → `files.order`); submit → `createQuestion`
- [X] T021 [US1] Rework `src/app/(user)/upload-question/page.tsx` (server) — `auth()` guard; `Promise.all([getCourses(), getCurrentBatch()])`; render `<UploadForm>` with flat course list; metadata title

**Checkpoint**: US1 functional — pending uploads with correct new fields/files, XOR rule + rate limit enforced.

---

## Phase 4: User Story 2 - Moderator or Admin Approves/Rejects (Priority: P1)

**Goal**: Pending questions show the new fields + all files in the existing unified approval dashboard; approve/reject works unchanged; first decision wins.

**Independent Test**: Log in as `moderator`, open `/approve`, open a pending question → see course, batch, programType, season/year, teacherName, tags, and every `question_files` entry (type + order). Approve → public within ~5s + submitter notified. Re-approve → "already processed". Reject with reason → submitter sees it.

### Implementation for User Story 2

- [X] T022 [US2] Rework the `question` entry in `approvalQueries` (`src/lib/db/queries/approval.ts`) — `fetchPending` details: courseCode/courseTitle (flat join), batchNumber, programType, season, year, teacherName, examType, tags, and `files` (fileUrl + fileType + order from `questionFiles`); `countPending` unchanged
- [X] T023 [US2] Extend `src/components/approval/ApprovalCard.tsx` — question branch renders the new fields (programType soft tag, season/year, teacher) + a "Review files" list (per-file link to `/api/questions/[id]/download?file=<order>` — authed reviewer dashboard); profile branch untouched; `decisionHandlers` in `src/app/(admin)/approve/actions.ts` need no change (fields are cosmetic)

**Checkpoint**: US1 + US2 work independently — approvals carry the full revised metadata/files and notifications still fire.

---

## Phase 5: User Story 3 - Student Searches, Previews, Likes & Downloads (Priority: P1)

**Goal**: The bank becomes a two-column page (filter panel left, card grid right, mobile drawer at 375px) with live top-course/top-batch chips, an "Upload question" button, redesigned cards, a Preview page (image gallery / embedded PDF + metadata card), viewCount on reach, downloadCount per click (ZIP + per-image), and login-required togglable likes with self-likes allowed.

**Independent Test**: Bank loads two-column + chips reflecting live counts (add an approved question → chips change on reload, no cache flush). Apply all five filters AND → approved-only results. At 375px the drawer/accordion filter panel works. Preview an image question → gallery + thumbnails; pdf → embedded viewer. `viewCount` +1 per detail page load. Download image paper → ZIP (plus per-image) → `downloadCount` +1 per click. Logged-in heart toggles `likeCount` (self-like works, double-like never duplicates); guest sees prompt, no file, no like, and `verify:guest-question-sql` passes.

### Implementation for User Story 3

- [X] T024 [P] [US3] Add `jszip` dependency (package.json) and create `src/lib/question-bank/zip.ts` — `downloadImagesAsZip(question: {title, files})`: fetch public image URLs, bundle with jszip, trigger blob download; plus per-image `downloadFile(fileUrl)` helper; call `recordDownload` (T030) once per click
- [X] T025 [US3] Create `src/app/api/questions/[id]/like/route.ts` — POST: `auth()` required (no session → 401 or redirect); question must be `status='approved'` else 404; idempotent toggle — insert `questionLikes` on like, delete on unlike (unique `(questionId,userId)` conflict → treat as already-liked, no error); re-read live count; `revalidateTag("question-bank")`; return `200 {liked, count}` with `Cache-Control: no-store`
- [X] T026 [P] [US3] Create `src/components/question-bank/QuestionLikeButton.tsx` (client) — optimistic heart toggle calling the like route; filled/outline by `isLikedByViewer`; counter updates from response; guest renders a disabled heart linking to `/login` (safeCallbackUrl); used in cards + detail
- [X] T027 [P] [US3] Rework `src/components/question-bank/QuestionCard.tsx` — FR-025 layout: top row course code + upload date (muted); body title (heading), course name, `Batch N · <examType>`, programType soft tag, `season year`, teacherName (hidden if empty); bottom row `♥ count  👁 count` (left, `QuestionLikeButton` + static view icon) and Preview (`/question-bank/[id]`) + Download (right)
- [X] T028 [US3] Rework `src/components/question-bank/QuestionSearch.tsx` (client) — filter panel: `CourseCombobox`, batch quick-search combobox, examType Select, programType Select, season Select + year input, "Clear filters"; quick-select chips row (top courses/top batches from server props, soft tags with counts, tap applies filter, single-select per group); prop `isMobileDrawer` support (sheet/accordion above-grid on <md, operable at 375px); preserves filters in searchParams
- [ ] T029 [US3] Rework `src/components/question-bank/QuestionDetailView.tsx` — two-region layout: main area renders image gallery (large display, prev/next when >1, thumbnail strip with aria-current) or embedded pdf `<iframe>` viewer + "Download PDF" fallback CTA; metadata card alongside (course code/title/creditHours, batch, examType, programType tag, season/year, teacherName, uploader, upload date, like + view/download counts, Download button — image: ZIP via `zip.ts` + per-image links; pdf: direct); guests: metadata + "Log in to download/preview" prompt, no file, no like
- [ ] T030 [US3] Rework `src/app/api/questions/[id]/download/route.ts` — keep auth gate + `status='approved'`/uploader rule; add `kind`/`file` params: `kind=file` increments `downloadCount` atomically (via shared counter helper) then redirects to the requested file (`file=<order>` resolves the `questionFiles` row; default for pdf); add `recordDownload` server action (auth-gated counter increment) for the client-side ZIP path so a ZIP click counts exactly once (no double count)
- [ ] T031 [US3] Rework `src/app/(guest)/question-bank/page.tsx` (server) — two-column layout (`lg:grid-cols-[300px,1fr]`); `Promise.all([getCatalog(), getCurrentBatch(), getTopCourses(), getRecentBatches(), getPopularTags(), searchQuestions(params, viewerRole)])`; "Upload question" Button top-right (guest → `/login?callbackUrl=...`); render chips + `QuestionSearch` + grid + pagination
- [ ] T032 [US3] Rework `src/app/(guest)/question-bank/[id]/page.tsx` (server) — `getQuestionDetail(id, viewerRole)` (increments viewCount on reach); notFound on null; render `QuestionDetailView`; metadata title = question title

**Checkpoint**: US3 complete — two-column bank, live chips, redesigned cards, preview (gallery/PDF), like toggle, and counter-accurate downloads; guest surface verified clean.

---

## Phase 6: User Story 4 - Student Tracks Own Submissions (Priority: P2)

**Goal**: The submitter sees their uploads with new fields, files, current status, and rejection reason; retry/re-download works.

**Independent Test**: Upload → `/my-submissions` shows `Pending`; moderator rejects with reason → `Rejected` + reason; approve → `Approved` and preview/downloadable from the row.

### Implementation for User Story 4

- [ ] T033 [US4] Rework `src/lib/db/queries/questions-mine.ts` — include new columns (programType, season, year, teacherName, counters), course code/title, `files` (ordered), and `rejectionReason` (latest `notifications` row for the question, as in 003 T027)
- [ ] T034 [US4] Extend `src/app/(user)/my-submissions/page.tsx` — question rows render the new fields + files count/type + `StatusBadge` + rejection reason; keep edit/re-submit entry points as shipped in 003 (re-submit flow already reuses `createQuestion`; new field/file inputs arrive automatically via UploadForm sync)

**Checkpoint**: All four stories independently functional.

---

## Phase 7: Supporting Scope — Admin Course Management (FR-030)

**Goal**: Minimal admin add/edit for the flat course catalog (required because the "Other" fallback was dropped — Q1:A); new courses appear immediately in the combobox/filters.

**Independent Test**: Log in as `admin` → `/manage/courses`: add a course (duplicate `code` → friendly error), edit title/creditHours; the new course appears in the upload combobox and course filter after reload. `user`/`moderator` get 403 (middleware). A course referenced by a question has no delete control.

- [ ] T035 [P] Create `src/app/(admin)/manage/courses/actions.ts` — `createCourse({code,title,creditHours})` (admin role check; friendly unique-code error) + `updateCourse({id,title?,creditHours?})`; revalidatePath('/manage/courses') + revalidateTag('question-bank'); no delete action (FK restrict)
- [ ] T036 [P] Update `src/middleware.ts` — add `"/manage/courses": ["admin"]` to `routePermissions`
- [ ] T037 Create `src/app/(admin)/manage/courses/page.tsx` — flat table (code, title, creditHours) + inline add form + row edit (title/creditHours); calls T035 actions; metadata title

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Verification script updates, repo docs sync, and end-to-end validation.

- [ ] T038 [P] Extend `scripts/verify-guest-question-sql.ts` + `verify:guest-question-sql` npm script — assert the guest `searchQuestions`/`getQuestionDetail` payload has **no `files` array, no `fileUrl`/`file_url` keys, and no `isLikedByViewer`**; required guest metadata keys present (id, title, batchNumber, programType, season, year, examType, courseCode, courseTitle, tags, counts)
- [ ] T039 [P] Update `AGENTS.md` — schema file set now: `courses` (flat), `questions`, `question-files`, `question-likes`, `question-tags`, users/profiles/skills/profile-skills/notifications/site-config (relations in `relations.ts`); note `subjects` removed (superseded decision), the two-step migration precedent, `recordDownload`/like route, client-side ZIP, and admin course surface
- [ ] T040 [P] Remove stale references to old fields across the app — grep for `customSubject`/`customCourse`/`.program`/`.evening`/`OTHER_COURSE`/`fileUrl` in `src/app`, `src/components`, `src/lib` (excl. migration/verify docs) and update any survivors (e.g. `my-submissions`, approval card) to the revised shapes
- [ ] T041 Run `npm run lint` and `npx tsc --noEmit` — fix all issues
- [ ] T042 Run `npm run verify:guest-question-sql` — guest payload clean
- [ ] T043 Run every scenario in `specs/004-question-bank-revision/quickstart.md` and the Playwright e2e suite (`npm run test:e2e`) covering SC-004, SC-008, SC-009, SC-010, SC-011, SC-012 — confirm end-to-end behavior (incl. 375px drawer and live chips)
- [ ] T044 [P] Scale spot-check (SC-002/SC-008) — extend `scripts/load-test-questions.ts` (or a new variant) to verify `searchQuestions` + `getTopCourses` + `getRecentBatches` + `getPopularTags` under ~10k approved questions stay < 2s (record planner use of the `(status, courseId)`/`(status, batchNumber)` indexes); note results in `quickstart.md`. Note: chip queries are now cached via the `question-bank` tag (5-min TTL), so scale expectations apply to `searchQuestions` + the tag-invalidation path.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately; T001–T005 parallel, T006 and T007 sequential after them, T008/T009 parallel
- **Foundational (Phase 2)**: depends on Phase 1 (schema); BLOCKS all stories
- **User Story phases (Phase 3+)**: all depend on Phases 1–2
- **Phase 7 (Admin courses)**: depends on foundational query/types only — can run in parallel with user stories
- **Polish (Phase 8)**: depends on all stories; T038–T040 parallel, T041–T043 final gate

### User Story Dependencies

- **US1**: Blocks nothing; needed for US4 data
- **US2**: Independent of US1 code; needed for US3 public results (test data) and US4 status changes
- **US3**: Code independent of US1/US2; meaningful testing needs approved data (US2). Depends on foundational queries (T016/T017)
- **US4**: Depends on US1 (rows) + US2 (status); `createQuestion` reengineer rides along
- **Phase 7**: Independent — no story dependency

### Within Each User Story

- Types/validation before actions; actions before UI; page wiring last
- US3: `zip.ts` + like route + counter helper before card/detail wiring (T024/T025/T030 precede T026–T029/T031–T032)

### Parallel Opportunities

- **Phase 1**: T001–T005 + T008 + T009 in parallel; T006 then T007 sequential
- **Phase 2**: T011/T012/T014/T015 parallel, T010/T013/T016/T017 sequential after schema
- **After Phase 2**: US1 (T018–T021), US2 (T022–T023), US3 (T024–T032), US4 (if staffed), and Phase 7 (T035–T037) in parallel
- **Within US3**: T024, T026, T027 parallel (T029/T031 depend on T024/T030)
- **Within Polish**: T038, T039, T040 parallel

---

## Parallel Example: User Story 3

```bash
Task: "T024 jszip dependency + src/lib/question-bank/zip.ts"
Task: "T026 src/components/question-bank/QuestionLikeButton.tsx"
Task: "T027 src/components/question-bank/QuestionCard.tsx"

# After T024 and T030:
Task: "T029 src/components/question-bank/QuestionDetailView.tsx"
Task: "T031 src/app/(guest)/question-bank/page.tsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1 (schema/migration `0005`) → **verify** the two-step data move preserved the single dev row.
2. Complete Phase 2 (types/queries).
3. Complete Phase 3: US1 (upload revision).
4. **STOP and VALIDATE**: upload a paper with new fields + 3 images + 1 pdf, check `question_files`/`pending` in psql.
5. Deploy/demo as a usable increment.

### Incremental Delivery

1. Setup + Foundational → revision foundation live.
2. US1 (upload revision) → test → demo (MVP).
3. US2 (approval details) → test.
4. US3 (bank UI, preview, likes, counters) → test → demo (full value).
5. US4 (my submissions) + Phase 7 (admin courses) → test.
6. Polish (verify script, AGENTS.md, quickstart/e2e gate, scale spot-check).

### Parallel Team Strategy

1. Team does Phase 1 + Phase 2 together.
2. Once foundational done: Developer A → US1; Developer B → US2 + US4; Developer C → US3; Developer D → Phase 7 admin courses.
3. Polish consolidation last.

---

## Notes

- [P] tasks = different files, no dependencies.
- Story label maps a task to its user story; Setup/Foundational/Polish have none.
- Migration `0005` MUST be hand-edited (INSERT…SELECT before the drop) — do not blindly apply generated DDL (same discipline as the `pg_trgm` precedent).
- Guest gating is server-side (query whitelist + authed routes), never UI hiding.
- Commit after each task or logical group; stop at any checkpoint to validate the story independently.