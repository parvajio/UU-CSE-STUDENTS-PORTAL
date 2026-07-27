# Data Model: Portal User Scenarios

**Phase**: 1 — Design & Contracts
**Date**: 2026-07-27
**Source**: `docs/data-dictionary.md` (exact schema), `spec.md` (behavioral constraints)

## Entity Overview

All tables below match `docs/data-dictionary.md` exactly. Drizzle schema files live at `src/lib/db/schema/`.

---

## users

| Field | Type | Constraints | Notes |
|---|---|---|---|
| id | uuid | PK, default random | |
| email | text | unique, required | |
| passwordHash | text | nullable | null if Google-only account |
| authProvider | enum | `credentials` \| `google` | |
| role | enum | `user` \| `moderator` \| `admin`, default `user` | guest = no row (unauthenticated) |
| createdAt | timestamp | default now | |
| updatedAt | timestamp | auto-update | |

**Relationships**: 1:1 with profiles (`profiles.userId`), 1:many with questions (`questions.uploadedBy`)

**Validation Rules**:
- R-001: Email must be unique
- R-002: At least one auth method (passwordHash for credentials, provider set to `google` for Google-only)
- R-003: Role transitions (user→moderator, moderator→admin) require admin action only

---

## profiles

| Field | Type | Constraints | Notes |
|---|---|---|---|
| id | uuid | PK | |
| userId | uuid | FK → users.id, unique | 1:1 with users |
| fullName | text | required | |
| studentId | text | required, unique | Admin verification key |
| batchNumber | integer | required | Dynamic dropdown up to CURRENT_BATCH |
| section | text | required | Fixed dropdown (A–F) |
| avatarUrl | text | nullable | |
| bio | text | nullable, max ~500 chars | |
| facebookUrl | text | nullable | |
| linkedinUrl | text | nullable | |
| whatsappNumber | text | nullable | Store with country code |
| portfolioUrl | text | nullable | |
| githubUrl | text | nullable | |
| isAlumni | boolean | default false | Clarification: self-toggle marks profile as alumni |
| currentCompany | text | nullable | Visible only when isAlumni = true |
| jobPosition | text | nullable | Visible only when isAlumni = true |
| status | enum | `pending` \| `approved` \| `rejected`, default `pending` | |
| approvedBy | uuid | FK → users.id, nullable | |
| approvedAt | timestamp | nullable | |
| createdAt | timestamp | default now | |
| updatedAt | timestamp | auto-update | |

> **Note**: `isAlumni`, `currentCompany`, `jobPosition` are additions from the clarification session. They are not in the original `data-dictionary.md` but are needed per the spec's approved student-to-alumni lifecycle. These should be added to the dictionary on next update.

**Guest-visible columns only**: `fullName`, `batchNumber`, skill tags (via join). Everything else requires login.

**Validation Rules**:
- P-001: One profile per userId (unique constraint enforced)
- P-002: studentId must be unique across all profiles
- P-003: Batch number must be ≤ admin-configurable CURRENT_BATCH
- P-004: Editing an approved profile resets status to pending
- P-005: Rate limit: 1 profile edit per hour per user

**Approval Lifecycle**: pending → (approved | rejected) via admin.
When `isAlumni` is toggled on an approved profile without changing other fields, no re-approval is needed.

---

## skills

| Field | Type | Constraints | Notes |
|---|---|---|---|
| id | uuid | PK | |
| name | text | required | e.g. "Web Development" |
| slug | text | unique | For URLs/filters |
| parentSkillId | uuid | FK → skills.id, nullable | null = top-level, set = subskill |
| colorKey | text | nullable | e.g. "blue", "violet", "rose" |

**Relationships**: Self-referencing via parentSkillId. Many-to-many with profiles via profile_skills.

**Validation Rules**: Slug must be unique. A skill cannot be its own parent.

---

## profile_skills (join)

| Field | Type | Constraints |
|---|---|---|
| profileId | uuid | FK → profiles.id |
| skillId | uuid | FK → skills.id |
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
| researchInterests | text | nullable | |
| officeRoom | text | nullable | |
| photoUrl | text | nullable | |

**Relationships**: None (admin-managed, no user/approval relationship)
**Approval Workflow**: None — admin creates/edits/deletes directly, changes are immediate.

---

## alumni

| Field | Type | Constraints | Notes |
|---|---|---|---|
| id | uuid | PK | |
| userId | uuid | FK → users.id, nullable, unique when set | null when admin-entered directly |
| fullName | text | required | |
| batchNumber | integer | required | |
| currentCompany | text | nullable | |
| jobPosition | text | nullable | |
| linkedinUrl | text | nullable | |
| facebookUrl | text | nullable | |
| contactInfo | text | nullable | |
| status | enum | `pending` \| `approved` \| `rejected` | |
| approvedBy | uuid | FK → users.id, nullable | |
| approvedAt | timestamp | nullable | |
| createdAt | timestamp | default now | |

**Two creation paths**:
1. **Self-submission** (userId set) → starts `pending`, admin approves
2. **Admin entry** (userId null) → inserted directly as `approved`

**Relationship to profiles**: When `isAlumni = true` on a profile, that profile also appears in the alumni directory. The `alumni` table handles the separate case — graduates without portal accounts entered by admin.

---

## career_guidance_requests

| Field | Type | Constraints |
|---|---|---|
| id | uuid | PK |
| studentProfileId | uuid | FK → profiles.id (requester) |
| alumniId | uuid | FK → alumni.id |
| message | text | required |
| status | enum | `pending` \| `accepted` \| `declined` |
| createdAt | timestamp | default now |

**Lifecycle**: pending → (accepted | declined) via alumnus action.

---

## questions

