# Implementation Plan: Portal User Scenarios

**Branch**: `002-portal-user-scenarios` | **Date**: 2026-07-27 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/002-portal-user-scenarios/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command; its definition describes the execution workflow.

## Summary

Build the CSE Students Portal as a single Next.js 15 App Router application with PostgreSQL (Neon), Drizzle ORM, Auth.js (NextAuth v5), and shadcn/ui. Deliver 9 modules (Student Expert Directory, Faculty Directory, Alumni Career Network, Digital Question Bank, Clubs & Executive Body, Event Gallery, Learning Academy, Student Helpline, Supporting Features) across 5 phased releases. Every submittable resource shares the universal approval pattern (`status/approvedBy/approvedAt`). Role-based access (guest/user/moderator/admin) is enforced at the data-query level, never by frontend hiding. Design tokens and component recipes follow `docs/design-direction.md`. All table schemas match `docs/data-dictionary.md`.

## Technical Context

**Language/Version**: TypeScript 5.x (strict mode), Node.js 20 LTS

**Primary Dependencies**:
- next@15, react@19, react-dom@19 (framework)
- tailwindcss@4, @tailwindcss/postcss (styling)
- next-auth@5 (auth)
- drizzle-orm@^0.45 + @neondatabase/serverless (database)
- drizzle-kit (migrations)
- @radix-ui/*, lucide-react, class-variance-authority, clsx, tailwind-merge (shadcn/ui prerequisites)
- uploadthing/react or @s3-lib/client (file uploads)

**Storage**: PostgreSQL via Neon (serverless). Drizzle ORM for schema and queries.

**Testing**: Vitest (unit), Playwright (E2E), @testing-library/react (component)

**Target Platform**: Web — Vercel deployment, serverless Edge/Node.js runtime

**Project Type**: Single Next.js 15 App Router web application (no separate backend)

**Performance Goals**: Search results under 2s for up to 5,000 profiles and 10,000 questions. Approval action reflects publicly within 5s. Page loads under 3s (LCP).

**Constraints**: PostgreSQL-only (no MongoDB — constitution principle). No hardcoded skill enums. Approval pattern identical across all submittable tables (documented exception: `career_guidance_requests` — peer-to-peer, see below). Glassmorphism restricted to navbar, hero, modals, featured cards only — never on tables or forms.

**Scale/Scope**: Single CSE department (~1,000 students, ~50 faculty, ~20 clubs). Concurrent users: ~200 peak.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Stack & Architecture | ✅ PASS | Single Next.js app, shadcn/ui + Tailwind, Drizzle ORM, Auth.js, Postgres full-text search |
| II. Role-Based Access Control | ✅ PASS | 4 tiers (guest/user/moderator/admin) enforced at data-query layer |
| III. Universal Approval Pattern | ✅ PASS | All submittable resources share `status/approvedBy/approvedAt`; single reusable approval dashboard |
| IV. Skill Hierarchy | ✅ PASS | Self-referencing `skills` table with `parentSkillId` — no hardcoded enums |
| V. Visual Identity & Design System | ✅ PASS | Tokens and component recipes from `docs/design-direction.md` |
| Technology Constraints | ✅ PASS | No MongoDB, no separate backend, batch numbers dynamic, data dictionary as schema source |
| Build Order | ✅ PASS | Phased delivery: Phase 1 (Foundation) → Phase 2 (Core) → Phase 3 (Community) → Phase 4 (Engagement) → Phase 5 (Extras) |

**Documented exception**: `career_guidance_requests` (spec §3.3-C) intentionally does not follow the universal approval pattern (Constitution Principle III). It is peer-to-peer, not moderated publish-content — the alumnus accepts/declines a guidance request, and there is no admin/moderator approval or content-visibility gate, so the `status/approvedBy/approvedAt` columns do not apply. Modeled for Phase 3 (Alumni Network), not implemented in Foundation. All other user-submitted resources follow the universal pattern.

**Gate**: ✅ PASS — no violations. Proceed to Phase 0.

## Project Structure

### Documentation (this feature)

```text
specs/002-portal-user-scenarios/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output — interface contracts
└── tasks.md             # Phase 2 output (/speckit.tasks command)
```

### Source Code (repository root)

```text
src/
├── app/                            # Next.js App Router pages
│   ├── (guest)/                    # Routes accessible without login
│   │   ├── directory/              #   Student Expert Directory
│   │   ├── faculty/                #   Faculty Directory
│   │   ├── question-bank/          #   Digital Question Bank (metadata only)
│   │   ├── clubs/                  #   Clubs & Executive Body
│   │   ├── alumni/                 #   Alumni Career Network
│   │   ├── events/                 #   Event Gallery
│   │   ├── notices/                #   Notice Board
│   │   ├── achievements/           #   Achievement Hall of Fame
│   │   └── projects/               #   Project Showcase
│   ├── (auth)/                     # Auth-required routes
│   │   ├── login/
│   │   ├── register/
│   │   └── callback/               # OAuth callbacks
│   ├── (user)/                     # Authenticated user routes
│   │   ├── profile/
│   │   ├── upload-question/
│   │   └── my-submissions/
│   ├── (moderator)/                # Moderator routes (no separate approve page — shared /approve route)
│   ├── (admin)/                    # Admin-only routes
│   │   ├── approve/                #   Unified approval dashboard — single /approve route serving moderators + admins, role-filtered via visibleResourceTypes; a separate (moderator)/approve would collide at the same URL (see T040/T042 merge)
│   │   ├── manage/
│   │   │   ├── roles/
│   │   │   ├── faculty/
│   │   │   ├── clubs/
│   │   │   ├── alumni/
│   │   │   ├── events/
│   │   │   ├── skills/
│   │   │   └── settings/
│   │   └── helpline/
│   ├── api/                        # API route handlers
│   │   ├── auth/                   #   NextAuth catch-all
│   │   ├── profiles/
│   │   ├── questions/
│   │   ├── alumni/
│   │   ├── clubs/
│   │   ├── notices/
│   │   ├── events/
│   │   ├── faculty/
│   │   ├── projects/
│   │   ├── achievements/
│   │   ├── helpline/
│   │   ├── skills/
│   │   ├── career-guidance/
│   │   └── upload/                 # File upload endpoint
│   ├── layout.tsx                  # Root layout
│   ├── page.tsx                    # Landing/hero page
│   └── globals.css                 # Tailwind base + shadcn variables
├── components/                     # Shared UI components
│   ├── ui/                         # shadcn/ui primitives (button, card, dialog, etc.)
│   ├── layout/                     # Navbar, footer, sidebar, glass-panel, mode-toggle
│   ├── directory/                  # ProfileCard, SkillTag, SearchBar
│   ├── approval/                   # ApprovalQueue, ApprovalCard, StatusBadge
│   └── shared/                     # EmptyState, LoadingSkeleton, NotificationBell, Pagination
├── lib/                            # Utilities
│   ├── db/                         # Drizzle client + queries
│   │   ├── index.ts                #   DB connection (Neon HTTP driver)
│   │   ├── schema/                 #   Drizzle schema files
│   │   │   ├── users.ts
│   │   │   ├── profiles.ts
│   │   │   ├── skills.ts
│   │   │   ├── profile-skills.ts
│   │   │   ├── questions.ts
│   │   │   ├── question-tags.ts
│   │   │   ├── faculty.ts
│   │   │   ├── career-guidance.ts
│   │   │   ├── clubs.ts
│   │   │   ├── club-members.ts
│   │   │   ├── notices.ts
│   │   │   ├── events.ts
│   │   │   └── projects.ts
│   │   └── queries/                # Reusable query helpers
│   │       ├── directory.ts
│   │       ├── questions.ts
│   │       └── approval.ts
│   ├── auth/                       # Auth.js config + middleware
│   │   ├── auth.ts                 #   NextAuth config
│   │   ├── middleware.ts           #   Route protection by role
│   │   └── providers.ts           #   Credentials + Google provider
│   ├── upload.ts                   # File upload client (R2 or UploadThing)
│   ├── search.ts                   # Postgres full-text search helpers
│   ├── notifications.ts            # In-app notification helpers
│   ├── rate-limit.ts               # Submission rate limiter
│   └── utils.ts                    # cn(), formatDate, etc.
├── styles/
│   └── tags.css                    # Soft tag / neumorphic pill component CSS
├── middleware.ts                    # Next.js middleware — role-based route protection
└── config/
    └── site.ts                     # Site-wide config (CURRENT_BATCH, etc.)
```

**Structure Decision**: Single Next.js 15 App Router project. No separate backend. All logic lives in Server Actions and Route Handlers within the Next.js app. The route groups `(guest)/`, `(auth)/`, `(user)/`, `(moderator)/`, `(admin)/` enforce role-based layout grouping. Files under `lib/db/schema/` use Drizzle's schema-as-code with `drizzle-kit` for migrations.

## Complexity Tracking

> No Constitution Check violations to justify. No complexity exceptions needed.
