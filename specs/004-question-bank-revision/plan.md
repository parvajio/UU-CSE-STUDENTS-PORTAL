# Implementation Plan: Digital Question Bank — Revision (Schema, Layout & Cards)

**Branch**: `004-question-bank-revision` | **Date**: 2026-08-10 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/004-question-bank-revision/spec.md` — a **revision layer over the already-shipped 003 implementation** (live DB has 1 dev/test question row; migrations 0000–0004 applied). Reverses the curated subject/course hierarchy, adds multi-file + engagement model, and reworks the bank's page/card/detail UI. Clarified 2026-08-10 (download = per-image + ZIP; admin course add/edit in scope; self-likes allowed).

## Summary

Revise the shipped Question Bank: **schema** — drop `subjects`, flatten `courses` (no `subjectId`), drop `questions.customSubject/customCourse/program/evening/fileUrl`, add `programType`/`season`/`year`/`teacherName`/`viewCount`/`downloadCount`, new `question_files` (1–5 images XOR 1 pdf) + `question_likes` (unique per user+question) tables; **migration** — verified live state is 1 dev/test row, so use the two-step data move (`file_url` → `question_files`) then drop; **UI** — two-column bank (left filter panel incl. quick-searchable course & batch comboboxes, examType/programType/season/year; mobile drawer at 375px), live top-5 course/batch chips (COUNT+GROUP BY+ORDER BY+LIMIT, no cache), "Upload question" button top-right, redesigned card (code+date / title+course+batch+examType+programType tag+season+year+teacher / like+view counts + Preview+Download), Preview detail page (image gallery w/ prev/next + thumbnails OR embedded PDF viewer + metadata card), viewCount on page reach, downloadCount per download click (per-image and ZIP for image papers); **admin** — minimal course add/edit; **likes** — toggle, login required, self-likes allowed. Guest access rules (metadata only, no file URL, no like control) are preserved from 003 and extended to cover both file types.

## Technical Context

**Language/Version**: TypeScript 5.x on Next.js 15 (App Router), Node 20 LTS (unchanged from 003)

**Primary Dependencies**: drizzle-orm + @neondatabase/serverless; Auth.js v5; `uploadthing@^7.7.4` + `@uploadthing/react@^7.3.3`; lucide-react; shadcn/ui (button/select/input/badge/dialog/drawer or sheet/accordion/popover); clsx/tailwind-merge; Zod v4. ZIP bundling for multi-image download: **client-side `jszip`** (browser fetches the public image URLs and bundles them) — chosen over a server-side archiver to avoid a Vercel serverless streaming dependency and keep downloadCount increment on the client-triggered action. Fallback per clarification: if jszip proves problematic, per-image downloads only.

**Storage**: PostgreSQL on Neon (primary) — the 003 schema tables `subjects`/`courses`/`questions`/`question_tags` already exist in migration `0004`; this revision generates a new migration `0005` that alters them and adds `question_files`/`question_likes`. Files stay in UploadThing (public ACL) with the never-disclose pattern.

**Testing**: tsx runner scripts (extend `scripts/verify-guest-sql.ts` pattern with a question-files variant asserting no `fileUrl`/`question_files` URLs leak to guests); Playwright for SC-004 (guest payload + download denial), SC-008 (1–5 images XOR 1 pdf), SC-009 (double-like), SC-010 (counter increments), SC-011 (375px drawer), SC-012 (live chips); `drizzle-kit generate/migrate`; `npm run db:seed` now seeds `courses` only (subjects seed removed).

**Target Platform**: Vercel (serverless), Linux dev

**Project Type**: Web application — single Next.js app, no separate backend (constitution §I). Upload browser→UploadThing direct; DB writes via Server Actions; downloads via authed Route Handler; ZIP bundling client-side.

**Performance Goals**: search < 2s over up to 10k questions (SC-002); approved searchable within 5s (SC-003); live chips query must not degrade page load (capped LIMIT 5 queries, joined counts); detail page gallery renders instantly (images lazy-loaded with `loading="lazy"`).

**Constraints**: 1–5 images XOR exactly 1 pdf, ≤ 10 MB each (FR-019, enforced at UploadThing router + Zod + server action); shared 5/hour `enforceSubmissionLimit`, staff exempt (unchanged); guest responses MUST NOT contain any file URL (SC-004); `batchNumber` integer ≤ CURRENT_BATCH with quick-search; downloadCount increments per actual download click (FR-021); likes require login, unique `(questionId, userId)` (FR-020); admin course add/edit in scope (FR-030); courses referenced by questions are not deletable (FK restrict).

**Scale/Scope**: ~10k questions (≈ up to 5× files = ~50k `question_files` rows), ~200 peak concurrent users (in-memory rate-limit accepted limitation unchanged).

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Assessment |
|---|---|
| §I Stack & Architecture (Next.js single app, Postgres/Drizzle, Auth.js, UploadThing, Vercel) | ✅ Pass — no new backend; upload browser→UploadThing; DB via Server Actions; ZIP bundling is client-side (jszip) to stay serverless-friendly |
| §II Role-Based Access Control (guest = browse/search, no downloads; user = download + submit + like; moderator/admin = approve) | ✅ Pass — `question` already moderator-eligible; guest file gating enforced at query/route layer for BOTH image and pdf files; likes require login |
| §III Universal Approval Pattern (status/approvedBy/approvedAt + one dashboard) | ✅ Pass — `questions` keeps the three columns unchanged; `question_files`/`question_likes` are child tables and do not add approval columns |
| §IV Skill Hierarchy (self-referencing `skills`, no hardcoded enums) | ✅ Pass — untouched; `programType`/`season`/`examType` are per-question enums (fixed vocabularies per data-dictionary), not skill categories |
| §V Visual Identity & Design System | ✅ Pass — filter panel/grid/cards are flat surfaces; glass only on navbar/modal/hero; programType tags use the soft-tag recipe; chips reuse tag styles; dark mode built in; 150–200ms ease-out motion |
| Technology constraints (data-dictionary as schema source; batch dynamic dropdown; no Mongo; no separate backend) | ✅ Pass — schema revision is applied to `docs/data-dictionary.md` first (FR-029), then code; `batchNumber` keeps `getCurrentBatch()` dynamic dropdown + quick-search |
| Build order (Phase 2 before Phase 5) | ✅ Pass — Question Bank is Phase 2 Core Content |

**Gate result**: Pass. No unjustified violations. One accepted, documented limitation carried over from 003: public-ACL UploadThing means a leaked raw CDN key is technically fetchable — guest-URL denial is enforced at our app layer (guests never receive any working URL; our download route denies them).

**Post-Phase-1 re-check (after data-model + contracts):** Still Pass. Design artifacts introduce no principle drift — `question_files`/`question_likes` are child tables without approval columns (§III intact); guest gating extended to files array + like route (query whitelist + authed routes, §II intact); flat catalog has no hardcoded enums beyond fixed per-question vocabularies (§IV intact); ZIP is client-side so no backend split (§I intact).

## Project Structure

### Documentation (this feature)

```text
specs/004-question-bank-revision/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
│   ├── server-actions.md
│   ├── routes.md
│   └── ui-contracts.md
├── checklists/          # spec quality checklist (all passing)
└── spec.md              # Feature specification (source of truth, amendment layer)
```

### Source Code (repository root)

```text
src/
├── app/
│   ├── (guest)/question-bank/
│   │   ├── page.tsx                       # REWORK: two-column layout, filter panel, chips, grid, Upload button
│   │   └── [id]/page.tsx                  # REWORK: Preview page — gallery OR PDF viewer + metadata card; viewCount++
│   ├── (user)/upload-question/
│   │   ├── page.tsx                       # REWORK: "Subject/course" combobox, programType/season/year, teacher, multi-file
│   │   └── actions.ts                     # REWORK: createQuestion — new fields, files array, file rule validation
│   ├── (user)/my-submissions/             # extend: new fields + files shown (minor)
│   ├── (admin)/approve/                   # extend: question detail shows new fields + files (minor)
│   ├── (admin)/manage/courses/            # NEW: minimal course add/edit (FR-030)
│   │   ├── page.tsx
│   │   └── actions.ts
│   ├── api/questions/[id]/download/       # REWORK: downloadCount++, pdf redirect / image zip-or-redirect logic
│   └── api/questions/[id]/like/           # NEW: toggle like route (POST/GET) — login required
├── components/
│   ├── question-bank/
│   │   ├── QuestionSearch.tsx             # REWORK: filter panel client component (comboboxes, drawer, chips)
│   │   ├── QuestionCard.tsx               # REWORK: card redesign per FR-025
│   │   ├── QuestionDetailView.tsx         # REWORK: gallery + thumbnail strip / PDF viewer + metadata card
│   │   ├── QuestionLikeButton.tsx         # NEW: heart toggle (optimistic, login-gated)
│   │   ├── UploadForm.tsx                 # REWORK: combobox + new fields + multi-file dropzone (1-5 img XOR 1 pdf)
│   │   └── CourseCombobox.tsx             # NEW: searchable combobox over courses (code/title)
│   └── ui/                                # + combobox/drawer/accordion primitives if not present (shadcn)
├── lib/
│   ├── db/
│   │   ├── schema/
│   │   │   ├── courses.ts                 # REWORK: drop subjectId → flat standalone
│   │   │   ├── questions.ts               # REWORK: new columns, drop customSubject/customCourse/program/evening/fileUrl
│   │   │   ├── question-files.ts          # NEW: question_files
│   │   │   ├── question-likes.ts          # NEW: question_likes
│   │   │   ├── subjects.ts                # DELETE: subjects table (and relations/imports)
│   │   │   ├── index.ts                   # REWORK: exports
│   │   │   └── relations.ts               # REWORK: courses flat; add files/likes relations
│   │   ├── queries/
│   │   │   ├── question-bank.ts           # REWORK: new columns, files, like/view counts, chips query, viewCount++ helper
│   │   │   ├── catalog.ts                 # REWORK: getCourses (flat), drop subject grouping
│   │   │   ├── approval.ts                # REWORK: question details → new fields + files
│   │   │   └── course-admin.ts            # NEW: admin add/edit course actions/queries
│   │   └── seed.ts                        # REWORK: seed courses only (no subjects)
│   ├── question-bank/
│   │   ├── constants.ts                   # REWORK: drop OTHER_COURSE; add TOP_CHIPS_N=5, season/programType labels
│   │   ├── filters.ts                     # REWORK: parse programType, season, year; drop evening/subject/custom
│   │   └── validation.ts                  # REWORK: Zod — new fields, file-set rule (1-5 img XOR 1 pdf)
│   ├── uploadthing.ts                     # REWORK: questionFile router → multi-file (maxFileCount 5, no mixed types)
│   └── rate-limit.ts                      # unchanged (enforceSubmissionLimit reused; likes NOT rate-limited)
├── types/question-bank.ts                 # REWORK: new field/filter/file/like types
└── middleware.ts                          # + /manage/courses → ["admin"] only
```

**Structure Decision**: Single Next.js app (constitution §I). Schema continues the per-table file + centralized `relations.ts` layout; `subjects.ts` is deleted. The like toggle is a Route Handler (mutable, cache-busting, called from a client component) — downloads stay a Route Handler so gating lives in the HTTP layer, consistent with the existing download contract. ZIP bundling is client-side (jszip) to avoid serverless streaming.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| *(none — see Constitution Check)* | | |
