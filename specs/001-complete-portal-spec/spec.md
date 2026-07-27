# Feature Specification: Complete Portal Specification

**Feature Branch**: `001-complete-portal-spec`

**Created**: 2026-07-27

**Status**: Draft

**Input**: User description: "Specify the CSE Students Portal per docs/overview.md — full module list, roles, access rules, approval workflow."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Guest Browsing the Directory (Priority: P1)

A visitor who has not logged in lands on the portal and wants to search for students with specific skills. They can browse profiles but only see names, batch numbers, and skill tags — no contact details, no download buttons.

**Why this priority**: Guest browsing is the lowest-access baseline; every other role inherits and extends this capability. Defining guest visibility boundaries first prevents accidental data leaks.

**Independent Test**: Open the portal in an incognito/private window without logging in. Search for a skill term and verify the results show only fullName, batch, and skill tags, no contact info or download actions.

**Acceptance Scenarios**:

1. **Given** I am a guest (not logged in), **When** I navigate to the student directory, **Then** I see a searchable list of profiles showing only fullName, batch, and skill tags.
2. **Given** I am not logged in, **When** I click on a student profile, **Then** I see only the fullName, batch, section, and skill tags — contact fields (WhatsApp, social links, portfolio) are not displayed.
3. **Given** I am not logged in, **When** I search the question bank, **Then** I see question titles and metadata but no download button.

---

### User Story 2 - Authenticated Student Submits a Profile (Priority: P1)

A logged-in CSE student fills out their profile (fullName, studentId, batch, section, social links, skills) and submits it. The profile enters `pending` status. The student cannot see their own profile in the public directory until an admin approves it.

**Why this priority**: Profile submission is the core user action of Phase 1. It exercises the entire approval pipeline from submission through moderation.

**Independent Test**: Log in as a `user`-role student, submit a completed profile, then log out and verify the profile does not appear in guest search results. Log back in and see the profile shows `pending` status.

**Acceptance Scenarios**:

1. **Given** I am a logged-in student with no profile, **When** I submit my profile with all required fields (fullName, studentId, batch, section), **Then** the profile is created with `status = pending` and I see a "Profile submitted for review" confirmation.
2. **Given** my profile is pending, **When** I visit the directory, **Then** my profile is not visible to other users or guests.
3. **Given** my profile is pending, **When** I view my own submission page, **Then** I see the current status as "Pending Review" with an amber-colored badge.
4. **Given** my profile is rejected with a reason, **When** I log in, **Then** I see a notification explaining why and an option to edit and resubmit.

---

### User Story 3 - Admin Approves a Pending Profile (Priority: P1)

An admin visits the approval dashboard and sees a queue of pending submissions (profiles, questions, etc. in one unified view). They review a profile's details and approve or reject it. Once approved, the profile immediately becomes visible in the directory.

**Why this priority**: The approval dashboard is the single reuse point mandated by the architecture. Building and validating it with one resource type (profiles) proves the pattern before extending to other resource types.

**Independent Test**: Log in as an `admin` user, see a pending profile in the unified queue, approve it, then immediately search for that profile as a guest and confirm it appears.

**Acceptance Scenarios**:

1. **Given** I am logged in as an admin, **When** I open the approval dashboard, **Then** I see all pending submissions grouped by resource type (profiles, questions, etc.) with submission timestamp and submitter info.
2. **Given** I review a pending profile, **When** I click "Approve", **Then** the profile status changes to `approved`, `approvedBy` and `approvedAt` are set, and the profile immediately becomes publicly visible.
3. **Given** I review a pending profile, **When** I click "Reject" and optionally provide a reason, **Then** the profile status changes to `rejected` and the submitter receives a notification with the rejection reason.
4. **Given** I am an admin, **When** I view a profile detail in the dashboard, **Then** I see the full profile data including the studentId that was used for verification.

---

### User Story 4 - Student Uploads a Question Paper (Priority: P1)

A logged-in student navigates to the Digital Question Bank, fills in the details (title, subject, course, batch, exam type), uploads a PDF/image, and submits. The question enters `pending` status and is hidden from other users until a moderator or admin approves it.

**Why this priority**: Question bank uploads are the second resource type that exercises the approval pattern, proving reuse of the single approval dashboard.

