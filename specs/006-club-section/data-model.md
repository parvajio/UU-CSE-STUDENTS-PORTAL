# Data Model: Club Section

**Branch**: `006-club-section` | **Date**: 2026-09-15

## Entities

### Department

Represents an academic department (e.g., "CSE", "IT"). Clubs belong to departments.

| Field | Type | Constraints | Notes |
|---|---|---|---|
| id | uuid | PK, default random | |
| name | text | unique, required | e.g. "CSE", "IT" |
| slug | text | unique, required | for URLs |
| description | text | nullable | |
| imageUrl | text | nullable | UploadThing URL |
| createdAt | timestamp | default now | |
| updatedAt | timestamp | `$onUpdate` | |

**Relationships**: One department has many clubs.

**Validation**: `name` and `slug` required and unique. Slug generated from name or provided.

---

### Club

Represents a student club within a department. Admin-created clubs are immediately approved.

| Field | Type | Constraints | Notes |
|---|---|---|---|
| id | uuid | PK, default random | |
| name | text | unique, required | |
| description | text | nullable | URLs auto-detected in rendering |
| departmentId | uuid | FK → departments.id, not null | |
| logoUrl | text | nullable | UploadThing URL |
| coverImgUrl | text | nullable | UploadThing URL |
| msgGroupUrl | text | nullable | Social link |
| pageUrl | text | nullable | Social link |
| fbGroupUrl | text | nullable | Social link |
| contacts | text | nullable | Contact info |
| mail | text | nullable | Email |
| status | enum | `pending` \| `approved` \| `rejected`, default `approved` | Admin-created = approved immediately |
| approvedBy | uuid | FK → users.id, nullable, `onDelete: SET NULL` | |
| approvedAt | timestamp | nullable | |
| createdAt | timestamp | default now | |
| updatedAt | timestamp | `$onUpdate` | |

**Relationships**: Many clubs belong to one department. Many club_members, gallery albums, achievements, and events belong to a club.

**Validation**: `name` unique and required. `departmentId` must reference an existing department. Admin-created clubs have `status = approved`.

**State transitions**: `pending` → `approved` | `rejected` (for future non-admin submissions). Admin-created bypasses pending state.

---

### ClubMember

Links a profile to a club with a role and designation.

| Field | Type | Constraints | Notes |
|---|---|---|---|
| id | uuid | PK, default random | |
| clubId | uuid | FK → clubs.id, `onDelete: CASCADE` | |
| profileId | uuid | FK → profiles.id, `onDelete: CASCADE` | |
| roleInClub | enum | `member` \| `executive` \| `advisor` | Required |
| position | text | nullable | e.g. "President", "General Secretary" |
| designation | text | nullable | Free-text e.g. "Group Admin" |
| joinedAt | timestamp | default now | |

**Relationships**: Many-to-many between profiles and clubs via club_members.

**Validation**: `roleInClub` is required. `profileId` must reference an approved profile. `designation` is free-text.

**Cascade**: Deleting a club or profile cascade-deletes related club_members.

---

### GalleryAlbum

A named collection of images within a club.

| Field | Type | Constraints | Notes |
|---|---|---|---|
| id | uuid | PK, default random | |
| clubId | uuid | FK → clubs.id, `onDelete: CASCADE` | |
| title | text | required | |
| description | text | nullable | |
| displayOrder | integer | required | |
| createdAt | timestamp | default now | |
| updatedAt | timestamp | `$onUpdate` | |

**Relationships**: One album has many gallery images.

**Validation**: `title` required. `clubId` must reference an existing club.

---

### GalleryImage

An image within a gallery album.

| Field | Type | Constraints | Notes |
|---|---|---|---|
| id | uuid | PK, default random | |
| albumId | uuid | FK → club_gallery_albums.id, `onDelete: CASCADE` | |
| imageUrl | text | required | UploadThing URL |
| caption | text | nullable | |
| displayOrder | integer | required | |
| createdAt | timestamp | default now | |

**Relationships**: Many images belong to one album.

**Validation**: `imageUrl` required (UploadThing). `albumId` must reference an existing album.

**Cascade**: Deleting an album cascade-deletes its images.

---

### ClubAchievement

An achievement or award for a club.

| Field | Type | Constraints | Notes |
|---|---|---|---|
| id | uuid | PK, default random | |
| clubId | uuid | FK → clubs.id, `onDelete: CASCADE` | |
| title | text | required | |
| description | text | nullable | |
| date | timestamp | nullable | |
| imageUrl | text | nullable | UploadThing URL |
| linkUrl | text | nullable | External link |
| createdAt | timestamp | default now | |
| updatedAt | timestamp | `$onUpdate` | |

**Relationships**: Many achievements belong to one club.

**Validation**: `title` required. `clubId` must reference an existing club.

---

### Event

A scheduled event that can be club-specific or standalone.

| Field | Type | Constraints | Notes |
|---|---|---|---|
| id | uuid | PK, default random | |
| clubId | uuid | FK → clubs.id, `onDelete: CASCADE`, nullable | `null` = standalone event |
| name | text | required | |
| place | text | nullable | |
| description | text | nullable | URLs auto-detected in rendering |
| date | timestamp | required | The event date |
| deadline | timestamp | nullable | Registration deadline |
| startTime | timestamp | nullable | Event start |
| endTime | timestamp | nullable | Event end |
| status | text | computed | `upcoming`/`ongoing`/`completed` — computed from startTime/endTime vs now() |
| createdAt | timestamp | default now | |
| updatedAt | timestamp | `$onUpdate` | |

**Relationships**: One club has many events. Standalone events have `clubId = null`.

**Validation**: `name` required. `date` required. `clubId` nullable (standalone vs club-specific).

**Status computation**: 
- `endTime > now()` → `ongoing`
- `startTime > now()` → `upcoming`  
- Otherwise → `completed`

**Visibility**: Club events (`clubId` set) appear on club detail page AND main events page. Standalone events (`clubId = null`) appear ONLY on main events page.

**Cascade**: Deleting a club cascade-deletes its events.

---

## Relationships Summary

```
departments (1) ──── (N) clubs (1) ──── (N) club_members
                              │
                              ├── (N) gallery_albums ──── (N) gallery_images
                              │
                              ├── (N) club_achievements
                              │
                              └── (N) events
```

- `profiles` → `club_members`: one-to-many (one profile can be in many clubs)
- `clubs` → `events`: one-to-many (one club has many events)

## Approval Pattern

Admin-created clubs are immediately `status = approved`. The `status`, `approvedBy`, `approvedAt` columns exist for future flexibility but are not used in the current admin-create flow. The `club_members` table does not use the approval pattern — members are added directly by admins. Gallery, achievements, and events are also admin-created and immediately visible.

## Data Dictionary Updates Required

`docs/data-dictionary.md` must be updated to include:
1. New `departments` table
2. Expanded `clubs` table with all new fields
3. Updated `club_members` table with `designation` field
4. New `club_gallery_albums`, `club_gallery_images`, `club_achievements`, `events` tables
