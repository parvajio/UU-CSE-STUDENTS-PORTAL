# Feature Specification: Portal User Scenarios

**Feature Branch**: `002-portal-user-scenarios`

**Created**: 2026-07-27

**Status**: Draft

> **Phase Mapping**: Stories are labeled with overall product priority (P1–P5).
> Foundation phase (tasks.md) implements only Stories 3.1-A through 3.1-D.
> Modules 3.2–3.9 are scheduled in Phases 2–5 per the build order in `plan.md`.
> P1 label does not imply Foundation-scope inclusion.

**Input**: User description: "Specify the CSE Students Portal based on docs/overview.md — every module, the 4 roles, the access-rule table, and the approval workflow, written as user scenarios and acceptance criteria."

## Clarifications

### Session 2026-07-27

- Q: How does a current student's profile transition to an alumni record when they graduate? → A: Students self-mark their own profile as alumni by toggling an `isAlumni` flag. The profile then also serves as the alumni directory entry — no separate alumni record needed for existing users. Alumni-specific fields (currentCompany, jobPosition) appear on the profile form when the toggle is enabled.
- Q: What rate limits should prevent spam and moderation queue flooding? → A: Tiered rate limits — users: 5 content submissions (questions, projects, etc.) per hour, 1 profile edit per hour. Moderators and admins are exempt.
- Q: How do users interact with in-app notifications? → A: Simple notification inbox — bell icon in navbar shows unread count badge, dropdown of recent notifications, clicking a notification navigates to the relevant resource. Notifications older than 30 days auto-clear.

## User Scenarios & Testing *(mandatory)*

### Module 3.1 — Student Expert Directory

#### Story 3.1-A — Guest browses the directory (Priority: P1)

A visitor who hasn't logged in lands on the directory and wants to find students with a particular skill. They type a search term and see a list of matching profiles. Each result card shows only the student's fullName, batchNumber, and skill tags — no contact info, no detail beyond those three fields.

**Independent Test**: Open the portal in a private browsing session (no login). Search by a skill name. Confirm the result cards display only fullName, batchNumber, and skill tag names. Confirm whatsappNumber, facebookUrl, linkedinUrl, portfolioUrl, and githubUrl are absent from both search results and any profile detail view.

**Acceptance Scenarios**:

1. **Given** I am a guest (not logged in), **When** I navigate to the Student Expert Directory, **Then** I see a search bar and a list of approved profiles showing only fullName, batchNumber, and skill tag names.
2. **Given** I am a guest viewing a profile, **When** I look at the profile card, **Then** I do not see the student's whatsappNumber, facebookUrl, linkedinUrl, portfolioUrl, githubUrl, bio, avatarUrl, or section.
3. **Given** I am a guest and I search for "Web Development", **When** profiles matching that skill exist, **Then** I see only approved profiles — pending and rejected profiles are not shown.

---

#### Story 3.1-B — Student submits their own profile (Priority: P1)

A logged-in student who has not yet created a profile fills out the profile form with fullName, studentId, batchNumber, section, and optionally avatarUrl, bio, facebookUrl, linkedinUrl, whatsappNumber, portfolioUrl, githubUrl, and one or more skill tags. They submit it. The profile enters `status = pending`. The student sees their profile status as "Pending Review" on their own dashboard, but the profile is not visible to anyone else (guests, other students, moderators) until an admin approves it.

**Independent Test**: Log in as a `user`-role student with no existing profile. Submit a completed profile with all optional fields filled. Log out and confirm the profile does not appear in guest search results. Log back in and confirm the profile shows `status = pending` with an amber badge.

**Acceptance Scenarios**:

1. **Given** I am a logged-in student, **When** I navigate to "Create Profile" and fill in required fields (fullName, studentId, batchNumber, section) plus optional social links and skill selections, **Then** I can submit the form and see a confirmation message.
2. **Given** I have submitted my profile, **When** I view my profile page, **Then** I see a "Pending Review" status badge colored amber (`rgba(217,119,6,0.10)` background) and all my submitted data is visible to me.
3. **Given** my profile is pending, **When** another user or a guest searches the directory, **Then** my profile does not appear in any search results.
4. **Given** I submit a profile with a studentId that another approved profile already uses, **When** I try to submit, **Then** I see an error that this student ID is already registered.

