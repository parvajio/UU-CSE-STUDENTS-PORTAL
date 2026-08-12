# Feature Specification: Profile Detail Page + Personal Portfolio

**Feature Branch**: `005-profile-detail-portfolio`

**Created**: 2026-08-12

**Status**: Draft

**Input**: User description: "Specify the Profile Detail Page + Personal Portfolio feature. This spec formalizes work that's largely already implemented (uncommitted, on disk) — the point of running /speckit.specify now is to establish the authoritative intended behavior so /speckit.clarify and /speckit.analyze can check the existing implementation against it, not to plan from scratch."

## Clarifications

### Session 2026-08-12

- Q: Scope boundary — what is explicitly out of scope for the portfolio system? → A: Option B scoped precisely — attach at most one image to achievements, projects, and certificates entries (never experiences), reusing the product's existing file-upload integration already used for question papers; add an optional link (`linkUrl`) to achievements matching the link pattern projects (`demoUrl`/`repoUrl`) and certificates (`credentialUrl`) already have; delivered as an intentional second schema migration on top of the already-built four tables; manual reordering and moderator/admin CRUD over portfolios stay out of scope.
- Q: Draft preview — how does an owner preview their pending profile's public layout? → A: Option A — the My Profile page renders a full two-column draft preview of the detail layout from the owner's draft data, behind the amber "draft until approved" notice; the public route still returns 404 for non-approved profiles, even for the owner.
- Q: Empty states — what does each portfolio section render when a profile has no entries? → A: Option A — the owner's /profile manager shows actionable per-section empty states with a primary Add button; on the public detail page empty portfolio sections show a quiet, non-actionable placeholder and the About section is omitted when there is no bio.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Directory Card, Guest vs. Authenticated (Priority: P1)

A visitor to the student directory sees one card per student. **Guests** (not logged in) see only a restricted card: the avatar (or initials fallback when no photo is set), the student's full name, their batch, their skill tags, and a "log in to view full profile" prompt. The guest card is visibly present but deliberately NOT clickable — clicking it does nothing (a behavioral difference from authenticated cards, not an oversight). No contact details, bio, or social links exist anywhere in what a guest receives.

