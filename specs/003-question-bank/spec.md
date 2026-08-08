# Feature Specification: Digital Question Bank

**Feature Branch**: `003-question-bank`

**Created**: 2026-08-08

**Status**: Draft

**Input**: User description: "Specify the Digital Question Bank module based on docs/overview.md section 3.4 and docs/data-dictionary.md's questions/question_tags tables. Cover: upload flow (title, subject, course, batch, examType, file via PDF/image upload, free-form tags → pending via enforceSubmissionLimit 5/hour), search/filter (subject, batch, course, examType, tag, reusing buildSearchQuery), guest access (metadata search but NO download, enforced at query/route layer, not a hidden button), approval (reuses universal pattern + dashboard, moderators can approve), rejection (optional reason with notification, same as profiles)."

**Amendment 2026-08-08**: subject/course replaced by curated `subjects`/`courses` reference tables (seeded from `src/lib/db/seed-data/uu-cse-courses-seed.json`) with `questions.courseId` as primary path plus `customSubject`/`customCourse` "other" fallback; `batch` → `batchNumber` integer reusing the profiles dynamic-dropdown pattern; filters group courses under subjects with an "Other" group for custom entries. `docs/data-dictionary.md` must be updated to match before code.

> **Phase Mapping**: Digital Question Bank is Phase 2 (Core Content) per the constitution build order. This spec finalizes the module's user-facing behavior, reusing foundation components. No new permission rules are introduced — `question` is already moderator-eligible in the existing permission matrix. This spec references the established approval pattern (constitution §III, spec 002 §Approval Workflow, Foundation implementation) rather than re-deriving it.

## Clarifications

### Session 2026-08-08

- Q: Does a guest get a question detail page, or is guest access cards-only (like the Foundation directory)? → A: Guests DO get a metadata-only detail page with a "Log in to download" prompt. The directory's cards-only rule was a sensitive-data mitigation (contact info); question metadata carries no such risk, so it does not apply here. A directly serves conversion (login prompt) with no real downside versus silently omitting the download.
- Q: How should subject/course be captured so filters don't fragment (previously deferred as I4)? → A: **Curated catalog amendment (2026-08-08):** add two curated reference tables — `subjects` (id, unique slug, name) and `courses` (id, unique code, title, creditHours, subjectId FK) — seeded from `src/lib/db/seed-data/uu-cse-courses-seed.json`. The `questions` table drops free-text `subject`/`course` in favor of `courseId` (FK → courses.id, nullable, **primary path**) plus `customSubject`/`customCourse` (text, nullable) as the free-form "other" fallback when a course is not yet in the curated list. `batch` becomes `batchNumber` (integer) reusing the profiles pattern exactly — dynamic dropdown from `site_config` CURRENT_BATCH. Filters group by subject, show course options from `courses` as the primary path, and surface any `customCourse` entries as a secondary "Other" filter group. `docs/data-dictionary.md` must be updated to match before any code is written.
- Q: The seed lists some course codes twice (e.g. `PHY0533101` under both basic-science-engineering and diploma-exempted) while `courses.code` is unique — how to resolve? → A: **Keep one code, remove the duplicate** — dedupe by code at seed time, keeping the row under the course's real subject. (Superseded in part by the next item: Diploma-Exempted is a per-question program flag, not a catalog subject, so its seed entries collapse into their real subjects regardless.)
- Q: What is the "Diploma-Exempted" concept in the upload flow? → A: **Not a subject — a per-question flag.** A student flags a paper as `regular` vs `diploma` when uploading, plus an independent `evening` flag. Diploma-Exempted is therefore dropped from the curated subject catalog (seed produces **7 subjects**, not 8) and replaced by per-question program labels on the question itself.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Student uploads a question paper (Priority: P1)

A logged-in student navigates to the upload page and fills in: title, subject (from the curated 7 subject categories), course (from the curated course list filtered by subject, or an "Other" custom text), batch (the same dynamic batch dropdown used by profiles, up to the current batch), program (a per-question flag: Regular / Diploma, defaulting to Regular), evening (an optional flag for evening-batch papers), examType (previous_year / midterm / final / lab / viva), and attaches a single file — a PDF or an image. They can also add free-form tags (not a fixed dropdown — anything they type, one tag at a time). They submit. The submission is created in `status = pending` and is invisible to everyone except the submitter and role-eligible reviewers until a moderator or admin approves it.