---

#### Story 3.1-C — Admin approves a student profile (Priority: P1)

An admin opens the approval dashboard and sees a unified queue of pending items across resource types. They find a pending profile, review its full data (including the studentId used for verification), and click "Approve." The profile's status changes to `approved`, `approvedBy` and `approvedAt` are recorded, and the profile immediately becomes visible in the directory to all user types.

**Independent Test**: Log in as an `admin`. Navigate to the approval dashboard. Approve a pending profile. Immediately open a guest session and search for that student's fullName — confirm the profile appears.

**Acceptance Scenarios**:

1. **Given** I am an admin, **When** I open the approval dashboard, **Then** I see a list of all pending items from every submittable resource type (profiles, questions, alumni, etc.) with timestamps and submitter names, filterable by resource type.
2. **Given** I click on a pending profile, **When** I review it, **Then** I see its full data: fullName, studentId, batchNumber, section, avatarUrl, bio, all social links, and selected skill tags.
3. **Given** I click "Approve" on a profile, **When** the action completes, **Then** the profile's `status` is `approved`, and it appears in directory searches for all user types including guests.
4. **Given** I click "Reject" and type a reason (e.g. "Student ID does not match department records"), **When** the action completes, **Then** the profile's `status` is `rejected` and the student who submitted it sees the rejection reason.

---

#### Story 3.1-D — Student edits their own approved profile (Priority: P2)

A student whose profile is already approved wants to update their bio, add a new skill, or change their portfolio link. They edit the profile and resubmit it. The profile re-enters `status = pending` until an admin reviews the changes.

**Independent Test**: Log in as a student with an approved profile. Edit the bio field and resubmit. Confirm the profile disappears from public directory search until re-approved.

**Acceptance Scenarios**:

1. **Given** I have an approved profile, **When** I edit any field and submit, **Then** my profile reverts to `status = pending` and is no longer publicly visible.
2. **Given** my edited profile is pending, **When** an admin approves it again, **Then** the updated data replaces the old data and the profile becomes public again.
3. **Given** I edit only my optional fields (e.g., bio, social links), **When** I submit, **Then** the same pending→approved workflow applies.

---

### Module 3.2 — Faculty Directory

#### Story 3.2-A — Any user views the faculty list (Priority: P1)

A guest, logged-in student, moderator, or admin navigates to the Faculty Directory. They see a list of all faculty members added by an admin. Each entry shows fullName, designation, email, phone, researchInterests, officeRoom, and photoUrl. No login is required to view. Faculty records are admin-managed — there is no self-submission or approval workflow.

**Independent Test**: Without logging in, navigate to the Faculty Directory. Confirm faculty cards display all fields and that there is no "Submit faculty" button.

**Acceptance Scenarios**:

1. **Given** I am a guest, **When** I navigate to the Faculty Directory, **Then** I see a list of faculty members showing fullName, designation, email, phone, researchInterests, officeRoom, and optionally a photo.
2. **Given** I am a student, moderator, or admin, **When** I view the same page, **Then** I see the same data as a guest — faculty is fully public.
3. **Given** I am a regular user or moderator, **When** I look for a way to add or edit a faculty record, **Then** there is no such option available.

---

#### Story 3.2-B — Admin manages faculty records (Priority: P2)

An admin logs in and accesses faculty management. They can add a new faculty member (with fullName, designation, email, optionally phone, researchInterests, officeRoom, photoUrl), edit existing records, or remove a faculty entry. Changes appear immediately with no approval workflow.

**Independent Test**: Log in as admin, add a new faculty member, log out, and confirm the new member appears in the guest-visible faculty directory.

**Acceptance Scenarios**:

1. **Given** I am an admin, **When** I fill in the "Add Faculty" form with fullName, designation, email, and optional fields and submit, **Then** the faculty member appears in the directory immediately — no approval needed.
2. **Given** I am an admin, **When** I edit an existing faculty member's email or officeRoom, **Then** the change is visible immediately on the public directory.
3. **Given** I am an admin, **When** I delete a faculty record, **Then** it disappears from the public directory immediately.

---

### Module 3.3 — Alumni Career Network

#### Story 3.3-A — Student marks own profile as alumni (Priority: P2)

A student with an existing approved profile toggles the "I am an alumnus" setting on their profile. This sets `isAlumni = true` on their profile record and reveals additional fields: currentCompany, jobPosition. The student fills these in and submits. The profile now also appears in the Alumni Career Network directory alongside the Student Expert Directory. Since the profile is already approved, the alumnus status takes effect immediately — no re-approval is needed unless profile content changed.

**Independent Test**: Log in as a student with an approved profile, toggle the alumni setting, fill in company/position, and confirm the profile appears in both the student directory and the alumni directory.

**Acceptance Scenarios**:

1. **Given** I have an approved profile, **When** I toggle "I am an alumnus" and fill in currentCompany and jobPosition, **Then** my profile appears in both the Student Expert Directory and the Alumni Career Network.
2. **Given** I toggle the alumni setting without changing any existing fields, **When** I save, **Then** no re-approval is required — the existing approval covers the alumni visibility.
3. **Given** I do not have a portal account, **When** I try to add an alumni-only record, **Then** I must first sign up and create a student profile (or an admin can enter me directly).

---

#### Story 3.3-B — Admin enters an alumni record directly (Priority: P2)

An admin wants to add an alumnus who may not have a portal account. They fill out the same alumni fields (fullName, batchNumber, currentCompany, jobPosition, linkedinUrl, facebookUrl, contactInfo). Since the admin is entering it, the record can be inserted directly with `status = approved` and `userId = null`, appearing immediately in the alumni directory.

**Independent Test**: Log in as admin, enter an alumni record directly, and confirm it appears in the public alumni directory without any approval step.

**Acceptance Scenarios**:

1. **Given** I am an admin, **When** I add an alumni record directly (without linking to a user account), **Then** the record is automatically `approved` and appears in the public alumni directory immediately.
2. **Given** an admin-added alumni record has `userId = null`, **When** the alumnus later creates a portal account, **Then** the admin can link the existing alumni record to the user's account.

---

#### Story 3.3-C — Student requests career guidance (Priority: P3)

A logged-in student finds an alumnus in the alumni directory and clicks "Request Career Guidance." They compose a message (the `message` field on a `career_guidance_requests` record) and send it. The request is created with `status = pending`. The alumnus sees it in their inbox and can accept (`status = accepted`) or decline (`status = declined`). The requesting student is notified of the outcome.

**Independent Test**: Log in as a student, send a guidance request to an alumnus. Log in as that alumnus, accept the request. Confirm the student receives a notification.

**Acceptance Scenarios**:

1. **Given** I am a logged-in student viewing an approved alumni profile, **When** I click "Request Career Guidance" and write a message, **Then** the request is sent with `status = pending` and the alumnus is notified.
2. **Given** I am an alumnus with a pending guidance request, **When** I click "Accept", **Then** the status changes to `accepted` and the requesting student sees a confirmation.
3. **Given** I am an alumnus with a pending guidance request, **When** I click "Decline", **Then** the status changes to `declined` and the requesting student is notified.

---

### Module 3.4 — Digital Question Bank

#### Story 3.4-A — Student uploads a question paper (Priority: P1)

A logged-in student navigates to the question bank upload page and fills in: title, subject, course, batch, examType (one of: previous_year, midterm, final, lab, viva), and uploads a PDF or image file. They can optionally add tags via the `question_tags` join table. The question enters `status = pending`. It is not searchable by anyone until a moderator or admin approves it.

**Independent Test**: Log in as a student, upload a question paper with all required fields. Log out and search for it as a guest — it should not appear. Log in as a moderator, approve it, then search again — it should now appear.

**Acceptance Scenarios**:

1. **Given** I am a logged-in student, **When** I upload a question paper with title, subject, course, batch, examType, and a file, **Then** the question is created with `status = pending` and I see a "Submitted for review" message.
2. **Given** my question is pending, **When** I or anyone else searches the question bank, **Then** the question does not appear.
3. **Given** I attempt to upload a file larger than the allowed size or of an unsupported type (not PDF or image), **When** I submit, **Then** I see a clear error message explaining the file requirements.

---

#### Story 3.4-B — User searches and downloads approved questions (Priority: P1)

A logged-in student searches the question bank by subject, course, batch, examType, or tags. They see a list of approved questions matching their filters. Each result shows title, subject, course, batch, examType, and tags. They click a question to download the file. Guests can browse and see the metadata but the download button is absent.

**Independent Test**: Log in as a student, search by a subject, find an approved question, download it. Log out and confirm the same question's detail page has no download button.

**Acceptance Scenarios**:

1. **Given** I am a logged-in student, **When** I search the question bank by subject, course, batch, examType, or tags, **Then** I see a list of approved questions matching my filters with their metadata.
2. **Given** I am a logged-in student viewing an approved question, **When** I click "Download", **Then** the file (PDF or image) is downloaded.
3. **Given** I am a guest, **When** I view the same question's detail page, **Then** I see the title and metadata but no download button.

---

#### Story 3.4-C — Moderator approves a question (Priority: P1)

A moderator opens the approval dashboard and sees pending questions alongside other low-sensitivity items. They review a question's details (title, subject, course, batch, examType, file preview), and approve or reject it. Profile approvals are not visible to moderators — only admins see those.

**Independent Test**: Log in as a moderator, confirm the approval dashboard shows pending questions but not pending profiles. Approve a question, then confirm it appears in the public question bank.

**Acceptance Scenarios**:

1. **Given** I am a moderator, **When** I open the approval dashboard, **Then** I see pending questions (and other low-sensitivity items) but NOT pending profiles or other admin-only items.
2. **Given** I review a pending question, **When** I click "Approve", **Then** the question's `status` becomes `approved` and it appears in the public question bank.
3. **Given** I am a moderator, **When** I try to navigate to profile management or role assignment, **Then** I receive an access-denied message.

---

### Module 3.5 — Clubs & Executive Body

#### Story 3.5-A — Any user views a club page (Priority: P2)

A guest, student, moderator, or admin navigates to a club's page (e.g., CPC, Cybersecurity Club, ML Club). They see the club's name, description, logoUrl, the executive committee members (with names and positions like "President", "General Secretary"), advisor info, a member list, and an activity/achievement gallery.

**Independent Test**: Without logging in, visit a club page. Confirm you can see all the club details including the executive committee and member list. (Club pages are fully public.)

**Acceptance Scenarios**:

1. **Given** I am a guest, **When** I visit a club page, **Then** I see the club's name, description, logo, executive committee members with their positions, advisor info, and a gallery of activities.
2. **Given** I am a student or moderator or admin, **When** I visit the same club page, **Then** I see the same information — club pages are public.
3. **Given** no clubs exist yet, **When** I visit the clubs section, **Then** I see a "No clubs listed yet" empty state.

---

#### Story 3.5-B — Admin creates and manages clubs (Priority: P2)

An admin accesses club management. They can create a new club with name, description, and logoUrl. They can add members to a club through the `club_members` table, assigning each member a roleInClub (`member`, `executive`, or `advisor`), an optional position title (e.g., "President"), and a joinedAt timestamp.

**Independent Test**: Log in as admin, create a new club, add an executive member. Log out and confirm the club page is visible, including the executive member you added.

**Acceptance Scenarios**:

1. **Given** I am an admin, **When** I create a club with name, description, and logo, **Then** the club's page is immediately visible to all users — no approval needed.
2. **Given** I am an admin editing a club, **When** I add a member with roleInClub set to `executive` and position "Secretary", **Then** the member appears in the executive committee section of the club page.
3. **Given** I am an admin, **When** I remove a club, **Then** the club's page is no longer accessible.