| Field | Type | Constraints | Notes |
|---|---|---|---|
| id | uuid | PK | |
| title | text | required | |
| subject | text | required | |
| course | text | required | Course code |
| batch | text | required | |
| examType | enum | `previous_year` \| `midterm` \| `final` \| `lab` \| `viva` | |
| fileUrl | text | required | PDF or image via upload service |
| uploadedBy | uuid | FK → users.id | |
| status | enum | `pending` \| `approved` \| `rejected`, default `pending` | |
| approvedBy | uuid | FK → users.id, nullable | |
| approvedAt | timestamp | nullable | |
| createdAt | timestamp | default now | |

**Validation Rules**:
- Q-001: File must be PDF or PNG/JPEG image, ≤ 10 MB
- Q-002: Rate limit: 5 content submissions per hour (includes questions, projects, etc.)

---

## question_tags (join)

| Field | Type |
|---|---|
| questionId | uuid, FK → questions.id |
| tag | text |

**Note**: Join table over a text array enables indexed filtering with normal joins.

---

## clubs

| Field | Type | Constraints |
|---|---|---|
| id | uuid | PK |
| name | text | unique, required |
| description | text | nullable |
| logoUrl | text | nullable |

---

## club_members

| Field | Type | Constraints | Notes |
|---|---|---|---|
| id | uuid | PK | |
| clubId | uuid | FK → clubs.id | |
| profileId | uuid | FK → profiles.id | |
| roleInClub | enum | `member` \| `executive` \| `advisor` | |
| position | text | nullable | e.g. "President" |
| joinedAt | timestamp | default now | |

---

## notices

| Field | Type | Constraints |
|---|---|---|
| id | uuid | PK |
| title | text | required |
| body | text | required |
| createdBy | uuid | FK → users.id (moderator/admin only) |
| createdAt | timestamp | default now |

**Validation Rules**: Only moderators and admins can create notices.

---

## events

| Field | Type | Constraints |
|---|---|---|
| id | uuid | PK |
| title | text | required |
| description | text | nullable |
| date | timestamp | required |
| mediaUrl | text | nullable |
| registrationUrl | text | nullable |
| createdBy | uuid | FK → users.id (admin only) |

**Behavior**: Next upcoming event (future event with smallest future date) gets the countdown card in the Event Gallery. Past events (date < now) appear in the archive grid.

---

## projects

| Field | Type | Constraints |
|---|---|---|
| id | uuid | PK |
| title | text | required |
| description | text | nullable |
| githubUrl | text | nullable |
| demoUrl | text | nullable |
| teamMembers | text | nullable (free text list) |
| status | enum | `pending` \| `approved` \| `rejected`, default `pending` |
| approvedBy | uuid | FK → users.id, nullable |
| approvedAt | timestamp | nullable |
| createdAt | timestamp | default now |

**Approval Lifecycle**: Standard approval pattern — user submits (pending) → admin approves/rejects.

---

## notifications

| Field | Type | Constraints |
|---|---|---|
| id | uuid | PK |
| userId | uuid | FK → users.id, required |
| type | text | required (e.g. "approval", "rejection", "guidance_accepted") |
| title | text | required |
| message | text | nullable |
| resourceType | text | nullable (e.g. "profile", "question", "project") |
| resourceId | uuid | nullable (links to the relevant resource) |
| read | boolean | default false |
| createdAt | timestamp | default now |

> **Note**: This table is derived from the research clarifications, not from `data-dictionary.md`. It supports the in-app notification bell system. Add to dictionary on next update.

**Behavior**: Notifications auto-delete after 30 days (via cron job or cleanup on read query).

---

## State Transition Diagrams

### Universal Approval Pattern

```text
[User submits] → status=pending → [Admin/Mod reviews]
                                      ├── Approved → status=approved, visible to all
                                      └── Rejected → status=rejected, submitter notified
[User edits approved resource] → status=pending (re-enters workflow)
```

### Alumni Self-Toggle

```text
[Profile is approved, isAlumni=false]
  └── Student toggles "I am an alumnus"
        └── isAlumni=true, currentCompany/jobPosition editable
              └── Profile appears in both directory and alumni network
              └── If existing fields unchanged: no re-approval needed
              └── If profile content changed: re-enters approval workflow
```

### Career Guidance Request

```text
[Student sends request] → status=pending → [Alumnus reviews]
                                              ├── Accepted → status=accepted
                                              └── Declined → status=declined
```

## Key Relationships Diagram

```text
users (1) ──→ (0..1) profiles ──→ (M) profile_skills ←── (M) skills
                                                              ↑
                                                         parentSkillId (self-ref)

users (1) ──→ (0..1) alumni ←── (M) career_guidance_requests ←── (M) profiles

users (1) ──→ (M) questions ──→ (M) question_tags

users (0..1) ──→ clubs (authored) ──→ (M) club_members ←── (M) profiles

faculty (standalone, admin-managed)
notices (standalone, moderator/admin authored)
events (standalone, admin authored)
projects (standalone, approval workflow)
```

## Index Strategy

| Table | Index | Purpose |
|---|---|---|
| profiles | `(fullName)` GIN trgm | Fuzzy name search for directory |
| profiles | `(batchNumber)` | Filter by batch |
| profiles | `(status, isAlumni)` | Approval queue + alumni filtering |
| skills | `(slug)` unique | Lookup by URL/filter |
| questions | `(subject, course, batch, examType)` | Multi-field filtering |
| questions | `(title, subject)` GIN tsvector | Full-text search |
| question_tags | `(tag)` | Tag-based filtering |
| notifications | `(userId, read, createdAt)` | Unread count + recent list |
| career_guidance_requests | `(alumniId, status)` | Alumnus inbox |
| club_members | `(clubId, roleInClub)` | Executive committee listing |
