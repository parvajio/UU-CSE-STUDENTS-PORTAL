# Feature Specification: Club Section

**Feature Branch**: `006-club-section`

**Created**: 2026-09-15

**Status**: Draft

**Input**: User description: "Specify the Club Section feature for the CSE Students Portal."

## Clarifications

### Session 2026-09-15

- Q: What can a logged-in User do in the Club Section? → A: User can only browse and see event information. No submissions, no management actions.
- Q: How to resolve clubs table schema discrepancy between data dictionary and spec? → A: Update the data dictionary to include all fields the spec references (add departmentId, coverImgUrl, social links, contacts, mail, status, timestamps).
- Q: What happens when an UploadThing image upload fails? → A: Upload is a blocking step — admin must retry before proceeding; the form submission fails entirely if upload fails.
- Q: How should concurrent edits to the same club be handled? → A: Last write wins with a version/timestamp check — show a warning if the record changed since the admin opened it.
- Q: What happens when an admin hits the rate limit (enforceSubmissionLimit)? → A: Show a clear error: "Rate limit reached — try again in X minutes" with the time remaining.

## User Scenarios & Testing *(mandatory)*

<!--
  IMPORTANT: User stories should be PRIORITIZED as user journeys ordered by importance.
  Each user story/journey must be INDEPENDENTLY TESTABLE - meaning if you implement just ONE of them,
  you should still have a viable MVP (Minimum Vovable Product) that delivers value.

  Assign priorities (P1, P2, P3, etc.) to each story, where P1 is the most critical.
  Think of each story as a standalone slice of functionality that can be:
  - Developed independently
  - Tested independently
  - Deployed independently
  - Demonstrated to users independently
-->

### User Story 1 - Admin Creates Departments and Clubs (Priority: P1)

As an admin, I want to create departments and clubs through the dashboard so that the club directory is populated with structured data organized by department.

**Why this priority**: Without departments and clubs, there is nothing for users to browse. This is the foundation of the entire Club Section.

**Independent Test**: Admin creates a department "CSE" with slug "cse", then creates a club "ACM" under it. Both appear immediately without any approval workflow.

**Acceptance Scenarios**:

1. **Given** admin is on `/manage/clubs`, **When** they fill in department name, slug, and submit, **Then** the department is created and persisted in the database.
2. **Given** admin creates a department, **When** they create a club under that department with name, description, and logo, **Then** the club is created and immediately visible on `/clubs` with no approval step.
3. **Given** admin edits a club's details, **When** they save changes, **Then** the club updates in-place and remains visible immediately.
4. **Given** admin deletes a club, **When** they confirm, **Then** the club is removed and related members/gallery/achievements/events are cascade-deleted appropriately.

---

### User Story 2 - Guest Browses Club Listing Grouped by Department (Priority: P1)

As a guest (not logged in), I want to browse clubs organized by department on `/clubs` so that I can discover all available clubs without needing to log in.

**Why this priority**: This is the primary public-facing feature of the Club Section. Guests must be able to access all club content.

**Independent Test**: Visiting `/clubs` shows all departments with their associated clubs listed under each department heading. No login required.

**Acceptance Scenarios**:

1. **Given** a guest visits `/clubs`, **When** the page loads, **Then** all approved departments are listed, each with its clubs displayed beneath it.
2. **Given** a club has `status = rejected`, **When** the guest browses `/clubs`, **Then** that club is not shown.
3. **Given** a club has `status = pending`, **When** the guest browses `/clubs`, **Then** that club is not shown (only approved clubs are public).

---

### User Story 3 - Guest Views Club Detail Page with All Content (Priority: P1)

As a guest, I want to view a club's detail page showing its description, links, members, gallery, achievements, and events so that I get a comprehensive view of the club.

**Why this priority**: The club detail page is the central public page that aggregates all club content.

**Independent Test**: Visiting `/clubs/[clubId]` renders the club name, description, logo, cover image, all link fields as clickable anchors, member list with avatars, gallery albums with images, achievements, and events with timers.

**Acceptance Scenarios**:

1. **Given** a guest visits `/clubs/[clubId]` for an approved club, **When** the page loads, **Then** the club's name, description, logo, cover image, and all link fields (msg group, page, fb) are rendered as clickable anchors opening in new tabs with safe referrer.
2. **Given** a club has members, **When** the guest views the club detail page, **Then** each member shows avatar (PP), name, designation, roleInClub, and position.
3. **Given** a club has gallery albums, **When** the guest views the club detail page, **Then** all albums are displayed with their images and captions.
4. **Given** a club has achievements, **When** the guest views the club detail page, **Then** all achievements are displayed with title, description, and optional image/link.
5. **Given** a club has ongoing events, **When** the guest views the club detail page, **Then** a live countdown timer shows the time remaining until the event ends.

---

### User Story 4 - Admin Manages Club Members by Searching Approved Profiles (Priority: P2)

As an admin, I want to search approved profiles and add them to a club with a free-text designation so that I can populate club membership with the correct roles.

