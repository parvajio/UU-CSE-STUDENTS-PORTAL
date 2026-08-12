---
description: "Task list for Profile Detail Page + Personal Portfolio implementation"
---

# Tasks: Profile Detail Page + Personal Portfolio

**Input**: Design documents from `/specs/005-profile-detail-portfolio/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Test tasks are included for schema/query verification and guest payload assertions.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3, US4)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [x] T001 Verify feature branch `005-profile-detail-portfolio` and check workspace setup
- [x] T002 [P] Review existing directory and profile codebase in `src/app/(guest)/directory/` and `src/app/(user)/profile/`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T003 Create four new table schemas in `src/lib/db/schema/profile-achievements.ts`, `src/lib/db/schema/profile-projects.ts`, `src/lib/db/schema/profile-certificates.ts`, and `src/lib/db/schema/profile-experiences.ts`
- [x] T004 Update `src/lib/db/schema/index.ts` to re-export the four new portfolio tables
- [x] T005 Update `src/lib/db/schema/relations.ts` to add relations between profiles and the four portfolio tables
- [x] T006 Generate and apply database migration 0006 for the four portfolio tables
- [x] T007 [P] Create shared portfolio types in `src/types/portfolio.ts`
- [x] T008 [P] Create Zod validation schemas for portfolio entities in `src/lib/portfolio/validation.ts`
- [x] T009 [P] Update UploadThing router in `src/lib/uploadthing.ts` to add portfolioImage route

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Directory Card, Guest vs. Authenticated (Priority: P1) 🎯 MVP

**Goal**: Implement directory cards with distinct guest (restricted, non-clickable) and authenticated (rich, navigable, social row) treatments.

**Independent Test**: Browse the directory as a guest and logged-in user; verify card treatments, clickability difference, and guest payload security.

### Implementation for User Story 1

- [x] T010 [P] [US1] Update query layer in `src/lib/db/queries/directory.ts` to support authed card field selection (bio, socials) while keeping guest selection strictly restricted to id, fullName, batchNumber, and skills
- [x] T011 [P] [US1] Create social link helper component in `src/components/directory/ProfileSocials.tsx`
- [x] T012 [US1] Redesign ProfileCard in `src/components/directory/ProfileCard.tsx` with authed view (gradient cover, overlapping avatar, handle meta, social icon row, soft tags) and separate guest non-clickable placeholder card
- [x] T013 [US1] Update directory page in `src/app/(guest)/directory/page.tsx` to pass viewerRole and auth state to ProfileCard

**Checkpoint**: User Story 1 fully functional and testable independently

---

## Phase 4: User Story 2 - Profile Detail Page (`/directory/[profileId]`) (Priority: P1)

**Goal**: Implement approved-only profile detail page with hero region, two-column body, single spark accent, and secure access checks.

**Independent Test**: Open detail page as logged-in user; verify redirect for guest with callback URL; verify 404 for non-approved profiles.

### Implementation for User Story 2

- [x] T014 [P] [US2] Update directory query layer in `src/lib/db/queries/directory.ts` to implement `getProfileDetail(profileId, viewerRole)` with guest/auth column-splitting and portfolio arrays fetch
- [x] T015 [P] [US2] Create profile detail view component in `src/app/(guest)/directory/[profileId]/profile-detail-view.tsx` with hero region (gradient banner + glass identity card), two-column body, and exactly one spark accent on Achievements
- [x] T016 [P] [US2] Create portfolio sections component in `src/components/directory/ProfilePortfolioSections.tsx` for experiences, projects, achievements, certificates, and skills
- [x] T017 [US2] Create loading skeleton component in `src/app/(guest)/directory/[profileId]/loading.tsx`
- [x] T018 [US2] Create profile detail page route in `src/app/(guest)/directory/[profileId]/page.tsx` with auth() session check, safeCallbackUrl redirect for guests, and 404 for non-approved profiles
- [x] T019 [US2] Update middleware in `src/middleware.ts` to protect `/directory/` routes as defense-in-depth

**Checkpoint**: User Stories 1 AND 2 working independently

---

## Phase 5: User Story 3 - Portfolio System (Achievements, Projects, Certificates, Experience) (Priority: P2)

**Goal**: Implement unmoderated four-table portfolio data layer, image/link support, rate limiting, and cascade deletions.

**Independent Test**: Add portfolio entry as owner; verify immediate visibility on detail page, absence of moderation, and rate limiting.

### Implementation for User Story 3

- [x] T020 [P] [US3] Create portfolio server actions file in `src/app/(user)/profile/portfolio-actions.ts` with `getMyPortfolio` query function
- [x] T021 [US3] Implement server-side add/update/delete actions for achievements in `src/app/(user)/profile/portfolio-actions.ts` with owner guard and rate-limiting (`portfolio:achievement:<userId>`)
- [x] T022 [US3] Implement server-side add/update/delete actions for projects in `src/app/(user)/profile/portfolio-actions.ts` with owner guard and rate-limiting (`portfolio:project:<userId>`)
- [x] T023 [US3] Implement server-side add/update/delete actions for certificates in `src/app/(user)/profile/portfolio-actions.ts` with owner guard and rate-limiting (`portfolio:certificate:<userId>`)
- [x] T024 [US3] Implement server-side add/update/delete actions for experiences in `src/app/(user)/profile/portfolio-actions.ts` with owner guard and rate-limiting (`portfolio:experience:<userId>`)
- [x] T025 [US3] Implement image upload handling and cleanup logic (no orphaned files on delete, save entry even if upload fails) in `src/app/(user)/profile/portfolio-actions.ts`

**Checkpoint**: Portfolio system fully operational and secured

---

## Phase 6: User Story 4 - My Profile Portfolio Management (`/profile`) (Priority: P2)

**Goal**: Implement owner CRUD dialogs, actionable empty states, amber draft notice, and inline two-column draft preview while pending.

**Independent Test**: Log in as profile owner, add/edit/delete all 4 entity types via `/profile`, verify draft preview and amber notice while pending.

### Implementation for User Story 4

- [ ] T026 [P] [US4] Create client-side PortfolioManager component in `src/app/(user)/profile/PortfolioManager.tsx` with 4 section cards, add/edit dialogs, confirm-delete modals, and actionable empty states
- [ ] T027 [US4] Update profile page in `src/app/(user)/profile/page.tsx` to fetch portfolio data alongside profile, skills, and batch data
- [ ] T028 [US4] Update ProfileView in `src/app/(user)/profile/ProfileView.tsx` to render amber pending notice, inline two-column draft preview of detail layout while pending, and PortfolioManager component

**Checkpoint**: All user stories implemented and independently testable

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] T029 [P] Update guest-SQL verification script in `scripts/verify-guest-sql.ts` to assert no portfolio or contact columns appear in guest query responses
- [ ] T030 [P] Run project linting (`npm run lint`), type-checking (`npx tsc --noEmit`), and build (`npm run build`)
- [ ] T031 Run quickstart.md validation and manual verification across all user stories

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3+)**: All depend on Foundational phase completion
  - US1 & US2 (P1) come first
  - US3 & US4 (P2) follow US1 & US2
- **Polish (Final Phase)**: Depends on all user stories being complete

### Parallel Opportunities

- Setup tasks marked [P] can run in parallel
- Foundational tasks marked [P] can run in parallel
- US1 and US2 components can be developed in parallel after Phase 2
- US3 server actions and US4 UI components can be developed in parallel once foundational schema is in place

---

## Implementation Strategy

### MVP First (User Stories 1 & 2)
1. Complete Setup + Foundational
2. Complete US1 (Directory Card) & US2 (Detail Page)
3. Validate guest restrictions and detail views

### Incremental Delivery (Portfolio System & Management)
1. Complete US3 (Portfolio Data & Server Actions)
2. Complete US4 (My Profile Portfolio Management UI & Draft Preview)
3. Run final verification and build checks