**Authenticated users** see a richer card: avatar, full name, an Alumni tag when the student is an alumnus, "Batch · Section", a truncated bio snippet, a row of social icons (LinkedIn, GitHub, Portfolio, Facebook, WhatsApp — showing only the icons actually set), and skill tags. The whole card is clickable through to the full profile page, EXCEPT the social icon row, which opens its own link independently without triggering card navigation (achieved via correct z-index layering between the card's single click target and the icon row, not two competing full-card click handlers).

The authenticated card has a modern social-profile feel: gradient cover strip, avatar overlapping the cover, name/meta styled like a handle, skills as soft tags, soft lift on hover, at most one special surface treatment, and correct dark mode from day one. The guest card's placeholder + prompt styling is a fixed, separate treatment — it must not look identical to the authenticated card.

**Why this priority**: The directory card is the primary entry point to profiles and the first thing every visitor sees. Guest restriction is also the project's hardest security discipline (SQL-level field splitting), so getting it right here sets the standard for the rest of the feature.

**Independent Test**: Browse the directory as a guest and as a logged-in user; verify the two card treatments, the clickability difference, and that a guest's network payload contains no contact/bio/social fields.

**Acceptance Scenarios**:

1. **Given** I am a guest on the directory, **When** the page loads, **Then** every card shows avatar (or initials fallback), full name, batch, and skill tags plus a "log in to view full profile" prompt, and no contact, bio, or social field appears in the page response or network payload.
2. **Given** I am a guest viewing a directory card, **When** I click anywhere on the card, **Then** no navigation occurs.
3. **Given** I am a logged-in user on the directory, **When** a card belongs to a profile with `isAlumni = true`, **Then** the card shows an Alumni tag and the "Batch · Section" meta line.
4. **Given** I am a logged-in user, **When** I click the card body of a directory card, **Then** I am taken to that profile's detail page.
5. **Given** a directory card whose profile has one or more social links set, **When** I click a social icon, **Then** that link opens in its own target without navigating away from the directory.
6. **Given** a directory card whose profile has no social links set, **When** it renders, **Then** no social icon row is shown at all.

---

### User Story 2 - Profile Detail Page (`/directory/[profileId]`) (Priority: P1)

A logged-in user who clicks a directory card lands on the full profile detail page. The page is the destination of the directory card and renders everything the card hints at, larger and better organized. It is only reachable for profiles whose status is `approved` — requesting any other profile's detail page returns a 404, never an error page and never a partial render.

Guests are redirected to the login page with a callback URL back to the page they tried to view, guarded by the existing safe-callback-URL logic so no open-redirect is possible. As defense in depth, the query layer also restricts the field set for a guest who somehow reaches the route, giving the same restricted fields as the directory card.

Layout: a hero region with a gradient banner and a glass identity card (avatar, name, alumni tag, batch/section/student ID, and company/job when the person is an alumnus), then a two-column body — left column for About, Experience, Projects; right column for Skills, Achievements, Certificates. Exactly one `spark` accent color is used on this entire screen, on the Achievements section. Portfolio sections with no entries render a quiet, non-actionable placeholder (never an invitation to add content), and the About section is omitted entirely when there is no bio, keeping the layout stable across profiles. The page is responsive down to 375px, keyboard-navigable, respects `prefers-reduced-motion`, and is correct in dark mode.

**Why this priority**: Without the detail page there is no destination for the directory cards; it delivers the core read value of the portal (full profile + portfolio) on its own even before portfolio management ships.

**Independent Test**: Log in, open a directory card, verify the hero + two-column layout renders all sections without error; as a guest, confirm redirection to login with a callback URL; request a non-approved profile URL directly and confirm a 404.

**Acceptance Scenarios**:

1. **Given** I am a guest, **When** I request a profile detail URL directly, **Then** I am redirected to the login page carrying a callback URL back to the original path, and the redirect target is not an open redirect.
2. **Given** I am logged in, **When** I request the detail page of a profile whose status is `approved`, **Then** the page renders the hero region and the two-column body with all sections.
3. **Given** I am logged in, **When** I request the detail page of a profile whose status is `pending` or `rejected`, **Then** I receive a 404 — not an error page and not a partially rendered page.
4. **Given** the detail page for an alumnus, **When** it renders, **Then** the hero shows the current company and job position.
5. **Given** the detail page, **When** I scan the screen, **Then** exactly one element uses the `spark` accent color, on the Achievements section.
6. **Given** the detail page at a 375px viewport, **When** I navigate it with a keyboard, **Then** every interactive element is reachable and focused visibly, hover animations have a reduced-motion fallback, and dark mode renders correctly.
7. **Given** a detail page where a portfolio section has no entries or the profile has no bio, **When** it renders, **Then** empty sections show a quiet, non-actionable placeholder and the About section is omitted entirely.

---

### User Story 3 - Portfolio System (Achievements, Projects, Certificates, Experience) (Priority: P2)

Each profile can carry a personal portfolio — achievements, projects, certificates, and work experience — stored in four dedicated tables rather than a single text/JSON field, each linked to its owning profile with cascade deletion. Achievements, projects, and certificates may each carry at most one optional image (experiences carry none), and achievements also support an optional link — matching the link pattern projects and certificates already have. This is a deliberate, documented exception to the universal `status`/`approvedBy`/`approvedAt` moderation pattern, with the same standing as `career_guidance_requests`: portfolio entries are self-curated by the profile owner, appear immediately, and are never moderated.

Adding, editing, or deleting portfolio entries NEVER changes the owning profile's own approval status. Portfolio content is only ever publicly visible on the detail page when the owning profile itself is `approved`; an owner can keep editing their portfolio while their profile is pending (drafting), it just is not publicly visible yet.

Portfolio mutations are rate-limited per entity type at 10 per hour per user — deliberately distinct from the profile-upsert 1/hour limit and the general 5/hour submission default, because this flow bypasses the approval-workflow wrapper entirely (there is no approval queue involved).

**Why this priority**: The portfolio is what makes a detail page worth visiting and an alumni/student profile a genuine showcase, but it depends on the detail page and its visibility rules from User Story 2. It delivers its full value only once profile management (User Story 4) lets owners populate it.

**Independent Test**: Create a portfolio entry as the owner, confirm it renders on the detail page immediately; verify that portfolio edits do not alter the profile's approval status; verify portfolio content is invisible while the owning profile is pending.

**Acceptance Scenarios**:

1. **Given** a profile owner, **When** they add a portfolio entry of any of the four types, **Then** it is visible on their own profile detail page immediately, without any moderation step.
2. **Given** an approved profile, **When** its owner edits or deletes a portfolio entry, **Then** the profile's `approved` status, approver, and approval time are unchanged.
3. **Given** a profile whose status is `pending`, **When** its owner edits their portfolio, **Then** the edits are saved but the portfolio content does not appear on the public detail page.
4. **Given** a profile owner, **When** they make more than 10 portfolio mutations of one entity type within an hour, **Then** further mutations of that type are blocked with a clear message until the window resets.
5. **Given** a profile that is deleted, **When** the deletion completes, **Then** all four portfolio tables lose that profile's entries as well.
6. **Given** an achievement, project, or certificate entry, **When** the owner attaches one optional image, **Then** the image renders on the detail page, and experience entries offer no image option at all.
7. **Given** an achievement entry, **When** the owner adds an optional link, **Then** it behaves exactly like the link fields on projects and certificates.

---

### User Story 4 - My Profile Portfolio Management (`/profile`) (Priority: P2)

The profile owner manages their own portfolio from the "My Profile" page. For each of the four entity types they can add, edit, and delete entries through dialogs; an entity type with no entries yet shows an actionable empty state with an Add button that guides the owner to populate it. Every mutation is guarded server-side for ownership — the server resolves the owning profile from the logged-in session and never trusts a client-supplied profile ID. Editing the portfolio is still allowed while the profile is `pending`, shown alongside an amber "draft until approved" notice, consistent with User Story 3's visibility rule. While pending, the My Profile page also renders a full two-column draft preview of the detail layout from the owner's draft data, so the owner sees exactly what approval will publish; the public detail route still returns 404 for non-approved profiles, even for the owner.

**Why this priority**: Management is what makes the portfolio usable; it completes the owner's round trip of create → preview → publish, and is what the two-column detail page is ultimately showcasing.

**Independent Test**: Log in as a profile owner, add/edit/delete each of the four entity types, confirm changes reflect on the detail page and that the amber notice appears while pending.

**Acceptance Scenarios**:

1. **Given** I am the owner of an approved profile, **When** I open the My Profile page, **Then** I can add, edit, and delete entries for all four portfolio entity types via dialogs.
2. **Given** my profile is `pending`, **When** I view the My Profile page, **Then** I can still add/edit/delete portfolio entries, an amber "draft until approved" notice is shown, and a full two-column draft preview of the detail layout renders from my draft data.
3. **Given** my profile is `pending`, **When** I open my own detail page URL, **Then** I receive a 404 just like any other viewer — my only preview of the public layout is the inline draft on the My Profile page.
4. **Given** I attempt a portfolio mutation, **When** the mutation is submitted, **Then** it succeeds only if the server-side ownership check matches my session; any attempt to mutate a profile that is not mine is rejected.
5. **Given** a portfolio mutation that would exceed the per-entity rate limit, **When** it is submitted, **Then** it is rejected without persisting anything.
6. **Given** my portfolio has an entity type with no entries, **When** I view the My Profile page, **Then** that section shows an actionable empty state with an Add button.

---

### Edge Cases

- A profile with no `avatarUrl` shows an initials fallback everywhere (directory card and detail hero) — never a broken image.
- A profile with some socials unset shows icons only for the ones set; a profile with none set shows no icon row at all.
- A guest clicks a directory card → nothing happens (card is not navigable); the login prompt is the only interactive affordance.
- A user directly types the URL of a non-approved profile → 404, regardless of status (`pending` or `rejected`).
- The owner of a `pending` profile also receives a 404 on their own detail URL — their only preview of the public layout is the inline draft preview on the My Profile page.
- A guest reaches the detail route through a stale link or bookmark → redirected to login by the middleware guard; if they still reach the page, the query layer returns only the guest-restricted field set (defense in depth, not the primary gate).
- Deleting a profile cascades its portfolio rows (FK cascade) — no orphaned portfolio entries.
- Editing a portfolio entry never flips an already-approved profile back to `pending`.
- Portfolio entries with null optional dates render without a date; open-ended experience/projects render as "Present".
- A social/portfolio URL that is invalid or missing simply shows no icon; outbound links open safely without leaking the portal's URL context.
- A page-level render failure on the directory/detail/My Profile pages must not disable unrelated, already-working UI (navbar dark-mode toggle, notification bell, avatar menu) — those belong to a different component tree; any coupling is itself a defect.
- Real avatar URLs from any configured remote image host must render — an image-host/CSP misconfiguration must not silently swallow avatars.
- A portfolio image that fails to upload must not prevent the entry's other fields from saving — the entry saves without the image and a clear error is shown.
- Deleting a portfolio entry with an attached image must not leave an orphaned image file behind in the storage used for portfolio images.
- A portfolio image that cannot be loaded must degrade to a placeholder, never a broken-image icon or a page crash.
- Empty portfolio sections on the public detail page show a quiet placeholder — never an invitation to add content; the About section is omitted entirely when the bio is empty.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST show guests only avatar (or initials fallback), full name, batch, and skill tags on directory cards, plus a "log in to view full profile" prompt.
- **FR-002**: System MUST render guest directory cards as non-navigable — a click on a guest card MUST NOT cause navigation.
- **FR-003**: System MUST exclude all contact, bio, social, and portfolio fields from the guest payload at the query layer (column selection), never by UI-only hiding.
- **FR-004**: System MUST apply the same guest-restricted field set when a guest somehow reaches the profile detail route (defense in depth).
- **FR-005**: System MUST show authenticated users a directory card with avatar, full name, Alumni tag (when applicable), "Batch · Section", a truncated bio snippet, a social icon row, and skill tags.
- **FR-006**: System MUST render only the social icons that are actually set, and MUST render no social icon row when none are set.
- **FR-007**: System MUST make the authenticated card navigable to `/directory/[profileId]` through a single stretched click target, with the social icon row layered above it so icon clicks open their own links without triggering card navigation (z-index layering, not competing handlers).
- **FR-008**: System MUST redirect guests requesting a profile detail page to `/login?callbackUrl=<original path>` using the existing safe-callback-URL guard, with no open-redirect possibility.
- **FR-009**: System MUST return a 404 for any profile detail request whose profile status is not `approved` — never an error page and never a partial render.
- **FR-010**: System MUST render the detail page as a hero region (gradient banner + glass identity card with avatar, name, alumni tag, batch/section/student ID, and company/job when the person is an alumnus) and a two-column body (left: About/Experience/Projects; right: Skills/Achievements/Certificates).
- **FR-011**: System MUST use exactly one `spark` accent on the entire detail screen, on the Achievements section.
- **FR-012**: System MUST keep the detail page responsive down to 375px, keyboard-navigable, `prefers-reduced-motion`-safe, and dark-mode-correct.
- **FR-013**: System MUST store portfolio content in four dedicated tables (achievements, projects, certificates, experiences), each linked to its owning profile with cascade deletion.
- **FR-014**: The four portfolio tables MUST NOT carry `status`/`approvedBy`/`approvedAt` columns — a documented exception to the universal approval pattern with the same standing as `career_guidance_requests`.
- **FR-015**: System MUST NOT change a profile's own approval status as a result of any portfolio mutation.
- **FR-016**: System MUST keep portfolio content publicly invisible until the owning profile is `approved`, while still allowing the owner to edit it while `pending` (drafting).
- **FR-017**: System MUST rate-limit portfolio mutations per entity type at 10/hour per user, distinct from the profile-upsert and general submission limits.
- **FR-018**: System MUST allow the profile owner to add, edit, and delete all four portfolio entity types via dialogs on the My Profile page.
- **FR-019**: System MUST guard every portfolio mutation for ownership server-side, resolving the owning profile from the session — a client-supplied profile ID MUST never be trusted.
- **FR-020**: System MUST show an amber "draft until approved" notice on portfolio management while the owning profile is `pending`.
- **FR-021**: System MUST render avatar images from any configured remote image host — an image-host/CSP misconfiguration MUST NOT silently swallow real avatar URLs.
- **FR-022**: System MUST isolate this feature's render/navigation failures from unrelated, already-working UI (navbar dark-mode toggle, notification bell, avatar menu) — those are a separate component tree and any coupling is a defect.
- **FR-023**: System MUST allow attaching at most one image to achievement, project, and certificate entries — and none to experience entries — reusing the product's existing file-upload capability already used for question papers, with no new upload infrastructure.
- **FR-024**: System MUST support an optional link on achievement entries, matching the existing link-field pattern on projects and certificates.
- **FR-025**: System MUST save the rest of a portfolio entry when its optional image upload fails, and MUST remove an entry's image from storage when the entry is deleted (no orphaned files).
- **FR-026**: System MUST render a full two-column draft preview of the detail layout on the My Profile page from the owner's draft data while the profile is `pending`, behind the amber "draft until approved" notice — and the public detail route MUST still return 404 for any non-approved profile, including the owner's own.
- **FR-027**: System MUST render a quiet, non-actionable placeholder for any portfolio section with no entries on the public detail page and MUST omit the About section when the profile has no bio; on the My Profile page, System MUST render an actionable empty state with an Add button per entity type that has no entries.

### Key Entities *(include if feature involves data)*

- **profiles**: the existing central record (approved/pending/rejected) that the directory cards, detail page, and portfolio all hang off; guest-visible columns remain limited to `fullName`, `batchNumber`, and skill tags.
- **profile_achievements**: achievement entries owned by a profile — title, achieved date, description, an optional image, and an optional link.
- **profile_projects**: project entries owned by a profile — title, description, technology stack, demo and repo links, start/end dates, and an optional image.
- **profile_certificates**: certificate entries owned by a profile — title, issuer, issue date, credential link, and an optional image.
- **profile_experiences**: work/position entries owned by a profile — company, role, start/end dates, description (deliberately no image field).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of guest directory interactions show avatar (or initials), name, batch, and skills with a login prompt, and 0% of guest card clicks result in navigation.
- **SC-002**: An authenticated user reaches a target profile's detail page in at most 2 clicks from the directory, with no page errors along the way.
- **SC-003**: 100% of profile detail requests for non-approved profiles resolve to a 404 response — never an error page and never partial content.
- **SC-004**: A portfolio edit made by the owner is visible on the detail page within seconds of saving, with no moderation step and no approval-status change.
- **SC-005**: With the detail page forced to fail, the navbar dark-mode toggle, notification bell, and avatar menu remain fully functional (no cascade failure).
- **SC-006**: No guest network response for any directory or detail request contains contact, bio, social, or portfolio fields (verified against a real guest session).
- **SC-007**: The detail page renders correctly at a 375px viewport and is fully navigable by keyboard.
- **SC-008**: An owner can attach one image to any achievement, project, or certificate entry and see it render on the detail page; deleting that entry removes its image from storage with no orphaned files.

## Assumptions

- Portfolio entries are sorted newest-first by their date field per entity type (achievements by achieved date, certificates by issue date, projects/experiences by start date); no manual reordering in this version.
- There is no hard cap on the number of portfolio entries per type; the per-entity rate limit governs mutation frequency, not storage volume.
- Experiences and projects with no end date render as "Present"; entries with null optional fields simply omit those parts when rendered.
- Social and portfolio links are stored as free text (per the data dictionary); outbound links open in a new tab with a safe referrer policy, and invalid/missing URLs simply show no icon.
- The existing session mechanism and safe-callback-URL helper are reused; no new authentication infrastructure.
- Remote-image-host configuration is centralized and shared, so a single configuration change covers all avatar hosts.
- The four portfolio tables and their relations already exist in the schema and are tracked by the latest migration (this spec formalizes already-implemented, uncommitted work rather than planning from scratch).
- The portfolio tables' status as a documented exception to the universal approval pattern is authoritative and will not be retrofitted with approval columns.
- Attaching one optional image to achievements, projects, and certificates (never experiences) plus an optional achievement link is an intentional second schema migration on top of the already-built four portfolio tables; it reuses the product's existing file-upload capability rather than building new upload infrastructure.
- Manual reordering of portfolio entries and moderator/admin CRUD over portfolios are explicitly out of scope for this feature.