**Why this priority**: Upload is the source of all bank content — without it the bank stays empty. It must ship first.

**Independent Test**: Log in as a `user`-role student, upload a paper choosing a subject, an existing curated course, a batch, and one extra tag. Confirm a "Submitted for review" message and that searching for the paper while logged out or logged in as another student returns nothing. Repeat with a custom "Other" course not in the curated list and confirm it still submits. Repeat again flagging it `diploma` + evening and confirm those flags persist on the record.

**Acceptance Scenarios**:

1. **Given** I am a logged-in student with an active session, **When** I submit a question with title, subject, course, batchNumber, examType, program flag, and a valid PDF or image file, **Then** the question is created with `status = pending`, tagged with my free-form tags, and I see a confirmation that it is under review.
2. **Given** I am a logged-in student, **When** I submit a question without a required field (e.g., no title, no subject, or no file), **Then** the form blocks submission and shows which required field is missing — nothing is sent.
3. **Given** I upload a file that is not a PDF or image, or exceeds the size limit, **Then** I get a clear error explaining the accepted file types/size before any submission is recorded.
4. **Given** a pending question exists from any user, **When** anyone else (guest or another logged-in user) searches the question bank, **Then** that question does not appear in any results.
5. **Given** I have already made 5 content submissions in the current hour, **When** I attempt a 6th upload, **Then** the upload is rejected with a message telling me when I can try again, and no pending item is created. (Moderators and admins are exempt.)
6. **Given** I submit a valid question, **When** I do so within the allowed limit, **Then** my upload counts against the shared 5-per-hour content submission limit — the same one used for every submission action across the portal, **not** the 1-per-hour profile upsert exception.
7. **Given** a course I need is not in the curated list, **When** I pick "Other" and type the course name, **Then** the question is submitted with my custom subject/course text and is searchable/filterable under the "Other" group once approved.
8. **Given** I do not touch the program or evening flags, **When** I submit, **Then** the paper is recorded as `Regular` and non-evening by default — a diploma or evening paper only shows as such if I set the flag.

---

### User Story 2 - Moderator or admin approves or rejects a pending question (Priority: P1)

A moderator (or admin) opens the unified approval dashboard and finds the pending question in the same queue that already lists other pending resources. They review its details — title, subject, course, batchNumber, examType, tags and the attached file — then click "Approve" or "Reject". On approve, the question becomes publicly searchable. On reject, they may type an optional reason; the submitter is notified either way, and the reason (if given) is shown to them. Moderators can see and act on questions (moderator-eligible); only admins see admin-only resource types in the same queue.

**Why this priority**: The trust model depends on moderated content — nothing a student uploads is visible to anyone else until a reviewer says yes.

**Independent Test**: Log in as a `moderator`, open the approval dashboard, verify pending questions appear alongside other moderator-eligible items and that pending profiles do **not** appear. Approve one question, log out, and confirm it now appears (metadata + file access) for a guest in the bank.

**Acceptance Scenarios**:

1. **Given** I am a moderator, **When** I open the approval dashboard, **Then** I see pending questions (alongside other moderator-eligible resource types) but not admin-only resource types such as profiles.
2. **Given** I open a pending question, **When** I click "Approve", **Then** its `status` changes to `approved`, `approvedBy` and `approvedAt` are recorded, the submitter receives an in-app approval notification, and the question appears in public search within 5 seconds (SC-003).
3. **Given** I open a pending question, **When** I click "Reject", **Then** its `status` changes to `rejected`, it remains hidden from everyone except the submitter, and the submitter receives an in-app rejection notification including my reason if I typed one.
4. **Given** I reject without typing a reason, **When** the submitter sees the notification, **Then** a generic "your question was not approved" message is shown rather than an empty reason field.
5. **Given** the question has already been acted on by another reviewer, **When** I try to approve or reject it again, **Then** I am shown "this question was already processed" and no duplicate action occurs.
6. **Given** I am an admin, **When** I open the dashboard, **Then** I see and can act on pending questions exactly as a moderator can.

