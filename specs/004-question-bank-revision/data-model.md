# Data Model: Digital Question Bank — Revision

**Phase**: 1 — Design & Contracts | **Date**: 2026-08-10

Applies the 004 revision to the shipped 003 data model. Column/table names are as they will land in `docs/data-dictionary.md` (FR-029) and the Drizzle schema. **Revision deltas vs 003 data-model.md**: `subjects` removed, `courses` flattened (no `subjectId`), `questions` new columns + dropped columns, two new tables `question_files` and `question_likes`.

---

## courses (flattened)

Was `subjectId`-linked (003); now a flat standalone catalog table. Seeded from `uu-cse-courses-seed.json` (70 rows, dedupe by code) — `subjects` no longer seeded.

| Field | Type | Constraints | Notes |
|---|---|---|---|
| id | uuid | PK | default random |
| code | text | unique, required | e.g. `CSE0612301` |
| title | text | required | e.g. "Database Management System" |
| creditHours | numeric | required | e.g. 3 |
| createdAt | timestamp | default now | |

**Indexes**: unique `(code)`. **No `subjectId`** — migration drops the column and the `idx_courses_subject_id` index.

**onDelete**: no parent reference anymore. `questions.courseId → courses.id` uses `onDelete: "restrict"` (a course with questions must not silently vanish — FR-030).

**Admin add/edit (FR-030)**: admins add (`code` unique, `title`, `creditHours`) and edit (`title`, `creditHours` only). Deletion of a course referenced by ≥1 question is blocked by the FK restrict.

---

## questions (revised)

User-submitted past papers. Universal approval trio unchanged (`status`/`approvedBy`/`approvedAt`). Classification is now **exactly one `courseId`** (combobox only — no `customSubject`/`customCourse`).

| Field | Type | Constraints | Notes |
|---|---|---|---|
| id | uuid | PK | default random |
| title | text | required | |
| titleTsv | tsvector | generated (`to_tsvector('english', "title")`) | unchanged from 003 |
| courseId | uuid | FK → courses.id, **required** | `onDelete: restrict` |
| batchNumber | integer | required | dynamic dropdown ≤ CURRENT_BATCH; quick-searchable in filters |
| programType | enum | `regular` \| `diploma` \| `evening`, default `regular`, required | replaces `program` + `evening` |
| season | enum | `summer` \| `fall` \| `spring` | required at app layer; DB nullable during migration backfill (see Migration) |
| year | integer | | required at app layer; DB nullable during migration backfill |
| teacherName | text | nullable | free text; no FK (Faculty Directory not built) |
| examType | enum | `previous_year` \| `midterm` \| `final` \| `lab` \| `viva` | unchanged |
| viewCount | integer | default 0 | atomic increment on detail page reach |
| downloadCount | integer | default 0 | atomic increment per download click |
| uploadedBy | uuid | FK → users.id, nullable, `onDelete: SET NULL` | unchanged |
| status | enum | `pending` \| `approved` \| `rejected`, default `pending` | universal |
| approvedBy | uuid | FK → users.id, nullable, `onDelete: SET NULL` | universal |
| approvedAt | timestamp | nullable | universal |
| createdAt / updatedAt | timestamp | `updatedAt` via `$onUpdate` | |

**Dropped columns** (migration `0005`): `customSubject`, `customCourse`, `program`, `evening`, `fileUrl`.

**Indexes** (revised):
- GIN `title_tsv` (unchanged)
- btree `(status, batchNumber)` (unchanged — serves listing + batch chips)
- btree `(status, courseId)` (add — serves course filter + course chips)
- btree `(courseId)` → fold into `(status, courseId)`; drop standalone if redundant
- btree `(uploadedBy)`, `(examType)`, `(programType)` 
- drop `idx_questions_program_evening`

**Validation Rules** (revised; renumbered from 003):
- Q-001: every question has exactly one `courseId` (combobox-only; SC-013).
- Q-002: `programType` ∈ `regular|diploma|evening` default `regular`; `season` ∈ `summer|fall|spring`; `year` integer — all required at app layer.
- Q-003: `teacherName` optional free text.
- Q-004: files — 1–5 `image` rows OR exactly 1 `pdf` row, never both/zero (Zod + server action).
- Q-005: rate limit 5/hour via `enforceSubmissionLimit`; staff exempt (unchanged).
- Q-006: `batchNumber` integer ≤ CURRENT_BATCH (unchanged).
- Q-007: title required/trimmed (unchanged).

