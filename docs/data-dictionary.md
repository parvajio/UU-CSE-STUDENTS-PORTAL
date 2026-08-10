# CSE Students Portal — Data Dictionary

Covers the entities needed for Phases 1–4 (Foundation, Core Content, Community). Extras-phase entities (CGPA calculator, blood donor, lost & found, learning academy, etc.) are intentionally left out — write their dictionaries when you reach that phase, since their shape may shift based on what you learn building the core first.

Shared pattern used across every user-submitted table: `status`, `approvedBy`, `approvedAt` — noted per table below where it applies.

---

## users
| Field | Type | Constraints | Notes |
|---|---|---|---|
| id | uuid | PK, default random | |
| email | text | unique, required | |
| passwordHash | text | nullable | null if Google-only or `unclaimed` account |
| authProvider | enum | `credentials` \| `google` \| `unclaimed` | `unclaimed` = admin-created placeholder for a legacy alum who has no login yet (e.g. graduated before the portal existed) — no real sign-in until they claim it |
| role | enum | `user` \| `moderator` \| `admin`, default `user` | guest = no row, unauthenticated |
| createdAt | timestamp | default now | |
| updatedAt | timestamp | auto-update via Drizzle `$onUpdate` | |

---

## profiles
| Field | Type | Constraints | Notes |
|---|---|---|---|
| id | uuid | PK | |
| userId | uuid | FK → users.id, nullable (as of migration `0003`), unique when set, `onDelete: CASCADE` | 1:1 with users when set; null for an admin-entered legacy alum whose linked `users` row is `unclaimed` — see Alumni note below for which direction this actually points |
| fullName | text | required | |
| studentId | text | unique when set, nullable | "SID" — required for current students (enforced at app/Zod level, not a DB constraint); left null for a legacy alum an admin adds who has no SID on file |
| batchNumber | integer | required | e.g. `61`, `68` — new batch every ~4 months, so render as a dropdown generated dynamically up to the current max (an admin-configurable `CURRENT_BATCH` value), not a hardcoded option list |
| section | text | required, e.g. `C` | small fixed dropdown (A–F or whatever range the department actually uses) |
| isAlumni | boolean | default `false` | flips a student's own profile into an alumni record — no separate alumni entity; see "Alumni" note below |
| currentCompany | text | nullable | shown only when `isAlumni = true` |
| jobPosition | text | nullable | shown only when `isAlumni = true` |
| avatarUrl | text | nullable | |
| bio | text | nullable, max ~500 chars | |
| facebookUrl | text | nullable | |
| linkedinUrl | text | nullable | |
| whatsappNumber | text | nullable | store with country code, e.g. `+8801...` |
| portfolioUrl | text | nullable | |
| githubUrl | text | nullable | |
| status | enum | `pending` \| `approved` \| `rejected`, default `pending` | |
| approvedBy | uuid | FK → users.id, nullable, `onDelete: SET NULL` | |
| approvedAt | timestamp | nullable | |
| createdAt / updatedAt | timestamp | `updatedAt` via Drizzle `$onUpdate` | |

**Guest-visible columns only:** `fullName`, `batchNumber`, skill tags (via join). Everything else requires login. Enforced in the query itself (role-based SELECT, not app-layer filtering) — see search implementation notes.

**Rate limit:** profile creation AND edits share one combined 1/hour limit (not two separate counters) — enforced at the top of the upsert action before the create/edit branch.

---

## skills
| Field | Type | Constraints | Notes |
|---|---|---|---|
| id | uuid | PK | |
| name | text | required | e.g. "Web Development" or "Next.js" |
| slug | text | unique | for URLs/filters |
| parentSkillId | uuid | FK → skills.id, nullable, `onDelete: SET NULL` | null = top-level category; set = subskill. SET NULL (not CASCADE) so deleting a category doesn't delete its subskills — they become orphaned top-level entries instead |
| colorKey | text | e.g. `blue`, `violet`, `rose`, `amber` | maps to the tag color system in the design doc |

## profile_skills (join table)
| Field | Type | Constraints |
|---|---|---|
| profileId | uuid | FK → profiles.id, `onDelete: CASCADE` |
| skillId | uuid | FK → skills.id, `onDelete: CASCADE` |
| — | | composite PK (profileId, skillId) |

---

## faculty
| Field | Type | Constraints | Notes |
|---|---|---|---|
| id | uuid | PK | |
| fullName | text | required | |
| designation | text | required | e.g. "Assistant Professor" |
| email | text | required | |
| phone | text | nullable | |
| researchInterests | text | nullable | free text or comma-separated |
| officeRoom | text | nullable | |
| photoUrl | text | nullable | |