---

### User Story 3 - Student searches and downloads an approved question (Priority: P1)

A logged-in student browses the question bank, searches and filters by subject, course (grouped under each subject, from the curated list), batchNumber, program (Regular/Diploma), evening, examType and tag (multiple filters can be combined). Curated courses appear under their subject; any questions filed under a custom "Other" course appear under a secondary "Other" group. Results show a small badge for `diploma` or `evening` papers so they are distinguishable from regular day papers. They see a list of approved questions with their metadata. Clicking a question lets them download the PDF/image file.

**Why this priority**: Download is the reason the bank exists — students get the papers. Requires the login gating in Story 4.

**Independent Test**: Log in as a user, search by a subject + examType, open an approved result and download the file. Confirm unapproved/rejected papers never appear. Confirm a course filter under a subject shows only curated courses plus an "Other" bucket that lists custom-course questions. Confirm a diploma/evening paper shows its badge.

**Acceptance Scenarios**:

1. **Given** I am a logged-in student, **When** I search the question bank by text or filter by subject, batchNumber, course, examType, program, evening, or tag, **Then** I see only approved questions matching my criteria, each showing title, subject, course, batchNumber, examType, tags (plus diploma/evening badges when set), ordered most recent first.
2. **Given** I set multiple filters (e.g., subject + final), **When** I apply them, **Then** only questions matching **all** the active filters are shown simultaneously.
3. **Given** no results exist for my filters, **When** I search, **Then** I see a clear empty state ("No question papers found — check back soon") rather than an error.
4. **Given** I open an approved question, **When** I click "Download", **Then** the original PDF or image file downloads successfully.
5. **Given** I filter by course, **When** I look at the course options, **Then** they are grouped under their subject from the curated list, and custom "Other" course entries appear in a separate "Other" filter group — so a curated and a custom question for the same course name never silently collide.

---

### User Story 4 — Guest searches question metadata but cannot download files (Priority: P1)

A guest searches the question bank and can filter by subject, tag, course, batchNumber, program, evening, or examType, and can open any approved question to view its metadata on a detail page. They see the same metadata card (title, subject, course, batchNumber, examType, tags, and diploma/evening badges when set) for an approved question that other users see. They do **not** see a download button; instead the opened question shows a clear "Log in to download" prompt pointing to the login page, and they **cannot** access the file content through any known or guessed link.

