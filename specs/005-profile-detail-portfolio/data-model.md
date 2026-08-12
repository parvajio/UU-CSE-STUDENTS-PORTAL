# Data Model: Profile Detail Page + Personal Portfolio

**Phase**: 1 — Design & Contracts | **Date**: 2026-08-12

Greenfield tables for this feature. Names land in `docs/data-dictionary.md` (single source of truth) and the Drizzle schema at `src/lib/db/schema/`. Follows the project schema conventions: `$onUpdate` for `updatedAt`, `onDelete: CASCADE` from `profiles.id`, relations centralized in `relations.ts`.

**Key standing decision**: all four tables are a **documented exception to the universal `status/approvedBy/approvedAt` approval pattern** — same standing as `career_guidance_requests` (spec FR-014). No approval columns. Visibility is governed solely by the owning `profiles.status`; portfolio mutations never touch profile approval.

---

## profile_achievements

A profile's achievement/honor entries. Owner-curated, unmoderated.

| Field | Type | Constraints | Notes |
|---|---|---|---|
| id | uuid | PK, default random | |
| profileId | uuid | FK → profiles.id, required, `onDelete: CASCADE` | |
| title | text | required | e.g. "ICPC Regionalist" |
| achievedDate | timestamp | nullable | drives newest-first sort |
| description | text | nullable | |
| imageUrl | text | nullable | at most one image (clarification Q1) |
| linkUrl | text | nullable | NEW — optional link, matching the projects/certificates link pattern (Q1) |
| createdAt / updatedAt | timestamp | `updatedAt` via `$onUpdate` | |

**Indexes**: btree `(profileId)` — detail-page lookup.

## profile_projects

A profile's project showcase entries.

| Field | Type | Constraints | Notes |
|---|---|---|---|
| id | uuid | PK, default random | |
| profileId | uuid | FK → profiles.id, required, `onDelete: CASCADE` | |
| title | text | required | |
| description | text | nullable | |
| techStack | text[] | nullable | free-text tags, NOT a skill FK and NOT an enum |
| demoUrl | text | nullable | |
| repoUrl | text | nullable | |
| startDate | timestamp | nullable | drives newest-first sort |
| endDate | timestamp | nullable | null ⇒ "Present" |
| imageUrl | text | nullable | at most one image (Q1) |
| createdAt / updatedAt | timestamp | `updatedAt` via `$onUpdate` | |

**Indexes**: btree `(profileId)`.

## profile_certificates

A profile's certificate/credential entries.

| Field | Type | Constraints | Notes |
|---|---|---|---|
| id | uuid | PK, default random | |
| profileId | uuid | FK → profiles.id, required, `onDelete: CASCADE` | |
| title | text | required | |
| issuer | text | required | |
| issueDate | timestamp | nullable | drives newest-first sort |
| credentialUrl | text | nullable | |
| imageUrl | text | nullable | at most one image (Q1) |
| createdAt / updatedAt | timestamp | `updatedAt` via `$onUpdate` | |

**Indexes**: btree `(profileId)`.

## profile_experiences

A profile's work/position entries. **Deliberately no `imageUrl`** (Q1).

| Field | Type | Constraints | Notes |
|---|---|---|---|
| id | uuid | PK, default random | |
| profileId | uuid | FK → profiles.id, required, `onDelete: CASCADE` | |
| company | text | required | |
| role | text | required | |
| startDate | timestamp | nullable | drives newest-first sort |
| endDate | timestamp | nullable | null ⇒ "Present" |
| description | text | nullable | |
| createdAt / updatedAt | timestamp | `updatedAt` via `$onUpdate` | |

**Indexes**: btree `(profileId)`.

---

## profiles (unchanged, referenced)

The owning record. `profiles.id` is the FK target (CASCADE). Guest-visible columns remain `{id, fullName, batchNumber}` + skill tags via join. Portfolio content is only ever returned when `profiles.status = 'approved'`; an owner drafts while `pending` via `/profile` only.

## users (unchanged, referenced transitively)

No new FKs from `users`. Ownership is resolved at the app layer: `profiles.userId = session.user.id`.

---

## Validation rules (app layer, `src/lib/portfolio/validation.ts`)

- **P-001**: every entity row requires a valid `profileId` whose owning `profiles.userId` equals the session user id (server-side owner guard; never trust a client-supplied `profileId`) — FR-019.
- **P-002**: required fields per entity — achievements `title`; projects `title`; certificates `title` + `issuer`; experiences `company` + `role`; all trimmed, non-empty.
- **P-003**: URL fields (`imageUrl`, `linkUrl`, `demoUrl`, `repoUrl`, `credentialUrl`) must be empty or a valid `http(s)://` URL (Zod `.url()`); `imageUrl` additionally must be an image extension-free URL from the UploadThing host (defense-in-depth check only — the upload router already restricts to images).
- **P-004**: at most one `imageUrl` per entry; experiences accept none (the manager simply offers no image field) — FR-023.
- **P-005**: `techStack` is free text (any array of trimmed strings ≤ 50 chars each); not validated against the `skills` table — FR-014 side-effect of the exception.
- **P-006**: dates optional; `endDate` may be null ("Present"); no `endDate < startDate` validation in v1 (self-curated, low stakes — documented assumption).
- **P-007**: mutation rate limit `checkRateLimit("portfolio:<entity>:<userId>", 10, 1h)` per entity type, add+update+delete combined, all roles — FR-017.
- **P-008**: no approval status transition — portfolio add/update/delete MUST NOT change `profiles.status`/`approvedBy`/`approvedAt` (they are never written by these actions) — FR-015.

## State transitions

None for portfolio entities — no moderation lifecycle (spec FR-014). The only relevant lifecycle is the owning profile's: portfolio visible publicly iff `profiles.status = 'approved'`; otherwise owner-only editing/draft preview on `/profile`.

## Migration `0006_*`

Single migration creating the four tables with final columns (research R-7). Steps:

1. `CREATE TABLE profile_achievements` (+ btree `(profile_id)`).
2. `CREATE TABLE profile_projects` (+ btree `(profile_id)`).
3. `CREATE TABLE profile_certificates` (+ btree `(profile_id)`).
4. `CREATE TABLE profile_experiences` (+ btree `(profile_id)`).
5. Four `ALTER TABLE ... ADD CONSTRAINT ... FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE`.

Generated by `drizzle-kit generate` from the schema files; no manual SQL edits required (no data backfill, no enum, no reserved-word columns). Apply via `npm run db:migrate` or, if `db:migrate` hangs on this machine (005 handoff landmine), the Neon HTTP apply path (`npx tsx --env-file=.env -e "..."` with `db.execute()`), then reconcile `drizzle.__drizzle_migrations`.

## Guest-read rule (query layer, FR-003/004/006)

Both `searchDirectory` (guest branch unchanged) and the new `getProfileDetail` (guest branch) select only `{id, fullName, batchNumber}` + `skills` via join. Portfolio tables are never joined/selected for a guest; `bio`, socials, `section`, `avatarUrl`, `studentId`, and all four portfolio arrays are authed-only. Verified by the extended `scripts/verify-guest-sql.ts` (raw-SQL assertion that no portfolio column appears in the guest `SELECT`).