---

### Module 3.6 — Event & Program Gallery

#### Story 3.6-A — User views past events and upcoming countdown (Priority: P3)

A guest or logged-in user navigates to the Event Gallery. They see a grid of past events (seminars, workshops, contests) with photos and descriptions, and a highlighted card for the next upcoming event showing its date, a live countdown timer, event details, and a registration button/link.

**Independent Test**: Without logging in, open the Event Gallery page. Verify you can see past event media and the upcoming event countdown.

**Acceptance Scenarios**:

1. **Given** I am any user (guest or logged in), **When** I navigate to the Event Gallery, **Then** I see a grid of past event entries with photos and descriptions.
2. **Given** there is a future event scheduled, **When** I view the Event Gallery, **Then** I see a featured card showing the event name, date, a live countdown timer, and a registration link.
3. **Given** the upcoming event date has passed, **When** the countdown reaches zero, **Then** the event moves to the past events archive and the next upcoming event (if any) takes its place in the featured card.

---

### Module 3.7 — CSE Learning Academy

#### Story 3.7-A — Student browses and accesses courses (Priority: P5)

A logged-in student navigates to the Learning Academy and sees a list of available courses/recorded classes. Each course has a title, instructor info, description, and progress indicator. Some courses may be labeled as premium. Students can start a course, track their progress, and receive a certificate upon completion.

**Independent Test**: Log in as a student, open the Learning Academy, start a course, complete a module, and confirm the progress indicator updates.

**Acceptance Scenarios**:

1. **Given** I am a logged-in student, **When** I open the Learning Academy, **Then** I see a list of available courses with titles, instructor names, and descriptions.
2. **Given** I start a course, **When** I complete lessons/modules, **Then** my progress is tracked and displayed as a percentage or step indicator.
3. **Given** I complete all modules of a course, **When** the course is finished, **Then** I receive a certificate of completion.

---

### Module 3.8 — Student Helpline

#### Story 3.8-A — Student finds a senior for support (Priority: P3)

A logged-in student navigates to the Student Helpline section. They see a curated directory of approximately 20 senior students who are available for academic, career, or emergency support. Each entry shows the senior's fullName, batchNumber, and contact information (whatsappNumber, facebookUrl). This is a fast-access directory — smaller and more targeted than the full Student Expert Directory.

**Independent Test**: Log in as a student, open the Helpline, verify you see approximately 20 senior student profiles with their contact info.

**Acceptance Scenarios**:

1. **Given** I am a logged-in student, **When** I navigate to the Student Helpline, **Then** I see a curated list of senior students with their fullName, batchNumber, and direct contact info (WhatsApp, Facebook).
2. **Given** I am a guest, **When** I try to access the Student Helpline, **Then** I am prompted to log in — the Helpline requires authentication.
3. **Given** the Helpline directory has fewer than 20 seniors, **When** I view it, **Then** I see only the available seniors with no empty filler entries.

---

### Module 3.9 — Supporting Features

#### Story 3.9-A — Notice Board (Priority: P3)

Any user (guest or logged in) visits the Notice Board and sees a chronological list of notices published by moderators and admins. Each notice shows a title, body, publisher name, and published date. Moderators/admins can create new notices.

**Independent Test**: Without logging in, open the Notice Board. Confirm notices are visible. Log in as a moderator, create a notice, and confirm it appears at the top of the list.

**Acceptance Scenarios**:

1. **Given** I am any user (guest, student, moderator, admin), **When** I visit the Notice Board, **Then** I see a list of notices ordered by most recent first, each showing title, body, and published date.
2. **Given** I am a moderator or admin, **When** I create a notice with a title and body, **Then** the notice appears immediately on the public Notice Board.

---

#### Story 3.9-B — Project Showcase (Priority: P4)

A logged-in student navigates to the Project Showcase and can submit their project with title, description, links (GitHub, live demo), team members, and media. Submissions are listed publicly for all users to browse after admin approval. Projects use the same `status/pending/approvedBy/approvedAt` approval pattern.

