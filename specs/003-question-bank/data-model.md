# Data Model: Digital Question Bank

**Phase**: 1 — Design & Contracts | **Date**: 2026-08-08

Schema is copied **verbatim** from `docs/data-dictionary.md` (the single source of truth per constitution). New tables: `subjects`, `courses`, `questions`, `question_tags`. `questions` reuses the universal approval trio (`status`/`approvedBy`/`approvedAt`) per constitution §III.

---

## subjects

Curated top-level categories for the question bank. Seeded from `uu-cse-courses-seed.json` (7 subjects; `diploma-exempted` excluded).

| Field | Type | Constraints | Notes |
|---|---|---|---|
| id | uuid | PK | default random |
| slug | text | unique, required | e.g. `cse-core` |
| name | text | required | e.g. "CSE Core" |
| createdAt | timestamp | default now | (consistent with repo timestamps) |

**Indexes**: none beyond PK/unique.

---

## courses

Curated courses, one per subject. Seeded with dedupe-by-`code` (keep one row under the course's real subject); the seed's former `_CHECK` rows were resolved 2026-08-09 (true duplicate `CSE0613307` dropped, the other 3 kept with stated credits) — 7 subjects / 70 courses.

| Field | Type | Constraints | Notes |
|---|---|---|---|
| id | uuid | PK | default random |
| code | text | unique, required | e.g. `CSE0612301` |
| title | text | required | e.g. "Database Management System" |
| creditHours | numeric | required | e.g. 3 |
| subjectId | uuid | FK → subjects.id | a course belongs to exactly one subject |
| createdAt | timestamp | default now | |

**Indexes**: btree `(subjectId)` (FK filter path), unique `(code)`.

**onDelete**: `subjectId` → `CASCADE`? No — a curated reference catalog; use `onDelete: "cascade"` for join-by-owner cleanup? The catalog is reference data (not user-submitted), so deletions are admin-managed; follow the `SET NULL`-vs-`CASCADE` convention: FK from a reference row that must keep existing questions intact → `onDelete: "restrict"` (a subject/course with questions must not silently vanish). Implementation detail: use `onDelete: "restrict"` on `courses.subjectId` and `questions.courseId` to preserve history.

---

## questions

User-submitted past papers. Carries the universal approval trio. Classification: **exactly one of** `courseId` OR `customSubject`+`customCourse` (SC-004a).

| Field | Type | Constraints | Notes |
|---|---|---|---|
| id | uuid | PK | default random |
| title | text | required | |
| courseId | uuid | FK → courses.id, nullable | **primary classification path** |
| customSubject | text | nullable | free-text fallback; used with `customCourse` |
| customCourse | text | nullable | free-text "other" course; mutually exclusive with `courseId` |
| batchNumber | integer | required | dynamic dropdown up to `CURRENT_BATCH` |
| program | enum | `regular` \| `diploma`, default `regular` | per-question flag |
| evening | boolean | default `false` | per-question flag |
| examType | enum | `previous_year` \| `midterm` \| `final` \| `lab` \| `viva` | |
| fileUrl | text | required | UploadThing CDN URL (public ACL) |
| uploadedBy | uuid | FK → users.id | |
| status | enum | `pending` \| `approved` \| `rejected`, default `pending` | universal |
| approvedBy | uuid | FK → users.id, nullable | universal; `onDelete: SET NULL` |
| approvedAt | timestamp | nullable | universal |
| createdAt | timestamp | default now | |
| updatedAt | timestamp | `$onUpdate` | matches repo convention |

**Indexes** (align with Foundation `profiles` pattern + SC-002 scale):
- GIN tsvector generated column `title_tsv` on `title` (text search)
- btree `(status)` and composite `(status, batchNumber)` for the primary filtered listing
- btree `(courseId)`, `(uploadedBy)`, `(examType)` for filters
- btree `(program, evening)` for badge filtering
- FK `uploadedBy`, `approvedBy` constraints per `users`

**Validation Rules** (from spec FRs):
- Q-001: file is PDF/PNG/JPEG, ≤ 10 MB — enforced by UploadThing file router (`maxFileSize: "10MB"`) + client preview.
- Q-002: rate limit 5 content submissions/hour via `enforceSubmissionLimit(userId)`; moderators/admins exempt.
- Q-003: classification XOR — exactly one of `courseId` OR `customSubject`+`customCourse` (Zod union in Server Action).
- Q-004: `batchNumber` must be an integer ≤ `CURRENT_BATCH` (dynamic dropdown enforces; Server Action re-validates).
- Q-005: `program` ∈ `regular|diploma` (default `regular`), `evening` boolean (default `false`) — always populated (SC-004b).
- Q-006: `fileUrl` required and `https://` prefixed (Server Action re-validates after UploadThing handoff).
- Q-007: title required, trimmed, non-empty.

---

## question_tags (join table, free-form)

| Field | Type | Constraints | Notes |
|---|---|---|---|
| id | uuid | PK | default random |
| questionId | uuid | FK → questions.id | `onDelete: CASCADE` (cleans up when question removed) |
| tag | text | required | free-form; not a fixed vocabulary |
| createdAt | timestamp | default now | |

**Indexes**: btree `(tag)`; composite `(questionId, tag)` unique to prevent duplicates per question.

**Rationale**: join table over text array (per data-dictionary recommendation) — enables indexed tag filtering with normal joins instead of array containment.

---

## State transitions

```
pending → approved  (moderator/admin; status, approvedBy, approvedAt set)
pending → rejected  (moderator/admin; optional reason → notification)
rejected → pending  (submitter edits & re-submits — re-enters approval; A-6)
approved → pending  (submitter edits approved paper — re-enters approval; A-6)
```

Only the first reviewer decision wins (concurrent-safety via conditional update on `status='pending'` — same as Foundation `decideItem`).

---

## Classification display rule

Filters group by subject; course options come from `courses` under their subject; any `customCourse` questions surface as a secondary "Other" group (never silently merged with a curated course of the same name).

---

## Approvals note

`question` resource type already exists in the `canApprove` matrix (`["moderator","admin"]`) — no permission changes. Approval flow is the existing dashboard (spec 002 Approval Workflow); this feature registers `question` in `approvalQueries` + `decisionHandlers` only.

## Migration

New `drizzle-kit generate` migration `0004_*` from the four new schema files. `0000`'s `CREATE EXTENSION pg_trgm` precedent is unaffected; the tsvector GIN index needs no pg_trgm. Verify `db:generate` output before `db:migrate`.