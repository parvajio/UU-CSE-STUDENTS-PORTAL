# UI Contracts: Digital Question Bank — Revision

**Layer**: Client components (React, shadcn/ui + Tailwind, lucide-react 1.5px stroke)

Design ground rules from `docs/design-direction.md` + the frontend-design skill: filter panel, cards, gallery, forms are **flat surfaces** (no glass — glass is navbar/hero/modal/featured only); programType/examType badges use the **soft tag** recipe (999px radius, low-opacity fill, matching border); motion 150–200ms ease-out; dark mode from day one; keyboard focus states; usable at 375px.

## Question Bank page (two-column)

| Region | Behavior |
|---|---|
| Header row | Title + "Upload question" button top-right (`Button` → `/upload-question`; guests → `/login?callbackUrl=...` with `safeCallbackUrl`) |
| Quick-select chips | Per-field chip rows placed above their controls: top courses by upload count (`getTopCourses`), recent batches with approved papers (`getRecentBatches`, grouped batchNumber DESC — recency, not popularity; **chip label is the bare batch number**, e.g. `61`, no "Batch " prefix), a client-side year row (All + current/previous year), and popular tags by usage (`getPopularTags`). Each chip carries a **per-item hue** (`soft-tag--hue`, inline `--tag-h` from a stable hash `chipHue(key)`); **selected = solid fill** (`soft-tag--active`: ~95% hue fill + white text); count badge is hue-tinted and inverts to white when selected; horizontally scrollable on mobile (wrap on desktop); tapping toggles the filter (single-select per field; tags multi-select shortcut into the tag input) |
| Filter panel (left, ~1/3 width on lg) | **Transparent** — sits directly on the page background (no `bg-muted`/border box, light + dark). "Subject/course" searchable combobox + course chips; batch quick-search combobox + recent-batch chips; examType / programType / season / year as **segmented pill rows** (All + each option, single-select) that are **colorful at rest** too — each pill uses `soft-tag--hue` with **one hue per group** (exam=270 violet, program=210 blue, season=170 teal, year=35 amber) and selected = solid `soft-tag--active` fill; year number input; tags chip input + popular-tag shortcut chips. Inputs/combobox triggers use `rounded-xl` for a rounded, soft look |
| Results header | Server-rendered row above the grid: "N papers" (aria-live) + **Clear all filters** link (→ `/question-bank`) shown when any filter param is active. Replaces the old in-panel footer so the count stays accurate per filter |
| Card grid (right) | responsive grid `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`, gap-4, cards flat with hover lift `translateY(-2px)` |
| Mobile (< md) | filter panel collapses into a **drawer/accordion above the grid** — fully operable at 375px (sheet/drawer opens from top or inline accordion); chips row scrolls horizontally; no page-level horizontal scroll |
| Pagination | unchanged from 003 (prev/next), preserved in the grid column |

## Live-but-smooth filtering

- Chip/pill selection reads/writes an optimistic `pending` copy of the URL params — the tapped chip fills solid **instantly**; navigation is coalesced with a trailing ~275ms debounce so rapid taps produce a single server render (wrapped in `useTransition`).
- Text inputs (search, year) debounce ~400ms; tag input commits on Enter/blur.
- **Search feedback**: commits signal a module-level `search-pending` store (`src/lib/question-bank/search-pending.ts`); the client `ResultsGate` swaps the grid to `<ResultsSkeleton aria-busy>` while a search is in flight and clears on the landing URL change (`router.replace` returns `void` in Next 15). A same-URL guard skips redundant commits so pending can't stick.
- Page split: `page.tsx` is a static shell (header + filter panel) with **cached** chip/catalog data (`unstable_cache`, tag `question-bank`, 5-min TTL — refreshed by the existing `revalidateTag("question-bank")` on approve/reject/upload/like); a server `Results` component inside a `<Suspense fallback={<ResultsSkeleton />}>` runs **only** `searchQuestions` per navigation, wrapped by `ResultsGate`.
- Dark mode: chips raise fill/border alpha (`--tag-s: 60%`, bg 0.17, border 0.45, text 80% lightness) and active becomes fully solid so hues stay legible on dark surfaces.
- URL remains the single source of truth and shareable (`?batch=67&exam=midterm`); browser back/forward and the Clear-all link re-sync the optimistic state.
- Search box: universal substring search — placeholder/`aria-label` teach the scope (titles, courses, tags, teacher, season, year…).

## Question card (FR-025)

```
┌──────────────────────────────┐
│ CSE0612301            Aug 09 │   top: course code + upload date (muted, small)
├──────────────────────────────┤
│ Midterm — DBMS                │   title (font-heading, semibold)
│ Database Management System    │   course name
│ Batch 68 · Midterm            │   batch + examType
│ [Regular]  Summer 2025        │   programType soft tag + season year
│ Dr. A. Rahman                 │   teacherName (muted; hidden if empty)
├──────────────────────────────┤
│ ♥ 12  👁 340       Preview ↗ Download ↓ │  bottom row
└──────────────────────────────┘
```

- Heart: `QuestionLikeButton` — filled when liked (authed), outline otherwise; optimistic toggle; guest renders a disabled heart that links to login. Counts `likeCount`.
- Eye: static `viewCount` display.
- "Preview" → `/question-bank/[id]`; "Download" → `/api/questions/[id]/download?kind=file` (pdf) or `?kind=zip` client path for images (per clarification; per-image fallback).

## Detail / Preview page (FR-026)

Two-region layout (main + side, `lg:grid-cols-[1fr_320px]`), single column on mobile.

- **Images**: main area shows the selected image large (`loading="lazy"`, `object-contain`, max-height viewport-safe); prev/next chevron buttons when >1; thumbnail strip below/beside (buttons, aria-current for active). 
- **PDF**: main area embeds the file (`<iframe title="Question paper" className="h-[70vh] w-full">` with a "Download PDF" fallback CTA). Guests never reach this region — server component renders the prompt instead.
- **Metadata card**: course (code + title + creditHours), batch, examType, programType tag, season + year, teacherName, uploader fullName, upload date; like button + view/download counts; **Download** button (image: ZIP + per-image menu; pdf: direct).
- Guest view: metadata card only + "Log in to download/preview" prompt; no file, no like control.

## Upload form (revised)

- "Subject/course": `CourseCombobox` — input filters flat `courses` by code OR title; arrow-key navigation; shows code + title per row; required.
- Batch: quick-search dropdown (`Array.from({length: currentBatch})`, type-to-narrow) — required.
- examType select (required); programType segmented select default Regular (required); season select + year input (required); teacherName text (optional).
- Tags: unchanged chip input (≤10, free-form).
- File dropzone: multi-file; pre-upload validation enforces all-images 1–5 XOR exactly 1 pdf with inline errors ("Add up to 5 images", "Images or PDF — not both"); reorder thumbnails (order becomes `question_files.order`).
- Submit → "Submitted for review" state; rate-limit error shows retry time.

## Course combobox (shared)

`CourseCombobox` (input + Radix Popover list, filtered by code/title substring, case-insensitive) used in upload form and filter panel. Batch combobox reuses the same primitive with numeric items.

## Admin course management (`/manage/courses`)

Table of courses (code, title, creditHours) + inline add form (code/title/creditHours, code unique error) + edit (title/creditHours). No delete control (FK restrict). Flat, admin-only route.