**Why this priority**: Members are a key part of the club experience, and the search-and-add flow requires careful UX design.

**Independent Test**: Admin searches for a profile by name, selects an approved profile, assigns roleInClub and designation, and the member appears on the club detail page.

**Acceptance Scenarios**:

1. **Given** admin is on a club's edit page, **When** they search for an approved profile, **Then** matching profiles are displayed in a search result list.
2. **Given** admin selects a profile, **When** they assign roleInClub (`member`, `executive`, `advisor`) and a free-text designation (e.g., "Group Admin"), **Then** the member is added to `club_members` with `joinedAt = now()`.
3. **Given** a member has been added, **When** the admin views the club detail page, **Then** the member appears with avatar, name, designation, roleInClub, and position.

---

### User Story 5 - Admin Manages Gallery, Achievements, and Events (Priority: P2)

As an admin, I want to create and manage gallery albums/images, achievements, and events for a club so that the club's content stays up to date.

**Why this priority**: These are content management features that enrich the club detail page but depend on the club existing first.

**Independent Test**: Admin creates a gallery album, adds images, adds an achievement, and creates a club event with start/end times — all appear on the club detail page.

**Acceptance Scenarios**:

1. **Given** admin is on a club's gallery management page, **When** they create an album with title and description, **Then** the album appears in the gallery section of the club detail page.
2. **Given** admin creates an album, **When** they upload images via UploadThing with captions, **Then** images appear in the album with correct display order.
3. **Given** admin creates an achievement, **When** they add title, description, optional image and link, **Then** the achievement appears on the club detail page.
4. **Given** admin creates an event with name, date, startTime, endTime, and clubId, **When** the event is saved, **Then** it appears on both the club detail page AND the main events page (since clubId is set).

---

### User Story 6 - Live Countdown Timer for Ongoing/Upcoming Events (Priority: P2)

As a visitor, I want to see a live countdown timer for ongoing and upcoming events so that I know exactly when an event starts or ends.

**Why this priority**: Timers are a key engagement feature and must be prominent and readable.

**Independent Test**: Visiting a club or events page with an event that has startTime/endTime set shows a live-updating countdown timer.

**Acceptance Scenarios**:

1. **Given** an event has `endTime` in the future, **When** the page loads, **Then** a timer counts down to the end time and is prominently displayed.
2. **Given** an event has `startTime` in the future, **When** the page loads, **Then** a timer counts down to the start time.
3. **Given** an event's `endTime` has passed, **When** the timer component renders, **Then** it shows the event as completed (no countdown).
4. **Given** the timer is running, **When** the user switches tabs and returns, **Then** the timer resumes correctly without desyncing.

---

### Edge Cases

- What happens when a department has no clubs? The department section heading still appears on `/clubs` but with an empty state message (e.g., "No clubs yet").
- What happens when a club is deleted? All related club_members (cascade), gallery albums and images (cascade), achievements (cascade), and events with that clubId are cascade-deleted. The club's events with `clubId = null` are unaffected — but club-specific events all have a clubId, so they are deleted too.
- What happens when an event's endTime passes? The `status` is computed as `completed` and the timer stops. The event remains visible but marked as completed.
- What happens when a user submits an event? **Not applicable — logged-in Users can only browse and see event information; they cannot submit events. All events are admin-created and immediately approved.**
- What happens when a description contains URLs? URLs are auto-detected in the rendering layer and rendered as clickable anchors without markdown/HTML from the editor.

## NOT NOW (future phases)

The following are intentionally out of scope for this feature:

- Event RSVP/registration system
- Full event management UI (calendar view, etc.)
- Club posts/activity feeds
- Member self-join requests for clubs
- Notification system for club events
- Club search/filter beyond department
- Gallery album editing/deletion by non-admins

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST support a `departments` table with `name` (unique, required), `slug` (unique, for URLs), `description` (nullable), and `imageUrl` (nullable).
- **FR-002**: System MUST support a `clubs` table with all fields specified in the data dictionary (id, name, description, departmentId, logoUrl, coverImgUrl, msgGroupUrl, pageUrl, fbGroupUrl, contacts, mail, status, timestamps). Admin-created clubs appear immediately with `status = approved`.
- **FR-003**: System MUST support a `club_members` table with fields: id, clubId (cascade delete), profileId (cascade delete), roleInClub (enum), position, designation (free-text), joinedAt.
- **FR-004**: System MUST support `club_gallery_albums` and `club_gallery_images` tables with the fields specified in the data dictionary.
- **FR-005**: System MUST support a `club_achievements` table with fields: id, clubId (cascade), title, description, date, imageUrl, linkUrl, createdAt, updatedAt.
- **FR-006**: System MUST support an `events` table with nullable `clubId`, `startTime`, `endTime`, and `status` fields, serving both club-specific and standalone events.
- **FR-007**: System MUST compute event `status` dynamically: if `endTime > now()` → `ongoing`, if `startTime > now()` → `upcoming`, else `completed`.
- **FR-008**: Club events (with `clubId` set) MUST appear on BOTH the club detail page AND the main events page. Standalone events (clubId = null) MUST appear ONLY on the main events page.
- **FR-009**: The `/clubs` listing page MUST group clubs by department. Each department section shows its name and all its approved clubs.
- **FR-010**: The `/clubs/[clubId]` page MUST be publicly accessible (guests can browse) and display all club content: description, links, members, gallery, achievements, events with timers.
- **FR-011**: All club management routes (`/manage/clubs`) MUST be admin-only, enforced by middleware.
- **FR-012**: Admin MUST be able to search approved profiles and add them to clubs with a free-text designation and roleInClub.
- **FR-013**: URLs in club descriptions and event descriptions MUST be auto-detected and rendered as clickable anchors opening in new tabs with safe referrer.
- **FR-014**: Timer component MUST be prominent and readable, counting down to event start/end, updating in real-time.
- **FR-015**: Admin MUST be able to create, edit, and delete departments, clubs, gallery albums, gallery images, achievements, and events.
- **FR-016**: All club management mutations MUST use the existing `enforceSubmissionLimit` rate-limiting wrapper.
- **FR-017**: System MUST use UploadThing for all image uploads (logo, cover, gallery images, achievement images).
- **FR-018**: Dark mode MUST be supported from day one alongside light mode, following the design direction exactly.

