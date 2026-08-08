# Quickstart: Digital Question Bank — Validation Guide

**Phase**: 1 — Design & Contracts
**Date**: 2026-08-08

## Prerequisites

- Foundation phase shipped and working (dev DB migrated to `0003`, seed run).
- Node 20 LTS, PostgreSQL (Neon) connection string in `.env`, Auth.js providers configured.
- UploadThing creds: `UPLOADTHING_SECRET` + `UPLOADTHING_APP_ID` in `.env` (already present in `.env.example`).

## Setup

```bash
# Apply the new migration (subjects, courses, questions, question_tags)
npm run db:generate
npm run db:migrate

# Seed the curated catalog into subjects/courses
npm run db:seed
#  Expect "[seed] subjects: 7 inserted", "[seed] courses: N inserted", existing seeds still idempotent

# Run the guest-payload verification
npm run verify:guest-question-sql
```

## Running

```bash
npm run dev   # http://localhost:3000
```

## Validation Scenarios

### Scenario A: Seed correctness (SC-004a/FR-005a)

1. Open `psql` and `select count(*) from subjects` → 7 (no `diploma-exempted`).
2. `select count(*) from courses` → 71 rows, `select count(*) from (select code from courses group by code having count(*)>1)` → 0.
3. `select count(*) from courses where subject_id in (select id from subjects where slug='cse-core')` > 0; `select count(*) from courses where code in ('PHY0533101','ECO0311101')` = 1 each (dedup kept one code).

### Scenario 2: Upload → pending (FR-001..004, FR-013, US-1)

1. Log in as a `user`-role student; open `/upload-question`.
2. Fill: title, Subject (curated dropdown), Course filtered by subject or select "Other" → type customSubject/customCourse, batch (dynamic dropdown up to `CURRENT_BATCH`), program Regular (default), examType `final`, drop a PDF ≤10MB, add a free-form tag.
3. **Expected**: "Submitted for review" and question shows `Pending` (amber) in `/my-submissions`; batch dropdown capped at `currentBatch`.
4. Add login-mode check: search as guest, or as another student → you do NOT see this (pending) question.
5. Repeat with a `diploma` + `evening` flagged upload → record shows flags (`program=diploma, evening=true`).
6. Repeat with a wrong file type / >10MB → error at the upload step, no pending row created.
7. Submit a 6th upload within the hour → `{success:false, retryAfter}` rate-limit message. Moderator/admin has no limit.

### Scenario 3: Approval → public (FR-9/10/11/12, US-2, SC-3)

1. Log in as `moderator`, open `/approve`. Dashboard shows the pending question (and other moderator-eligible items), NOT pending profiles.
2. Open it → review details (title, subject, course, batch, examType, tags, file). Approve.
3. **Expected**: `status=approved`; submitter notification ("Question approved"); question now appears in public results for guest within ~5s.
4. Approve again → "already processed" no-op (conditional update).
5. Reject path with a reason → submitter sees rejection reason in notification + `/my-submissions` badge turns `Rejected`; without a reason, generic message (`my-submissions`/notification).

### Scenario 4: Search & filters (FR-5, FR-6, US-3)

1. Log in as user. Apply filters: subject + examType `final` + tag; multiple filters AND; results only `approved`.
2. Confirm course dropdown groups courses under subjects and surfaces custom course under an `Other` block in sidebar; a curated + custom same-name do NOT collide.
3. diploma/evening papers show a `Diploma`/`Evening` badge.
4. No-results → empty state ("No question papers found — check back soon").

### Scenario 5: Guest browse + download-deny (FR-7, FR-8, US-4, SC-4)

1. Private window (guest) → `/question-bank`. Metadata cards visible; no download control; open a detail → metadata + "Log in to download" CTA pointing to `/login`.
2. Change URL to `/api/questions/{id}/download` → guest redirected to `/login` (or `401`) — denied at the access layer.
3. Run `npm run verify:guest-question-sql` → enforces guest payload has NO `fileUrl` field and required metadata keys are present.
4. Log in as that user → download works (redirect to UploadThing CDN URL, file opens).

### Scenario 6: Batch rollover (edge)

1. Admin sets `currentBatch` +1 in `/manage/settings`. Upload shows dropdown extended; existing question rows keep originals.

## Notes

- Uses `scripts/verify-guest-question-sql.ts` (mirrors optional `verify-guest-sql.ts`).
- Full implementation details in `tasks.md` / `data-model.md` / `contracts/`.
- Guest download deny is server-side enforcement (query whitelist + authed route), not UI hide.