<!--
== Sync Impact Report ==
Version change: (template) → 1.0.0
Bump rationale: Initial constitution — all 5 principles filled from docs/ + user input.
Modified principles: N/A (first fill)
Added sections:
  - I. Stack & Architecture
  - II. Role-Based Access Control
  - III. Universal Approval Pattern (NON-NEGOTIABLE)
  - IV. Skill Hierarchy as Self-Referencing Table
  - V. Visual Identity & Design System
  - Technology Constraints
  - Build Order & Development Workflow
Removed sections: N/A
Templates requiring updates:
  - .specify/templates/plan-template.md ✅ no change needed (Constitution Check gate is generic)
  - .specify/templates/spec-template.md ✅ no change needed (no constitution references)
  - .specify/templates/tasks-template.md ✅ no change needed (no constitution references)
  - .opencode/commands/speckit.*.md ✅ no change needed (references are file-path based, not principle-specific)
Follow-up TODOs: RATIFICATION_DATE set to 2026-07-26 based on speckit manifest installation timestamp. If a different date is required, update the date line below.
-->

# CSE Students Portal Constitution

## Core Principles

### I. Stack & Architecture

The project MUST use the following stack decisions as non-negotiable:

- **Frontend/Backend**: Next.js 15 (App Router) + TypeScript — single deployable app.
  No separate Express or NestJS backend for MVP. Revisit a NestJS split only if
  the single app is outgrown.
- **UI**: shadcn/ui + Tailwind CSS. Icons use lucide-react at 1.5px stroke.
- **Database**: PostgreSQL on Neon. No MongoDB — the domain is deeply relational
  (many-to-many profiles↔skills, clubs↔members, multi-field filtering).
- **ORM**: Drizzle (not Prisma). Works natively with `@neondatabase/serverless`,
  no query-engine binary, faster cold starts on serverless functions.
- **Auth**: Auth.js (NextAuth v5) with Credentials + Google providers. JWT session
  with a `role` claim (`admin | moderator | user | guest`). Route protection via
  Next.js `middleware.ts`.
- **File storage**: Cloudflare R2 (S3-compatible) or UploadThing.
- **Search**: Postgres full-text search (`tsvector`/`tsquery`) to start. Upgrade
  to Meilisearch/Typesense only if search becomes a bottleneck.
- **Deploy**: Vercel.

### II. Role-Based Access Control

The platform MUST enforce exactly four access tiers:

| Role | Key permissions |
|---|---|
| Guest (not logged in) | Browse/search — sees only `fullName`, batch, skill tags. No contact info, no downloads |
| User (logged in student) | Full profile views, download question papers, submit content (goes to `pending`) |
| Moderator | User + approve/reject questions, low-sensitivity submissions |
| Admin | Everything — approve profiles, manage roles/clubs/faculty/alumni, full moderation queue |

Access rules per content type MUST follow the table in `docs/overview.md` §5.
Guest-visible profile columns are limited to `fullName`, batch, and skill tags
(via join) — this MUST be enforced at the query level, never by frontend hiding.

### III. Universal Approval Pattern (NON-NEGOTIABLE)

Every user-submitted resource (`profiles`, `questions`, `club_members`, `alumni`,
and future submittable content) MUST share these three columns:

```
status      enum (pending | approved | rejected)  default pending
approvedBy  uuid FK → users.id  nullable
approvedAt  timestamp  nullable
```

Build **one** approval dashboard UI and reuse it across all resource types.
Do NOT build a bespoke approval flow per feature. The approval pipeline:

```
User submits → status=pending → Moderator/Admin reviews → Approved (visible) | Rejected (hidden)
```

### IV. Skill Hierarchy as Self-Referencing Table

Skills MUST NOT be hardcoded as enums. Model them as a `skills` table with:

```
id             uuid  PK
name           text  required (e.g. "Web Development")
slug           text  unique (for URLs/filters)
parentSkillId  uuid  FK → skills.id, nullable (null = top-level category)
colorKey       text  maps to tag color system (e.g. "blue", "violet", "rose")
```

Subskills (e.g. "Next.js" under "Web Development") reference their parent via
`parentSkillId`. This allows students and admins to add new subskills without
code changes. The join table `profile_skills` links profiles to skills.

### V. Visual Identity & Design System

All visual output MUST follow `docs/design-direction.md` exactly:

- **Palette**: Cool blue/violet — `#5B5FEF` primary (light) / `#8B8FFF` (dark),
  with `#8B5CF6` / `#A78BFA` secondary accent. Status colors: amber=pending,
  green=approved, red=rejected (soft low-opacity backgrounds).
