# Tasks: Club Section

**Input**: Design documents from `/specs/006-club-section/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Playwright e2e tests are available but not explicitly requested per story — test tasks are included where validation is critical per quickstart.md.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Single project**: `src/`, `tests/` at repository root
- Paths shown below reflect the single-project Next.js App Router structure per plan.md

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure for the Club Section module

- [X] T001 Create club schema files: `src/lib/db/schema/departments.ts`, `src/lib/db/schema/clubs.ts`, `src/lib/db/schema/club-members.ts`, `src/lib/db/schema/club-gallery-albums.ts`, `src/lib/db/schema/club-gallery-images.ts`, `src/lib/db/schema/club-achievements.ts`, `src/lib/db/schema/events.ts` per data-model.md field definitions
- [X] T002 [P] Update `src/lib/db/schema/index.ts` to export all new club schema modules (departments, clubs, clubMembers, clubGalleryAlbums, clubGalleryImages, clubAchievements, events)
- [X] T003 [P] Update `src/lib/db/schema/relations.ts` to add relations for departments, clubs, clubMembers, clubGalleryAlbums, clubGalleryImages, clubAchievements, events (with proper cascade/SET NULL patterns)
- [X] T004 Update `docs/data-dictionary.md` to add `departments` table, expand `clubs` table with all new fields (departmentId, coverImgUrl, msgGroupUrl, pageUrl, fbGroupUrl, contacts, mail, status, approvedBy, approvedAt, timestamps), add `club_gallery_albums`, `club_gallery_images`, `club_achievements`, `events` tables, and update `club_members` with `designation` field

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T005 [P] Update `src/middleware.ts` to enforce admin-only protection on `/manage/clubs/*` routes and public access on `/clubs/*` per middleware contract
- [ ] T006 [P] Create `src/app/clubs/page.tsx` — public `/clubs` listing route shell with DepartmentGroup and ClubCard component placeholders
- [ ] T007 [P] Create `src/app/clubs/[clubId]/page.tsx` — public club detail route shell with all content section placeholders
- [ ] T008 [P] Create `src/app/manage/clubs/page.tsx` — admin dashboard route shell with authentication guard
- [ ] T009 [P] Create API route files: `src/app/api/departments/route.ts`, `src/app/api/clubs/route.ts`, `src/app/api/clubs/[clubId]/route.ts` with admin-only middleware enforcement and `enforceSubmissionLimit` wrapper
- [ ] T010 [P] Configure UploadThing integration for club images (logo, cover, gallery, achievement) reusing existing `src/lib/uploadthing.ts` pattern per uploadthing contract
- [ ] T011 [P] Create `src/lib/db/queries/clubs.ts` with query functions: `getDepartmentsWithClubs()`, `getClubById()`, `getApprovedClubs()`, `getClubDetail()` — all filtering by `status = approved` for public queries
- [ ] T012 [P] Update `src/lib/db/seed.ts` to add seed data for departments and clubs (admin-created with `status = approved`) for development/validation

**Checkpoint**: Foundation ready — schema, middleware, routes, queries, and UploadThing infrastructure in place. User story implementation can now begin.

---

## Phase 3: User Story 1 - Admin Creates Departments and Clubs (Priority: P1) 🎯 MVP

**Goal**: Admin can create departments and clubs through the management dashboard. Admin-created clubs appear immediately with `status = approved` and are visible on `/clubs` without any approval workflow.

**Independent Test**: Admin creates a department "CSE" with slug "cse", then creates a club "ACM" under it. Both appear immediately on `/clubs` without any approval step.

### Tests for User Story 1 (Playwright e2e)

- [ ] T013 [P] [US1] Playwright e2e test: admin creates department and verifies it persists in `tests/e2e/manage-departments.spec.ts`
- [ ] T014 [P] [US1] Playwright e2e test: admin creates club under department and verifies it appears on `/clubs` without approval in `tests/e2e/manage-clubs.spec.ts`

### Implementation for User Story 1

- [ ] T015 [P] [US1] Create `DepartmentGroup` component in `src/components/clubs/DepartmentGroup.tsx` — renders department heading with its clubs beneath
- [ ] T016 [P] [US1] Create `ClubCard` component in `src/components/clubs/ClubCard.tsx` — displays club name, logo, description preview with glassmorphism styling
- [ ] T017 [US1] Implement department CRUD in `src/app/manage/clubs/departments/page.tsx` — form with name, slug, description, imageUrl; Server Action calls `enforceSubmissionLimit` and persists to Neon
- [ ] T018 [US1] Implement club CRUD in `src/app/manage/clubs/[clubId]/page.tsx` — form with name, description, departmentId, logoUrl, coverImgUrl; admin-created clubs set `status = approved` immediately
- [ ] T019 [US1] Implement `ClubManagementForm` component in `src/components/clubs/ClubManagementForm.tsx` — shared form with concurrent edit detection via `updatedAt` timestamp check (409 warning)
- [ ] T020 [US1] Implement delete department/club with cascade confirmation in `src/app/manage/clubs/departments/page.tsx` and `src/app/manage/clubs/[clubId]/page.tsx`
- [ ] T021 [US1] Implement rate limit error display: "Rate limit reached — try again in X minutes" using `enforceSubmissionLimit` return value in `ClubManagementForm.tsx`
- [ ] T022 [US1] Add URL auto-detection rendering for club descriptions (FR-013) in `src/components/clubs/ClubCard.tsx` and detail page

**Checkpoint**: User Story 1 fully functional — admin can create, edit, delete departments and clubs; all appear immediately on `/clubs`.

---

## Phase 4: User Story 2 - Guest Browses Club Listing Grouped by Department (Priority: P1)

**Goal**: Guests (not logged in) can browse clubs organized by department on `/clubs`. Only `status = approved` clubs and departments are shown.

**Independent Test**: Visiting `/clubs` shows all departments with their associated approved clubs listed under each department heading. No login required. Rejected/pending clubs are hidden.

### Implementation for User Story 2

- [ ] T023 [P] [US2] Implement `/clubs` page data fetching in `src/app/clubs/page.tsx` — query `getDepartmentsWithClubs()` filtering `status = approved`, grouped by department
- [ ] T024 [US2] Implement empty state rendering: departments with no clubs show "No clubs yet" message per edge case spec
- [ ] T025 [US2] Implement `DepartmentGroup` component in `src/components/clubs/DepartmentGroup.tsx` — renders department name heading with clubs list beneath, glassmorphism styling per design-direction.md
- [ ] T026 [US2] Implement dark mode support for `/clubs` page — verify all glass panels, tags, and cards render correctly in both light and dark modes per `docs/design-direction.md`
- [ ] T027 [US2] Add Playwright e2e test: guest browsing `/clubs` shows departments with clubs and hides rejected/pending clubs in `tests/e2e/guest-clubs-listing.spec.ts`

**Checkpoint**: User Story 2 fully functional — guests can browse all approved clubs grouped by department without login.

---

## Phase 5: User Story 3 - Guest Views Club Detail Page with All Content (Priority: P1)

**Goal**: Guests can view a club's detail page showing description, links, members, gallery, achievements, and events with timers.

**Independent Test**: Visiting `/clubs/[clubId]` renders the club name, description, logo, cover image, all link fields as clickable anchors, member list with avatars, gallery albums with images, achievements, and events with timers. No login required.

### Tests for User Story 3

- [ ] T028 [P] [US3] Playwright e2e test: guest visits `/clubs/[clubId]` and verifies all content sections render in `tests/e2e/guest-club-detail.spec.ts`

### Implementation for User Story 3

- [ ] T029 [P] [US3] Create `ClubDetailPage` component in `src/components/clubs/ClubDetailPage.tsx` — orchestrates all content sections (description, links, members, gallery, achievements, events)
- [ ] T030 [US3] Implement club description and link rendering in `src/components/clubs/ClubDetailPage.tsx` — render msgGroupUrl, pageUrl, fbGroupUrl as clickable anchors with `rel="noopener noreferrer"`, auto-detect URLs in description text
- [ ] T031 [US3] Implement member list rendering in `src/components/clubs/ClubMembers.tsx` — display avatar (from `profiles.avatarUrl`), fullName, designation, roleInClub, position for each club member
- [ ] T032 [US3] Implement gallery rendering in `src/components/clubs/ClubGallery.tsx` — display albums with images and captions, organized by album
- [ ] T033 [US3] Implement achievements rendering in `src/components/clubs/ClubAchievements.tsx` — display title, description, optional image/link
- [ ] T034 [US3] Implement events section rendering in `src/components/clubs/ClubDetailPage.tsx` — display event cards with countdown timers, showing "From [Club Name]" tag for club events
- [ ] T035 [US3] Add Playwright e2e test: event countdown timer displays correctly on club detail page in `tests/e2e/club-detail-timer.spec.ts`

**Checkpoint**: User Story 3 fully functional — guests see complete club detail pages with all content sections.

---

## Phase 6: User Story 4 - Admin Manages Club Members by Searching Approved Profiles (Priority: P2)

**Goal**: Admin can search approved profiles and add them to a club with a free-text designation and roleInClub.

**Independent Test**: Admin searches for a profile by name, selects an approved profile, assigns roleInClub and designation, and the member appears on the club detail page.

### Implementation for User Story 4

- [ ] T036 [P] [US4] Implement profile search API in `src/app/api/club-members/route.ts` — GET handler searching approved profiles by name using Drizzle `ilike` on `profiles.fullName`
- [ ] T037 [US4] Implement member search UI in `src/app/manage/clubs/[clubId]/page.tsx` — search input with debounced results dropdown showing approved profiles
- [ ] T038 [US4] Implement add member form in `src/components/clubs/ClubManagementForm.tsx` — dropdown for roleInClub (`member` | `executive` | `advisor`), free-text designation field, profile selector
- [ ] T039 [US4] Implement member addition Server Action — validates `profileId` references approved profile, inserts into `club_members` with `joinedAt = now()`, enforces `enforceSubmissionLimit`
- [ ] T040 [US4] Update `ClubMembers` component in `src/components/clubs/ClubMembers.tsx` — re-renders with new member data including avatar, name, designation, roleInClub, position

**Checkpoint**: User Story 4 fully functional — admin can search and add members to clubs.

---

## Phase 7: User Story 5 - Admin Manages Gallery, Achievements, and Events (Priority: P2)

**Goal**: Admin can create and manage gallery albums/images, achievements, and events for a club.

**Independent Test**: Admin creates a gallery album, adds images, adds an achievement, and creates a club event with start/end times — all appear on the club detail page.

### Tests for User Story 5

- [ ] T041 [P] [US5] Playwright e2e test: admin creates gallery album and uploads images in `tests/e2e/manage-gallery.spec.ts`

### Implementation for User Story 5

- [ ] T042 [P] [US5] Implement gallery album CRUD in `src/app/manage/clubs/[clubId]/gallery/page.tsx` — form with title, description; `POST /api/clubs/[clubId]/gallery` creates album
- [ ] T043 [US5] Implement gallery image upload in `src/app/api/gallery-images/route.ts` — multipart/form-data handling with UploadThing blocking upload, persists imageUrl, caption, displayOrder to `club_gallery_images`
- [ ] T044 [US5] Implement achievement CRUD in `src/app/manage/clubs/[clubId]/achievements/page.tsx` — form with title, description, optional date, imageUrl (UploadThing), linkUrl; `POST /api/club-achievements`
- [ ] T045 [US5] Implement event CRUD in `src/app/manage/clubs/events/page.tsx` and `src/app/api/events/route.ts` — form with name, place, description, date, deadline, startTime, endTime, clubId; event status computed dynamically
- [ ] T046 [US5] Implement event visibility logic — club events (`clubId` set) appear on club detail page AND main events page with "From [Club Name]" tag; standalone events (`clubId = null`) appear only on main events page
- [ ] T047 [US5] Add Playwright e2e test: admin creates achievement and event, verifies they appear on club detail page in `tests/e2e/manage-achievements-events.spec.ts`

**Checkpoint**: User Story 5 fully functional — admin can manage gallery, achievements, and events for any club.

---

## Phase 8: User Story 6 - Live Countdown Timer for Ongoing/Upcoming Events (Priority: P2)

**Goal**: Visitors see a live countdown timer for ongoing and upcoming events. Timer updates every second, resumes correctly after tab switch, respects `prefers-reduced-motion`.

**Independent Test**: Visiting a club or events page with an event that has startTime/endTime set shows a live-updating countdown timer.

### Tests for User Story 6

- [ ] T048 [P] [US6] Playwright e2e test: countdown timer updates every second and resumes after tab switch in `tests/e2e/countdown-timer.spec.ts`
- [ ] T049 [P] [US6] Playwright e2e test: timer shows "completed" when endTime has passed in `tests/e2e/countdown-timer.spec.ts`

### Implementation for User Story 6

- [ ] T050 [P] [US6] Create `EventTimer` component in `src/components/clubs/EventTimer.tsx` — props `endTime?`, `startTime?`; counts down to end or start; shows "completed" if both passed; updates every second via `useEffect`/`setInterval`
- [ ] T051 [US6] Implement tab-switch resync in `src/components/clubs/EventTimer.tsx` — use `Date.now()` on each tick rather than relying on `setInterval` drift; or use `visibilitychange` event to recalculate
- [ ] T052 [US6] Implement `prefers-reduced-motion` support in `src/components/clubs/EventTimer.tsx` — check `window.matchMedia('(prefers-reduced-motion: reduce)')`; disable or reduce timer animations
- [ ] T053 [US6] Add Playwright e2e test: timer respects reduced motion preference in `tests/e2e/countdown-timer.spec.ts`

**Checkpoint**: User Story 6 fully functional — all event timers are live, accurate, accessible.

---

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] T054 [P] Update `src/lib/db/schema/index.ts` and `src/lib/db/schema/relations.ts` with any final schema adjustments based on integration testing
- [ ] T055 [P] Add Playwright e2e test suite for end-to-end validation per `quickstart.md` scenarios in `tests/e2e/club-section-full.spec.ts`
- [ ] T056 Verify dark mode across all club pages and components — `/clubs`, `/clubs/[clubId]`, `/manage/clubs` — per `docs/design-direction.md`
- [ ] T057 Verify keyboard navigation and visible focus states on all interactive elements per SC-010
- [ ] T058 Verify `prefers-reduced-motion` support across all club components per SC-009
- [ ] T059 Run `npm run db:generate && npm run db:migrate` to validate all schema changes and generate migration
- [ ] T060 Run Playwright e2e test suite: `npx playwright test` to validate all stories end-to-end
- [ ] T061 Update `src/lib/db/seed.ts` with comprehensive seed data covering departments, clubs, members, gallery, achievements, and events for development
- [ ] T062 Validate URL auto-detection accuracy (http, https, www) per SC-006 across all text rendering components

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion — BLOCKS all user stories
- **User Stories (Phase 3–8)**: All depend on Foundational phase completion
  - US1, US2, US3 are P1 and can proceed in parallel after Foundational
  - US4, US5, US6 are P2 and may integrate with P1 stories but should be independently testable
  - US5 depends on US1 (needs clubs to exist) and US3 (needs detail page infrastructure)
  - US6 depends on US5 (needs events to exist)
- **Polish (Phase 9)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) — No dependencies on other stories
- **User Story 2 (P1)**: Can start after Foundational (Phase 2) — Depends on US1 (needs departments/clubs to exist)
- **User Story 3 (P1)**: Can start after Foundational (Phase 2) — Depends on US1 and US2 (needs clubs and listing infrastructure)
- **User Story 4 (P2)**: Can start after Foundational (Phase 2) — Depends on US1 (needs clubs and approved profiles)
- **User Story 5 (P2)**: Can start after US1 and US3 — Needs clubs to exist and detail page infrastructure
- **User Story 6 (P2)**: Can start after US5 — Needs events to exist

### Within Each User Story

- Tests (if included) MUST be written and FAIL before implementation
- Models/schema before services/routes
- Services/routes before UI components
- Core implementation before integration
- Story complete before moving to next priority

### Parallel Opportunities

- All Setup tasks marked [P] can run in parallel (T002, T003 with T004)
- All Foundational tasks marked [P] can run in parallel (T005–T012 within Phase 2)
- US1, US2, US3 can start in parallel after Foundational completes
- T013/T014 (US1 tests) can run in parallel with T015/T016 (US1 components)
- T023/T024/T025/T026 (US2 tasks) can run in parallel within the story
- T029/T030/T031/T032/T033/T034 (US3 components) can run in parallel
- T041/T047/T048/T049/T053 (test tasks) can run in parallel with implementation
- Models within a story marked [P] can run in parallel
- Different user stories can be worked on by different team members

---

## Parallel Example: User Story 1

```bash
# Launch all tests for User Story 1 together:
Task: "Playwright e2e test: admin creates department and verifies it persists"
Task: "Playwright e2e test: admin creates club and verifies it appears on /clubs"

# Launch all schema/model tasks for User Story 1 together:
Task: "Create club schema files (departments, clubs, club-members, etc.)"
Task: "Update schema/index.ts and relations.ts with club exports"

# Launch all component tasks for User Story 1 together:
Task: "Create DepartmentGroup component"
Task: "Create ClubCard component"
Task: "Create ClubManagementForm component"
```

---

## Parallel Example: User Stories 1–3 (P1 Sprint)

After Foundational completes, three developers can work simultaneously:

- Developer A: US1 — Department/Club CRUD (`src/app/manage/clubs/`, `src/components/clubs/ClubManagementForm.tsx`)
- Developer B: US2 — Club listing page (`src/app/clubs/page.tsx`, `src/components/clubs/DepartmentGroup.tsx`)
- Developer C: US3 — Club detail page (`src/app/clubs/[clubId]/page.tsx`, `src/components/clubs/ClubDetailPage.tsx`)

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001–T004)
2. Complete Phase 2: Foundational (T005–T012)
3. Complete Phase 3: User Story 1 (T013–T022)
4. **STOP and VALIDATE**: Test User Story 1 independently — admin can create departments and clubs, both appear on `/clubs`
5. Deploy/demo if ready

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → Deploy/Demo (MVP!)
3. Add User Story 2 → Test independently → Deploy/Demo
4. Add User Story 3 → Test independently → Deploy/Demo
5. Add User Story 4 → Test independently → Deploy/Demo
6. Add User Story 5 → Test independently → Deploy/Demo
7. Add User Story 6 → Test independently → Deploy/Demo
8. Each story adds value without breaking previous stories

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Story 1 (Departments/Clubs CRUD)
   - Developer B: User Story 2 (Club listing page)
   - Developer C: User Story 3 (Club detail page)
3. Once US1–US3 are stable:
   - Developer A: User Story 4 (Club members)
   - Developer B: User Story 5 (Gallery, achievements, events)
   - Developer C: User Story 6 (Countdown timer)
4. Stories complete and integrate independently

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Verify tests fail before implementing
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Avoid: vague tasks, same file conflicts, cross-story dependencies that break independence
- Admin-created clubs are immediately `status = approved` — no approval workflow needed per spec clarification
- All club management mutations use `enforceSubmissionLimit` rate limiting
- UploadThing is blocking — form submission fails entirely if upload fails
- `events` table uses computed `status` (not stored as DB column)
- `profiles.avatarUrl` already exists — no new avatar infrastructure needed