**Independent Test**: Log in as a `user`, upload a question paper, verify it shows as pending for the submitter but is invisible to other logged-in users until approved.

**Acceptance Scenarios**:

1. **Given** I am a logged-in student, **When** I upload a question paper with title, subject, course, batch, examType and file, **Then** the question is created with `status = pending` and I see a "Submitted for review" message.
2. **Given** a question is pending, **When** another user searches the question bank, **Then** that question does not appear in results.
3. **Given** I am a moderator, **When** I open the approval dashboard, **Then** I see the pending question alongside other pending items and can approve or reject it.

---

### User Story 5 - Moderator Manages Low-Sensitivity Approvals (Priority: P2)

A moderator (not an admin) logs in and sees a filtered view of the approval dashboard — they can approve/reject question uploads and other low-sensitivity submissions, but profile approvals and role management options are not available.

**Why this priority**: Distinguishing moderator vs. admin access levels validates the role-based access rules before more complex content types are added.

**Independent Test**: Log in as a `moderator`, verify you can see and act on pending questions but not pending profiles.

**Acceptance Scenarios**:

1. **Given** I am logged in as a moderator, **When** I open the approval dashboard, **Then** I see only low-sensitivity items (questions, resource submissions) — profile approvals are hidden.
2. **Given** I am a moderator, **When** I attempt to navigate to profile management or role assignment pages, **Then** I receive an access-denied message.
3. **Given** I am a moderator, **When** I approve a question, **Then** it becomes publicly searchable and downloadable.

---

### User Story 6 - Admin Manages Faculty Directory, Clubs, Alumni (Priority: P2)

An admin directly manages the faculty directory (add/edit/delete faculty members), club pages (create/edit clubs, assign executive members and advisors), and the alumni network (add alumni directly or approve self-submissions). These are admin-only write operations.

**Why this priority**: Admin-only content management surfaces the distinction between user-submitted (approval-flow) and admin-managed (direct-write) content types.

**Independent Test**: Log in as an `admin`, add a faculty member and a club, then verify they appear for all user types.

**Acceptance Scenarios**:

1. **Given** I am an admin, **When** I add a faculty member with name, designation, email, optionally phone and research interests, **Then** the faculty member appears immediately in the faculty directory — no approval needed.
2. **Given** I am an admin, **When** I create a club with name, description, and logo, **Then** the club page is immediately visible.
3. **Given** I am an admin, **When** I approve a self-submitted alumni record, **Then** the alumnus appears in the alumni network.
4. **Given** I am a user, **When** I try to add a faculty member, **Then** the option is not available — faculty is admin-managed only.

---

### User Story 7 - User Requests Career Guidance from Alumni (Priority: P3)

A logged-in student finds an alumnus in the Alumni Career Network and clicks "Request career guidance." They compose a message. The request is sent to the alumnus with `status = pending`. The alumnus can accept (opening a conversation) or decline.

**Why this priority**: Alumni engagement adds a structured interaction that is not a simple approval but still uses a status-based workflow.

**Independent Test**: Log in as a `user`, find an approved alumnus, send a guidance request, then log in as the alumnus and see the request in a notification/inbox.

**Acceptance Scenarios**:

1. **Given** I am a logged-in student, **When** I click "Request career guidance" on an alumnus profile and write a message, **Then** the request is sent with `status = pending`.
2. **Given** a guidance request is pending, **When** the alumnus logs in, **Then** they see the request highlighted in their inbox.
3. **Given** an alumnus receives a request, **When** they click "Accept", **Then** the status changes to `accepted` and the student is notified.
4. **Given** a guidance request exists, **When** the alumnus clicks "Decline", **Then** the status changes to `declined` and the student is notified.

---

### Edge Cases