**Independent Test**: Log in as a student, submit a project. Confirm it's not public until an admin approves it from the unified dashboard.

**Acceptance Scenarios**:

1. **Given** I am a logged-in student, **When** I submit a project with title, description, and links, **Then** the project enters `status = pending` and is not publicly visible.
2. **Given** a project is pending, **When** an admin approves it from the approval dashboard, **Then** it appears in the public Project Showcase.

---

#### Story 3.9-C — Achievement Hall of Fame (Priority: P4)

Any user (guest or logged in) can browse the Achievement Hall of Fame — a gallery of notable student and team achievements. Each entry shows the achiever(s), description, a date, and optional media. Admin curates and approves entries.

**Acceptance Scenarios**:

1. **Given** I am a guest, **When** I navigate to the Achievement Hall of Fame, **Then** I see a gallery of approved achievement entries with descriptions and dates.
2. **Given** I am an admin, **When** I add or approve an achievement entry, **Then** it appears in the public Hall of Fame.

---

#### Story 3.9-D — Additional supporting features (Priority: P5)

The portal includes the following supporting features, each accessible from the main navigation. All are either fully public or require login as noted:

- **CGPA Calculator**: A logged-in student can input semester grades and compute their CGPA.
- **Academic Routine/Calendar**: Any user can view the current academic schedule.
- **Blood Donor Directory**: A logged-in student can register as a blood donor (name, batch, blood group, contact) and other students can search for donors by blood group.
- **Lost & Found**: A logged-in student can post lost/found items with descriptions and contact info. Posts use the approval pattern.
- **Freelancer Directory**: A logged-in student can list their freelancing profile (skills, platforms, portfolio links).
- **Internship/Job/Scholarship Boards**: Moderators and admins can post opportunities; students can browse and apply or follow external links.
- **Research Paper Repository**: Students can submit research papers (PDFs) for admin approval and public access.
- **General Resource-Sharing Hub**: A library of shared study resources (notes, links, guides), user-submitted with approval.
- **Certificate Verification**: Anyone can enter a certificate ID to verify its authenticity.

---

### Role-Based Access — Access Rules Summary

The following table governs what each user type can see and do across all modules. This is enforced at the data-access layer — never by frontend hiding alone.

| Action | Guest | User | Moderator | Admin |
|---|---|---|---|---|
| Search/browse directory, questions, notices, events, clubs, faculty, alumni | ✅ | ✅ | ✅ | ✅ |
| View full profile details (contact info, social links, portfolio) | ❌ | ✅ | ✅ | ✅ |
| Download question papers | ❌ | ✅ | ✅ | ✅ |
| Submit a profile, question, project, or other resource | ❌ | ✅ (goes to pending) | ✅ (goes to pending) | ✅ (can skip pending) |
| Approve/reject questions and low-sensitivity submissions | ❌ | ❌ | ✅ | ✅ |
| Approve/reject profiles and sensitive submissions | ❌ | ❌ | ❌ | ✅ |
| Manage roles (promote/demote moderators) | ❌ | ❌ | ❌ | ✅ |
| Manage faculty, club, and alumni records directly | ❌ | ❌ | ❌ | ✅ |
| Publish notices | ❌ | ❌ | ✅ | ✅ |
| Manage events and achievements | ❌ | ❌ | ❌ | ✅ |

---

### Approval Workflow — Universal Pattern

Every submittable resource type (profiles, questions, alumni self-submissions, projects, lost & found posts, research papers, resource-sharing entries) follows the same approval pipeline:

1. **Submission**: A user (or moderator) fills in the required fields and submits.
2. **Pending**: The resource is created with `status = pending`. It is NOT visible to guests or other users. Only the submitter and reviewers can see it.
3. **Review**: Moderators and/or admins see the pending item in the unified approval dashboard. They can view the full submission data.
4. **Decision**:
   - **Approved** → `status = approved`, `approvedBy` set to reviewer's user ID, `approvedAt` set to current timestamp. Resource becomes immediately publicly visible.
   - **Rejected** → `status = rejected`. Reviewer may provide a reason. Submitter is notified with the reason and can edit and resubmit.
