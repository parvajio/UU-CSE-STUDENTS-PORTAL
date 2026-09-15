# Research: Club Section

**Branch**: `006-club-section` | **Date**: 2026-09-15

## Phase 0 Research Findings

### Research Task: UploadThing image upload failure handling

**Decision**: UploadThing upload is a blocking step — admin must retry before proceeding; the form submission fails entirely if upload fails.

**Rationale**: Per spec clarification, image uploads (logo, cover, gallery images, achievement images) must succeed before the mutation is committed. This ensures data consistency — no orphaned records with missing images.

**Alternatives considered**:
- Allow saving with placeholder images and uploading later → Rejected: creates inconsistent state and poor UX
- Queue uploads asynchronously → Rejected: adds complexity and potential race conditions

### Research Task: Concurrent edit handling for clubs

**Decision**: Last write wins with a version/timestamp check — show a warning if the record changed since the admin opened it.

**Rationale**: Simple optimistic concurrency control. The `updatedAt` timestamp already exists on all tables via `$onUpdate`. Admin sees a warning if `updatedAt` differs from when they opened the form.

**Alternatives considered**:
- Pessimistic locking (database row locks) → Rejected: overkill for admin-only content, adds latency
- No conflict handling → Rejected: risks silently overwriting changes

### Research Task: Rate limit error handling

**Decision**: Show a clear error: "Rate limit reached — try again in X minutes" with the time remaining.

**Rationale**: The existing `enforceSubmissionLimit` returns `{ allowed: false, retryAfter }`. The UI needs to display the remaining time to the admin.

**Alternatives considered**:
- Silent fail or generic error → Rejected: poor UX, admin doesn't know when they can retry
- Custom rate limit per feature → Rejected: reuse existing shared wrapper as per project convention

### Research Task: Events table schema and status computation

**Decision**: Event `status` is computed dynamically: if `endTime > now()` → `ongoing`, if `startTime > now()` → `upcoming`, else `completed`. Computed in the rendering layer or query layer (not stored as a DB column).

**Rationale**: Computed status avoids stale data and eliminates the need for DB triggers or periodic updates. The spec explicitly states this is acceptable.

**Alternatives considered**:
- Store `status` as a DB column updated by cron or trigger → Rejected: adds complexity, potential staleness
- Client-side only computation → Rejected: inconsistent across clients; server-side computation preferred

### Research Task: Club events visibility (dual-page requirement)

**Decision**: Club events (with `clubId` set) appear on BOTH the club detail page AND the main events page with a "From [Club Name]" tag. Standalone events (clubId = null) appear ONLY on the main events page.

**Rationale**: This is a filtering/query concern. The events query includes `clubId` as a filter parameter. Club detail page filters by `clubId`, main events page shows all events including those with `clubId`.

**Alternatives considered**:
- Separate event tables for club vs standalone → Rejected: unnecessary duplication, violates normalization
- Always show all events everywhere → Rejected: confusing for standalone events

### Research Task: Data dictionary update for clubs

**Decision**: Update `docs/data-dictionary.md` to add `departments` table and expand `clubs` table with all fields referenced in the spec: `departmentId`, `coverImgUrl`, `msgGroupUrl`, `pageUrl`, `fbGroupUrl`, `contacts`, `mail`, `status`, `timestamps`.

**Rationale**: Per spec clarification, the data dictionary is the single source of truth and must include all fields the spec references.

### Research Task: Testing approach

**Decision**: Playwright for e2e tests. No unit test framework currently configured beyond what's needed for Playwright.

**Rationale**: `package.json` shows `playwright test` as the test command. The project already has e2e test infrastructure.

**Alternatives considered**:
- Adding Jest/Vitest for unit tests → Rejected: not in project dependencies, would add scope beyond this feature
- Manual testing only → Rejected: spec requires measurable testable outcomes

### Research Task: Profile images (PP/avatar) availability

**Decision**: `profiles.avatarUrl` is already available for rendering member avatars on club pages. No new work needed.

**Rationale**: The existing `profiles` schema has `avatarUrl` field. The `club_members` table references `profileId` and the detail page can join profile data for avatars.

## Consolidated Findings

1. **UploadThing failure is blocking** — form submission fails entirely if image upload fails; admin must retry.
2. **Concurrent edits use optimistic locking** via `updatedAt` timestamp with a warning.
3. **Rate limit errors surface the remaining time** using the existing `enforceSubmissionLimit` return value.
4. **Event status is computed**, not stored — eliminates the need for triggers or cron jobs.
5. **Events dual-page visibility** is a query/filter concern, not a schema concern.
6. **Data dictionary must be updated** with `departments` and expanded `clubs` schema.
7. **Playwright** is the existing testing framework; no new test framework needed.
8. **Profile avatars already exist** on the `profiles` table — no additional avatar infrastructure needed.