- **Unverified studentId**: A student submits a profile with a studentId that doesn't match department records — what review options does the admin have?
- **Duplicate submission**: A user with an already-approved profile tries to submit a second profile — system prevents duplicate profiles per user.
- **Upload failure**: A question paper upload fails due to file size/type — clear error message guides the user to retry with an acceptable file.
- **Moderator overreach**: A moderator attempts to approve a profile (which should be admin-only) — the system denies the action at the permission level, not just hiding the UI button.
- **Deleting approved content**: An admin deletes or unpublishes an already-approved profile/question — the content is hidden but a soft-delete or archive mechanism preserves the audit trail.
- **Batch rollover**: A new batch starts and the admin updates `CURRENT_BATCH` — existing profiles keep their original batchNumber; the dropdown for new profiles now extends to the new value.
- **Concurrent moderation**: Two moderators open the same pending item simultaneously — the first action (approve/reject) succeeds; the second sees a "this item was already processed" message.
- **Guest sees empty state**: No profiles or questions approved yet — guest sees a friendly empty state ("No profiles found — check back after students join").

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST support four access tiers — guest (unauthenticated), user (logged-in student), moderator, admin — with permissions matching the access rules table in §5 of the overview.
- **FR-002**: System MUST enforce guest visibility to only `fullName`, batch, and skill tags on all profile views — enforced at the data query level, never by frontend hiding.
- **FR-003**: System MUST prevent guests from accessing download buttons, contact details, or any profile field beyond the guest-visible set.
- **FR-004**: Authenticated users MUST be able to submit their own student profile, edit it, and view its approval status.
- **FR-005**: System MUST prevent duplicate profiles — one profile per user maximum.
- **FR-006**: System MUST record every user-submitted resource with `status = pending` by default, requiring moderator or admin approval before public visibility.
- **FR-007**: Moderators MUST be able to approve or reject question uploads and other low-sensitivity submissions — but MUST NOT be able to approve profiles or manage roles.
- **FR-008**: Admins MUST be able to approve or reject any pending resource, including profiles, questions, alumni, and club content.
- **FR-009**: System MUST provide a single unified approval dashboard that lists all pending items across resource types (profiles, questions, etc.), with filtering by resource type.
- **FR-010**: The approval dashboard MUST show for each item: resource type, title/name, submitter info, submission timestamp, and a detail view with full data before approval.
- **FR-011**: When a resource is approved, the system MUST set `status = approved`, `approvedBy` to the approver's user ID, and `approvedAt` to the current timestamp — then make the resource publicly visible immediately.
- **FR-012**: When a resource is rejected, the system MUST set `status = rejected` and optionally record a rejection reason visible to the submitter.
- **FR-013**: System MUST notify submitters when their resource is approved (optional notification) or rejected (with the reason, if provided).
- **FR-014**: System MUST support the Digital Question Bank with uploads categorized by exam type (previous_year, midterm, final, lab, viva), tagged by subject/course/batch, with search and filter capabilities.
- **FR-015**: The question bank MUST support file uploads (PDF and image formats), with downloads restricted to logged-in users only.
- **FR-016**: System MUST provide an admin-managed Faculty Directory with fields: fullName, designation, email, phone, researchInterests, officeRoom, photoUrl — no approval workflow.
- **FR-017**: System MUST support the Alumni Career Network with self-submission (starts `pending`) and admin direct-entry (starts `approved`) paths.
- **FR-018**: Logged-in users MUST be able to browse the alumni directory and send "career guidance requests" to alumni with a message.
- **FR-019**: Alumni MUST receive career guidance requests in their inbox and be able to accept or decline them, with the requesting student notified of the outcome.
- **FR-020**: System MUST support Clubs & Executive Body pages, each with: name, description, logo, executive committee, advisor info, member list, and activity/achievement gallery.
- **FR-021**: System MUST support a Notice Board where moderators and admins can publish notices (title, body) visible to all users.
- **FR-022**: System MUST support an Event & Program Gallery with photo/media archive and an upcoming event countdown (date, live timer, details, optional registration link).
- **FR-023**: System MUST support an Achievement Hall of Fame to highlight notable student/team achievements.
- **FR-024**: System MUST support a Project Showcase where students can display their projects.
- **FR-025**: System MUST provide a Student Helpline directory of ~20 senior students available for support, with contact info.
- **FR-026**: The skills system MUST be modeled as a self-referencing `skills` table with nullable `parentSkillId`, allowing admins and users to add subskills without code changes.
- **FR-027**: Profiles MUST be linkable to multiple skills via a `profile_skills` join table.
- **FR-028**: Search across profiles and questions MUST use text-based search, returning results with guest-appropriate field visibility.
- **FR-029**: System MUST support both light and dark modes, built alongside each other from day one.
- **FR-030**: System MUST enforce that batch numbers in profile forms are rendered as a dynamic dropdown generated up to an admin-configurable `CURRENT_BATCH` value — NOT hardcoded.

