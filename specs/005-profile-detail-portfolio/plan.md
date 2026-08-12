# Implementation Plan: Profile Detail Page + Personal Portfolio

**Branch**: `005-profile-detail-portfolio` | **Date**: 2026-08-12 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/005-profile-detail-portfolio/spec.md` — directory card (guest vs. authenticated), `/directory/[profileId]` detail page, four-table portfolio system (a documented exception to the universal approval pattern), and owner-side portfolio management on `/profile`. Clarified 2026-08-12 (Q1: one optional image on achievements/projects/certificates + achievement `linkUrl` via an intentional second migration; Q2: inline draft preview on `/profile` while pending; Q3: actionable empty states on `/profile`, calm placeholders on the public page).

**Working-tree note (reconciled)**: the handoff (`docs/.opencode/handoff-profile-portfolio.md`) describes this feature as already implemented and uncommitted, but it is **not present in this working tree** — `git stash@{0}` holds only an abandoned *free-text `profiles.achievements`* approach (superseded by the four-table decision). The shipped HEAD is Question Bank (004). This plan therefore builds the feature from scratch per the spec. Net consequence for the migration story: the four portfolio tables are created **once**, in a single migration `0006`, already including the image columns and `achievements.linkUrl` from clarification Q1 — equivalent to the spec's "four tables + intentional second migration", just collapsed into one file because there is no pre-existing four-table schema to migrate on top of.

## Summary

Add the full profile-detail + portfolio experience: **schema** — four new tables (`profile_achievements`, `profile_projects`, `profile_certificates`, `profile_experiences`), each FK → `profiles.id ON DELETE CASCADE`, **no** `status/approvedBy/approvedAt` columns (documented exception, same standing as `career_guidance_requests`), with one optional `imageUrl` on achievements/projects/certificates (not experiences) and `linkUrl` on achievements; **directory card** — redesigned authenticated card (gradient cover strip, overlapping avatar, handle-style meta, social icon row, soft-tag skills, soft lift) with a single stretched click target and z-indexed social row, plus a fixed separate guest placeholder card (non-clickable); **detail page** — `/directory/[profileId]` authed-only (guests → `/login?callbackUrl=…` via `safeCallbackUrl`), 404 for non-approved profiles, hero (gradient banner + glass identity card) + two-column body (left About/Experience/Projects, right Skills/Achievements/Certificates), exactly one `spark` accent on Achievements, quiet placeholders for empty sections, About omitted without bio; **portfolio management** — `/profile` owner-only CRUD dialogs for all four entity types, server-side ownership guards (profile resolved from session, never a client-supplied `profileId`), per-entity 10/hour rate limit (`portfolio:<entity>:<userId>`), amber "draft until approved" notice + inline two-column draft preview while pending, actionable per-section empty states; portfolio visibility gated purely by the owning profile's `approved` status; portfolio mutations never touch profile approval.

## Technical Context

**Language/Version**: TypeScript 5.x on Next.js 15 (App Router), Node 20 LTS (unchanged from 003/004)

**Primary Dependencies**: drizzle-orm + @neondatabase/serverless; Auth.js v5; `uploadthing@^7` + `@uploadthing/react` (reuse the existing `questionFile` router pattern — add a `portfolioImage` router); lucide-react (1.5px stroke, no brand icons — `Contact`/`Code2`/`Globe`/`Link2`/`MessageCircle` already map to LinkedIn/GitHub/Portfolio/Facebook/WhatsApp); shadcn/ui (avatar/card/dialog/input/textarea/label/select/badge/toast/separator); clsx/tailwind-merge.

**Storage**: PostgreSQL on Neon — four new tables in a single migration `0006`; no new enums beyond per-entity enum-free design (columns are plain `text`/`timestamp`/`text[]`). Portfolio images live in UploadThing (public ACL) with the same never-disclose-to-guests rule as question files.

**Testing**: extend `scripts/verify-guest-sql.ts` (guest branches of `searchDirectory` **and** `getProfileDetail` assert only `{id, fullName, batchNumber, skills}` — plus a raw-SQL check that no portfolio/contact column appears in the guest `SELECT`); `npm run lint`, `npx tsc --noEmit`, `npm run build`; manual/Playwright for SC-001..008; `drizzle-kit generate/migrate` (or the Neon HTTP apply path if `db:migrate` hangs on this machine — see the 005 handoff's landmines).

**Target Platform**: Vercel (serverless), Linux dev

**Project Type**: Web application — single Next.js app, no separate backend (constitution §I). DB reads via query functions, writes via Server Actions, image uploads browser→UploadThing direct.

**Performance Goals**: directory search < 2s over the existing approved-profile set (unchanged from current implementation); detail page paints within 1s of navigation; portfolio images lazy-loaded (`loading="lazy"`); no cache layer introduced for the new queries (single-app scale).

**Constraints**: guest payloads MUST contain only `{id, fullName, batchNumber, skills}` — enforced at the query column-selection layer, never UI hiding (FR-003/004/006); detail route 404s for any non-approved profile including its owner (FR-009/026); portfolio mutations MUST NOT change profile approval (FR-015); per-entity 10/hour rate limit distinct from profile-upsert 1/hour and the 5/hour submission default (FR-017); owner-guarded mutations server-side (FR-019); at most one image per entry, none on experiences, reused upload infra, no new upload stack (FR-023); failed image upload must not abort the entry save, entry/image delete must not orphan files (FR-025); remote avatar/image hosts must render (FR-021); 375px responsive + keyboard + reduced-motion + dark mode (FR-012); one `spark` per screen on Achievements (FR-011); card/social z-index layering must not regress (FR-007); page crashes must not cascade into navbar/notification/avatar-menu interactivity (FR-022).

**Scale/Scope**: ~200 peak concurrent users (accepted in-memory rate-limit limitation unchanged — per data dictionary); profiles in the hundreds-to-low-thousands; portfolio rows per profile modest (< 50 each). No hard cap per entity type.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Assessment |
|---|---|
| §I Stack & Architecture (single Next.js app, Postgres/Drizzle, Auth.js, UploadThing, Vercel) | ✅ Pass — no backend split; reads via queries, writes via Server Actions, image upload browser→UploadThing reusing the existing integration |
| §II Role-Based Access Control (guest = browse only; user = full views + submit; moderator/admin = approve) | ✅ Pass — guest restriction stays at the query layer (column selection) for both card and detail; detail route authed-only + 404-on-non-approved; portfolio mutations owner-only |
| §III Universal Approval Pattern (status/approvedBy/approvedAt + one dashboard) | ✅ Pass **with documented exception** — the four portfolio tables deliberately carry NO approval columns; the constitution pre-authorizes such exceptions (`career_guidance_requests` standing), and this feature extends that standing explicitly in the spec (FR-014), AGENTS.md, and `docs/data-dictionary.md`. No bespoke approval flow is built — there is no approval queue at all. Profile approval stays untouched by portfolio edits (FR-015) |
| §IV Skill Hierarchy (self-referencing `skills`, no hardcoded enums) | ✅ Pass — untouched; `techStack` on projects is a free-text `text[]`, not a skill enum |
| §V Visual Identity & Design System | ✅ Pass — authenticated card = modern social card (one special surface: gradient cover + soft lift; soft-tag skills; glass only on the hero identity card and modal backdrops — never on lists/forms); guest card is a fixed separate placeholder treatment; one `spark` accent total (Achievements); dark mode built in; 150–200ms ease-out; reduced-motion fallbacks |
| Technology constraints (data-dictionary as schema source; batch dynamic dropdown; no Mongo; no separate backend) | ✅ Pass — schema shapes first recorded in `docs/data-dictionary.md` (four tables + image/link columns + exception note), then code; `profiles` batch/section handling unchanged; no hardcoded portfolio field enums |
| Build order (Phase 1 before Phase 5) | ✅ Pass — directory/profile is Phase 1 Foundation; portfolio showcase sits under Phase 4 but ships here as the profile's companion feature per the approved spec |

**Gate result**: Pass. The only deviation is the §III exception, and it is pre-authorized by the constitution's own exception pattern and explicitly re-authorized by the spec (FR-014), so it is justified rather than unjustified.

**Post-Phase-1 re-check (after data-model + contracts):** Still Pass. `data-model.md` adds four child tables with no approval columns (§III exception intact and documented); contracts keep guest field-splitting at the query layer and owner guards in Server Actions (§II intact); UI contracts confine glass to hero/modal and pin the one-`spark` rule (§V intact); no new backend or Mongo anywhere (§I intact).

## Project Structure

### Documentation (this feature)

```text
specs/005-profile-detail-portfolio/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
│   ├── server-actions.md
│   ├── routes.md
│   └── ui-contracts.md
├── checklists/          # spec quality checklist (all passing)
└── spec.md              # Feature specification (source of truth)
```

### Source Code (repository root)

```text
src/
├── app/
│   ├── (guest)/directory/
│   │   ├── page.tsx                       # MODIFY: pass viewerRole + isAuthed to ProfileCard
│   │   └── [profileId]/
│   │       ├── page.tsx                   # NEW: auth() → safeCallbackUrl redirect; getProfileDetail → notFound(); render view
│   │       ├── loading.tsx                # NEW: skeleton (reuse LoadingSkeleton)
│   │       └── profile-detail-view.tsx    # NEW: gradient banner + glass identity card + two-column body
│   ├── (user)/profile/
│   │   ├── page.tsx                       # MODIFY: Promise.all([getMyProfile, getAllSkills, getCurrentBatch, getMyPortfolio])
│   │   ├── actions.ts                     # unchanged (upsert/getMyProfile)
│   │   ├── portfolio-actions.ts           # NEW "use server": getMyPortfolio + add/update/delete × 4 entities
│   │   ├── PortfolioManager.tsx           # NEW client: 4 section cards + add/edit dialogs + confirm-delete + empty states
│   │   └── ProfileView.tsx                # MODIFY: amber pending notice → also draft preview; render PortfolioManager
├── components/
│   ├── directory/
│   │   ├── ProfileCard.tsx                # MODIFY: authed redesign + guest placeholder split; stretched overlay Link + z-indexed social row
│   │   ├── ProfileSocials.tsx             # NEW: buildSocialLinks() + ProfileSocialIconRow (only set socials)
│   │   ├── ProfilePortfolioSections.tsx   # NEW: Experiences/Projects/Achievements/Certificates sections + SkillsPanel (spark on Achievements)
│   │   └── ProfileDetail.tsx              # REUSE: identity card content (avatar/name/alumni/batch/section/SID/company/job) for hero + /profile
├── lib/
│   ├── db/
│   │   ├── schema/
│   │   │   ├── profile-achievements.ts    # NEW: id, profileId FK CASCADE, title NN, achievedDate, description, imageUrl, linkUrl
│   │   │   ├── profile-projects.ts        # NEW: id, profileId FK CASCADE, title NN, description, techStack text[], demoUrl, repoUrl, startDate, endDate, imageUrl
│   │   │   ├── profile-certificates.ts    # NEW: id, profileId FK CASCADE, title NN, issuer NN, issueDate, credentialUrl, imageUrl
│   │   │   ├── profile-experiences.ts     # NEW: id, profileId FK CASCADE, company NN, role NN, startDate, endDate, description
│   │   │   ├── index.ts                   # MODIFY: re-export the four tables
│   │   │   └── relations.ts               # MODIFY: profiles → many(achievements/projects/certificates/experiences) + one() back-references
│   │   └── queries/
│   │       └── directory.ts               # MODIFY: authed card +bio +5 socials; NEW getProfileDetail(profileId, viewerRole) guest/auth column-split + portfolio arrays; types
│   ├── portfolio/
│   │   └── validation.ts                  # NEW: Zod schemas per entity + URL/date rules + image rules + label maps
│   ├── uploadthing.ts                     # MODIFY: + portfolioImage route (image only, 1 file, ~5MB, authed)
│   └── rate-limit.ts                      # unchanged (checkRateLimit reused with portfolio:<entity>:<userId>)
├── types/portfolio.ts                     # NEW: shared PortfolioEntity types / input shapes
├── middleware.ts                          # MODIFY: + "/directory/": ["user","moderator","admin"] (defense-in-depth; page-level auth() stays primary gate)
└── styles/tags.css                        # unchanged (soft-tag recipe reused)
```

**Structure Decision**: Single Next.js app (constitution §I). Schema continues the per-table file + centralized `relations.ts` layout. The detail page is a Server Component (server-only data, no client hydration for content); `PortfolioManager` is the only client island on `/profile`; `ProfileCard` stays a Server Component (no client handler needed thanks to stretched-overlay `Link`). Portfolio queries live in `directory.ts` (they are profile-scoped reads); portfolio mutations live in a dedicated `portfolio-actions.ts`.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| *(none — the §III portfolio exception is pre-authorized, see Constitution Check)* | | |
