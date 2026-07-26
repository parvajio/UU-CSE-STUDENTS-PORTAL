# CSE Students Portal — Technical Guidelines

**Motto:** "One Platform, Endless Opportunities for CSE Students."

---

## 1. Stack Decisions (Direct Answers)

### Database: **PostgreSQL (Neon) — not MongoDB**
Almost everything in this portal is relational:
- Profiles ↔ Skills is many-to-many, with a skill→subskill hierarchy (self-referencing or parent/child table).
- Profiles ↔ Clubs ↔ Executive roles is many-to-many with role metadata.
- Questions need multi-field filtering (batch, course, subject, tag, date) — this is exactly what SQL indexes/joins are built for.
- Approval workflows need status enums, `approvedBy`, `approvedAt` — clean as relational columns with foreign keys to `users`.
- Roles/permissions (admin/moderator/user) map naturally to relational access patterns.

MongoDB would force you to denormalize a genuinely relational domain, and you'd rebuild joins in application code. Neon (serverless Postgres) also pairs well with Next.js on Vercel — scales to zero, HTTP driver works in edge/serverless functions.

### ORM: **Drizzle — not Prisma**
For this specific stack (Next.js + Neon + Vercel serverless):
- Drizzle has no separate query-engine binary → faster cold starts on serverless functions.
- Works natively with Neon's HTTP/WebSocket driver (`@neondatabase/serverless`).
- SQL-like query builder — since you already know SQL, you get full control without a heavy abstraction layer.
- Schema-as-code with `drizzle-kit` migrations is lightweight and versionable in git.

Prisma has better out-of-the-box DX (Prisma Studio, more mature docs) but is heavier at runtime — not worth it here since your team is small and comfortable with SQL.

### Backend: **Don't stand up a separate service for MVP — use Next.js Route Handlers + Server Actions**
For a single full-stack app with one frontend, a separate Express/NestJS backend just adds deployment complexity, CORS handling, and duplicate auth logic for no real benefit at MVP stage.

**If/when you do split the backend** (e.g. you plan a future mobile app, or the team grows and you want strict separation of concerns), choose **NestJS over Express**:
- Your domain has 3 roles × many resource types × approval workflows. NestJS's Guards, Pipes, Interceptors, and DTerms with `class-validator` map directly onto "only moderators can approve questions," "validate this profile update," etc. — you get this structure for free instead of hand-rolling middleware.
- Modules make it easier for multiple student contributors to work on separate features (clubs, questions, profiles) without stepping on each other.
- Express is more minimal and flexible, but for a project this size with a rotating team of student devs, that flexibility becomes inconsistency.

**Recommendation:** Build the MVP as one Next.js app. Revisit a NestJS split only if you outgrow it.

### Auth: **Auth.js (NextAuth v5)**
- Credentials provider (student ID/email + password) + Google provider (many students already have university Google accounts).
- JWT session with a `role` claim (`admin | moderator | user | guest`).
- Route protection via Next.js `middleware.ts`, checking role per route group.
- Access tiers:
  - **Not logged in:** can search/browse (names, skill tags, faculty names) — no contact info, no downloads, no full profile detail.
  - **Logged in (user):** full profile views, download question PDFs, submit questions/profile updates (goes to `pending` status).
  - **Moderator:** approve/reject questions and low-sensitivity submissions.
  - **Admin:** approve profiles, manage roles, full access.

### File storage
Use **Cloudflare R2** (S3-compatible, cheapest egress) or **UploadThing** (fastest to integrate with Next.js) for question PDFs, profile images, gallery photos, certificates.

### Search
Start with Postgres full-text search (`tsvector`/`tsquery`) on questions and profiles — it's free and sufficient at this scale. Only reach for Meilisearch/Typesense if search becomes a bottleneck later.

---

## 2. Suggested Stack Summary

| Layer | Choice |
|---|---|
| Frontend/Backend | Next.js 15 (App Router) + TypeScript |
| UI | shadcn/ui + Tailwind |
| Database | PostgreSQL (Neon) |
| ORM | Drizzle |
| Auth | Auth.js (NextAuth v5) |
| File storage | Cloudflare R2 or UploadThing |
| Search | Postgres full-text (upgrade later if needed) |
| Deployment | Vercel |

---

## 3. Core Data Model

The full field-level schema (types, constraints, resolved decisions on batch/section, student ID, alumni entry paths, etc.) lives in **`data-dictionary.md`** — that's the single source of truth for table shape now, so it isn't repeated or duplicated here.

The one principle worth restating: every user-submitted table (`profiles`, `questions`, club activity posts, etc.) shares the same `status` + `approvedBy` + `approvedAt` pattern so your admin/moderator approval UI can be built once and reused across resource types — don't build a bespoke approval flow per feature.

---

## 4. Suggested Build Order (phased MVP → full scope)

**Phase 1 — Foundation**
- Auth + roles (admin/moderator/user/guest)
- Student profile system + skill tagging (with approval)
- Admin dashboard: approve/reject profiles

**Phase 2 — Core content**
- Digital Question Bank (upload, tag, filter, search, approve)
- Faculty directory (admin-managed, no self-submission needed)

**Phase 3 — Community**
- Clubs & executive body pages
- Alumni network
- Notice board

**Phase 4 — Engagement**
- Event gallery + countdown
- Achievement hall of fame, project showcase

**Phase 5 — Extras** (lowest priority, build once core is stable)
- CGPA calculator, routine/calendar, blood donor directory, lost & found, freelancer directory, learning academy/courses, certificate verification

Building the approval-workflow pattern once in Phase 1 and reusing it everywhere will save you the most time across the whole roadmap.

---

## 5. A Few Things Worth Deciding Early

- **Skill hierarchy:** model as `skills` table with nullable `parentSkillId`, not as hardcoded enums — lets students/admins add new subskills without a code change.
- **"Top 15 Students per sector":** don't hardcode a ranking; either let admins pin profiles per skill category, or rank by an endorsement/vote count you design later.
- **Public search without login:** make sure your Postgres queries for guest search only `SELECT` the non-sensitive columns (name, batch, skill tags) — don't rely on frontend hiding to protect contact info.
