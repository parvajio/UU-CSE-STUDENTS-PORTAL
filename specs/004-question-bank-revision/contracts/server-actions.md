# Server Action & Query Contracts: Digital Question Bank — Revision

**Layer**: Next.js Server Actions + query functions called from Server Components / Route Handlers.

Amends `specs/003-question-bank/contracts/server-actions.md`. Superseded shapes (customSubject/customCourse, program/evening, fileUrl) are replaced below.

## Create Question (revised)

```typescript
async function createQuestion(data: {
  title: string;                                     // required, trimmed ≤200
  courseId: string;                                  // REQUIRED — combobox only (no "Other")
  batchNumber: number;                               // integer ≤ CURRENT_BATCH
  programType: "regular" | "diploma" | "evening";    // default "regular"
  season: "summer" | "fall" | "spring";              // required
  year: number;                                      // integer, required
  teacherName?: string;                              // optional free text
  examType: "previous_year" | "midterm" | "final" | "lab" | "viva";
  files: Array<{ fileUrl: string; fileType: "image" | "pdf"; order: number }>;
  tags?: string[];                                   // zero or more free-form tags
}): Promise<
  | { success: true; questionId: string; status: "pending" }
  | { success: false; error: string; fieldErrors?: Record<string, string>; retryAfter?: number }
>
```

**Behavior**:
1. `auth()` → redirect `/login` if not logged in.
2. Zod validate: `courseId` required; `files` = 1–5 all `image` XOR exactly 1 `pdf` (Q-004); `batchNumber` int; `programType`/`season`/`year` present (Q-002); `fileUrl` entries `https://`.
3. Re-verify course exists (`courses.id`) and `batchNumber ≤ CURRENT_BATCH` (defense in depth).
4. `enforceSubmissionLimit(userId)` → retryAfter on limit (staff exempt).
5. Single `db.batch`: insert `questions` (status `pending`) + `question_files` rows (ordered) + `question_tags` rows (case-insensitive dedupe).
6. `revalidatePath` on `/upload-question`, `/my-submissions`, `question-bank` tag.

## Search Questions (revised query contract)

```typescript
// src/lib/db/queries/question-bank.ts — query fn, NOT a Server Action
type ViewerRole = "guest" | "user" | "moderator" | "admin";

async function searchQuestions(params: {
  query?: string;              // universal substring search — see buildUniversalTerm
  courseId?: string;           // flat course filter (no subject, no "Other")
  batchNumber?: number;        // quick-searchable
  examType?: ExamType;
  programType?: "regular" | "diploma" | "evening";
  season?: "summer" | "fall" | "spring";
  year?: number;
  tags?: string[];             // question matches ALL tags
  page?: number;
  pageSize?: number;
}, viewerRole?: ViewerRole): Promise<{
  items: Array<{
    id: string; title: string; batchNumber: number;
    programType: ProgramType; season: Season; year: number;
    teacherName: string | null; examType: ExamType;
    courseCode: string; courseTitle: string;
    likeCount: number; viewCount: number; downloadCount: number;
    isLikedByViewer?: boolean;         // only when viewerRole !== "guest" (LEFT JOIN likes)
    tags: string[];
    // files/fileUrls NEVER present for guest
  }>;
  total: number;
}>
```

**Guest rule**: `viewerRole === "guest"` ⇒ `question_files` rows and any file URL are excluded from the payload; counts and metadata included; `isLikedByViewer` absent.

**Universal search (`buildUniversalTerm`)**: when `query` is present it ORs partial/substring conditions (still ANDed with structured filters): `titleTsv @@ plainto_tsquery(term)` (uses the stored GIN `title_tsv` column), `courses.code`/`courses.title` (EXISTS + `ilike`), `question_tags.tag` (EXISTS + `ilike`), `teacherName` (`ilike`), submitter name via `users.profile.fullName` (EXISTS + `ilike`), season/program enum-value or `SEASON_LABELS`/`PROGRAM_TYPE_LABELS` label match, and for all-digit terms `year = n OR batchNumber = n`. LIKE `%`/`_`/`\` are escaped. `examType` labels are intentionally not matched.

## Quick-select chips (three queries)

The three chip queries plus `getCatalog`/`getCurrentBatch` are **cached** for the page shell via `unstable_cache` (tag `question-bank`, 5-min TTL) — they only re-run on tag invalidation (approve/reject/upload/like → `revalidateTag("question-bank")`) rather than on every filter navigation; filter navigations run only `searchQuestions` (see `page.tsx` shell + `results.tsx` split).

```typescript
async function getTopCourses(n: number): Promise<
  Array<{ courseId: string; code: string; title: string; count: number }>
>
// Top N courses by upload count over status='approved' (COUNT + GROUP BY + ORDER BY count DESC, latest DESC + LIMIT n), cached (tag `question-bank`).

async function getRecentBatches(n: number): Promise<
  Array<{ batchNumber: number; count: number }>
>
// Most RECENT batches that have approved questions (GROUP BY batchNumber ORDER BY batchNumber DESC LIMIT n) — recency ranking, not popularity. Cached.

async function getPopularTags(n: number): Promise<
  Array<{ tag: string; count: number }>
>
// Top N tags by usage across approved questions (question_tags JOIN approved questions, GROUP BY tag ORDER BY count DESC LIMIT n). Cached.
```

## Get Question Detail (revised)

```typescript
async function getQuestionDetail(id: string, viewerRole: ViewerRole): Promise<
  | {
      id: string; title: string; batchNumber: number;
      programType: ProgramType; season: Season; year: number;
      teacherName: string | null; examType: ExamType;
      courseCode: string; courseTitle: string; creditHours: string;
      submitterName: string | null; createdAt: string; updatedAt: string;
      likeCount: number; viewCount: number; downloadCount: number;
      isLikedByViewer?: boolean;      // non-guest only
      tags: string[];
      files: Array<{ fileUrl: string; fileType: "image" | "pdf"; order: number }>;  // NON-GUEST ONLY
    }
  | null
>
```

**Guest rule**: `files` array is omitted entirely for guests; the server component renders the "Log in to download/preview" prompt. Increments `viewCount` atomically on page reach (before returning).

## Like toggle (Route Handler — see routes.md)

Returns `{ liked: boolean; count: number }`; login required.

## Record download (server action, auth-gated)

```typescript
async function recordDownload(data: { questionId: string; kind: "file" | "zip" }): Promise<{ downloadCount: number }>
// auth() required; increments questions.downloadCount atomically; revalidates detail card counts.
```

Used by the client-side ZIP path (the ZIP is bundled in the browser, so the Route Handler can't increment it server-side). The direct-file download path increments inside the existing download Route Handler instead (no double count).

## Course admin (new)

```typescript
async function createCourse(data: { code: string; title: string; creditHours: string }): Promise<
  | { success: true } | { success: false; error: string }
>
async function updateCourse(data: { id: string; title?: string; creditHours?: string }): Promise<
  | { success: true } | { success: false; error: string }
>
// admin role only (session check); code unique enforced by DB + friendly error; delete intentionally absent (FK restrict).
```

## Approve / Reject (unchanged signatures, revised details payload)

```typescript
async function approveItem(data: { resourceType: "question"; resourceId: string }): Promise<DecideItemResult>
async function rejectItem(data: { resourceType: "question"; resourceId: string; reason?: string }): Promise<DecideItemResult>
```

`approvalQueries.question` details now include: title, courseCode/courseTitle, batchNumber, programType, season, year, teacherName, examType, tags, and files (fileUrl + fileType + order — reviewer-visible; this is an authed dashboard payload).
