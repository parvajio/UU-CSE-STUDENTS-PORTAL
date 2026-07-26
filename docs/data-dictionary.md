# CSE Students Portal — Data Dictionary

Covers the entities needed for Phases 1–4 (Foundation, Core Content, Community). Extras-phase entities (CGPA calculator, blood donor, lost & found, learning academy, etc.) are intentionally left out — write their dictionaries when you reach that phase, since their shape may shift based on what you learn building the core first.

Shared pattern used across every user-submitted table: `status`, `approvedBy`, `approvedAt` — noted per table below where it applies.

---

## users
| Field | Type | Constraints | Notes |
|---|---|---|---|
| id | uuid | PK, default random | |
| email | text | unique, required | |
| passwordHash | text | nullable | null if Google-only account |
| authProvider | enum | `credentials` \| `google` | |
| role | enum | `user` \| `moderator` \| `admin`, default `user` | guest = no row, unauthenticated |
| createdAt | timestamp | default now | |
| updatedAt | timestamp | auto-update | |

---

## profiles
| Field | Type | Constraints | Notes |
|---|---|---|---|
| id | uuid | PK | |
| userId | uuid | FK → users.id, unique | 1:1 with users |
| fullName | text | required | |
| studentId | text | required, unique | "SID" — used by admin to verify a real CSE student before approval |
| batchNumber | integer | required | e.g. `61`, `68` — new batch every ~4 months, so render as a dropdown generated dynamically up to the current max (an admin-configurable `CURRENT_BATCH` value), not a hardcoded option list |
| section | text | required, e.g. `C` | small fixed dropdown (A–F or whatever range the department actually uses) |
| avatarUrl | text | nullable | |
| bio | text | nullable, max ~500 chars | |
| facebookUrl | text | nullable | |
| linkedinUrl | text | nullable | |
| whatsappNumber | text | nullable | store with country code, e.g. `+8801...` |
| portfolioUrl | text | nullable | |
| githubUrl | text | nullable | |
| status | enum | `pending` \| `approved` \| `rejected`, default `pending` | |
| approvedBy | uuid | FK → users.id, nullable | |
| approvedAt | timestamp | nullable | |
| createdAt / updatedAt | timestamp | | |

**Guest-visible columns only:** `fullName`, `batch`, skill tags (via join). Everything else requires login.

---

## skills
| Field | Type | Constraints | Notes |
|---|---|---|---|
| id | uuid | PK | |
| name | text | required | e.g. "Web Development" or "Next.js" |
| slug | text | unique | for URLs/filters |
| parentSkillId | uuid | FK → skills.id, nullable | null = top-level category; set = subskill |
| colorKey | text | e.g. `blue`, `violet`, `rose`, `amber` | maps to the tag color system in the design doc |

## profile_skills (join table)
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
| researchInterests | text | nullable | free text or comma-separated |
| officeRoom | text | nullable | |
| photoUrl | text | nullable | |

Admin-managed directly — no `status`/submission flow (per your spec: faculty directory isn't self-service).

---

## alumni
| Field | Type | Constraints | Notes |
|---|---|---|---|
| id | uuid | PK | |
| userId | uuid | FK → users.id, nullable, unique when set | set when the alumnus self-submitted and has a login; null when admin-entered directly |
| fullName | text | required | |
| batchNumber | integer | required | same batch system as profiles |
| currentCompany | text | nullable | |
| jobPosition | text | nullable | |
| linkedinUrl | text | nullable | |
| facebookUrl | text | nullable | |
| contactInfo | text | nullable | |
| status | enum | `pending` \| `approved` \| `rejected` | self-submitted rows start `pending`; admin-entered rows can be inserted directly as `approved` |
| approvedBy / approvedAt | | nullable | |

## career_guidance_requests
| Field | Type | Constraints | Notes |
|---|---|---|---|
| id | uuid | PK | |
| studentProfileId | uuid | FK → profiles.id | requester |
| alumniId | uuid | FK → alumni.id | |
| message | text | required | |
| status | enum | `pending` \| `accepted` \| `declined` | |
| createdAt | timestamp | | |

---

## questions
| Field | Type | Constraints | Notes |
|---|---|---|---|
| id | uuid | PK | |
| title | text | required | |
| subject | text | required | |
| course | text | required | e.g. course code |
| batch | text | required | |
| examType | enum | `previous_year` \| `midterm` \| `final` \| `lab` \| `viva` | |
| fileUrl | text | required | PDF or image, via R2/UploadThing |
| uploadedBy | uuid | FK → users.id | |
| status | enum | `pending` \| `approved` \| `rejected` | |
| approvedBy / approvedAt | | nullable | |
| createdAt | timestamp | | |

## question_tags (join table, for flexible multi-tag filtering)
| Field | Type |
|---|---|
| questionId | uuid, FK → questions.id |
| tag | text |

Recommend a join table over a text array — lets you filter/search by tag with a normal indexed join instead of array containment queries.

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

## Resolved Decisions

1. **Batch/section:** split into `batchNumber` (integer, dropdown generated dynamically up to the current batch — not a hardcoded list, since a new batch starts every ~4 months) and `section` (e.g. `C`, small fixed dropdown).
2. **Student ID:** required, unique `studentId` field on profiles — used by admins to verify real CSE students before approval.
3. **WhatsApp number:** stored as free text for now, no validation/formatting enforced at input.
4. **Alumni entries:** both paths supported — self-submission (nullable `userId`, starts `pending`) and direct admin entry (`userId` null, can be inserted as `approved`).