### Key Entities *(include if feature involves data)*

- **User**: An authenticated account with email, password (or Google auth), and a role (user, moderator, admin). Guest users have no row. One user may have one profile.
- **Profile**: A student's public representation — fullName, studentId, batch, section, photo, bio, social links, portfolio, GitHub, and linked skills via join table. Every profile has a lifecycle: pending → approved/rejected.
- **Skill**: A hierarchical category (e.g. "Web Development") or subskill (e.g. "Next.js") with a slug and color key. Self-referencing via parentSkillId for nesting. Linked to profiles via profile_skills.
- **Question**: A past exam paper upload with title, subject, course, batch, examType, and file. Has the same pending→approved lifecycle as profiles.
- **Faculty**: An admin-managed directory entry — no submission/approval. Fields: name, designation, email, phone, research interests, office, photo.
- **Alumnus**: A graduate entry with company/position info and contact links. Supports two creation paths: self-submitted (pending→approved) and admin-entered (immediately approved). Accepts career guidance requests from current students.
- **Club**: A student organization (e.g. CPC, Cybersecurity Club) with description, logo, executive committee members, advisor, and activity gallery. Admin-managed.
- **Notice**: A time-sensitive announcement published by moderator/admin. Title, body, creator, timestamp.
- **Event**: A scheduled program/activity with date, details, media gallery, and optional registration link. Supports an upcoming countdown.
- **Career Guidance Request**: A formal outreach from a student to an alumnus, with message and status (pending/accepted/declined).
- **Achievement**: A notable accomplishment entry for the Hall of Fame — student/team, description, media, date.
- **Project**: A student project showcase entry — title, description, links, team members, media.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A guest can search the directory and see results with only name, batch, and skill tags in under 2 seconds — no contact information is exposed at any point in the browsing flow.
- **SC-002**: A user can complete and submit their profile in under 5 minutes, with clear guidance on required fields.
- **SC-003**: A moderator or admin can approve or reject a pending item from the unified dashboard in under 30 seconds per item.
- **SC-004**: An uploaded question paper transitions from submission to public visibility (after approval) in under 30 seconds from the moment the moderator clicks "Approve."
- **SC-005**: 100% of user-submitted content types (profiles, questions, alumni) use the same `status/approvedBy/approvedAt` pattern — verified by a single query across all relevant tables.
- **SC-006**: Role-based access rules from §5 of the overview are enforced correctly for every resource type at the data layer, confirmed by automated permission tests — zero cases of a guest accessing contact data or a moderator approving a profile.
- **SC-007**: The approval dashboard presents a unified queue across all resource types, with filtering by type — no new dashboard UI is built per content type.
- **SC-008**: The platform loads and is usable in both light and dark modes from the first deploy — no mode is retrofitted later.
- **SC-009**: Search results for profiles and questions return within 2 seconds for up to 5,000 profiles and 10,000 questions.

## Assumptions

- Students have reliable internet access and use a desktop/laptop or tablet browser as their primary device.
- The platform is built as a single deployable Next.js app — no separate backend service for the MVP.
- Admin users are trusted department representatives (faculty or student association members) who are comfortable managing content through a web dashboard.
- Batch numbers change approximately every 4 months — the dropdown generation mechanism is flexible enough to accommodate this without code changes.
- The `studentId` field on profiles is the primary mechanism for verifying that a submitter is a genuine CSE student — the admin reviews this manually during approval.
- File uploads for question papers are PDF or common image formats (PNG, JPEG), with a reasonable file size limit (e.g., 10MB).
- The "Top students per skill" feature is deferred — the initial directory uses admin-curated pinning if needed, not an algorithmic ranking.
- Google OAuth and email/password are the two authentication methods — no other SSO providers are needed for the MVP.
- The platform initially serves the CSE department of a single institution — multi-department or multi-institution support is out of scope for this specification.
- Notifications are delivered as in-app notifications (bell icon / inbox) for the MVP — email or push notifications are deferred.
