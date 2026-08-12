# Route & Middleware Contracts: Profile Detail Page + Personal Portfolio

**Layer**: Next.js App Router pages, middleware, existing UploadThing route.

## New / modified routes

| Route | Access | Behavior |
|---|---|---|
| `/directory/[profileId]` (NEW) | Authenticated (`user`/`moderator`/`admin`) | Guests → `redirect("/login?callbackUrl=" + safeCallbackUrl("/directory/" + profileId))` (page-level, FR-008). Any profile whose `status !== 'approved'` → `notFound()` (FR-009). Renders `ProfileDetailView` (server component). |
| `/directory` (existing) | Public | Unchanged listing (guest cards non-clickable; authed cards link to detail). `searchDirectory` now returns `bio` + socials for authed viewers. |
| `/profile` (existing) | Authenticated | Now also loads portfolio + renders `PortfolioManager`; pending profile shows amber notice + inline two-column draft preview (FR-020/026). |
| `/api/uploadthing` (existing) | Authenticated via router middleware | Router gains a `portfolioImage` route (image only, ≤1 file, ≤5MB) — no new endpoint. |

## Middleware (`src/middleware.ts`)

Add the following entry — defense-in-depth only (page-level `auth()` is the primary gate):

```typescript
"/directory/": ["user", "moderator", "admin"],
```

**Caveats to verify in quickstart Scenario A**:
- `matchRoute` matches `pathname === key` **and** `pathname.startsWith(key + "/")`, so the trailing-slash key is intended to gate only subpaths. Next's default `trailingSlash: false` 308-redirects `/directory/` → `/directory`, but middleware ordering must be smoke-tested: the public listing `/directory` must stay public, and `/directory/<id>` must require login.
- The callback round-trip must work: guest clicks an authed-card URL (or types it) → middleware and/or page guard → `/login?callbackUrl=%2Fdirectory%2F<id>` → after login → back on the detail page. `safeCallbackUrl` guarantees no external URL is accepted (no open-redirect).

## Access-control summary

| Actor | `/directory` listing | `/directory/[id]` | `/profile` portfolio |
|---|---|---|---|
| Guest | Approved cards, restricted payload, non-clickable | → login (`callbackUrl`); restricted payload if reached | n/a (route gated) |
| User (owner) | Full card | Any approved profile; 404 for own pending profile | Full CRUD + draft preview while pending |
| User (non-owner) | Full card | Any approved profile | no access to another's portfolio (owner-guarded) |
| Moderator / Admin | Full card | Same as user | Admin only sees what they own (no portfolio CRUD surface) |
