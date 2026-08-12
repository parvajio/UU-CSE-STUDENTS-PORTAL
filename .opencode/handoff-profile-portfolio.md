# Handoff — Profile Detail Page + Personal Portfolio (debug & finish)


## Project context (read these first)

- `AGENTS.md` — project constitution (stack, roles, universal approval pattern, do-nots).
- `docs/data-dictionary.md` — sole source of truth for table shapes.
- `docs/design-direction.md` — exact color tokens, glassmorphism recipe, soft-tag CSS, typography,
  motion. Read before touching UI.
- `.opencode/skills/frontend-design/SKILL.md` — enforces the visual identity; read before any UI work.
- Stack: Next.js 15 App Router + TS, shadcn/ui + Tailwind v4, Postgres (Neon) + Drizzle, Auth.js v5
  (JWT `role` claim), Vercel deploy. Repo uses SpecKit (`.opencode/commands/speckit.*.md`).
- Git: branch `main`. **All current work is UNCOMMITTED on disk.**

---

## Feature requirements (as the user asked)

1. **Directory cards** (`/directory`):
   - **Guest:** card shows profile avatar+ name + batch + skills, plus a prompt to log
     in. Cards are clickable BUT go to login for guests. No contact/bio/socials — enforced in SQL.
   - **Logged-in user:** card shows avatar, name, Alumni tag, Batch · Section, bio snippet,
     social icon row, skill tags. The WHOLE card is clickable → `/directory/[profileId]`.
   - Card should look like a **modern social-media profile** (this is under-polished — see Bugs).
2. **Profile detail page** `/directory/[profileId]` (logged-in only; guests → `/login?callbackUrl=…`):
   - Only **approved** profiles (else 404). Same content as the card but bigger/more organized.
   - Hero = gradient banner + glass identity card (avatar, name, alumni tag, batch/section/studentId,
     company/job, socials). Body = two columns: left About/Experience/Projects; right
     Skills/Achievements/Certificates. One `spark` accent per screen (Achievements section).
   - Clean yet colorful UI; dark mode from day one; responsive; keyboard-accessible; reduced-motion safe.
3. **Portfolio system** (mini-LinkedIn/Upwork showcase) per profile:
   - Achievements, Projects, Certificates, and Experience — stored in **four dedicated tables**
     (decision, not a text field).
   - Visible on the detail page only when the owning profile is **approved**.
   - **No moderation**: self-curated, unmoderated, editing never resets profile approval.
   - Rate limit: per-entity 10/hr (`checkRateLimit("portfolio:<entity>:<userId>", 10, 1h)`).
4. **My Profile** (`/profile`): add/edit/delete all four portfolio types via dialogs, owner-only
   server-side guards, drafts allowed while profile is pending (amber notice).

---

## What is already implemented (on disk, uncommitted)

### Schema (migration `drizzle/migrations/0005_calm_loa.sql` — already applied)
Four tables in `src/lib/db/schema/` (re-exported in `schema/index.ts`, relations in `relations.ts`),
all `FK -> profiles.id ON DELETE CASCADE`, `updatedAt` via `$onUpdate`:

- `profile-achievements.ts`: id, profileId, **title (notNull)**, achievedDate (ts, null), description
- `profile-projects.ts`: id, profileId, **title (notNull)**, description, techStack (`text[]`),
  demoUrl, repoUrl, startDate, endDate
- `profile-certificates.ts`: id, profileId, **title (notNull)**, **issuer (notNull)**, issueDate,
  credentialUrl
- `profile-experiences.ts`: id, profileId, **company (notNull)**, **role (notNull)**, startDate,
  endDate, description

**Documented exception to the universal `status/approvedBy/approvedAt` pattern** (same standing as
`career_guidance_requests`) — recorded in `docs/data-dictionary.md`, `docs/overview.md`, `AGENTS.md`.
Do not retrofit approval columns onto these.

### Query layer — `src/lib/db/queries/directory.ts`
- Authenticated branch of `searchDirectory` now also selects `bio` + 5 socials (feeds the rich card).
  Guest branch unchanged (`{id, fullName, batchNumber}` + skills).
- New `getProfileDetail(profileId, viewerRole)` — same guest/auth column-split pattern:
  - guest branch returns only `{id, fullName, batchNumber, skills}` (defense in depth);
  - authed branch returns full public profile + `skills` + `achievements/projects/certificates/
    experiences` arrays; `WHERE status='approved'`.
- New types: `ProfileDetailData`, `ProfileAchievement`, `ProfileProject`, `ProfileCertificate`,
  `ProfileExperience`; `FullSearchProfile` extended with `bio` + socials.
- `scripts/verify-guest-sql.ts` extended with a guest-branch assertion for `getProfileDetail` — passes.

### Directory card — `src/components/directory/ProfileCard.tsx`
- Guest branch: placeholder avatar (initials on blue→violet gradient), name, batch, skills, and a
  "Log in to view full profile" link (`/login?callbackUrl=%2Fdirectory`). Not clickable.
- Authed branch: avatar, name, Alumni tag, Batch · Section, `line-clamp-2` bio, social icon row,
  skill tags. Whole card clickable via a **stretched overlay `<Link className="absolute inset-0 z-10">`**
  (social icon row is `relative z-20` so it opens externally). **Do not regress this z-index layering.**
- `src/components/directory/ProfileSocials.tsx`: `buildSocialLinks()` + `ProfileSocialIconRow`.
  Icons: `Contact`=LinkedIn, `Code2`=GitHub, `Globe`=Portfolio, `Link2`=Facebook,
  `MessageCircle`=WhatsApp (brand icons do NOT exist in this lucide-react version).