**Why this priority**: Guests get value from discovery of metadata, but file content is login-only per the access-rule table (§5 overview.md). This is stricter than the directory (guests see full cards there) — the file access itself is gated. Guests get a metadata-only detail page (unlike the Foundation directory's cards-only guest surface) because question metadata carries no contact data — the directory's stricter rule exists to keep contact info private, which does not apply here.

**Independent Test**: In a private window (not logged in), search and open an approved question. Confirm metadata is displayed, a "Log in to download" prompt is shown, and there is no Download control. Then manually change the URL to the question's file URL and confirm access is denied — the file is not served to an unauthenticated user on any path, and no working file link is ever contained anywhere in the guest response (a hidden button alone is unacceptable; the guest must not be able to reach the file at the access layer).

**Acceptance Scenarios**:

1. **Given** I am a guest, **When** I open an approved question, **Then** I see only the metadata (title, subject, course, batchNumber, examType, tags, and diploma/evening badges when set) plus a visible "Log in to download" prompt that takes me to the login page — no download link or button is rendered for guests.
2. **Given** I am a guest, **When** I directly request the file URL of an approved question (e.g., pasting a URL I obtained elsewhere, or invoking the same endpoint the download uses), **Then** the request does **not** return the file — the server itself enforces the login requirement, rather than merely omitting the click control, and shows the login page (or a clear not-allowed message).
3. **Given** a guest request, **When** the bank search response is built, **Then** no file URL field is present in the data served to guests — the file reference is never disclosed to unauthenticated viewers.
4. **Given** I am a guest and the question is pending or rejected, **When** I search or attempt direct access, **Then** I cannot see it at all (neither metadata nor file).

---

### User Story 5 - Student tracks own submissions (Priority: P2)

A logged-in student opens their own submissions view ("My Submissions") and sees all the questions they've uploaded, each with its current status (pending / approved / rejected), and can see the rejection reason if they were rejected, and reopen/retry.

**Why this priority**: Without this the submitter has no visibility into where their content stands; it also carries the rejection-reason back to them.

**Independent Test**: Upload a question, view it under My Submissions as `pending`. Have a moderator reject it with a reason, refresh the page, and confirm the submitter sees the `rejected` status and the reason.

**Acceptance Scenarios**:

1. **Given** I am a logged-in student with uploads, **When** I open "My Submissions", **Then** I see every question I've uploaded with a status badge matching its current `status`.
2. **Given** a question of mine was rejected with a reason, **When** I look at it, **Then** I see the rejection reason text.
3. **Given** one of my pending questions is approved, **When** I look at it, **Then** I can open it (and download — I own it) and its status shows `approved`.

---

### Edge Cases

- **Upload failure / partial upload**: A file that fails to transfer or is corrupt returns a clear error, and the pending question is not created (no orphan pending row).
- **Concurrent moderation**: Two reviewers act on the same pending question at the same time — the first decision wins, the second sees "already processed". (Conditional update).
- **Guest direct file access**: as described in Story 4 — always denied at the access layer, no funnel through a hidden/faked URL.
- **Empty tag list**: a question with no tags is still searchable/filterable by the other fields and is valid — tags are not mandatory.
- **Same paper uploaded twice**: duplicates are allowed to be caught by reviewers during approval — no automatic dedup in this scope.
- **Batch rollover**: batchNumber comes from the dynamic dropdown; when the admin updates the current batch, existing questions keep their original batchNumber and new uploads see the extended dropdown (same behavior as profiles).
- **Course not in the curated list**: the upload form's "Other" path accepts free-text customSubject/customCourse; such questions surface in filters under the "Other" group, and are not silently merged with a curated course of the same name.
- **Seed data has flagged rows**: the seed JSON marks a few courses with `_CHECK` notes (e.g., possible duplicate `Operating System Lab` code `CSE0613206`, a low credit-hour `Data Communication`, and a second Microprocessor-lab code) and repeats some codes across subjects (e.g., `PHY0533101` under both basic-science-engineering and diploma-exempted). These rows are de-duplicated by code at seed time — **keep one code, remove the duplicate** — keeping the row under the course's real subject; the `diploma-exempted` subject is **not seeded at all** (it is now a per-question program flag). Any leftover duplicate codes are rejected at seed time. (Assumptions A-9/A-12, clarified 2026-08-08.)
- **File too large / wrong type**: blocked at the upload step with the accepted formats and max size shown.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: A logged-in user MUST be able to upload a question paper with fields: title (required), subject (required, from the curated subject list), course (required — either a curated course from the list filtered by subject, or an "Other" custom entry typed by the user), batchNumber (required, from the dynamic batch dropdown), program (required, Regular | Diploma, default Regular), evening (optional boolean flag), examType (required, one of previous_year | midterm | final | lab | viva), file (required), and zero or more free-form tags.
- **FR-001a**: The upload form MUST present subject/course as curated selections backed by the `subjects` and `courses` reference tables; when the user selects "Other" for a course, the form MUST capture free-text `customSubject`/`customCourse` values instead. A question MUST be stored against exactly one of (courseId) or (customSubject/customCourse), never both.
- **FR-001b**: The batchNumber field MUST behave exactly like the profiles batchNumber — an integer chosen from a dynamic dropdown generated up to the current batch value (from the portal's `currentBatch` setting), not a free-text field and not a hardcoded list.
- **FR-001c**: The upload form MUST capture a per-question program flag (`regular` | `diploma`, defaulting to `regular`) and an optional `evening` boolean flag, stored on the question record and shown as badges in search results, so diploma and evening-batch papers are distinguishable at a glance. These flags replace the earlier "Diploma-Exempted" subject concept — it is not a subject.
- **FR-002**: The upload MUST accept only a single file in PDF or common image format (PNG/JPEG) with a 10 MB maximum; any other file is rejected with a clear message at the upload step.
- **FR-003**: A submitted question MUST persist with `status = pending` and MUST NOT be returned in search results for anyone other than the submitter, or until a moderator/admin approves it.
- **FR-004**: Upload submissions MUST share the portal's default content-submission rate limit — 5 per hour per user — reusing the same shared limit the portal applies to every submission action, **not** the 1-per-hour profile exception. Exceeding the limit returns a message with the retry delay; moderators and admins are exempt.
- **FR-005**: The question bank MUST support filtering by subject, course, batchNumber, examType, program (Regular | Diploma), evening, and tag, plus a free-text search. When more than one filter is active, results MUST match every selected filter at once, and all results MUST be limited to `approved` questions. Course filter options MUST be grouped under their subject from the curated catalog, with any `customCourse` questions surfaced as a secondary "Other" group.
- **FR-005a**: The `subjects` and `courses` reference tables MUST be seeded with the 7 subjects and their courses from the provided seed data on first deployment, so filters and the upload form have content without manual admin entry. Seeding MUST dedupe by course code (one row per unique code, keeping the row under the course's real subject) so the `courses.code` unique rule holds, and MUST NOT seed the `diploma-exempted` subject (program is a per-question flag).
- **FR-006**: Question search MUST work consistently with directory search (same shared search capability, kept shared in the codebase specifically for this) rather than introducing a divergent search path.
- **FR-007**: A guest MUST be able to search approved question metadata and open an approved question on a metadata-only detail page (title, subject, course, batchNumber, examType, tags) that shows a "Log in to download" prompt, but MUST NOT be shown any download control, and MUST NOT be able to retrieve the file content by any URL — enforced at the access layer, so the enforcement is not just a hidden button.
- **FR-008**: A logged-in user MUST be able to download the file of any approved question.
- **FR-009**: Moderators and admins MUST be able to approve/reject pending questions from the existing unified approval dashboard (already covered by existing role matrix — `question` is moderator-eligible; no new permission rules in this scope and module).
- **FR-010**: Approving a question MUST set `status: 'approved'`, record `approvedBy` (the reviewer's ID) and `approvedAt`, and make it publicly searchable after this within the portal's 5-second visibility window.
- **FR-011**: Rejecting a question MUST set `status: 'rejected'`, keep it invisible to everyone except the submitter, and allow an optional rejection reason; the submitter MUST be notified in-app of the decision, with the reason when provided.
- **FR-012**: Concurrent decisions MUST be safe: only the first approval/rejection wins, regardless of whether an "already processed" notice is shown for the second.
- **FR-013**: Each user MUST be able to see, on their own submissions page, every question they've uploaded with its current status and any rejection reason.

### Key Entities

- **Subject**: A curated top-level category for the question bank — id, unique slug, name. Seeded from the 7 categories in the seed data (Language & Cultures, General Education, Basic Science and Engineering, Mathematics, CSE Core, CSE Elective, Project — Diploma-Exempted is NOT a subject; it is a per-question program flag).
- **Course**: A curated course within a subject — id, unique code, title, creditHours, subjectId (FK → subjects.id). Seeded from the seed data's course list. The primary way questions are classified.
- **Question**: A past exam upload — title, courseId (FK → courses.id, nullable) or customSubject/customCourse (free-text "other" fallback), batchNumber (integer), program (regular | diploma, default regular), evening (boolean, default false), examType (previous_year/midterm/final/lab/viva), file (PDF/image via the file storage), `uploadedBy` (the submitting user), plus the universal `status`/`approvedBy`/`approvedAt` columns.
- **QuestionTag**: A join record — a free-form tag attached to a question (questionId, tag). Many tags per question; tags are not a fixed vocabulary.
- **User** (existing): the account acting as uploader (student/moderator/admin) or reviewer (moderator/admin), with the role already carried in the session.

## Success Criteria *(mandatory)*

- **SC-001**: A student can complete and submit a question upload (with file + one tag) in under 5 minutes. (Post-launch manual metric.)
- **SC-002**: Search results over up to 10,000 questions return within 2 seconds (reusing the directory-wide scale target from spec 002 SC-008).
- **SC-003**: An approved question is publicly searchable within 5 seconds of the approval action (same window as the rest of the portal).
- **SC-004**: The portal never returns a working file URL in any guest response, and the download endpoint denies guests — enforced at the access layer, not by UI hiding, and verified by a guest-payload check (no `fileUrl` key) plus a request to the download route that receives a denial every time. Residual scope note: files live on a public-ACL UploadThing bucket, so a raw CDN key a guest somehow obtains outside the portal is technically fetchable; full SC-004 is satisfied for every URL the portal itself produces.
- **SC-004a**: Every approved question maps to exactly one classification path — a curated course OR a custom "other" entry — never both and never neither, verified by a schema/seed check.
- **SC-004b**: Every question carries a valid program value (`regular` or `diploma`, default `regular`) and a boolean evening flag, verified by a schema check; no question is left with an empty/unset program or ambiguous diploma status.
- **SC-005**: 100% of question rows use the same `status`/`approvedBy`/`approvedAt` columns as every other submittable resource (schema check).
- **SC-006**: A moderator or admin can locate, review, and decide a pending question from the unified dashboard in under 30 seconds. (Post-launch manual metric.)
- **SC-007**: A rate-limited upload returns a message that tells the user how long to wait (retry-after value in seconds) — same contract as all other submissions.

## Assumptions

- **A-1**: File storage reuses the existing file-storage setup (the same one the portal uses for profile/other files — PDFs/images, 10 MB max). Deferred scale concerns (bulk uploads) are out of scope for the MVP.
- **A-2**: Free-form tags: no tag suggestion/autocomplete in v1 — users type tags freely; deduplicate normalization of tags is left acceptable (tag is a simple text per the data dictionary).
- **A-3**: ~~`batch` is an open text field~~ **Superseded by the curated-catalog amendment (2026-08-08):** `batchNumber` is an integer field reusing the profiles pattern exactly — dynamic dropdown from the `currentBatch` site setting, not free text.
- **A-4**: "Download" requires login; there is no guest download — and this is enforced at the access layer as in FR-007, not left to the UI.
- **A-5**: The shared search helper and rate-limit wrapper, approved workflow dashboard (incl. role-eligibility), notifications system, and My Submissions page are existing Foundation artifacts and are reused — no reimplementation of the approval flow.
- **A-6**: Re-submission after rejection / edits to an approved paper: a user can edit and re-submit after rejection and a rejected state — re-entering `pending`. This reuses the same "edit reverts to pending and requires re-approval" rule as the rest of the portal.
- **A-7**: Deleting/soft-deleting questions is out of scope for this feature (no delete control in the current data dictionary); the archived/audit workflow (if built) is a later decision.
- **A-8**: Notifications (approval/rejection) are single, in-app messages — the portal's existing notification bell — and follow the same pattern as profile approval.
- **A-9**: The seed file `uu-cse-courses-seed.json` is the authoritative source for the subject/course catalog. Course codes that appear under more than one subject are deduplicated by code at seed time (**keep one code, remove the duplicate** — the surviving row is under the course's real subject). The `_CHECK`-flagged rows are validated during seeding; the seeded catalog's exact row count is whatever passes that dedupe/validation.
- **A-10**: `customSubject`/`customCourse` are free text with no auto-complete or normalization in v1; deduping against the curated catalog or other custom entries is a later enhancement.
- **A-11**: `docs/data-dictionary.md` is updated to match this structure (subjects/courses tables + questions.courseId/customSubject/customCourse + batchNumber + program/evening flags) before any implementation begins.
- **A-12**: The `diploma-exempted` subject from the seed JSON is NOT imported into the `subjects` table (7 subjects seeded). Diploma and evening are per-question flags on the `questions` record (`program`: regular|diploma, default regular; `evening`: boolean, default false), not catalog categories. Clarified 2026-08-08.