# UI Contracts: Profile Detail Page + Personal Portfolio

**Layer**: React Server Components + one client island (`PortfolioManager`) + `ProfileCard` (server component).

Enforces `docs/design-direction.md` and the frontend-design skill: glass only on hero/modal, soft-tag skills, one special surface max, one `spark` accent per screen (Achievements), 150–200ms ease-out, dark mode from day one, `motion-reduce` fallbacks, keyboard focus states, responsive to 375px.

## 1. Directory card — `ProfileCard.tsx` (server component)

Two treatments decided by shape presence, not by a prop (`"avatarUrl" in profile` — already the existing discriminator).

**Guest card** (fixed, separate treatment — must NOT look identical to authed):
- Initials avatar on the blue→violet gradient (`#5B5FEF → #8B5CF6`), name, `Batch N`, skill soft-tags, and a muted "Log in to view full profile" affordance (a link to `/login?callbackUrl=%2Fdirectory`).
- **Not clickable** — no card-level `Link`, no cursor change (FR-002). Clicking does nothing.

**Authed card** (modern social-profile card, one special surface = gradient cover strip):
- Relative `Card` (radius 16, `--surface` bg, `border`, colored shadow per design doc §6) with a 3px gradient top accent (`linear-gradient(90deg, primary, secondary)`); soft lift on hover (`translateY(-2px)`, deepened colored shadow), `motion-reduce:translate-y-0`.
- **Gradient cover strip** at top + **avatar overlapping the cover** (`-mt-*`, ring of `--surface`).
- Name in Space Grotesk + handle-style meta `Batch 61 · Section C`; `Alumni` soft-tag when `isAlumni` (default hue); bio snippet `line-clamp-2`.
- Social icon row (`ProfileSocials.tsx`, only set socials; absent when none) — icons `Contact`/`Code2`/`Globe`/`Link2`/`MessageCircle` at 1.5px stroke.
- Skill soft-tags (`SkillTag`/`soft-tag--<colorKey>` recipe).
- **Navigation layering (FR-007 — do not regress):** one stretched overlay `<Link href={/directory/[id]} className="absolute inset-0 z-10" aria-label>`; the social icon row is `relative z-20` so its `<a>` opens externally (`target="_blank" rel="noreferrer noopener"`) without triggering the overlay. Never two competing full-card click handlers.

## 2. Detail page — `[profileId]/profile-detail-view.tsx` (server component)

- **Hero:** full-width gradient banner (`#5B5FEF → #8B5CF6`, soft blob, low-contrast) + **glass identity card** (glassmorphism recipe: `--surface-glass`, `blur(16px)`, 1px border, radius 20) overlapping it — avatar (initials fallback when null), name, Alumni tag when applicable, `Batch · Section`, `Student ID`, and `currentCompany · jobPosition` when `isAlumni`. Socials render via `ProfileSocials`.
- **Body:** `grid md:grid-cols-2 gap-*` — left: **About** (bio; section omitted entirely when no bio — FR-027), **Experience**, **Projects**; right: **Skills** (soft-tags), **Achievements** (**the one `spark` accent on this screen** — FR-011, e.g. section heading icon/badge in `#F97066`/`#FB8A80`), **Certificates**. Rendered by `ProfilePortfolioSections.tsx` (shared with the /profile draft preview).
- **Empty sections** (FR-027): quiet, non-actionable placeholder per section ("No projects yet.") — never an add-Call-to-action for a non-owner; About omitted when no bio.
- **Entry rendering:** images lazy-loaded with fixed aspect/box (no CLS), fallback to a neutral placeholder if unloadable (never a broken-image icon); open-ended dates → "Present"; null optional fields simply omitted.
- `loading.tsx` skeleton reuses `LoadingSkeleton`.
- 375px: columns stack; hero + identity card reflow; no horizontal scroll; keyboard-focusable throughout; reduced-motion respected; dark mode correct from day one.

## 3. My Profile portfolio manager — `PortfolioManager.tsx` (client island)

- Four section cards (Achievements / Projects / Certificates / Experience) rendered from `getMyPortfolio()`.
- **Empty state** per section (FR-027): actionable — "Add your first project" + primary **Add** button opening the dialog.
- **Add / Edit dialogs** (shadcn `Dialog`; glass backdrop only — the form itself stays flat per design doc): entity field sets per the contract table; image field via `generateUploadDropzone<OurFileRouter>()` (`portfolioImage` route) — one image, optional, preview + remove (removal clears `imageUrl` and, on save, best-effort-deletes the old file); URL/date fields; inline field errors; Save/Cancel.
- **Delete**: confirm dialog; destructive-styled confirm; calls `deletePortfolioEntry`.
- **Amber "draft until approved" notice** (FR-020) when `status === "pending"` — same amber treatment as the existing pending banner in `ProfileView.tsx`.
- **Draft preview** (FR-026): when pending, `ProfileView` renders the two-column detail layout (hero-less identity card + `ProfilePortfolioSections`) from draft data above/below the manager — the owner sees exactly what approval publishes; the public route still 404s.
- Feedback via the existing toast system; `revalidatePath` keeps `/profile` and the detail page fresh.
- Rate-limit hits surface the returned `retryAfter` message inline.

## Cross-cutting

- **Isolation (FR-022):** the directory/detail/`/profile` page component trees are rendered independently of the navbar tree (`Navbar`/`NavbarClient`, `NotificationBell`, `UserMenu`, `ThemeToggle`); no context/prop coupling is introduced. A render error in a profile component must not cascade into navbar interactivity — verified in quickstart Scenario B (force an error on the detail page; navbar controls must still work).
- **Images (FR-021):** plain `<img>`/`Avatar` only (no `next/image`); no `images.remotePatterns` change required (research R-3). Quickstart verifies a real remote avatar URL renders.
- **Dark mode & motion:** every surface above is built in both modes as it ships; `motion-reduce` on hover lifts/fades; 150–200ms ease-out only.
