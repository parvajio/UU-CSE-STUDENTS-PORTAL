# Route Contracts: Digital Question Bank — Revision

**Layer**: App Router pages + Route Handlers (HTTP)

Amends `specs/003-question-bank/contracts/routes.md`.

## Page routes

| Route | Access | Role read | Description |
|---|---|---|---|
| `/question-bank` | public (guest) | `viewerRole = session?.user?.role ?? "guest"` | **REWORK**: two-column layout — left filter panel (course combobox, batch quick-search, examType, programType, season/year), right card grid; live top-5 course/batch chips; "Upload question" button top-right (guest → login). Guests see metadata cards only (no file URLs, no `isLikedByViewer`) |
| `/question-bank/[id]` | public (guest) | `viewerRole` | **REWORK**: Preview page — image gallery (large view + prev/next + thumbnail strip) or embedded PDF viewer in the main area, metadata card alongside (course, batch, examType, teacher, uploader, program/season/year) with Download. `viewCount` increments on reach. Guests: prompt instead of file/like; no URL in payload |
| `/upload-question` | user, moderator, admin (middleware unchanged) | `session.user` | **REWORK**: "Subject/course" combobox (no category-first), batch quick-search dropdown, programType/season/year, optional teacherName, tags, multi-file dropzone (1–5 images XOR 1 pdf) |
| `/my-submissions` | user+ | `session.user.id` | extend: new fields + files shown (minor) |
| `/approve` | moderator+, admin | existing | extend: question detail shows new fields + files |
| `/manage/courses` | **admin** (NEW middleware entry) | `session.user` | minimal course add/edit table (FR-030) |
| `/login` | guest | — | target for "Log in to download/preview" CTA (reuse `safeCallbackUrl`) |

## Download Route Handler (revised)

```
GET /api/questions/[id]/download?file=<orderIndex>&kind=file|zip
```

| Aspect | Value |
|---|---|
| Auth | `auth()` → no session ⇒ redirect `/login` with `safeCallbackUrl` |
| Authorization | viewer role `user/moderator/admin`; question must be `status='approved'` (or requester is `uploadedBy`) else `404` |
| `kind=file` | increments `downloadCount` atomically; redirects to the requested file's CDN URL (`file` = `order` index for multi-image, else the single pdf) |
| `kind=zip` | reserved for future server-side zip if the client-side path is replaced; for MVP the client-side ZIP path calls the `recordDownload` action separately and does NOT hit this route (avoids double-count) |
| Guest outcome | denied before any file reference is touched (SC-004) |

**Why a route**: unchanged from 003 — access rule enforced at the HTTP/query layer, never UI hiding. Guests never receive any file URL from any query payload, and the like/download paths always go through authed surfaces.

## Like toggle Route Handler (NEW)

```
POST /api/questions/[id]/like
```

| Aspect | Value |
|---|---|
| Auth | `auth()` → 401/redirect if no session |
| Authorization | any logged-in user; question must be `status='approved'` (likes on non-approved are `404`) |
| Behavior | idempotent toggle: insert `question_likes` row on like (unique `(questionId,userId)` conflict → treat as already-liked), delete on unlike; re-read count |
| Response | `200 { liked: boolean; count: number }`; `Cache-Control: no-store` |
| Note | self-likes allowed; not rate-limited |

## UploadThing API route (revised router config)

```
POST /api/uploadthing/?(action=upload)&endpoint=questionFile
GET  /api/uploadthing/?action=callback ...
```

`questionFile` router: `image: { maxFileSize: "10MB", maxFileCount: 5 }`, `pdf: { maxFileSize: "10MB", maxFileCount: 1 }`. Cross-type XOR enforced by the form + Zod (router cannot express it). Middleware auth unchanged (throws for guests). `onUploadComplete` collects each file descriptor → component state → `createQuestion` action.

## Middleware additions

- `/manage/courses` → `["admin"]` (all other routes unchanged from 003).

## Revalidation tags

- `question-bank` — invalidated on approve/reject, on submit, on like toggle, on `recordDownload`, on `createCourse`/`updateCourse` (chips + combobox must refresh).
- `my-submissions` — invalidated on approve/reject.
- `course-admin` — invalidated on course add/edit.

## Guest enforcement recap (updated)

1. `searchQuestions`/`getQuestionDetail` never expose `files`/any file URL (or `isLikedByViewer`) for `"guest"`.
2. Download only via `/api/questions/[id]/download` (authed); ZIP path only reachable from an authed page payload.
3. Like route requires `auth()`; guests see a prompt, never a working heart POST result.
4. `verify-guest-question-sql` script extended to assert the guest payload has no `files` array (no `fileUrl`/`file_url` keys) and no `isLikedByViewer`.
