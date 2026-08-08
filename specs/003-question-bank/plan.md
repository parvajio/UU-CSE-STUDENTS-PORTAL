# Implementation Plan: Digital Question Bank

**Branch**: `003-question-bank` | **Date**: 2026-08-08 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/003-question-bank/spec.md` + `/specify` curated-catalog amendment + user directives (schema exactly as in `docs/data-dictionary.md`, access-layer guest enforcement, UploadThing integration points, guest detail-page pattern parity).

## Summary

Build the Digital Question Bank as Phase 2 (Core Content) on top of the completed Foundation. Students upload past papers (title, curated `subjects`/`courses` classification or "Other" free-text fallback, `batchNumber` from the dynamic dropdown, `program`/`evening` flags, examType, one PDF/PNG/JPEG ≤ 10 MB via UploadThing, free-form tags) → `pending` → moderator/admin approves via the existing unified approval dashboard (register a `question` handler — no new permission rules) → publicly searchable/filterable (multi-filter AND, group courses under subjects with an "Other" group) with **login-only file download enforced at the query/route layer**. Guests get a metadata-only detail page with a "Log in to download" prompt and never receive a `fileUrl` in any response. Reuses: universal approval pattern, shared 5/hour rate limit, search helper, notifications, My Submissions.

## Technical Context

**Language/Version**: TypeScript 5.x on Next.js 15 (App Router), Node 20 LTS

**Primary Dependencies**: drizzle-orm + @neondatabase/serverless, Auth.js v5 (`next-auth@beta`), `uploadthing@^7.7.4` + `@uploadthing/react@^7.3.3` (installed, unused), lucide-react, shadcn/ui (button/select/input/badge/textarea/dialog), clsx/tailwind-merge

**Storage**: PostgreSQL on Neon (primary). Question-paper files in UploadThing v7 — **public ACL, never-disclose pattern** (user decision 2026-08-08): guests never receive the CDN URL from any query/route; download URL is handed out only through an auth-gated path. Residual risk (a leaked raw CDN key is technically fetchable) is documented and accepted.

**Testing**: tsx runner scripts (mirrors Foundation's `scripts/verify-guest-sql.ts` / `scripts/load-test.ts` pattern); Playwright for the guest-download-delegation scenario (SC-004); `drizzle-kit generate/migrate`; `npm run db:seed` extended for subjects/courses.

**Target Platform**: Vercel (serverless), Linux dev

**Project Type**: Web application — single Next.js app, no separate backend (constitution §I). Upload via UploadThing client components (browser→UploadThing direct); DB writes via Server Actions.

**Performance Goals**: search results < 2s for up to 10,000 questions (SC-002, mirror of spec 002 SC-008); approved question publicly searchable within 5s (SC-003); upload flow < 5 minutes end-to-end (SC-001, manual).

**Constraints**: single file per question, PDF/PNG/JPEG, ≤ 10 MB, rejected at upload step; shared 5/hour content-submission limit (`enforceSubmissionLimit`), moderators/admins exempt; guest responses MUST NOT contain `fileUrl` (access-layer rule, not UI hiding); `questions.courseId` XOR `customSubject`+`customCourse` — never both, never neither (SC-004a); `program`/`evening` flags always set (SC-004b).

**Scale/Scope**: ~10k questions, ~200 peak concurrent users (matches AGENTS.md in-memory rate-limit accepted limitation).

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Assessment |
|---|---|
| §I Stack & Architecture (Next.js single app, Postgres/Drizzle, Auth.js, UploadThing, Vercel) | ✅ Pass — no new backend; upload is browser→UploadThing direct, DB via Server Actions |
| §II Role-Based Access Control (guest = browse/search, no downloads; user = download + submit; moderator/admin = approve `question`) | ✅ Pass — `question` is already moderator-eligible in `canApprove`; guest file gating enforced at query/route layer, never UI hiding |
| §III Universal Approval Pattern (status/approvedBy/approvedAt + one dashboard) | ✅ Pass — `questions` carries the three columns; `approvalQueries`/`decisionHandlers` get a `question` entry reusing the dashboard |
| §IV Skill Hierarchy (self-referencing `skills`, no hardcoded enums) | ✅ Pass — untouched; question *tags* are free-form text via join table, deliberately NOT skills |
| §V Visual Identity & Design System | ✅ Pass — glassmorphism only on featured/nav/modal surfaces; forms/tables/tags follow existing recipes |
| Technology constraints (data-dictionary as schema source; batch dynamic dropdown; no Mongo; no separate backend) | ✅ Pass — schema copied verbatim from `docs/data-dictionary.md`; `batchNumber` reuses `getCurrentBatch()` dropdown pattern |
| Build order (Phase 2 before Phase 5) | ✅ Pass — Question Bank is Phase 2 Core Content |

**Gate result**: Pass. No unjustified violations. One accepted, documented limitation (not a violation): public-ACL UploadThing means a leaked raw CDN key is technically fetchable — guest-URL denial is enforced at our app layer (guests never receive any working URL and our download endpoint denies them); full SC-004 is satisfied for every URL the portal itself ever produces.

## Project Structure

### Documentation (this feature)

```text
specs/003-question-bank/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
│   ├── server-actions.md
│   └── routes.md
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
src/
├── app/
│   ├── (guest)/question-bank/            # public search + metadata-only detail page
│   │   ├── page.tsx
│   │   └── [id]/page.tsx                 # detail; "Log in to download" for guests
│   ├── (user)/upload-question/
│   │   ├── page.tsx
│   │   └── actions.ts                    # createQuestion server action (+ tag insert)
│   ├── (user)/my-submissions/            # extended: question rows join profile row
│   │   └── page.tsx
│   ├── (admin)/approve/                  # existing dashboard; new question handler wired
│   ├── api/questions/[id]/download/      # auth-gated file delivery (Route Handler)
│   └── api/uploadthing/                  # UploadThing route handler (core.ts + route.ts)
├── components/
│   ├── question-bank/                    # QuestionSearch, QuestionCard, TagPill, DetailView, UploadForm (client)
│   └── shared/                           # existing EmptyState, LoadingSkeleton, StatusBadge
├── lib/
│   ├── db/
│   │   ├── schema/                       # NEW subjects.ts, courses.ts, questions.ts, question-tags.ts
│   │   │   └── relations.ts              # add the four Relations blocks
│   │   ├── queries/
│   │   │   ├── question-bank.ts          # searchQuestions(deps: viewerRole), getQuestionDetail
│   │   │   ├── questions-mine.ts         # my submissions
│   │   │   └── approval.ts               # + question entry in approvalQueries
│   │   ├── seed.ts                       # + seedQuestionBank (subjects/courses from JSON)
│   │   └── seed-data/uu-cse-courses-seed.json  # existing; first consumer added
│   ├── uploadthing.ts                    # file router (core) + typed client components
│   └── auth/                             # existing auth(); upload middleware reuses session
├── middleware.ts                         # already pre-configured: /question-bank public, /upload-question user+
└── types/                                # QuestionCard, QuestionDetail, QuestionInput types
```

**Structure Decision**: Single Next.js app (constitution §I). Schema mirrors the established per-table file + centralized `relations.ts` layout. Upload route handler is the only new `src/app/api` surface (UploadThing requires `app/api/uploadthing/route.ts`); file delivery uses a Route Handler so download gating lives in HTTP-layer access control, mirroring the directory's query-layer guest whitelist.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| *(none — see Constitution Check)* | | |