- **Typography**: Space Grotesk for headings (500/600 weight), Inter for
  body/UI (400/500 body, 600 emphasis). Avoid font-weight 700+ except hero text.
- **Glassmorphism**: Top navbar, hero panels, modal backdrops, featured cards
  ONLY. NEVER on data tables, lists, or forms. Recipe: `rgba(white,0.55)` +
  `blur(16px)` + 1px border. Always verify text contrast on glass surfaces.
- **Soft tags**: Neumorphic-leaning pills for skills and status badges —
  `border-radius: 999px`, low-opacity background, inset highlight shadow.
- **Dark mode**: Build from day one alongside light mode, not retrofitted.
  Test every glass/tag component in both modes as built.
- **Motion**: 150–200ms ease-out on hover/tap. Card lift: `translateY(-2px)`.
  No bouncy/springy easing. Page transitions: simple fade, no slide gimmicks.

## Technology Constraints

- **No MongoDB**: The domain is relational. Use Neon/Postgres for all data.
- **No separate backend for MVP**: All logic lives in Next.js Route Handlers
  and Server Actions. Revisit NestJS split only if the single app is outgrown.
- **No hardcoded skill enums**: Skills use the self-referencing `skills` table
  (Principle IV). Never add a hardcoded list of skill categories.
- **Data dictionary as schema source**: `docs/data-dictionary.md` is the single
  source of truth for table shapes, types, constraints, and resolved decisions.
  Do not guess column names or types.
- **Batch numbers**: Not hardcoded — dropdown generated dynamically up to an
  admin-configurable `CURRENT_BATCH` value.
- **Alumni entry**: Supports both self-submission (nullable `userId`, starts
  `pending`) and direct admin entry (can insert as `approved`).

## Build Order & Development Workflow

### Phased Build Order

Features MUST be built in this phase order to deliver a usable MVP early:

1. **Phase 1 — Foundation**: Auth + roles, Student Profile system + skill
   tagging, Admin approval dashboard. Ship this as a usable MVP before Phase 2.
2. **Phase 2 — Core Content**: Digital Question Bank, Faculty Directory.
3. **Phase 3 — Community**: Clubs & Executive Body, Alumni Network, Notice Board.
4. **Phase 4 — Engagement**: Event Gallery + countdown, Achievement Hall of Fame,
   Project Showcase.
5. **Phase 5 — Extras**: CGPA calculator, routine/calendar, blood donor
   directory, lost & found, freelancer directory, Learning Academy.

Do not start Phase 5 work until Phase 1 is shipped and usable.

### Development Workflow

- Use the SpecKit workflow: `speckit.clarify` → `speckit.specify` →
  `speckit.plan` → `speckit.tasks` → `speckit.implement` in sequence.
- All plans MUST include a **Constitution Check** gate that verifies alignment
  with these principles before research and after design.
- Complexity that violates a principle MUST be explicitly justified in the plan
  with an explanation of why a simpler alternative was rejected.

## Governance

### Amendment Procedure

1. Propose the change with rationale in a feature spec or pull request.
2. Update this constitution file with the proposed changes.
3. Increment the version per semantic versioning rules:
   - **MAJOR**: Backward incompatible governance/principle removals or
     redefinitions.
   - **MINOR**: New principle/section added or materially expanded guidance.
   - **PATCH**: Clarifications, wording, typo fixes, non-semantic refinements.
4. Document the version change, modified sections, and any template updates
   in a Sync Impact Report (prepended as HTML comment at top of file).

### Compliance

- Every `/speckit.plan` execution MUST evaluate the Constitution Check gate.
- Plans that violate a principle without justification MUST be rejected.
- This constitution supersedes all ad-hoc guidance. When docs conflict,
  the constitution is the tiebreaker; update the conflicting doc to match.

### Runtime Guidance

- `AGENTS.md` at the repository root serves as the compact entry point for
  agent sessions. It is a derived summary of this constitution and the four
  `docs/` files. Keep it in sync when principles change.
- For full detail, reference the four `docs/` files:
  - `docs/overview.md` — vision, modules, access rules, build order
  - `docs/guidelines.md` — technical rationale, stack decisions
  - `docs/design-direction.md` — color system, typography, component specs
  - `docs/data-dictionary.md` — table shapes, types, constraints

**Version**: 1.0.0 | **Ratified**: 2026-07-26 | **Last Amended**: 2026-07-26
