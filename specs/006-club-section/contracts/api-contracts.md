# Contracts: Club Section

**Branch**: `006-club-section` | **Date**: 2026-09-15

This document defines the interface contracts for the Club Section feature. Since this is a web application with no external API consumers, the contracts describe the internal API surface (Route Handlers) and the page contracts (public routes).

---

## 1. Public Page Contracts

### `/clubs` — Club Listing Page

**Access**: Public (guests and all roles)

**Contract**:
- Returns all departments with their approved clubs grouped by department
- Each department shows name and associated clubs
- Empty departments show "No clubs yet" message
- Clubs with `status != approved` are excluded

**Response Shape**:
```ts
interface DepartmentGroup {
  department: { id: string; name: string; slug: string; imageUrl?: string }
  clubs: Array<{
    id: string; name: string; description?: string; logoUrl?: string
    status: "approved"
  }>
}
```

---

### `/clubs/[clubId]` — Club Detail Page

**Access**: Public (guests and all roles)

**Contract**:
- Returns club details: name, description, logo, cover image, all link fields
- Renders members list with avatars (PP), name, designation, roleInClub, position
- Renders gallery albums with images and captions
- Renders achievements with title, description, optional image/link
- Renders events with countdown timers for ongoing/upcoming events
- URLs in descriptions rendered as clickable anchors with safe referrer

**Response Shape**:
```ts
interface ClubDetail {
  club: {
    id: string; name: string; description?: string; logoUrl?: string
    coverImgUrl?: string; msgGroupUrl?: string; pageUrl?: string
    fbGroupUrl?: string; contacts?: string; mail?: string
  }
  members: Array<{
    profileId: string; avatarUrl?: string; fullName: string
    roleInClub: string; position?: string; designation?: string
  }>
  albums: Array<{
    id: string; title: string; description?: string; images: Array<{
      id: string; imageUrl: string; caption?: string; displayOrder: number
    }>
  }>
  achievements: Array<{
    id: string; title: string; description?: string; date?: string
    imageUrl?: string; linkUrl?: string
  }>
  events: Array<{
    id: string; name: string; place?: string; date: string
    startTime?: string; endTime?: string; status: "upcoming" | "ongoing" | "completed"
  }>
}
```

---

## 2. Route Handler Contracts

### `POST /api/clubs` — Create Club

**Access**: Admin only (enforced by middleware)

**Request Body**:
```ts
{ name: string; description?: string; departmentId: string; logoUrl?: string; coverImgUrl?: string }
```

**Response**: Created club object with `status: "approved"`

**Rate Limit**: `enforceSubmissionLimit` (5/hour)

---

### `PUT /api/clubs/[clubId]` — Update Club

**Access**: Admin only

**Request Body**: Partial club fields

**Concurrency**: Optimistic lock via `updatedAt` — returns 409 if record changed since fetch

**Rate Limit**: `enforceSubmissionLimit`

---

### `DELETE /api/clubs/[clubId]` — Delete Club

**Access**: Admin only

**Cascade**: Deletes club_members, gallery albums/images, achievements, events with this clubId

---

### `POST /api/departments` — Create Department

**Access**: Admin only

**Request Body**:
```ts
{ name: string; slug: string; description?: string; imageUrl?: string }
```

**Response**: Created department object

---

### `POST /api/club-members` — Add Member to Club

**Access**: Admin only

**Request Body**:
```ts
{ clubId: string; profileId: string; roleInClub: "member" | "executive" | "advisor"; position?: string; designation?: string }
```

**Validation**: `profileId` must reference an approved profile

---

### `POST /api/clubs/[clubId]/gallery` — Create Gallery Album

**Access**: Admin only

**Request Body**:
```ts
{ title: string; description?: string }
```

---

### `POST /api/gallery-images` — Upload Gallery Image

**Access**: Admin only

**Blocking**: UploadThing upload must succeed before proceeding

**Request**: multipart/form-data with `albumId`, `image`, `caption`, `displayOrder`

---

### `POST /api/club-achievements` — Create Achievement

**Access**: Admin only

**Request Body**:
```ts
{ clubId: string; title: string; description?: string; date?: string; imageUrl?: string; linkUrl?: string }
```

---

### `POST /api/events` — Create Event

**Access**: Admin only

**Request Body**:
```ts
{
  clubId?: string; name: string; place?: string; description?: string;
  date: string; deadline?: string; startTime?: string; endTime?: string
}
```

**Validation**: If `clubId` is provided, event appears on club detail page AND main events page. If `clubId` is null, event appears only on main events page.

---

## 3. Component Contracts

### `EventTimer` Component

**Props**: `endTime?: string`, `startTime?: string`

**Behavior**: 
- Displays countdown to `endTime` if future, or to `startTime` if `startTime` is future
- Shows "completed" if both times have passed
- Updates every second
- Resumes correctly after tab switch
- Respects `prefers-reduced-motion`

---

### URL Auto-Detection

**Contract**: URLs in club descriptions and event descriptions are auto-detected and rendered as `<a>` tags opening in new tabs with `rel="noopener noreferrer"`. Formats: `http`, `https`, `www`.

---

## 4. Middleware Contract

**Route Protection**:
- `/clubs/*` → Public (no auth required)
- `/manage/clubs/*` → Admin only (middleware checks `session.role === "admin"`)

**Role Enforcement**: Done at the middleware level, not the component level.

---

## 5. UploadThing Contract

**Configuration**: Reuses existing UploadThing infrastructure from `question_files`.

**Fields**: logoUrl, coverImgUrl, gallery images, achievement images.

**Failure Behavior**: Blocking — form submission fails entirely if upload fails. Admin must retry.
