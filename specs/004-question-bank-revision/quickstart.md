# Quickstart: Digital Question Bank — Revision (Validation Guide)

**Phase**: 1 — Design & Contracts
**Date**: 2026-08-10

## Prerequisites

- 003 Question Bank shipped (schema at migration `0004`, seed run, existing implementation in place).
- Node 20 LTS, Neon connection string in `.env`, Auth.js providers configured, UploadThing creds set.
- Branch `004-question-bank-revision`; `docs/data-dictionary.md` updated to the revision shapes first (FR-029).

## Setup

```bash
# 1. Generate + apply the revision migration (0005): flat courses, questions columns,
#    question_files, question_likes, drop subjects
npm run db:generate
npm run db:migrate
#  EXPECT: the generated SQL was manually edited (like the pg_trgm precedent) so the
#  file_url → question_files INSERT…SELECT runs BEFORE the file_url drop; subjects
#  dropped after courses.subject_id.

# 2. Seed: courses only (subjects seeding removed)
npm run db:seed
#  Expect "[seed] subjects: N (removed)", courses remain idempotent.

# 3. Guest-payload verification (no files array / no URLs leak to guests)
npm run verify:guest-question-sql

# 4. Run the Playwright suite for the new UI contracts (SC-004/008/009/010/011/012)
npm run test:e2e
```

## Running

```bash
npm run dev   # http://localhost:3000
```

## Validation Scenarios

### Scenario A: Migration preserved the existing data (FR-028)

1. `select count(*) from question_files` → ≥ 1 (the pre-existing dev/test question's `file_url` moved here).
2. `select count(*) from questions where file_url is not null` → 0; `select count(*) from information_schema.columns where table_name='questions' and column_name in ('file_url','custom_subject','custom_course','program','evening')` → 0.
3. `select count(*) from information_schema.tables where table_name='subjects'` → 0; `select count(*) from courses where subject_id is not null` → 0.

### Scenario 1: Upload — combobox, new fields, multi-file rules (FR-014..019, US-1)

1. Log in as `user`; open `/upload-question`.
2. "Subject/course" combobox: type `CSE06` or part of a title → pick a course directly (no subject step, no "Other").
3. Fill batch (quick-search dropdown, type-to-narrow, capped at `CURRENT_BATCH`), examType, programType (Regular default), season + year, optional teacherName, a tag.
4. Attach 3 images → submit → "Submitted for review"; `/my-submissions` shows `Pending`; `question_files` has 3 `image` rows with `order` 0..2.
5. Attach exactly 1 pdf → accepted; `question_files` has 1 `pdf` row.
6. Attach 6 images, or 2 pdfs, or image+pdf → inline rejection ("max 5 images" / "images or PDF, not both"), nothing sent.
7. Search as guest / another student → the pending question is invisible.
8. 6th upload within the hour → `retryAfter` message; moderator/admin exempt.

### Scenario 2: Approval → public (unchanged flow, new fields visible)

1. `moderator` opens `/approve` → pending question shows course, batch, programType, season/year, teacher, tags, and all files.
2. Approve → `status=approved`, submitter notified, question public within ~5s; second approve → "already processed".

### Scenario 3: Bank page layout, chips, filters (FR-022..024, SC-011/012)

1. Open `/question-bank` → two columns: filter panel left, grid right; "Upload question" top-right.
2. Top courses + top batches chips present with live counts; add a new approved question → reload → chip counts/order update (no cache flush).
3. Apply course + batch + examType + programType + season/year together → AND-filtered approved results.
4. **375px** (devtools): filter panel collapses into a drawer/accordion; chips scroll horizontally; no page-level horizontal scroll; all filters usable.

### Scenario 4: Card + Preview detail page (FR-025/026, SC-008/010)

1. Grid card shows code+date / title+course+batch+examType+programType tag+season+year+teacher / heart+eye counts / Preview+Download.
2. Preview an image question → large image, prev/next when >1, thumbnail strip, metadata card (course/batch/examType/teacher/uploader/program-season-year) + Download.
3. Preview a pdf question → embedded viewer in the main area + same metadata card.
4. `viewCount` increases by 1 each time the detail page loads (reload increments again).
5. Logged-in Download on an image paper → one-click ZIP of all images (plus per-image downloads available); `downloadCount` +1 per actual click. Pdf paper → direct download, `downloadCount` +1.
6. SC-008 spot-check: `select question_id, count(*), min(file_type), max(file_type) from question_files group by question_id` → no row with count not in [1..5] and no mix of image+pdf.

### Scenario 5: Likes (FR-020, SC-009)

1. Logged in → click heart → `liked:true`, count +1; click again → `liked:false`, count -1.
2. Double-click rapidly → still at most one like (unique constraint), count never drifts below 0.
3. Like your own approved question → works (self-likes allowed).
4. Guest → heart disabled / redirects to login; like POST denied.

### Scenario 6: Guest access & counters (FR-021/027, SC-004)

1. Private window → bank cards + detail metadata visible; `viewCount` still increments on detail reach.
2. No file rendered (image or pdf), no like control, no file URL anywhere in the response.
3. `/api/questions/[id]/download` as guest → redirected to `/login`/401.
4. `verify:guest-question-sql` asserts no `files` array / file keys in the guest payload.

### Scenario 7: Admin course management (FR-030)

1. Log in as `admin` → `/manage/courses`: add a course (duplicate code → friendly error), edit title/creditHours.
2. New course appears immediately in the upload combobox and course filter.
3. Course referenced by a question → no delete control exists; FK restrict protects it.
4. `user`/`moderator` hitting `/manage/courses` → 403 (middleware).

## Notes

- ZIP bundling is client-side (`jszip`); if it's cut at implementation, per-image downloads remain the floor and `downloadCount` still increments per click.
- Full implementation details in `data-model.md`, `contracts/`, and later `tasks.md`.
- Guest gating is server-side (query whitelist + authed routes), never UI hiding.
