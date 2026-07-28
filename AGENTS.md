# CSE Students Portal — AGENTS.md

Greenfield project — no application code exists. The four files in `docs/` are the **sole source of truth** for all decisions.

## Stack

- Next.js 15 App Router + TypeScript — single deployable app (no separate backend)
- shadcn/ui + Tailwind CSS
- PostgreSQL (Neon) + Drizzle ORM
- Auth.js (NextAuth v5) — JWT session with `role` claim (`guest|user|moderator|admin`)
- File storage: Cloudflare R2 or UploadThing
- Search: Postgres full-text search (`tsvector`/`tsquery`) — start here, upgrade later if needed
- Deploy: Vercel

## Roles & Access

| Role | Key permissions |
|---|---|
| Guest (not logged in) | Browse/search — sees only `fullName`, batch, skill tags. No contact info, no downloads |
| User (logged in student) | Full profile views, download question papers, submit content (goes to `pending`) |
| Moderator | User + approve/reject questions, low-sensitivity submissions |
| Admin | Everything — approve profiles, manage roles/clubs/faculty/alumni, full moderation queue |

## One Rule: Reuse the Approval Pattern

Every user-submitted table (`profiles`, `questions`, `club_members`, `alumni`, etc.) has the **same three columns**:

```
status  enum (pending | approved | rejected)  default pending
approvedBy  uuid FK → users.id  nullable
approvedAt  timestamp  nullable
```

Build **one** approval dashboard UI and reuse it — do not build a bespoke approval flow per feature.

## Do NOT

- **No MongoDB** — the domain is deeply relational (many-to-many profiles↔skills, clubs↔members, multi-field filtering). Use Neon/Postgres.
- **No separate Express or NestJS backend for MVP** — use Next.js Route Handlers + Server Actions. Revisit a NestJS split only if you outgrow the single app.
- **No hardcoded skill category enums** — skills are a `skills` table with nullable `parentSkillId` (self-referencing). Students/admins add subskills without code changes.

## Schema Source

`docs/data-dictionary.md` is the single source of truth for table shapes, types, constraints, and resolved decisions (e.g. batchNumber is a dynamic dropdown, studentId is required+unique, alumni supports both self-submit and admin-entry). **Do not guess column names or types.**

## Build Order

Phase 1 (Foundation) → Phase 2 (Core Content) → Phase 3 (Community) → Phase 4 (Engagement) → Phase 5 (Extras). Ship Phase 1 as a usable MVP before touching Phase 5.

## Design

- `docs/design-direction.md` has exact color tokens, glassmorphism recipe, tag component CSS, typography (Space Grotesk headings + Inter body), and motion guidelines.
- Glassmorphism only on navbar, hero, modal backdrops, featured cards — never on data tables, lists, or forms.
- Dark mode: build from day one alongside light, not retrofitted.
- Icons: lucide-react (1.5px stroke).
- Status tag colors: amber=pending, green=approved, red=rejected (with soft low-opacity backgrounds).

## SpecKit Workflow

This repo uses [SpecKit](https://github.com/anomalyco/speckit) via `.specify/` and `.opencode/commands/speckit.*.md`. When starting work on a feature, use commands like `speckit.clarify`, `speckit.specify`, `speckit.plan`, `speckit.tasks`, `speckit.implement` in sequence.

## Schema Conventions

All decisions below are reflected in the Drizzle schemas at `src/lib/db/schema/`.

- **onDelete pattern**: `SET NULL` on `approvedBy` and `parentSkillId` (preserves history, avoids cascading deletes); `CASCADE` on `userId` and join-table columns (cleans up when owning row is removed).
- **`users.authProvider`**: includes `'unclaimed'` for admin-created placeholder accounts with no real login yet (used for legacy alumni). These accounts have no `passwordHash` until claimed.
- **`profiles.studentId`**: nullable, unique when set. "Required for current students" is an app-level Zod rule, not a DB constraint. Allows legacy alumni (added by admin) with no SID.
- **Self-referencing FK pattern**: typed callback `(): AnyPgColumn => table.id` with explicit `onDelete`, paired with a `relations()` block in `relations.ts` using a matched `relationName` string on both the `one()` and `many()` sides.
- **All `*Relations`** live in `src/lib/db/schema/relations.ts`, not in individual table files, to avoid circular imports.
- **`$onUpdate`** for `updatedAt` timestamps, not DB triggers (simpler, version-controlled, sufficient for a single-app deployment).
- **`pg_trgm` extension**: The `0000_*.sql` migration is manually edited to prepend `CREATE EXTENSION IF NOT EXISTS pg_trgm;` before the GIN trigram index on `profiles.fullName`. This is tracked in git (not manual SQL) so it applies automatically on Neon branch-per-feature deployments.