---

## question_files (NEW)

A question's paper files. Replaces `questions.fileUrl`.

| Field | Type | Constraints | Notes |
|---|---|---|---|
| id | uuid | PK | default random |
| questionId | uuid | FK → questions.id, `onDelete: CASCADE` | cleans up when question removed |
| fileUrl | text | required | UploadThing CDN URL (public ACL, never disclosed to guests) |
| fileType | enum | `image` \| `pdf` | one row = one stored object |
| order | integer | required | 0..n display order for images; pdf always 0 |

**Indexes**: btree `(questionId, order)`.

**Shape rule (SC-008)**: per question — `fileType = 'image'` count ∈ [1,5], XOR exactly one `fileType = 'pdf'` row. Enforced at app/validation layer (form + Zod + action), not as a DB constraint (can't express XOR cleanly).

---

## question_likes (NEW)

Engagement toggle.

| Field | Type | Constraints | Notes |
|---|---|---|---|
| id | uuid | PK | default random |
| questionId | uuid | FK → questions.id, `onDelete: CASCADE` | |
| userId | uuid | FK → users.id, `onDelete: CASCADE` | |
| createdAt | timestamp | default now | |

**Indexes**: unique `(questionId, userId)` (double-like prevention, SC-009); btree `(userId)` if per-user queries ever appear (skip for MVP).

**Rules**: toggle requires login; self-likes allowed (Q3); not rate-limited.

---

## question_tags (unchanged)

From 003 — `questionId` (FK CASCADE) + `tag`, unique `(questionId, tag)`, btree `(tag)`. Unchanged by this revision.

---

## users (unchanged)

Unchanged. `uploadedBy` (SET NULL) and `approvedBy` (SET NULL) FKs from `questions`; new FK from `question_likes.userId` (CASCADE).

---

## State transitions (unchanged from 003)

```
pending → approved  (moderator/admin; status, approvedBy, approvedAt set)
pending → rejected  (moderator/admin; optional reason → notification)
rejected → pending  (submitter edits & re-submits)
approved → pending  (submitter edits approved paper)
```

First reviewer decision wins (conditional update on `status='pending'`). Like toggle and counters have no approval state.

---

## Migration `0005_*` (verified data state)

Live DB (2026-08-10): 1 question row (dev test, `file_url` set), 7 subjects / 70 courses seed. Steps in order:

1. Create enums `question_program_type`, `question_season`, `question_file_type`.
2. Create `question_files` (+ index) and `question_likes` (+ unique).
3. **Data move (manual edit to generated SQL)**: `INSERT INTO question_files (question_id, file_url, file_type, order_) SELECT id, file_url, <image/pdf by URL extension regex>, 0 FROM questions WHERE file_url IS NOT NULL AND file_url <> ''` — before any drop.
4. `ALTER TABLE questions ADD COLUMN program_type ..., season ..., year ..., teacher_name ..., view_count ... DEFAULT 0, download_count ... DEFAULT 0`.
5. Drop `questions.file_url`, `custom_subject`, `custom_course`, `program`, `evening` (+ `idx_questions_program_evening`).
6. Drop `courses.subject_id` (+ `idx_courses_subject_id`), then `DROP TABLE subjects`.
7. Drop enum `question_program` (after `program` column gone).

`season`/`year` added **nullable** (backfill unknowable for the one test row), required enforced at the app layer — matches the `profiles.studentId` nullable-but-required precedent. Drizzle `generate` emits DDL but not step 3; the migration file is manually edited to insert the `INSERT…SELECT` (same workflow as the `pg_trgm` precedent).

---

## Classification display rule (revised)

Filters read `courseId` only. No subject grouping; no "Other" bucket. Filter options: flat course combobox (code/title search), batch quick-search, examType, programType, season, year. Top-N chips aggregate by `courseId` and `batchNumber` over approved questions.
