# Tasks: Digital Question Bank

**Input**: Design documents from `/specs/003-question-bank/` (plan.md, spec.md, research.md, data-model.md, contracts/)

**Prerequisites**: Foundation phase shipped (migrations `0000`–`0003`, seed, approval dashboard, rate limit, notifications, auth, middleware routes pre-wired for `/question-bank` + `/upload-question`)

**Organization**: Tasks are grouped by user story so each story can be implemented and tested independently. Schema + seed + UploadThing wiring (Setup) and shared query/types (Foundational) block every story.

**Tests**: TDD-style test tasks are NOT requested by the spec; the only mandated verification is the guest-payload access-layer check (SC-004) — implemented as `scripts/verify-guest-question-sql.ts` (mirrors the existing `verify-guest-sql.ts` Foundation precedent) inside US4.

## Path Conventions

- Single Next.js app, `src/` at repo root. Server Actions in `src/app/(route-group)/<feature>/actions.ts`. DB queries in `src/lib/db/queries/`. Schema in `src/lib/db/schema/` (relations centralized in `relations.ts`).
- Use the shared `enforceSubmissionLimit(userId)` wrapper (`src/lib/rate-limit.ts`, 5/hour) for `createQuestion` — NOT the 1/hour profile exception.
- Guest file gating: `searchQuestions`/`getQuestionDetail` take `viewerRole: ViewerRole` (reuse `ViewerRole` from `src/lib/db/queries/directory.ts`) and exclude `fileUrl` from the guest `columns:` whitelist; downloads only via the authed Route Handler.
- **Search strategy (remediation 2026-08-08)**: `questions.title_tsv` is a Postgres-generated (`stored`) tsvector column with a GIN index (added in T003). `searchQuestions` free-text uses `buildSearchQuery(term, [questions.title])` from `src/lib/search.ts` — the generated-column expression is `to_tsvector('english', title)`, so the runtime query matches the index and Postgres can use it at scale (SC-002).
- `docs/data-dictionary.md` is the schema source of truth; when a task fixes a drift, update the dictionary in the same commit (see T026 remediation note).

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Curated catalog + questions schema (per `docs/data-dictionary.md`), migration, seed, and UploadThing wiring — everything both user stories and filters depend on.

