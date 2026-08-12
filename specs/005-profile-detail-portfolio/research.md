# Research Notes: Profile Detail Page + Personal Portfolio

**Phase**: 0 — Outline & Research | **Date**: 2026-08-12

Resolves every `NEEDS CLARIFICATION` flagged in the plan's Technical Context, plus best-practice checks for the new integrations. Each item: **Decision / Rationale / Alternatives considered**.

---

## R-1: Portfolio image upload (FR-023) — how, size, count

**Decision**: Add a second route to the existing UploadThing router in `src/lib/uploadthing.ts` — `portfolioImage` — restricted to `image` type, `maxFileCount: 1`, `maxFileSize: "5MB"`, with the same `.middleware()` auth gate as `questionFile` (session user required). Dialogs use `generateUploadDropzone<OurFileRouter>()` for the field, exactly like `UploadForm.tsx` already does for question files. One URL string is stored per entry; never a mixed-type multi-file flow.

**Rationale**: Reuses the already-integrated upload stack (constitution §I allows UploadThing; no new infra, no new env vars, no new CSP surface). Single-file matches clarification Q1 ("one image per entry"). 5MB is generous for a profile showcase image but tighter than the 10MB question-paper cap, which is fine because these are decorative portfolio visuals, not scans to be preserved.

**Alternatives considered**:
- Cloudflare R2 direct upload — rejected: R2 is permitted but not yet integrated anywhere; wiring a full signed-upload flow would be new infrastructure for a one-image-per-entry need.
- Store image as base64 in Postgres — rejected: bloats the DB and the page HTML; violates the file-storage decision.

## R-2: Orphan image cleanup on entry delete / replace (FR-025, SC-008)

**Decision**: In the `delete` (and `update`, when an existing image is replaced) server actions, after the DB write succeeds, call `utapi.deleteFiles([fileKey])` from `uploadthing/server`, **best-effort** — the file key is the final path segment of the stored `imageUrl`. Wrap in try/catch; a failed deletion logs and does not fail the action (the DB row is the source of truth; a stray CDN object is a hygiene issue, not a correctness one).

