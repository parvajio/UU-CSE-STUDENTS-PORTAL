# Server Action & Query Contracts: Profile Detail Page + Personal Portfolio

**Layer**: Next.js Server Actions (`src/app/(user)/profile/portfolio-actions.ts`, `"use server"`) + query functions called from Server Components (`src/lib/db/queries/directory.ts`).

## Portfolio read contracts (query layer, `directory.ts`)

```typescript
// Guest card / authed card — MODIFIED shape
type GuestSearchProfile = { id: string; fullName: string; batchNumber: number; skills: Skill[] }
type FullSearchProfile = GuestSearchProfile & {
  section: string; avatarUrl: string | null; isAlumni: boolean;
  bio: string | null;                                          // NEW (authed only)
  facebookUrl: string | null; linkedinUrl: string | null;       // NEW (authed only)
  whatsappNumber: string | null; portfolioUrl: string | null;   // NEW (authed only)
  githubUrl: string | null;                                     // NEW (authed only)
}

// NEW — detail page
type PortfolioEntry<T extends "achievement" | "project" | "certificate" | "experience"> = T extends "achievement"
  ? { id: string; title: string; achievedDate: string | null; description: string | null; imageUrl: string | null; linkUrl: string | null }
  : T extends "project"
    ? { id: string; title: string; description: string | null; techStack: string[]; demoUrl: string | null; repoUrl: string | null; startDate: string | null; endDate: string | null; imageUrl: string | null }
    : T extends "certificate"
      ? { id: string; title: string; issuer: string; issueDate: string | null; credentialUrl: string | null; imageUrl: string | null }
      : { id: string; company: string; role: string; startDate: string | null; endDate: string | null; description: string | null }

type ProfileDetailData = GuestSearchProfile & {                    // guest branch: exactly this + skills
  // authed branch only:
  section: string; studentId: string | null; avatarUrl: string | null;
  isAlumni: boolean; currentCompany: string | null; jobPosition: string | null;
  bio: string | null;
  facebookUrl: string | null; linkedinUrl: string | null; whatsappNumber: string | null;
  portfolioUrl: string | null; githubUrl: string | null;
  achievements: PortfolioEntry<"achievement">[];
  projects: PortfolioEntry<"project">[];
  certificates: PortfolioEntry<"certificate">[];
  experiences: PortfolioEntry<"experience">[];
}

async function getProfileDetail(
  profileId: string,
  viewerRole: "guest" | "user" | "moderator" | "admin"
): Promise<ProfileDetailData | null>
```

**Behavior**:
1. `WHERE profiles.id = :id AND profiles.status = 'approved'` — any other status ⇒ `null` (page turns it into `notFound()`, FR-009).
2. `viewerRole === "guest"` ⇒ columns `{id, fullName, batchNumber}` + skills only; **no** portfolio joins, no socials/bio/section/avatar (FR-004 defense in depth).
3. Authed ⇒ full public profile + four portfolio arrays, each sorted newest-first by its date field (research R-6: null dates last, `createdAt DESC` tiebreak).

## Portfolio mutation contracts (`portfolio-actions.ts`)

All four are parallel; the shapes below are the canonical ones. Every mutation:

1. `auth()` → `redirect("/login")` if no session.
2. Resolve `profileId` from `profiles.userId = session.user.id` (never from client input); if the owner has no profile row ⇒ `{ success: false, error: "No profile found." }` (FR-019).
3. `checkRateLimit("portfolio:<entity>:<userId>", 10, 1h)` — combined add+update+delete counter per entity; on limit ⇒ `{ success: false, error, retryAfter }` (FR-017, P-007).
4. Zod validate per P-001..P-006.
5. DB write scoped by the resolved owner `profileId` (update/delete additionally `WHERE id = :id AND profileId = :ownerProfileId` — R-5 last-write-wins).
6. On delete / image-replace: best-effort `utapi.deleteFiles([fileKey])` (R-2).
7. `revalidatePath("/profile")` and `revalidatePath("/directory/" + profileId)`.

```typescript
async function getMyPortfolio(): Promise<{
  achievements: PortfolioEntry<"achievement">[];
  projects: PortfolioEntry<"project">[];
  certificates: PortfolioEntry<"certificate">[];
  experiences: PortfolioEntry<"experience">[];
}>
// auth() required; resolves the owner profile from session; returns empty arrays when the profile has none.

async function addPortfolioEntry(
  entity: "achievement" | "project" | "certificate" | "experience",
  data: /* entity-specific input, see below */
): Promise<{ success: true } | { success: false; error: string; fieldErrors?: Record<string, string>; retryAfter?: number }>

async function updatePortfolioEntry(
  entity: "achievement" | "project" | "certificate" | "experience",
  entryId: string,
  data: /* entity-specific input */
): Promise<{ success: true } | { success: false; error: string; fieldErrors?: Record<string, string>; retryAfter?: number }>

async function deletePortfolioEntry(
  entity: "achievement" | "project" | "certificate" | "experience",
  entryId: string
): Promise<{ success: true } | { success: false; error: string }>
```

**Entity input shapes** (Zod `input` — all fields optional in `update` except nothing; required ones enforced):

| Entity | Fields |
|---|---|
| achievement | `title` (req), `achievedDate?`, `description?`, `imageUrl?`, `linkUrl?` |
| project | `title` (req), `description?`, `techStack?: string[]`, `demoUrl?`, `repoUrl?`, `startDate?`, `endDate?`, `imageUrl?` |
| certificate | `title` (req), `issuer` (req), `issueDate?`, `credentialUrl?`, `imageUrl?` |
| experience | `company` (req), `role` (req), `startDate?`, `endDate?`, `description?` |

Dates are ISO strings (`YYYY-MM-DD` or full ISO) coerced to `timestamp`; empty strings normalize to `null`.

**Invariants**: these actions NEVER write `profiles` (FR-015); a portfolio image upload that failed (no `imageUrl` returned by the dropzone) does not abort the entry save (FR-025 — the action proceeds with `imageUrl: null` and shows a non-blocking notice).

## Query plumbing on /profile (`page.tsx`)

`Promise.all([getMyProfile(), getAllSkills(), getCurrentBatch(), getMyPortfolio()])` → render `ProfileView` (with amber notice + draft preview when `status === "pending"`) then `PortfolioManager` (owner CRUD + actionable empty states).
