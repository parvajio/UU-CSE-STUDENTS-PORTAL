# Server Action Contracts: Digital Question Bank

**Layer**: Next.js Server Actions (imported and called directly from client components)

Supersedes the placeholder `uploadQuestion`/`searchQuestions` shapes in `specs/002-portal-user-scenarios/contracts/server-actions.md` — the free-text `subject`/`course`/`batch` are gone, replaced by the curated-catalog + `batchNumber` + flags model.

## Upload Question

```typescript
// Creates a pending question row (universal approval trio → status="pending").
async function createQuestion(data: {
  title: string;
  // Exactly one classification path (Q-003):
  courseId?: string;                              // curated course — XOR with customSubject/customCourse
  customSubject?: string;                         // XOR fallback path
  customCourse?: string;
  batchNumber: number;                            // integer ≤ CURRENT_BATCH (Q-004)
  program: "regular" | "diploma";                 // default "regular" (Q-005)
  evening: boolean;                               // default false (Q-005)
  examType: "previous_year" | "midterm" | "final" | "lab" | "viva";
  fileUrl: string;                                // UploadThing handoff URL (Q-006)
  tags?: string[];                                // zero or more free-form tags (optional)
}): Promise<
  | { success: true; questionId: string; status: "pending" }
  | { success: false; error: string; fieldErrors?: Record<string, string>; retryAfter?: number }
>
```

**Behavior**:
1. `auth()` → 401/redirect if not logged in.
2. Zod validate (Q-003 XOR, Q-004, Q-005, Q-006, Q-007).
3. `enforceSubmissionLimit(userId)` → `{success:false, error, retryAfter}` on limit (moderator/admin exempt via pre-check).
4. `db.insert(questions)` with universal trio defaulted to pending; insert `question_tags` rows in same transaction.
5. `revalidatePath("/upload-question")` (+ `/my-submissions`).

## Search Questions

```typescript
// src/lib/db/queries/question-bank.ts — NOT a Server Action; a query fn called from pages.
type ViewerRole = "guest" | "user" | "moderator" | "admin";

async function searchQuestions(params: {
  query?: string;
  subjectId?: string;       // filter courses under subject group
  courseId?: string;        // curated course (or special "other" marker)
  batchNumber?: number;
  examType?: ExamType;
  program?: "regular" | "diploma";
  evening?: boolean;
  tags?: string[];          // question matches ALL tags
  page?: number;
  pageSize?: number;        // reuse APPROVAL_PAGE_SIZE convention
}, viewerRole?: ViewerRole): Promise<{
  items: QuestionCard[];    // columns: id,title,batchNumber,examType,program,evening,
                            //   courseTitle,courseCode,subjectName | customCourse, tags
                            //   fileUrl NEVER present for guest
  total: number;
}>
```

**Guest rule**: `viewerRole === "guest"` ⇒ whitelist `columns` exclude `fileUrl`. Guests also see only `status='approved'`.

## Get Question Detail

```typescript
async function getQuestionDetail(id: string, viewerRole: ViewerRole): Promise<
  | QuestionDetail          // includes fileUrl ONLY for viewerRole !== "guest"
  | null                     // not found OR (guest && status !== approved)
>
```

## My Submissions

```ts
async function getMyQuestions(userId: string): Promise<MyQuestionRow[]> // status badge + rejection reason
```

## UploadThing handoff (not a Server Action)

```ts
// src/lib/uploadthing.ts — server file router
export const ourFileRouter = {
  questionFile: f({ pdf: { maxFileSize: "10MB", maxFileCount: 1 }, image: { maxFileSize: "10MB", maxFileCount: 1 } })
    .middleware(({ req }) => { /* auth(); throw UploadThingError if guest */ })
    .onUploadComplete(() => { /* no DB write — fileUrl flows via createQuestion */ }),
};

// client component: <UploadDropzone endpoint="questionFile" onClientUploadComplete={(res) => setFileUrl(res[0].ufsUrl)} />
```

The file router must NOT be the system-of-record for the question row — it only authorizes the upload and returns the URL; the `createQuestion` Server Action owns the DB row.

## Approve / Reject (reuse, unchanged signature)

```typescript
async function approveItem(data: { resourceType: "question"; resourceId: string }): Promise<DecideItemResult>
async function rejectItem(data: { resourceType: "question"; resourceId: string; reason?: string }): Promise<DecideItemResult>
```

## Download (Route Handler)

Not a Server Action — an HTTP route so gating lives at the access layer (see `routes.md`).