### Key Entities *(include if feature involves data)*

- **Department**: Represents an academic department (e.g., "CSE", "IT"). Has a unique name and slug for URLs. Clubs belong to departments.
- **Club**: Represents a student club within a department. Has name, description, logo, cover image, social links, contacts, and status. Admin-created clubs are immediately approved.
- **ClubMember**: Links a profile to a club with a roleInClub enum, position, and free-text designation (for group admin/moderator). Cascade-deleted when club or profile is deleted.
- **GalleryAlbum**: A named collection of images within a club. Has title, description, and display order.
- **GalleryImage**: An image within a gallery album. Has imageUrl (UploadThing), caption, and display order.
- **ClubAchievement**: An achievement or award for a club. Has title, description, optional date, image, and link.
- **Event**: A scheduled event that can be either club-specific (clubId set) or standalone (clubId null). Has name, place, description, date, deadline, start/end times, and computed status.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Admin can create a department and a club in under 2 minutes through the dashboard, with both appearing immediately on `/clubs`.
- **SC-002**: The `/clubs` page loads and displays all departments with their clubs in under 1 second on both light and dark mode.
- **SC-003**: The `/clubs/[clubId]` page renders all content sections (description, members, gallery, achievements, events) without requiring login.
- **SC-004**: The countdown timer updates every second and remains accurate even when the user switches browser tabs.
- **SC-005**: Club events with `clubId` set appear on both the club detail page and the main events page, showing "From [Club Name]" tag.
- **SC-006**: URLs in descriptions are auto-detected and rendered as clickable anchors with 100% accuracy for standard URL formats (http, https, www).
- **SC-007**: All images upload to UploadThing and display correctly on both light and dark modes within 3 seconds of upload.
- **SC-008**: The admin dashboard for club management is fully functional: create, edit, delete departments, clubs, gallery, achievements, and events.
- **SC-009**: The system respects `prefers-reduced-motion` — timers and animations are disabled or reduced for users who prefer reduced motion.
- **SC-010**: All interactive elements have visible keyboard focus states and the interface is fully navigable via keyboard.

## Assumptions

- **Admin-created clubs require no approval workflow**: Since admins are trusted users, clubs they create appear immediately with `status = approved`. The status field exists for future flexibility.
- **User-submitted events go through the universal approval pattern**: Per the project constitution (Principle III), all user-submitted resources must have `status`, `approvedBy`, `approvedAt`. Admin-created events are immediately approved and do not require approval.
- **Logged-in Users can only browse and see event information**: Per clarification, Users cannot submit events or perform any management actions. All event creation is admin-only.
- **UploadThing infrastructure already exists**: The project already has UploadThing configured for file uploads (used in question_files). The same infrastructure will be reused for club images.
- **Existing middleware patterns apply**: `/clubs` is public, `/manage/clubs` is admin-only — these route protections already exist in the middleware configuration.
- **The `events` table does not exist yet**: It must be created from scratch with all specified fields including `clubId`, `startTime`, `endTime`, and `status`.
- **Status computation is client-side or server-side via query**: The `status` enum is computed based on `startTime`/`endTime` relative to `now()`. This can be done in the rendering layer or as a DB-generated column.
- **Profile images (PP/avatar) already exist**: The `profiles.avatarUrl` field is already available for rendering member avatars on club pages.
- **No separate backend**: All club management uses Next.js Route Handlers and Server Actions, consistent with the project's architecture.
- **Rate limiting via existing `enforceSubmissionLimit`**: All admin mutation actions (create/edit/delete) use the shared rate-limiting wrapper.