- `src/components/directory/ProfilePortfolioSections.tsx`: presentational Experiences/Projects/
  Achievements/Certificates sections + `SkillsPanel` (used by the detail page; Achievements section
  uses the single `spark` accent).

### Detail route — `src/app/(guest)/directory/[profileId]/`
- `page.tsx`: `auth()` → guest `redirect('/login?callbackUrl=…')`; `getProfileDetail` → `notFound()`;
  renders `ProfileDetailView`.
- `profile-detail-view.tsx`: gradient banner + glass identity card + two-column body (left
  About/Experience/Projects; right Skills/Achievements/Certificates). `loading.tsx` skeleton.
- `src/middleware.ts`: added `"/directory/": ["user","moderator","admin"]` (detail routes protected;
  listing `/directory` stays public).

### My Profile — `src/app/(user)/profile/`
- `portfolio-actions.ts` (`"use server"`): `getMyPortfolio()` + `add/update/delete` for all four
  entities. Owner-guarded (`profiles.userId == session.user.id`), URL/date validation, per-entity
  rate limit, `revalidatePath('/profile')` + `/directory/<profileId>`.
- `PortfolioManager.tsx` (client): 4 section cards with Add/Edit dialogs + confirm-delete; amber
  "draft until approved" notice; `profileApproved` prop.
- `page.tsx`: `Promise.all([getMyProfile(), getAllSkills(), getCurrentBatch(), getMyPortfolio()])`;
  renders `ProfileView` then a Portfolio section with `PortfolioManager`.

---

## Environment landmines (read before touching DB or running migrate)

1. **`npm run db:migrate` / `drizzle-kit migrate` HANGS** on this machine (serverless websocket can't
   connect). The working path is the Neon HTTP client:
   `npx tsx --env-file=.env -e "..."` with `db.execute()` — this is how `0005` was applied manually.
2. **Migration tracking drift:** the remote DB's `drizzle.__drizzle_migrations` already has 7 rows,
   including entries from an ABANDONED earlier attempt at this same feature using a DIFFERENT
   (approval-pattern) schema. Because drizzle compares last-applied `created_at`, it treats `0005` as
   already applied and skips it. The DB tables were manually reconciled to match the current schema —
   on THIS DB just verify tables match the schema files; on a fresh DB, `0000 → 0005` applies cleanly.
3. **`.next` was cleared and the rebuild aborted.** Run `npm run build` (or `npm run dev`) before
   testing. The last successful build listed `/directory/[profileId]` and compiled clean.
4. Useful seed data for manual testing: admin `admin@cse-portal.edu` / `changeme123` (seed defaults);
   approved profiles include `MD. Parvaj Mosharof` (has a real avatar URL) and `E2E Student *` (null
   avatar → expect initials fallback, that is correct).

---

## REPORTED BUGS — fix in priority order

The user is upset and explicitly asked "why did you touch them" about the navbar controls. They were
NOT touched. Assume a page-level crash cascades into dead client JS (theme toggle, notification bell,
avatar menu) — fix the crash first.

1. **Internal server error on `/directory/[profileId]`** → "details not opening".
   The data layer is VERIFIED fine (`getProfileDetail` + `searchDirectory` both return correct data
   for an approved profile id, e.g. `501bd748-caa7-48ca-804b-448e3c0527fa`). Reproduce with
   `next start` (or `next dev`) + an authed cookie and read the ACTUAL error from the terminal.
   Suspects, in order:
   - stale `.next` "cannot find module for page: /_not-found / /approve" style errors → clean rebuild;
   - `profile-detail-view.tsx` (the `ring-4 ring-surface` token, glass classes, any import mismatch);
   - `page.tsx` params/redirect handling;
   - middleware path-matching edge (verify `/directory/<id>` passes, listing stays public).
2. **Dark mode toggle / notification bell / profile avatar menu not responding** (Navbar,
   `src/components/layout/NavbarClient.tsx` — untouched by the feature). Likely cascade from bug #1
   (hydration/render crash kills interactivity). If fixing #1 doesn't restore them, inspect
   NavbarClient hydration errors independently (server/client render mismatch).
3. **Card profile picture not showing** — authed cards render `AvatarImage` only when
   `profile.avatarUrl` is set (null-avatar profiles show initials fallback, correct). Verify a real
   URL (imagekit) loads; check CSP/remote-pattern/image host if not.
4. **Card doesn't look like a modern social-media profile** — DESIGN TASK. Redesign the AUTHENTICATED
   card per `docs/design-direction.md` + the frontend-design skill: e.g. gradient cover strip, avatar
   overlapping the cover, name + handle-style meta, social icon row, skills as soft tags, soft lift on
   hover, one special surface max, dark mode tested from day one. The GUEST card must keep the
   placeholder-avatar + "log in" prompt (that is the user's decided behavior).

---

## Verification checklist (before calling it done)

- `npm run lint` and `npx tsc --noEmit` clean.
- `npm run build` succeeds; `/directory/[profileId]` listed in output.
- `npm run verify:guest-sql` passes (guest never sees contact/portfolio fields).
- Manual:
  - As guest: directory shows placeholder cards + login prompt; cards NOT clickable.
  - As authed user: cards show avatar/socials/bio; clicking a card opens the detail page without error.
  - `/profile`: PortfolioManager renders; add/edit/delete each of the 4 entities works; changes appear
    on the detail page; editing portfolio never resets profile approval.
  - Dark mode toggle, notification bell, and avatar menu work on the directory and detail pages.
