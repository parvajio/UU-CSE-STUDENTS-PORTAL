# Implementation Plan: T052–T054 (Validation, Guest-SQL Audit, Load Test)

**Branch**: `002-portal-user-scenarios` | **Feature**: `specs/002-portal-user-scenarios`

## Summary

Three cross-cutting validation tasks for the already-shipped Foundation build:

- **T052** — Run quickstart scenarios 1–4 end-to-end via **Playwright** (fresh install; the same tool serves T054). Covers US1–US4 + RBAC. Scenario 4 (question bank) is **deferred to Phase 2** — the `questions` table/UI do not exist in Foundation scope.
- **T053** — Prove the guest query in `src/lib/db/queries/directory.ts` never returns contact fields: static review + a runnable script that asserts the runtime shape AND the raw SELECT clause.
- **T054** — Load test: seed 5,000 synthetic approved profiles, benchmark `searchDirectory` (all search paths) with timed real calls + `EXPLAIN ANALYZE`, assert < 2,000 ms (SC-008). The 10,000-questions half auto-skips (no `questions` table until Phase 2), then cleans up all seeded rows.

## Decisions (user-confirmed)

1. **T052 tooling** = Playwright (one install also covers T054). No curl runbook.
2. **Scenario 4** = defer; validate scenarios 1–3 only.
3. **Scenario 3 step 6** (`/manage/roles` UI) = verify admin-only access via the `/approve` page that exists in Foundation. Classify `/manage/roles` by grepping `tasks.md`/`plan.md` before writing the report ("never scoped" vs "deferred").
4. No new app-code changes — only `scripts/`, `e2e/`, `playwright.config.ts`, and `tasks.md` checkoffs.

## Files

| File | Action |
|---|---|
| `playwright.config.ts` | new — chromium project, `baseURL http://localhost:3000`, `webServer: npm run dev`, `reuseExistingServer: !CI`, 1 worker |
| `e2e/foundation.spec.ts` | new — serial spec, US1–US4 + RBAC scenarios |
| `scripts/verify-guest-sql.ts` | new — T053 |
| `scripts/load-test.ts` | new — T054 |
| `package.json` | add `"test:e2e": "playwright test"` script |
| `.gitignore` | add `/test-results/`, `/playwright-report/`, `/blob-report/`, `/playwright/.cache/` |
| `specs/002-portal-user-scenarios/tasks.md` | mark T052/T053/T054 `[X]` |

Dependency: `npm i -D @playwright/test` + `npx playwright install chromium` (already installed this session).

---

## T052 — Playwright E2E (quickstart scenarios 1–3 + US4)

### Selectors discovered (source of truth for the spec)

- Register (`src/components/auth/RegisterForm.tsx`): `#email`, `#password`, `#confirmPassword`, button `Create account`.
- Login (`src/components/auth/LoginForm.tsx`): `#email`, `#password`, button `Sign in` (exact — avoid "Sign in with Google").
- Profile form (`src/components/directory/ProfileForm.tsx`): labels `Full name`, `Student ID`, `Bio`, `GitHub`, `WhatsApp number`; Radix selects `aria-label="Section"`/`aria-label="Batch"` with `role=option` items; skill pills are `<button>`s named by skill text (e.g. `Web Development`); submit `Submit for review`.
- Profile view (`src/app/(user)/profile/ProfileView.tsx`): button `Edit Profile`; pending banner text `Your profile is under review`.
- Approvals (`src/app/(admin)/approve/page.tsx` + `src/components/approval/ApprovalCard.tsx`): card container `div.rounded-xl.border` with heading = `submitterName` (profile `fullName`); per-card `Review` button opens dialog with `Approve`/`Reject`.
- Directory (`src/app/(guest)/directory/page.tsx`): search `aria-label="Search directory"`, submit `Search`, result heading = `fullName`.
- StatusBadge (`src/components/approval/StatusBadge.tsx`): pending label = `Pending Review`.

### Test data (generated fresh per run to survive the in-memory rate limits)

- `runId = Date.now().toString(36)`
- student email `e2e.student.<runId>@example.test`, password `Str0ngP@ssw0rd!`
- student name `E2E Student <runId>`, studentId `E2E-<runId>` (unique per run → no SID clash across runs)
- contact fields used in assertion: WhatsApp `+8801999999999`, GitHub URL
- admin: `ADMIN_SEED_EMAIL=admin@cse-portal.edu`, `ADMIN_SEED_PASSWORD=changeme123` (confirmed in `.env`)

### Spec outline (serial, shared student context via `beforeAll`)

1. **US2 — register + submit pending profile**
   Register, redirect to `/`, open `/profile`, fill form (batch 65, section A, skills: Web Development, bio + contact fields), submit → assert "under review" banner; `/my-submissions` shows `Pending Review` + name.
2. **US1a — guest search hides pending profile**
   Fresh guest context, search by student name → heading count 0.
3. **US3 — admin approves**
   Fresh admin context, login, `/approve` → find card by name → `Review` → `Approve` → heading count 0.
4. **US1b — guest search shows approved profile (scenario 1)**
   Guest search by skill `Web Development` AND by name → card visible with name, `Batch 65`, `Web Development` pill; assert `+8801999999999` and GitHub URL **absent** (count 0).
5. **Scenario 3 — RBAC**
   - Guest `/profile` → redirected to `/login?callbackUrl=...`.
   - Student `/manage/roles` → HTTP 403 + `Forbidden` body (middleware).
   - Admin `/approve` → `Approvals` heading visible (admin-only surface stands in for `/manage/roles` UI step).
