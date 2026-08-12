# Quickstart: Profile Detail Page + Personal Portfolio (Validation Guide)

**Phase**: 1 — Design & Contracts | **Date**: 2026-08-12

## Prerequisites

- Foundation + Question Bank shipped (schema at migration `0005`, seed run, `admin@cse-portal.edu` / `changeme123` seed defaults; approved profiles exist — e.g. `MD. Parvaj Mosharof` with a real avatar URL and an `E2E Student *` with a null avatar → initials fallback).
- Node 20 LTS, Neon connection string in `.env`, Auth.js providers, UploadThing creds (`UPLOADTHING_TOKEN`/`UPLOADTHING_SECRET`) set.
- `docs/data-dictionary.md` updated first (four portfolio tables + `imageUrl`/`linkUrl` columns + the documented approval-pattern exception note), then schema files.

## Setup

```bash
# 1. Schema files → migration 0006 (four portfolio tables, single migration — research R-7)
npm run db:generate
npm run db:migrate
#  EXPECT: 0006 creates profile_achievements/profile_projects/profile_certificates/profile_experiences
#  with image_url + link_url included. If db:migrate hangs on this machine (serverless websocket),
#  apply via the Neon HTTP client (npx tsx --env-file=.env -e "..." with db.execute()) and reconcile
#  drizzle.__drizzle_migrations manually (005 landmine).

# 2. Guest-payload verification — extended to cover getProfileDetail + portfolio columns
npm run verify:guest-sql
#  EXPECT: existing assertions PASS + new detail-branch assertion PASS (guest gets {id, fullName,
#  batchNumber, skills} only; no portfolio/contact column in the guest SELECT).

# 3. Static checks
npm run lint && npx tsc --noEmit
```

## Running

```bash
npm run build && npm run start   # or: npm run dev → http://localhost:3000
# EXPECT: /directory/[profileId] listed in the build output and compiling clean.
```

## Validation Scenarios

### Scenario A: Access control + middleware smoke test (FR-008/009, routes.md)

1. **Guest** opens `/directory` → listing renders with placeholder cards + "Log in to view full profile"; **no card click navigates** (FR-002); inspect network/HTML → no `bio`, no socials, no `avatarUrl`/`section` in the guest payload (SC-006).
2. **Guest** types `/directory/<approvedId>` → redirected to `/login?callbackUrl=%2Fdirectory%2F<approvedId>`; `/directory/` (trailing slash) still shows the public listing (no lockout); after login the callback returns to the detail page.
3. **Logged in** types `/directory/<pendingOrRejectedId>` → **404**, not an error page, not partial content (SC-003). Owner's own pending profile also 404s on the public route (FR-026).

### Scenario B: Directory cards (FR-001..007, SC-001/005)

1. Authed card shows cover strip, overlapping avatar, name, `Alumni` tag + `Batch · Section` for an alumnus, bio snippet (truncated), social icon row (only set socials; none set ⇒ no row), skill tags; null-avatar profile shows initials fallback (SC-001).
2. Click card body → detail page; click a social icon → opens externally **without** navigating the card (z-index layering intact — FR-007).
3. **Cascade check (FR-022):** with the detail page forced to fail (e.g. temporary render error), the navbar dark-mode toggle, notification bell, and avatar menu must all remain functional.

### Scenario C: Detail page (FR-010..012, FR-027)

1. Approved profile → hero (gradient banner + glass identity card: avatar, name, alumni tag, batch/section/SID, company/job when alumni) + two-column body (left About/Experience/Projects; right Skills/Achievements/Certificates).
2. Exactly **one** `spark` element on screen — the Achievements section.
3. Profile with no bio and empty sections → About omitted, quiet non-actionable placeholders (never "Add" CTAs) (FR-027, US2 scenario 7).
4. **375px** viewport: columns stack, no horizontal scroll; keyboard-tab through every interactive element with visible focus; `prefers-reduced-motion` disables hover lifts; dark mode renders correctly (SC-007).

### Scenario D: Portfolio management + visibility (FR-013..020, FR-023..027, SC-004/008)

1. Owner on `/profile`: four section cards; empty entity types show actionable "Add your first …" + primary Add button (Q3).
2. Add an **achievement** with image + link → appears on the owner's approved detail page within seconds (SC-004). Add a **project** (techStack, demo/repo URLs, dates, image), **certificate** (issuer + credentialUrl + image), **experience** (company/role/dates) — all persist.
3. **Experiences show no image option** (FR-023); adding an image to any other entity that fails to upload does not abort the save — entry persists without image (FR-025).
4. Edit each entity; replace/remove an image (old file best-effort-deleted); delete an entry → image removed from storage (SC-008), profile approval unchanged (FR-015, SC-004).
5. Open-ended experience → renders "Present".
6. `select count(*) ...` per table for a fixture profile → rows match the manager; deleting the profile cascades its portfolio rows (FK CASCADE).
7. **Pending profile:** portfolio manager still editable, amber "draft until approved" notice (FR-020), and the inline two-column draft preview renders owner draft data (FR-026); public detail route 404s for it.
8. >10 mutations of one entity type in an hour → clear message with `retryAfter`; other entity types still editable; no data persisted on the blocked call (US3 scenario 4, US4 scenario 5).
9. Log in as a **different user** → attempting to mutate the first user's portfolio is rejected server-side (owner guard, FR-019).

### Scenario E: Guest read discipline (SC-006)

1. Re-run `npm run verify:guest-sql` — the extended script asserts the guest detail branch returns only `{id, fullName, batchNumber, skills}` and that no portfolio table column appears in the guest `SELECT` clause (FR-003/004).

## Notes

- Portfolio images: UploadThing `portfolioImage` route (image only, 1 file, ≤5MB); storage cleanup on delete is best-effort (`utapi.deleteFiles`), never blocks the DB write (R-2).
- Full implementation details in `data-model.md`, `contracts/`, and later `tasks.md`.
- The four tables are a documented §III exception — do not add `status/approvedBy/approvedAt` columns to them.