5. **Post-approval edits**: If an approved resource is edited by its owner, it reverts to `status = pending` and must be re-approved.

---

### Edge Cases

- **Duplicate submission attempts**: A user with an existing approved profile cannot submit a second profile — one profile per user.
- **Empty state — no data yet**: Modules with no approved content show friendly empty states ("No profiles found yet — check back after students join") rather than error pages.
- **Concurrent moderation**: Two moderators open the same pending item. The first click (approve or reject) succeeds. The second sees a "This item was already processed" notice.
- **Unsupported file type**: Question paper uploads reject non-PDF/non-image files with a clear error before the upload starts.
- **Guest accessing protected routes**: A guest who tries to navigate to a user-only page (e.g., profile submission) is redirected to the login page.
- **Moderator overreach**: A moderator who attempts to approve a profile (admin-only) receives an access-denied response at the permission level.
- **Batch rollover**: When the admin updates `CURRENT_BATCH`, existing profiles retain their original `batchNumber`. New profile submissions see an extended dropdown.
- **Submission rate limiting**: A user who exceeds 5 content submissions per hour or 1 profile edit per hour sees a rate-limit error with a retry-after time. Moderators and admins have no rate limits.

## Requirements *(mandatory)*

### What Each Role Must Be Able to Do

- **R-001**: Guests can search and browse the Student Expert Directory, Faculty Directory, Question Bank (metadata only without download), Club pages, Event Gallery, Notice Board, Alumni Network (approved profiles only), and Achievement Hall of Fame.
- **R-002**: Guests see only fullName, batchNumber, and skill tags on profile views — never bio, avatarUrl, section, contact info, social links, portfolio, or GitHub URLs.
- **R-003**: Guests cannot download question paper files or see download buttons.
- **R-004**: Users (logged-in students) can submit, view, and edit their own profile with fields matching the profiles table (fullName, studentId — required for current students, nullable for legacy alum — batchNumber, section, avatarUrl, bio, facebookUrl, linkedinUrl, whatsappNumber, portfolioUrl, githubUrl).
- **R-005**: Users can submit question papers with title, subject, course, batch, examType (previous_year/midterm/final/lab/viva), file upload, and optional tags.
- **R-006**: Users can toggle alumni status on their own profile, submit projects, lost & found posts, and other submittable content — all enter `status = pending` where approval is required.
- **R-007**: Users can download approved question papers.
- **R-008**: Users can browse and search approved alumni, faculty, clubs, events, notices, and hall of fame.
- **R-009**: Users can request career guidance from alumni via a message.
- **R-010**: Moderators can do everything a User can, plus approve/reject questions and other low-sensitivity submissions from the unified approval dashboard.
- **R-011**: Moderators cannot see or approve profiles, manage roles, manage faculty/clubs directly, manage alumni-status profiles, or perform other admin-only actions.
- **R-012**: Admins can do everything — approve/reject any pending resource, manage faculty/clubs and alumni-status profiles directly, assign roles, manage events and achievements, and publish notices.
- **R-013**: The approval dashboard shows pending items across all resource types in a single unified queue, filterable by type.
- **R-014**: Every approved resource records `approvedBy` (the reviewer's ID) and `approvedAt` (the approval timestamp).
- **R-015**: Rejected submissions include an optional reason visible to the submitter.
- **R-016**: Submitters are notified in-app when their resource is approved or rejected — a bell icon in the navbar shows an unread count badge; clicking it opens a dropdown of recent notifications; clicking a notification navigates to the relevant resource. Notifications older than 30 days auto-clear.
- **R-017**: Editing an approved resource resets it to `status = pending` for re-approval.
- **R-018**: Each user can have at most one profile; duplicate profiles are prevented.
- **R-019**: Batch numbers in profile forms are rendered as a dynamic dropdown, not a hardcoded list, generated based on an admin-configurable current batch value.
- **R-020**: Faculty, clubs, and notices managed by admins appear immediately without any approval workflow.
- **R-021**: Submission rate limits are enforced — users may submit at most 5 content items (questions, projects, etc.) per hour and 1 profile edit per hour. Moderators and admins are exempt from rate limits.

### Key Entities

- **User**: Authenticated account with email, password or Google auth (or `unclaimed` for admin-created placeholder accounts with no login yet), and a role (user, moderator, admin). Guests have no user row.
- **Profile**: A student's public identity — fullName, studentId, batchNumber, section, avatarUrl, bio, social links, portfolio, GitHub, skill tags (via profile_skills join), plus an `isAlumni` boolean (default false). When `isAlumni` is toggled on, additional fields currentCompany and jobPosition appear. The profile serves double duty: it appears in the Student Expert Directory and, when `isAlumni=true`, also in the Alumni Career Network.
- **Skill**: A hierarchical category or subskill (name, slug, parentSkillId, colorKey) linked to profiles via profile_skills.
- **Question**: A past exam upload — title, subject, course, batch, examType, fileUrl, tags (via question_tags) — with the same approval lifecycle as profiles.
- **Faculty**: An admin-managed directory entry with fullName, designation, email, phone, researchInterests, officeRoom, photoUrl — no approval workflow.
- **Alumnus**: A graduate record. For users who signed up as students, this is their profile with `isAlumni=true`. For legacy graduates with no account, an admin creates a `profiles` row (with a matching `unclaimed` `users` row) directly, leaving `studentId` null.
- **Career Guidance Request**: A message from a student to an alumnus (studentProfileId, alumniProfileId, message) with status pending/accepted/declined.
- **Club**: A student organization with name, description, logoUrl, and members (club_members with roleInClub and position).
- **Notice**: A time-sensitive announcement (title, body, createdBy) published by moderators/admins — always visible.
- **Event**: A scheduled or past program with date, media, description, and optional registration link.
- **Project**: A student project with title, description, links, team members — uses the approval pattern.
- **Achievement**: A notable accomplishment entry in the Hall of Fame — admin-curated.

## Success Criteria *(mandatory)*

- **SC-001**: A guest browsing any module sees only the fields that role is permitted to see — confirmed by automated queries that verify no contact data leaks through the data layer.
- **SC-002**: A user can complete and submit a profile with all fields from the data-dictionary in under 5 minutes.
- **SC-003**: A moderator or admin can locate, review, and approve/reject a pending item from the unified dashboard in under 30 seconds.
- **SC-004**: An approved resource becomes publicly visible within 5 seconds of the approval action.
- **SC-005**: All submittable resource types (profiles, questions, projects, etc.) use exactly the same `status/approvedBy/approvedAt` columns — verified by a single schema check.
- **SC-006**: Role-based access rules are enforced at the data-access level for every resource type — zero cases of a guest accessing contact data or a moderator approving a profile.
- **SC-007**: Every module listed in overview.md §3 is navigable and displays its data according to the access rules — none are missing or throw errors.
- **SC-008**: Search results across profiles and questions return within 2 seconds for up to 5,000 profiles and 10,000 questions.

## Assumptions

- The portal serves a single CSE department initially — multi-department support is out of scope for this specification.
- Authentication methods are email/password, Google OAuth, and `unclaimed` placeholder accounts for legacy alumni — no other SSO providers for the MVP.
- Notifications are delivered in-app (bell icon / notification inbox) — email or push notifications are deferred.
- File uploads for question papers are limited to PDF and common image formats (PNG, JPEG) with a 10 MB maximum file size.
- The Learning Academy (Module 3.7) and Extras supporting features (Module 3.9 items beyond the notice board and project showcase) are Phase 5 / lowest priority and will be built only after core modules are stable.
- The "Top students per skill" feature mentioned in overview.md §3.1 is deferred — the directory uses simple search/filter in v1.
- Batch numbers have a new value approximately every 4 months; the dropdown is dynamic based on an admin-configurable `CURRENT_BATCH` setting.
- The Student Helpline directory of ~20 seniors is admin-curated — there is no self-nomination flow.