Admin-managed directly — no `status`/submission flow (per your spec: faculty directory isn't self-service).

---

## Alumni (merged into `profiles`, no separate table)

Superseded decision — kept here for history: an earlier version of this doc had `alumni` as its own table. Revised during spec-kit `/clarify`: most alumni were students on this portal already, so an alumnus is just a `profiles` row with `isAlumni = true`, `currentCompany`, and `jobPosition` set — not a duplicate entity. For a legacy alum with no prior account, an admin creates a `profiles` row (`userId = null`, per migration `0003`) alongside a matching `unclaimed` `users` row, leaving `studentId` null. **Authoritative wording lives in spec.md §3.3-B** — this section and the Key Entities doc both defer to it rather than independently redescribing the pattern.

**No-notification edge case:** approving a legacy-alum profile (`userId = null`) does not send a notification — there's no linked account to notify. Intentional, documented in spec R-016 and T038.

## career_guidance_requests
**Modeled here for forward reference — not implemented in Foundation. Belongs to Phase 3 (Alumni Career Network).**

| Field | Type | Constraints | Notes |
|---|---|---|---|
| id | uuid | PK | |
| studentProfileId | uuid | FK → profiles.id | requester |
| alumniProfileId | uuid | FK → profiles.id | the alumnus being contacted — same table as the requester, since alumni are now just profiles with `isAlumni = true` |
| message | text | required | |
| status | enum | `pending` \| `accepted` \| `declined` | **Deliberate exception to the universal status/approvedBy/approvedAt pattern** — this is a peer-to-peer request the alumnus accepts/declines, not admin-moderated public content, so the approval-workflow shape doesn't apply. Justified explicitly in `plan.md`. |
| createdAt | timestamp | | |

Rate limit for career-guidance requests: **TBD, decided during Phase 3's own `/specify` cycle** — not decided now, in isolation, ahead of the module that actually needs it.

---

## subjects (superseded — removed by the 004 revision)

Superseded decision — kept here for history: an earlier revision (2026-08-08, Digital Question Bank `/specify` amendment) curated question-bank classification as a `subjects` + `courses` reference hierarchy seeded from `uu-cse-courses-seed.json` (7 subjects), with `courses.subject_id` linking each course to exactly one subject. **Reversed 2026-08-10 by the 004 revision**: the hierarchy was deemed unnecessary overhead — `subjects` is dropped (migration `0005`), `courses` is flattened (no `subjectId`), and classification is a combobox over the flat `courses` catalog only. Seeding no longer touches subjects. Mirror of the alumni-history note — not a silent delete. Authoritative wording lives in `specs/004-question-bank-revision/spec.md` (FR-029).

## courses
Flat, admin-managed reference catalog for the question bank (revised 2026-08-10 — no `subjectId`). Seeded from `uu-cse-courses-seed.json`'s `courses` array; the JSON's duplicate codes are de-duplicated by `code` at seed time (**keep one code, remove the duplicate**) so the unique rule holds. `diploma-exempted` entries are excluded (diploma is a per-question `programType`, not a subject).

| Field | Type | Constraints | Notes |
|---|---|---|---|
| id | uuid | PK | |
| code | text | unique, required | e.g. `CSE0612301` |
| title | text | required | e.g. "Database Management System" |
| creditHours | numeric | required | e.g. 3 |
| createdAt | timestamp | default now | |

**Admin add/edit (FR-030)**: admins add a course (`code` unique, `title`, `creditHours`) and edit `title`/`creditHours`. Deletion of a course referenced by ≥1 question is blocked by the FK `restrict` on `questions.courseId` — no delete action exists.

## questions
| Field | Type | Constraints | Notes |
|---|---|---|---|
| id | uuid | PK | |
| title | text | required | |
| titleTsv | tsvector | generated (`to_tsvector('english', "title")`) | Postgres-maintained, no app writes |
| courseId | uuid | FK → courses.id, **required**, `onDelete: restrict` | **combobox-only classification** — exactly one `courseId`, no free-text fallback (004 revision) |
| batchNumber | integer | required | dynamic dropdown up to `CURRENT_BATCH` — same pattern as `profiles.batchNumber` |
| programType | enum | `regular` \| `diploma` \| `evening`, default + required `regular` | replaces `program` + `evening` (004 revision) |
| season | enum | `summer` \| `fall` \| `spring` | required at app layer; DB nullable (backfill-unaware at migration) — `profiles.studentId` precedent |
| year | integer | | required at app layer; DB nullable (same precedent) |
| teacherName | text | nullable | free text; no FK (Faculty Directory not built) |
| examType | enum | `previous_year` \| `midterm` \| `final` \| `lab` \| `viva` | |
| viewCount | integer | default `0`, required | atomic increment on detail page reach |
| downloadCount | integer | default `0`, required | atomic increment per download click |
| uploadedBy | uuid | FK → users.id, nullable, `onDelete: SET NULL` | |
| status | enum | `pending` \| `approved` \| `rejected` | |
| approvedBy / approvedAt | | nullable | |
| createdAt / updatedAt | timestamp | `updatedAt` via Drizzle `$onUpdate` | |

**Dropped columns (migration `0005`)**: `customSubject`, `customCourse`, `program`, `evening`, `fileUrl` (replaced by `question_files`).

**File rule (Q-004)**: each question has 1–5 `image` `question_files` rows **XOR** exactly 1 `pdf` row, never both/zero — enforced at the validation layer (Zod + server action), not as a DB constraint (XOR isn't expressible cleanly).

## question_files (NEW — 004 revision)
A question's paper files; replaces `questions.fileUrl`.

| Field | Type | Constraints | Notes |
|---|---|---|---|
| id | uuid | PK | |
| questionId | uuid | FK → questions.id, `onDelete: CASCADE` | |
| fileUrl | text | required | UploadThing CDN URL (public ACL, never disclosed to guests) |
| fileType | enum | `image` \| `pdf` | one row = one stored object |
| order | integer | required | display order 0..n for images; pdf always 0 — SQL column `order_` (reserved word) |
| createdAt | timestamp | default now | |

Index: btree `(questionId, order)`.

## question_likes (NEW — 004 revision)
Engagement toggle.

| Field | Type | Constraints | Notes |
|---|---|---|---|
| id | uuid | PK | |
| questionId | uuid | FK → questions.id, `onDelete: CASCADE` | |
| userId | uuid | FK → users.id, `onDelete: CASCADE` | |
| createdAt | timestamp | default now | |

Index: unique `(questionId, userId)` — double-like prevention. Toggle requires login; self-likes allowed; not rate-limited.

## question_tags (join table, for flexible multi-tag filtering)
| Field | Type | Constraints |
|---|---|---|
| id | uuid | PK, default random |
| questionId | uuid | FK → questions.id, required, indexed |
| tag | text | required |
| createdAt | timestamp | default now |

Composite unique `(questionId, tag)` prevents duplicate tags on the same question; btree index on `tag` supports tag filtering. Recommend a join table over a text array — lets you filter/search by tag with a normal indexed join instead of array containment queries.

---

## clubs
| Field | Type | Constraints |
|---|---|---|
| id | uuid | PK |
| name | text | unique, required |
| description | text | nullable |
| logoUrl | text | nullable |

## club_members
| Field | Type | Constraints | Notes |
|---|---|---|---|
| id | uuid | PK | |
| clubId | uuid | FK → clubs.id | |
| profileId | uuid | FK → profiles.id | |
| roleInClub | enum | `member` \| `executive` \| `advisor` | |
| position | text | nullable | e.g. "President", "General Secretary" |
| joinedAt | timestamp | | |

---

## notices
| Field | Type | Constraints |
|---|---|---|
| id | uuid | PK |
| title | text | required |
| body | text | required |
| createdBy | uuid | FK → users.id (moderator/admin only) |
| createdAt | timestamp | |

---

---

## notifications

Added during Foundation planning (not in the original doc — synced here after the fact per the constitution's single-source-of-truth requirement).

| Field | Type | Constraints | Notes |
|---|---|---|---|
| id | uuid | PK | |
| userId | uuid | FK → users.id, required, `onDelete: CASCADE` | |
| type | text | required | |
| title | text | required | |
| message | text | nullable | |
| resourceType | text | nullable | e.g. `"profile"`, `"question"` — no FK, see note below |
| resourceId | uuid | nullable | **Deliberately no FK constraint** — this is a polymorphic reference; `resourceType` determines which table it points to, and Postgres can't express a single FK across multiple possible target tables. Integrity here is enforced at the application layer (wherever `insertNotification` is called), not the database. |
| read | boolean | default `false` | |
| createdAt | timestamp | default now | |

**Index:** composite `(userId, read)`, userId-first — matches the exact query shape the notification bell polls every 30s (`WHERE userId=? AND read=false`).

**30-day auto-clear (R-016):** deferred, not implemented in Foundation. Intended approach when built: cleanup-on-read-query rather than a cron job.

---

## site_config

Added late in Foundation (T056, admin-configurable `CURRENT_BATCH`) — a generic key/value table so future admin-runtime settings can reuse it instead of each needing its own table.

| Field | Type | Constraints | Notes |
|---|---|---|---|
| key | text | PK | e.g. `"currentBatch"` |
| value | jsonb | required | |
| updatedBy | uuid | FK → users.id | |
| updatedAt | timestamp | | |

**`currentBatch` specifically:** read via a plain, uncached `getCurrentBatch()` query (deliberately no caching layer — this value needs to be visible immediately when an admin updates it). Updates are **non-decreasing only** — rejected if the new value is below the current one, since lowering it would retroactively violate the rule that every `profiles.batchNumber` must be ≤ `CURRENT_BATCH`.

---

## Rate Limiting Convention

- **Default (5/hour):** enforced via a shared `enforceSubmissionLimit(userId)` wrapper in `rate-limit.ts` — the intended default for every submission action across every future module (questions, club posts, etc.), not just Foundation's. New submission actions should call this wrapper rather than reimplementing the check.
- **Profile upsert (exception, 1/hour):** creation and edits share **one combined** counter, checked unconditionally before the create/edit branch in `upsertProfile` — not two separate limits, and not exempting creation.
- **Registration (IP-based):** `T050` also rate-limits `registerUser` by IP — a reasonable scope addition beyond the original submission-content intent, not part of the 5/hour or 1/hour patterns above.
- **Known limitation, accepted for MVP:** the store is an in-memory `Map` — per-instance and ephemeral on Vercel serverless, so limits are approximate across concurrent instances and reset on cold starts. Documented in `plan.md`. Revisit (move to Upstash/Redis or a Neon table) if concurrent users regularly exceed ~500, or if Vercel scaling introduces multiple concurrent instances under normal (non-spike) load.

---

## Resolved Decisions

1. **Batch/section:** split into `batchNumber` (integer, dropdown generated dynamically up to the current batch — not a hardcoded list, since a new batch starts every ~4 months) and `section` (e.g. `C`, small fixed dropdown).
2. **Student ID:** required, unique `studentId` field on profiles — used by admins to verify real CSE students before approval.
3. **WhatsApp number:** stored as free text for now, no validation/formatting enforced at input.
4. **Alumni:** merged into `profiles` via an `isAlumni` flag — no separate table. `studentId` is nullable (unique when set) to allow a legacy alum with no SID; `users.authProvider` gains an `unclaimed` value for admin-created accounts with no real login yet.
5. **`profiles.userId` is nullable** (migration `0003`, additive — applied after the initial schema, not squashed into it) — required for the legacy-alum pattern in decision 4 to actually be insertable.
6. **Alumni approval stays inside the universal pattern, admin-only** — no separate moderator-approvable "alumni" resource type, no no-approval-needed toggle. An `isAlumni` change is just a profile edit, subject to the same admin-only approval as everything else on `profiles`.
7. **`career_guidance_requests` is a deliberate, documented exception** to the universal status/approvedBy/approvedAt pattern (peer accept/decline, not admin moderation) — justified in `plan.md`, not treated as a gap to close.
8. **Notifications and rate-limiting conventions** are documented above as their own sections, added after the original doc was written — see those sections for the shared-wrapper pattern and the accepted in-memory-store limitation.
9. **Question bank course/subject classification was a curated catalog (2026-08-08):** `subjects` + `courses` reference tables seeded from `uu-cse-courses-seed.json`; `questions.courseId` was the primary path with `customSubject`/`customCourse` as a free-text "other" fallback (a question uses exactly one of the two, never both). `questions.batch` became `batchNumber` (integer) reusing the `profiles` dynamic-dropdown pattern. Seed dedupe rule: **keep one code, remove the duplicate**. Diploma was a per-question `program` flag (`regular`|`diploma`, default `regular`) plus an `evening` boolean — **not** a subject. **Superseded by decision 10 (004 revision).**
10. **Question bank revision — classification combobox-only (2026-08-10, 004):** the subject/course hierarchy is reversed: `subjects` is dropped (migration `0005`), `courses` is flattened (no `subjectId`), and every question has **exactly one `courseId`** — no `customSubject`/`customCourse` "Other" fallback (spec SC-013/Q-001). `program`+`evening` are replaced by a single `programType` enum (`regular|diploma|evening`); `questions` gains `season`/`year`/`teacherName`/`viewCount`/`downloadCount` and drops `fileUrl` in favor of the new `question_files` (1–5 images XOR 1 pdf) and `question_likes` (unique `(questionId, userId)`) tables. Admin course management ships in scope (**FR-030**: add `code`/`title`/`creditHours`, edit `title`/`creditHours`, no delete for referenced courses). Downloads are per-image plus a client-side ZIP bundle. Season/year are nullable-at-DB + app-required (backfill-unaware — the `profiles.studentId` precedent), and the `0005` migration preserves the single pre-existing question row via a two-step `file_url` → `question_files` data move (like the `pg_trgm` precedent). See `specs/004-question-bank-revision/spec.md` and `data-model.md`.
