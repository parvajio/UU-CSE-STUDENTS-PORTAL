# Implementation Plan: Club Section

**Branch**: `006-club-section` | **Date**: 2026-09-15 | **Spec**: [link](/specs/006-club-section/spec.md)

**Input**: Feature specification from `/specs/006-club-section/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command; its definition describes the execution workflow.

## Summary

Implement the Club Section for the CSE Students Portal — a complete module allowing admins to create departments, clubs, manage members, gallery, achievements, and events. Guests can browse clubs grouped by department and view club detail pages with all content. All club management routes are admin-only. Uses the existing Drizzle ORM schema patterns, UploadThing for images, and `enforceSubmissionLimit` for rate limiting.

## Technical Context

**Language/Version**: TypeScript (Next.js 15 App Router)

**Primary Dependencies**: Next.js 15, Drizzle ORM, @neondatabase/serverless, UploadThing, shadcn/ui + Tailwind CSS, lucide-react, zod

**Storage**: PostgreSQL on Neon via Drizzle ORM

**Testing**: Playwright (e2e tests)

**Target Platform**: Linux server (Vercel deployment)

**Project Type**: Web application (Next.js App Router — single deployable app)

**Performance Goals**: /clubs page loads in under 1 second; countdown timers update every second without desyncing

**Constraints**: Rate limiting via `enforceSubmissionLimit` (5/hour default); UploadThing image uploads are blocking steps; dark mode must be supported from day one; in-memory rate-limit store accepted for MVP (~200 concurrent users)

**Scale/Scope**: Department → Club → Members/Gallery/Achievements/Events hierarchy; guest-browsable public pages; admin-only management dashboard at `/manage/clubs`

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Phase 0 Pre-Design Check

- **Stack & Architecture** ✅ — Next.js 15 App Router + TypeScript, Drizzle ORM, PostgreSQL/Neon, UploadThing. No separate backend.
- **Role-Based Access Control** ✅ — Admin-only management routes (`/manage/clubs`), guest-browsable `/clubs`. Matches Principle II.
- **Universal Approval Pattern** ✅ — Admin-created clubs are immediately `status = approved`. No approval workflow needed for admin-created content. Guest-visible clubs filtered by `status = approved` at query level.
- **Skill Hierarchy as Self-Referencing Table** ✅ — No changes needed; existing `skills` table with `parentSkillId` pattern is respected.
- **Visual Identity & Design System** ✅ — Cool blue/violet palette, Space Grotesk headings, Inter body, glassmorphism on nav/hero/cards only, soft tags for status badges, dark mode from day one.
- **No hardcoded skill enums** ✅ — Not applicable to this feature.
- **Data dictionary as schema source** ✅ — Data dictionary will be updated with club-specific fields per spec clarification.
- **Build Order** ✅ — Clubs section is Phase 3 (Community) per build order. Data dictionary and existing patterns (UploadThing, rate limiting) are already in Foundation.

**All gates pass. No violations requiring justification.**

## Project Structure

### Documentation (this feature)

```text
specs/006-club-section/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
src/
├── lib/
│   ├── db/
│   │   ├── schema/
│   │   │   ├── departments.ts       # NEW
│   │   │   ├── clubs.ts             # NEW (updated from existing minimal)
│   │   │   ├── club-members.ts      # NEW (updated from existing minimal)
│   │   │   ├── club-gallery-albums.ts # NEW
│   │   │   ├── club-gallery-images.ts # NEW
│   │   │   ├── club-achievements.ts # NEW
│   │   │   ├── events.ts            # NEW
│   │   │   ├── index.ts             # Updated exports
│   │   │   └── relations.ts         # Updated with club relations
│   │   ├── rate-limit.ts            # Existing — reused
│   │   └── seed.ts                  # Potentially updated
│   ├── uploads/                     # UploadThing configuration — existing
│   └── middleware.ts                # Existing — updated with club routes
├── app/
│   ├── clubs/                       # Public club pages
│   │   ├── page.tsx                 # /clubs — grouped listing
│   │   └── [clubId]/
│   │       └── page.tsx             # /clubs/[clubId] — detail page
│   ├── manage/
│   │   └── clubs/                   # Admin-only management
│   │       ├── page.tsx             # /manage/clubs — dashboard
│   │       ├── departments/         # Department CRUD
│   │       ├── [clubId]/            # Club CRUD, members, gallery, achievements, events
│   │       └── events/              # Events management
│   └── api/                         # Route handlers
│       └── ...                      # Club-related API routes
├── components/
│   ├── clubs/                       # Club-specific components
│   │   ├── ClubCard.tsx
│   │   ├── ClubDetailPage.tsx
│   │   ├── ClubMembers.tsx
│   │   ├── ClubGallery.tsx
│   │   ├── ClubAchievements.tsx
│   │   ├── EventTimer.tsx           # Countdown timer component
│   │   ├── DepartmentGroup.tsx
│   │   └── ClubManagementForm.tsx
│   └── ui/                          # Existing shadcn/ui components
```

**Structure Decision**: Single-project Next.js App Router structure, consistent with existing project layout. All new schema files follow the existing `src/lib/db/schema/` pattern. Route handlers and Server Actions handle mutations. Public pages in `app/clubs/`, admin pages in `app/manage/clubs/`.

## Complexity Tracking

> No Constitution Check violations — no complexity tracking needed.