6. **US4 — edit approved profile reverts to pending**
   Student `/profile` → `Edit Profile` → change bio → submit → banner shows; guest search by name → heading count 0.

### Pre-run

```bash
npm run db:seed        # admin + 6 skills (idempotent)
npx playwright test    # starts/ reuses dev server on :3000
```

### Report

Terminal PASS/FAIL per acceptance scenario (spec.md), plus a classification of `/manage/roles`:

> **Grep first**: `rg -n "manage/roles" specs/002-portal-user-scenarios/tasks.md specs/002-portal-user-scenarios/plan.md specs/002-portal-user-scenarios/spec.md`
> - Appears in `tasks.md`/`plan.md` but not built → flag as real gap + follow-up.
> - Absent from tasks/plan (only in `contracts/auth.md` route map) → report as "never scoped in T001–T054", not "deferred".
> (Verified this session: `/manage/roles` appears in `contracts/auth.md` and `src/middleware.ts` route maps only — **not** in tasks.md or plan.md. Expected classification: never scoped.)

Scenario 4 recorded as **deferred to Phase 2** (requires `questions` schema + upload UI + file storage).

---

## T053 — Guest SQL contact-field audit

### Static (already confirmed this session)

`src/lib/db/queries/directory.ts:91-93` — guest branch `columns: { id: true, fullName: true, batchNumber: true }`; skills via `with` → `profileSkills.columns: {}` + `skill: { id, name, slug, colorKey }`. None of the contact columns (`whatsapp_number`, `facebook_url`, `linkedin_url`, `portfolio_url`, `github_url`, `bio`, `avatar_url`, `section`) appear.

### New `scripts/verify-guest-sql.ts` (tsx, no new deps)

1. **Runtime shape**: run real `searchDirectory({ query: "x" }, "guest")` against dev DB; assert every returned row's keys ⊆ `{id, fullName, batchNumber, skills}` and each skill's keys ⊆ `{id, name, slug, colorKey}`.
2. **Raw SELECT**: build the exact guest-shaped `findMany` on a `drizzle(neon(url), { schema, logger: true })` client (logging prints the SQL); collect the printed SQL; assert none of the 8 contact column names appear; print the SQL for the record.
3. Same pair of checks for the skill-name search path (EXISTS subquery).
4. Exit non-zero on any failure; PASS summary otherwise.

---

## T054 — Load test (SC-008: search < 2 s @ 5k profiles / 10k questions)

### New `scripts/load-test.ts` (tsx, no Playwright needed; EXPLAIN ANALYZE per task)

1. **Seed 5,000 synthetic approved profiles**
   - 5,000 `users` (email `loadtest+<i>@example.test`, `authProvider: 'unclaimed'`, `passwordHash: null` — allowed by schema, avoids bcrypt cost).
   - 5,000 `profiles` (unique `studentId` `LT-<i>`, batch 1..CURRENT_BATCH random, section A–F random, `status: 'approved'`).
   - `profile_skills` (1–3 random of the 6 seeded skills per profile).
   - Insert in chunks of 1,000.
2. **Benchmarks** (`performance.now()` around real `searchDirectory` calls — end-to-end incl. Neon round-trip):
   - name hit (`query: "Load Test 4999"`), name miss (worst case, no match),
   - skill search (`query: "Web Development"`),
   - batch filter, full listing (limit 100), combined query.
3. **`EXPLAIN (ANALYZE, BUFFERS)`** on the equivalent raw SQL for name + skill searches to confirm **Index Scan** on `idx_profiles_fullname_trgm` (not Seq Scan) and print the plan.
4. **Assert** each timed run < 2,000 ms; FAIL + exit 1 if exceeded.
5. **Questions half**: `SELECT to_regclass('public.questions')` — absent in Foundation → print `SKIP (Phase 2)`, record as deferred assert in report. (Script is written so the 10k-questions branch drops in when the schema lands.)
6. **Cleanup**: `DELETE profile_skills → profiles → users` for rows matching the `loadtest+%` email prefix, restoring the dev DB; print counts.

Run: `npx tsx --env-file=.env scripts/load-test.ts` (mirrors `db:seed`'s env pattern). Flags: `--profiles=<n>` to override, `--no-cleanup` to keep data.

---

## Execution order

1. `npm run db:seed` (idempotent — admin + skills)
2. Run T052 spec (`npx playwright test`) → fix/note failures
3. Run T053 script → capture SQL + pass/fail
4. Run T054 script (seed → benchmark → cleanup)
5. Grep `/manage/roles` (done — never scoped in T001–T054), write report
6. Mark T052/T053/T054 `[X]` in tasks.md
7. Report to user (validation table + load numbers + gap notes)

## Risks / notes

- **Rate limits (in-memory)**: `registerUser` caps at 5/hour per IP; `upsertProfile` edit caps at 1/hour/user. Fresh emails per run stay under the cap; >5 runs in an hour need a dev-server restart to reset the Map.
- **Playwright + dev server**: `reuseExistingServer: !CI`; stale `.next` cache can cause phantom build errors → `rm -rf .next` if build misbehaves (seen this session).
- **Neon latency** is included in timed `searchDirectory` calls (real SC-008 signal); dev-DB numbers are representative, not production-tuned.
- No application source changes required for T052–T054.