**Rationale**: UploadThing does not garbage-collect app-referenced files; explicit cleanup is the only way to satisfy "no orphaned files" (SC-008) without a cron job. Best-effort avoids coupling DB success to external-call success (FR-025's "image failure must not abort the entry save" philosophy, applied symmetrically to delete).

**Alternatives considered**: Relying on UploadThing's own file retention — rejected, it has no per-app auto-cleanup hook; a later migration/backfill would be needed.

## R-3: Remote image hosts / `next/image` (FR-021)

**Decision**: Keep the project's established plain-`<img>` path for avatars and portfolio images. shadcn `AvatarImage` (already used by `ProfileCard.tsx`) renders a plain `<img>`, so **no `images.remotePatterns` config is required** — `next.config.mjs` is currently empty and stays that way. All new image surfaces (card avatar, detail hero avatar, portfolio entry images) use `Avatar`/plain `<img>` with explicit `width`/`height` (or fixed-size avatars) to avoid layout shift. Add one verification step to quickstart: a profile whose `avatarUrl` points to any real host (e.g. imagekit) must render — confirming no host silently swallows it.

**Rationale**: Consistency with the existing card implementation (no `next/image` anywhere in the directory/profile tree today) and zero CSP config risk. `Avatar` already provides the initials fallback required for null avatars.

**Alternatives considered**: Switching avatars/images to `next/image` with a `remotePatterns` allowlist — rejected: more config, more cache/optimizer complexity, and it would be a regression risk for the currently-working avatar rendering; revisit only if image optimization is ever required.

## R-4: Portfolio rate-limit scope (FR-017)

**Decision**: Uniform `checkRateLimit("portfolio:<entity>:<userId>", 10, 60*60*1000)` per entity type (`achievements` | `projects` | `certificates` | `experiences`), counting **add + update + delete combined** on one counter per entity, applied to **all roles including staff** (no exemption).

**Rationale**: The spec (FR-017, US3 scenario 4) states "10 per hour per user" with no staff carve-out, and the feature is deliberately outside the approval workflow — so reusing `enforceSubmissionLimit` (which is tied to the 5/hour + staff-exempt convention) would be wrong on both dimensions. A single combined counter per entity is also simpler to reason about and matches the data-dictionary convention of one counter per resource type.

**Alternatives considered**: Three separate counters (add/edit/delete) — rejected: a user could bypass the intent by rotating operations; also more keys to expire. Reusing `enforceSubmissionLimit` — rejected: wrong window and semantics (approval-queue oriented).

## R-5: Concurrent edits on the same entry (deferred in clarify)

**Decision**: Last-write-wins, no optimistic locking. Each mutation is a targeted `UPDATE ... WHERE id = :id AND profileId = :ownerProfileId`; the ownership predicate doubles as the concurrency guard.

**Rationale**: Single owner, low collision risk (clarify session deferred this to planning as low-impact). Last-write-wins is the simplest correct behavior and requires no `updatedAt`-compare or version column.

**Alternatives considered**: Version column / `updatedAt` precondition — rejected for MVP: adds API surface for a near-zero-incidence case.

## R-6: Portfolio entry sorting (assumption in spec)

**Decision**: Newest-first by the entity's date field — achievements by `achievedDate`, certificates by `issueDate`, projects and experiences by `startDate` — with entries lacking a date sorting **after** dated ones, and `createdAt DESC` (then `id`) as the deterministic tiebreak.

**Rationale**: Deterministic ordering is required for stable UI and tests; newest-first matches the spec's Assumptions and the "mini-LinkedIn" mental model (most recent work on top).

**Alternatives considered**: Manual ordering — explicitly out of scope (clarification Q1 rejected option C).

## R-7: Migration story (working-tree reconciliation)

**Decision**: A single migration `0006` creates the four portfolio tables already containing their final columns — `image_url` on achievements/projects/certificates and `link_url` on achievements — because no four-table schema exists in this working tree to add a second migration on top of (see plan Summary). Net schema is byte-identical to the spec's "four tables + deliberate second migration" outcome. No data-backfill step is needed (greenfield tables).

**Rationale**: Avoids the absurdity of generating `0006` (tables without images) + `0007` (add image columns) for freshly-created empty tables. The spec's framing was predicated on pre-existing work that is not on disk.

**Alternatives considered**: Faithfully emitting two migrations — rejected as needless ceremony for empty tables; would also risk the DB/app-migration drift the 005 handoff warns about.

## R-8: Detail-route access control — middleware vs page guard (FR-008/009)

**Decision**: The **page-level `auth()` guard is primary**: `page.tsx` calls `auth()`, redirects guests via `safeCallbackUrl("/directory/" + profileId)` to `/login?callbackUrl=…`, then `getProfileDetail` → `notFound()` for non-approved. Middleware gets a defense-in-depth entry `"/directory/": ["user","moderator","admin"]` (subpath-only intent). Because `matchRoute` also matches `pathname === key`, the trailing-slash key must be verified not to lock out the listing `/directory` — Next's default `trailingSlash: false` normalizes `/directory/` → `/directory`, but the middleware must be smoke-tested on the listing, the detail page, and the `/login?callbackUrl=` round-trip (quickstart Scenario A).

**Rationale**: The page guard is authoritative and testable at the unit level; middleware adds defense-in-depth without being the single point of correctness. The safe-callback helper is reused verbatim (no open-redirect regression).

**Alternatives considered**: Middleware-only gating — rejected: route matching for dynamic segments + trailing slashes is brittle; a page guard is also what `upsertProfile`/question actions already do.

## R-9: Social icon mapping (FR-006/007)

**Decision**: Reuse the established lucide mapping already present in `ProfileDetail.tsx`: `Contact`=LinkedIn, `Code2`=GitHub, `Globe`=Portfolio, `Link2`=Facebook, `MessageCircle`=WhatsApp — extracted into `ProfileSocials.tsx` (`buildSocialLinks()` + `ProfileSocialIconRow`). Verify the installed lucide-react version ships no brand icons (it doesn't — this mapping is why the generic icons are used); do not attempt to add brand-icon packages.

**Rationale**: Zero new deps, and the mapping is already proven in the shipped `ProfileDetail`. Extraction enables the same row on the card and the hero with one implementation.

**Alternatives considered**: Installing `lucide-react` brand icon add-ons — rejected (not present in this version; generic icons are the established convention).

## R-10: Draft preview composition (FR-026, Q2)

**Decision**: On `/profile`, when the profile is `pending`, render the same `ProfilePortfolioSections` components plus the identity-card content behind the amber "draft until approved" notice — a faithful two-column preview fed from the owner's draft data, without reaching the public route.

**Rationale**: Satisfies Q2 (option A) with pure component reuse; no special-casing of the public route; the preview automatically matches the approved page because it shares components.

**Alternatives considered**: Rendering the public route for the owner — rejected (breaks FR-009's universal 404).

---

## Integration patterns confirmed (reused, no change needed)

- **Guest column-split discipline**: already implemented for `searchDirectory` (`src/lib/db/queries/directory.ts`, guest columns `{id, fullName, batchNumber}` + skills); `getProfileDetail` repeats the identical pattern. Verified by `scripts/verify-guest-sql.ts`, which gets a second assertion block for the detail guest branch and a raw-SQL no-portfolio-column check.
- **`$onUpdate` for `updatedAt`**: per-table `.notNull().defaultNow().$onUpdate(...)` like `profiles.ts`/`question-files.ts` (constitution schema convention; no DB triggers).
- **`onDelete: CASCADE` from profile**: `profiles.id` referenced by the four tables with cascade, matching `question_files.questionId` precedent; relations go in centralized `relations.ts` (no circular imports).
- **Rate limiting**: reuse `checkRateLimit(key, max, windowMs)` directly (as `upsertProfile` does for its 1/hour); do **not** route through `enforceSubmissionLimit`.
- **Notifications**: no new notifications — portfolio is self-curated, unmoderated (no approval event to notify on).
