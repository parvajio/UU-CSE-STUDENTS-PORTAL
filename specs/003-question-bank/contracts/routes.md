# Route Contracts: Digital Question Bank

**Layer**: App Router pages + Route Handlers (HTTP)

## Page routes

| Route | Access | Role read | Description |
|---|---|---|---|
| `/question-bank` | public (guest) | `viewerRole = session?.user?.role ?? "guest"` | Search + filter UI; guest sees metadata cards only (no `fileUrl`) |
| `/question-bank/[id]/?filters=...` | public (guest) | `viewerRole` | Metadata-only detail; guests see "Log in to download" CTA instead of download control (divergence from directory's cards-only rule: metadata carries no contact risk, per spec clarify 2026-08-08) |
| `/upload-question` | `user`, `moderator`, `admin` (already in `middleware.ts`) | `session.user` | Upload form: curated subject→course cascade + "Other" fallback, batch dropdown, flags, examType, free tags, UploadThing dropzone |
| `/my-submissions` | user+ | `session.user.id` | Existing page extended: question rows rendered alongside profile submission |
| `/approve` | moderator+, admin | existing | Existing dashboard; now surfaces pending questions |
| `/login` | guest | — | Target for "Log in to download" CTA (reuse `safeCallbackUrl`) |

## Download Route Handler

```
GET /api/questions/[id]/download
```

| Aspect | Value |
|---|---|
| Auth | `auth()` → no session ⇒ `redirect("/login")` with `safeCallbackUrl` (or `401`) |
| Authorization | viewer role `user/moderator/admin` only |
| Data rule | question must be `status='approved'` (or requester is `uploadedBy`) else `404` |
| Response | `redirect(fileUrl)` — the UploadThing CDN URL (public ACL) |
| Guest outcome | denied at this layer before any file reference is touched (SC-004). If a guest somehow holds a raw CDN key (out of scope), the route itself never serves it |

**Why a route, not a direct `<a href>fileUrl</a>`**: the access rule is enforced at the route/query layer, never by UI hiding (constitution §II). Guests never receive `fileUrl` from any query payload (SELECT whitelist in `searchQuestions`), and the download path is always this authed route, so URL-guessing `…/download` fails server-side. Mirrors the `scripts/verify-guest-sql.ts` discipline.

## UploadThing API route (infrastructure)

```
POST /api/uploadthing/?(action=upload)&endpoint=questionFile     ← browser → UploadThing upload
GET  /api/uploadthing/?action=callback ...                        ← UploadThing → app webhook
```

`createRouteHandler` from `uploadthing/next`. Middleware auth is per-endpoint, not on this route (per UploadThing docs). File validation (max 10MB; pdf/image) lives in the `questionFile` router.

## Revalidation tags

- `question-bank` — invalidated on approve/reject (question becomes publicly visible) and on submit; `searchQuestions` pages read it.
- `my-submissions` — invalidated on approve/reject.

## Guest enforcement recap (this contract + `server-actions.md`)

1. `searchQuestions`/`getQuestionDetail` whitelist column sets never expose `fileUrl` for `"guest"`.
2. Download is only reachable via `/api/questions/[id]/download` → `auth()` gate.
3. Upload requires `auth()` via router middleware → guests can never create a row.
4. `verify-guest-question-sql` script asserts the guest payload has no `fileUrl` key (extend `verify-guest-sql`).