- [X] T001 Create `src/lib/db/schema/subjects.ts` — `subjects` table per data-model.md: id (uuid PK defaultRandom), slug (text unique notNull), name (text notNull), createdAt (timestamp string mode defaultNow)
- [X] T002 Create `src/lib/db/schema/courses.ts` — `courses` table per data-model.md: id (uuid PK), code (text unique notNull), title (text notNull), creditHours (numeric notNull), subjectId (uuid FK → subjects.id, `onDelete: "restrict"`), createdAt; add btree index on `subjectId`
- [X] T003 Create `src/lib/db/schema/questions.ts` — `questions` table per data-model.md: id (uuid PK), title (text notNull), titleTsv (tsvector **generated always as** `to_tsvector('english', title)` **stored** — enables the GIN full-text index), courseId (uuid FK → courses.id nullable, `onDelete: "restrict"`), customSubject (text nullable), customCourse (text nullable), batchNumber (integer notNull), program (pgEnum `regular|diploma` default `regular`), evening (boolean default false), examType (pgEnum `previous_year|midterm|final|lab|viva`), fileUrl (text notNull), uploadedBy (uuid FK → users.id notNull), status (pgEnum `pending|approved|rejected` default `pending`), approvedBy (uuid FK → users.id nullable, `onDelete: "set null"`), approvedAt (timestamp nullable), createdAt (defaultNow), updatedAt (defaultNow + `$onUpdate`); indexes: GIN `title_tsv` (`to_tsvector('english', title)` matches the generated column), `(status, batchNumber)`, `(courseId)`, `(examType)`, `(program, evening)`, `(uploadedBy)` — **deviation 2026-08-08**: `uploadedBy` is nullable + `onDelete: "set null"` (resolved decision: question survives user deletion)
- [X] T004 Create `src/lib/db/schema/question-tags.ts` — `questionTags` join table per data-model.md: id (uuid PK), questionId (uuid FK → questions.id, `onDelete: "cascade"`), tag (text notNull), createdAt, composite unique `(questionId, tag)` + btree index on `tag`. (Remediation 2026-08-08: `docs/data-dictionary.md` `question_tags` was missing the PK `id` + `createdAt` and the composite unique note; already aligned to match — this step just implements the schema.)
- [X] T005 Update `src/lib/db/schema/relations.ts` — add `subjectsRelations` (one→many courses), `coursesRelations` (one subject), `questionsRelations` (one course, one uploader `users`, one approver `users`, many questionTags), `questionTagsRelations` (one question); also add `questions: many(questions)` and `courses: many(courses)` to `usersRelations`/`subjectsRelations` as needed
- [X] T006 Update `src/lib/db/schema/index.ts` — export all four new schema files (add `./subjects`, `./courses`, `./questions`, `./question-tags`)
- [X] T007 Run `npm run db:generate` then `npm run db:migrate`; review migration `0004_*` for the four tables, enums (`program`, `exam_type`, `question_status`), the `title_tsv` generated column + GIN index, FKs, and indexes before applying
- [X] T008 Add `seedQuestionBank()` to `src/lib/db/seed.ts` and call it from `seed()` — read `src/lib/db/seed-data/uu-cse-courses-seed.json`; dedupe courses by `code` (keep one row under the course's real subject; the former `_CHECK` rows were resolved 2026-08-09 — true duplicate `CSE0613307` dropped, other 3 kept with stated credits); insert subjects by unique `slug` then courses by unique `code` idempotently (mirror `seedSkills` skip-if-exists pattern); log `[seed] subjects: N, courses: N`; run `npm run db:seed` and verify 7 subjects / 70 courses in `psql`
- [X] T009 Wire UploadThing per research.md §1 — create `src/lib/uploadthing.ts`: file router `ourFileRouter` with endpoint `questionFile` (pdf + image, `maxFileSize: "10MB"`, `maxFileCount: 1`), `.middleware()` calling existing `auth()` and returning `{ uploadedBy: session.user.id }` (throw `UploadThingError` for guests), `.onUploadComplete()` doing NO DB write; create `src/app/api/uploadthing/route.ts` exporting `{ GET, POST }` via `createRouteHandler({ router })`; confirm env vars match the installed v7 SDK (`UPLOADTHING_SECRET`+`UPLOADTHING_APP_ID` vs `UPLOADTHING_TOKEN`) and update `.env.example` accordingly; verify `GET /api/uploadthing` responds

**Checkpoint**: Catalog + questions schema migrated and seeded; UploadThing endpoint live. Story work can begin.

---

## Phase 2: Foundational (Shared Query Layer & Types)

**⚠️ CRITICAL**: No user story UI can render until these exist.

- [X] T010 Create `src/types/question-bank.ts` — `SubjectOption` (id, slug, name), `CourseOption` (id, code, title, creditHours, subjectId), `QuestionCard` (id, title, batchNumber, program, evening, examType, courseTitle?, courseCode?, subjectName?, customCourse?, tags[], and `fileUrl` only for non-guest variant), `QuestionDetail`, `MyQuestionRow`, `ExamType`, `QuestionProgram`, `QuestionFilterParams`
- [X] T011 Create `src/lib/db/queries/catalog.ts` — `getSubjectsWithCourses(): Promise<Array<SubjectOption & { courses: CourseOption[] }>>` (subjects with their courses, ordered by name) for the upload form cascade and the Story 3 course filter; export `getCatalog()` used by `/upload-question` and `/question-bank` pages

**Checkpoint**: Shared types + catalog query ready; user stories can be built in parallel.

---

## Phase 3: User Story 1 - Student Uploads (Priority: P1) 🎯 MVP

**Goal**: A logged-in student submits a paper (title, curated subject→course or "Other" custom entry, batchNumber, program/evening flags, examType, ≤10MB PDF/image via UploadThing, free tags) → creates a `pending` question, invisible to others, under the shared 5/hour limit.

**Independent Test**: Upload as `user`, confirm "Submitted for review" and the receipt is created; the row must be `status='pending'` (checkable via `psql`), and a guest/other student can't find it. Pending-badge assertions in `/my-submissions` require T027 (Story 5), so the US-1 acceptance assert status via the DB for the standalone story. A wrong file type/>10MB fails at upload; a 6th upload within the hour returns the rate-limit retry-after; a `diploma`+`evening` flagged paper persists those flags.

### Implementation for User Story 1

- [X] T012 [US1] Create `src/app/(user)/upload-question/actions.ts` — `createQuestion(input)` Server Action: `auth()` or `redirect("/login")`; Zod-validate classification XOR (`courseId` XOR `customSubject`+`customCourse`, Q-003) + `batchNumber` integer 1..`getCurrentBatch()` + `program`/`evening`/`examType` + `https` `fileUrl` + `title` required; run `enforceSubmissionLimit(userId)` (5/hour, exempt moderators/admins) returning `{success:false, error, retryAfter}` on limit; insert question + `questionTags` via `db.batch` in one transaction; revalidatePath('/my-submissions'); return `{success:true, questionId, status:"pending"}`
- [X] T013 [P] [US1] Create `src/components/question-bank/UploadForm.tsx` (client) — subject Select → course Select filtered by subject (from `getSubjectsWithCourses` prop) with an "Other" option that reveals customSubject/customCourse text inputs; batchNumber Select from `Array.from({length: currentBatch})`; program segmented (`regular` default / `diploma`); `evening` toggle; examType Select (previous_year/midterm/final/lab/viva); free-form tag input (comma/keypress add, chips list); `<UploadDropzone endpoint="questionFile" onClientUploadComplete={(res) => setFileUrl(res[0].ufsUrl)} onUploadError={...} />`; file type/size error shown inline; submit → `createQuestion`; disable submit while uploading
- [X] T014 [US1] Create `src/app/(user)/upload-question/page.tsx` (server) — guard `auth()` (redirect `/login`), `Promise.all([getCatalog(), getCurrentBatch()])`, render `<UploadForm>` with those props; metadata title "Upload Question"

**Checkpoint**: US1 functional — uploads land as `pending` with the right classification/flags, rate-limited, invisible to others.

---

## Phase 4: User Story 2 - Moderator Approves/Rejects (Priority: P1)

**Goal**: Pending questions appear in the existing unified approval dashboard; a reviewer can inspect the question + file, then approve/reject; only the first decision wins.

**Independent Test**: Log in as `moderator`, open `/approve`, see the pending question (and NOT pending profiles), open it, review question metadata + attached file, then approve → publicly searchable and submitter notified; re-approve → "already processed"; reject with a reason → submitter sees the reason.

### Implementation for User Story 2

- [ ] T015 [US2] Register a `question` entry in `approvalQueries` inside `src/lib/db/queries/approval.ts` — implement `fetchPending(page, pageSize)` (questions where `status='pending'` with course/subject + tags + fileUrl in `details`, `title` = question title, `submitterName` from the uploadedBy user) and `countPending()`; keep `visibleResourceTypes` behavior unchanged
- [ ] T016 [US2] Add a `question` handler to `decisionHandlers` in `src/app/(admin)/approve/actions.ts` — conditional update `where status='pending'` setting `status/approvedBy/approvedAt` (returns "already processed" if 0 rows); on success insert a notification via `buildNotification` (label = question title, resourceType `question`, reason passed on reject) to `uploadedBy`; append `revalidateTag("question-bank")` and `revalidatePath("/question-bank")` to the existing `decideItem` revalidation list
- [ ] T017 [US2] Add a `question` details view so reviewers can inspect + open the attached file — extend `src/components/approval/ApprovalCard.tsx` to branch when `item.resourceType === "question"`: render title, subject/course (curated or custom), batchNumber, program/evening badges, examType, tags, and a "Review file" link pointing at `/api/questions/[id]/download` (authed); keep the existing profile branch unchanged

**Checkpoint**: US1 AND US2 work independently — approved questions public, rejected hidden, notifications fire, reviewers can review the file.

---

## Phase 5: User Story 3 - Student Searches & Downloads (Priority: P1)

**Goal**: Logged-in students search/filter approved questions (multi-filter AND: subject-grouped course, batchNumber, examType, program, evening, tag, free text) and download the file via the authed route.

**Independent Test**: Search by subject + examType, open a result and download; unapproved/referred never appear; course filter groups under a subject with an "Other" bucket; diploma/evening badges render.

### Implementation for User Story 3

- [ ] T018 [US3] Create `src/lib/db/queries/question-bank.ts` — `searchQuestions(params, viewerRole="guest")`: conditions = `status='approved'` AND each active filter (`courseId` where present, or "other" course → `customCourse` not null; `subjectId` → courseId in subject's courses; `batchNumber`; `examType`; `program`; `evening`; tags → EXISTS per tag in `question_tags`); free-text via `buildSearchQuery(term, [questions.title])` from `src/lib/search.ts` (backed by the `title_tsv` GIN index from T003); order by createdAt desc; guest `columns:` whitelist excludes `fileUrl`; nested course/subject + tags; paginate; return `{items, total}`
- [ ] T019 [US3] Create `src/app/(guest)/question-bank/page.tsx` (server) — `viewerRole = session?.user?.role ?? "guest"`; `const [catalog, params] = await Promise.all([getCatalog(), searchParams])`; render `QuestionSearch` filter panel + results grid; metadata title "Question Bank"; add `loading.tsx` in this route group
- [ ] T020 [P] [US3] Create `src/components/question-bank/QuestionSearch.tsx` (client) — filter form: subject Select → grouped course Select (curated courses under a subject + separate "Other" option); batchNumber, examType, program, evening Selects; tag text input (comma chips); free-text search input; preserves the active filter (on page navigation) via searchParams; "Clear all" resets
- [ ] T021 [P] [US3] Create `src/components/question-bank/QuestionCard.tsx` — card with course/subject (curated name or `customCourse`), batchNumber, examType, tags (`.soft-tag` pills, colors per design-direction), `Diploma`/`Evening` badges; links to `/question-bank/[id]`; list/grid variants
- [ ] T022 [US3] Create `src/app/api/questions/[id]/download/route.ts` — Route Handler: `auth()` required (no session → `redirect("/login")` with safe callback or 401); fetch question; require `status='approved'` OR `uploadedBy === session.user.id` else 404; `NextResponse.redirect(fileUrl)`; no revalidate needed

**Checkpoint**: US-3 complete — searchable approved questions with working download for logged-in users.

---

## Phase 6: User Story 4 - Guest Searches Metadata, Can Not Download (Priority: P1)

**Goal**: Guests search/browse approved metadata and open a detail page with a "Log in to download" prompt but never obtain a working file URL — enforced at query and route levels.

**Independent Test**: Private window — search + open an approved + view metadata only; hit `/api/questions/[id]/download` → denied; run `verify:guest-question-sql` → guest payload has NO `fileUrl`.

### Implementation for User Story 4

- [ ] T023 [US4] Add `getQuestionDetail(id, viewerRole)` to `src/lib/db/queries/question-bank.ts` — return full question with course/subject + tags; guest whitelist excludes `fileUrl`; return `null` if not found or the question is not `status='approved'`
- [ ] T024 [US4] Create `src/app/(guest)/question-bank/[id]/page.tsx` — server: `getQuestionDetail(id, viewerRole)`; if `null` → notFound(); render `QuestionDetailView` with viewerRole; metadata title = question title
- [ ] T025 [P] [US4] Create `src/components/question-bank/QuestionDetailView.tsx` (server-safe component) — metadata (title, course/subject, batchNumber, examType, tags, program/evening badges, submitter name); guests: a prominent "Log in to download" Button → `/login?callbackUrl=/question-bank/[id]`; logged-in: download Button/`<a href={`/api/questions/[id]/download`}>`
- [ ] T026 [P] [US4] Create `scripts/verify-guest-question-sql.ts` + npm script `verify:guest-question-sql` (mirror `scripts/verify-guest-sql.ts`) — assert: guest `searchQuestions`/`getQuestionDetail` result objects have NO `fileUrl` key; and the guest branch SQL (`db.query`/`sql` inspect) references no `file_url` column; and the required guest metadata keys are present (id, title, batchNumber, examType, tags, course/subject names)

**Checkpoint**: US-3 + US-4 complete — guests get full discovery, zero file access, verified by the script.

---

## Phase 7: User Story 5 - Student Tracks Own Submissions (Priority: P2)

**Goal**: Student sees every uploaded questions with current status + any rejection reason, right-click reopen/re-download, and if rejected, edit/re-submit (A-6).

**Independent Test**: Upload → shows `Pending`; moderator rejects with a reason → `Rejected` + reason shown; approve → `Approved`, downloadable; edit a rejected question's title and re-submit → returns to `pending`.

### Implementation for User Story 5

- [ ] T027 [US5] Create `src/lib/db/queries/questions-mine.ts` — `getMyQuestions(userId)`: questions where `uploadedBy = userId` with course/subject + tags plus `rejectionReason` (latest `notifications` row where `resourceType='question'`, `resourceId=question.id`, `type='rejection'`; null if none)
- [ ] T028 [US5] Extend `src/app/(user)/my-submissions/page.tsx` — after existing profile submission block, render a "Questions" section: for each row a `StatusBadge`, title, course/subject, batchNumber, examType, tags, rejection reason (if any), a link to `/question-bank/[id]` for approved/own rows, and an "Edit" button to a re-submit flow rendered by T029
- [ ] T029 [US5] Add edit/re-submit support — extend the `createQuestion` action (`src/app/(user)/upload-question/actions.ts`) to accept an optional `questionId`: when present, update the existing row (title/course/custom/batch/flags/tags) and set `status='pending'` clearing `approvedBy` and `approvedAt` (mirror `upsertProfile`'s `resetApproval`); pass `currentQuestion` into `UploadForm.tsx` (T013) so it can prefill edit on `/upload-question?edit=<id>`; no rate-limit for edits when they re-enter the same 5/hour budget

**Checkpoint**: All five stories independently functional.

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Docs sync, search scaling evidence, and end-to-end validation.

- [ ] T030 Update `AGENTS.md` — extend the "Schema file set" to `subjects`, `courses`, `questions`, `question-tags` (all in `src/lib/db/schema/`, relations in `relations.ts`); note the `download` Route Handler public-ACL never-disclose pattern, the generated `title_tsv` index, and shared 5/hour limit for `createQuestion`
- [ ] T031 Run `npm run lint` and `npm run typecheck` (or `tsc --noEmit`) and fix any; then run every scenario in `specs/003-question-bank/quickstart.md` (seed counts, upload→pending, review→public, filters, guest download-deny via `verify:guest-question-sql`, batch rollover) and confirm.
- [ ] T032 **Performance (SC-002)** — create `scripts/load-test-questions.ts` + `npm run test:questions` mirroring `scripts/load-test.ts`: bulk-insert ~10,000 synthetic `approved` questions across subjects/batches/tags; run `EXPLAIN ANALYZE` on the exact `searchQuestions` SQL with multi-filters + free text; assert full latency field response target (<2s) and record the planner's use of the `title_tsv` GIN index; add note in `quickstart.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately (T001–T009)
- **Foundational (Phase 2)**: depends on Phase 1 (schema + query); BLOCKS all stories
- **User Story phases (Phase 3+)**: all depend on Phase 1+2. US2 depends on T003/T005 (schema); US-3/4 depend on schema + catalog; US-5 depends on US1+US2 (has data)
- **Polish (Phase 8)**: depends on the selected stories, plus Scan-2 load test after Phase 3

### User Story Dependencies

- **US1**: Blocks nothing; required for US-5 data
- **US2**: Independent of US1; needed for US-3 public results
- **US3**: Search + download depends on US-2 (public data) for meaningful testing, code is independent
- **US4**: Guest metadata depends on US-3
- **US5**: My submissions depends on US-1 (uploaded rows) + US-2 (status changes)

### Within Each User Story

- Schema/relations before queries; queries before UI; UI before wiring
- Implementation before integration (story4's page after story3's query)

### Parallel Opportunities

- **Phase 1**: T001–T004 (schema) + T009 (UploadThing) in parallel
- **Phase 2**: T010, T011 in parallel
- **After Phase 2**: US1 (T012–T014), US2 (T015–T017), US3 (T018–T022) can be staffed in parallel; US-4 (T023–T026) joins once US-3's query file is done; US-5 (T027–T029) once US-1 lands
- **Within US3**: T020, T021 parallel
- **Within US4**: T024, T025, T026 parallel

---

## Parallel Examples

### Parallel: Phase 1 schema

```bash
Task: "T001 src/lib/db/schema/subjects.ts"
Task: "T002 src/lib/db/schema/courses.ts"
Task: "T003 src/lib/db/schema/questions.ts"
Task: "T004 src/lib/db/schema/question-tags.ts"
# then T005 relations + T006 index + T007 migrate + T008 seed sequentially
```

### Parallel: US3 UI

```bash
Task: "T020 src/components/question-bank/QuestionSearch.tsx"
Task: "T021 src/components/question-bank/QuestionCard.tsx"
```

---

## Implementation Strategy

### MVP First (US1 Only)

1. Phase 1 (schema/migration/seed/UploadThing complete)
2. Phase 2 (types + catalog query)
3. Phase 3 (US1 upload)
4. **STOP and VALIDATE** — upload lands pending, rate-limited, hidden read-only
5. Optionally deploy/demo

### Incremental Delivery

1. Setup + Foundational → catalog seeded + uploadable
2. US1 → upload (MVP) → demo
3. US2 → moderation+review UI
4. US3 → search/download
5. US4 → guest-gating (SC-004)
6. US5 → my submissions + re-submit
7. Polish → docs sync + SC-1 setting + SC-2 load test

---

## Notes

- Reuse: `enforceSubmissionLimit`, `buildSearchQuery`, `getCurrentBatch`, `canApprove`/`visibleResourceTypes`, approval dashboard, `StatusBadge`, `EmptyState`, `buildNotification`.
- Guest `fileUrl` exclusion enforced at query + route layer, never by UI hiding.
- `docs/data-dictionary.md` is the schema source of truth — when T004 or any other task changes a schema detail, sync the dictionary entry in the same commit.
- SC-004 wording aligned (remediation 2026-08-08): the guest bound to "portal never returns a working file URL in any response" + download endpoint denial; the raw CDN key (public ACL) residual is out of scope.
- Commit after each task or logical group; stop at any checkpoint to validate the story.