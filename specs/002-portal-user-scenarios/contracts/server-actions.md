# Server Action Contracts

**Layer**: Next.js Server Actions (imported and called directly from client components)

## Profile Actions

```typescript
// Submit or update profile
async function upsertProfile(data: {
  fullName: string;
  studentId: string;
  batchNumber: number;
  section: string;
  avatarUrl?: string;
  bio?: string;
  facebookUrl?: string;
  linkedinUrl?: string;
  whatsappNumber?: string;
  portfolioUrl?: string;
  githubUrl?: string;
  skillIds: string[];           // selected skill IDs
  isAlumni?: boolean;
  currentCompany?: string;
  jobPosition?: string;
}): Promise<{ success: boolean; profileId: string; status: ApprovalStatus }>

// Toggle alumni status (no re-approval needed if other fields unchanged)
async function toggleAlumniStatus(): Promise<{ success: boolean; isAlumni: boolean }>

// Get own profile (always returns full data for the owner)
async function getMyProfile(): Promise<ProfileFull | null>

// Get directory profiles (role-aware — different shape per role)
async function searchDirectory(params: {
  query?: string;
  skillIds?: string[];
  batchNumber?: number;
}): Promise<ProfileCard[]>       // Guest sees limited fields
```

## Question Actions

```typescript
async function uploadQuestion(data: {
  title: string;
  subject: string;
  course: string;
  batch: string;
  examType: "previous_year" | "midterm" | "final" | "lab" | "viva";
  file: File;                     // validated client-side + server-side
  tags?: string[];
}): Promise<{ success: boolean; questionId: string; status: "pending" }>

async function searchQuestions(params: {
  query?: string;
  subject?: string;
  course?: string;
  batch?: string;
  examType?: string;
  tags?: string[];
}): Promise<QuestionCard[]>
```

## Approval Dashboard Actions

```typescript
async function getPendingItems(params: {
  resourceType?: "profile" | "question" | "alumni" | "project";
  page?: number;
}): Promise<{
  items: PendingItem[];
  total: number;
}>

async function approveItem(data: {
  resourceType: string;
  resourceId: string;
}): Promise<{ success: boolean }>

async function rejectItem(data: {
  resourceType: string;
  resourceId: string;
  reason?: string;
}): Promise<{ success: boolean }>
```

## Alumni / Career Guidance Actions

```typescript
async function requestCareerGuidance(data: {
  alumniId: string;
  message: string;
}): Promise<{ success: boolean; requestId: string }>

async function respondToGuidanceRequest(data: {
  requestId: string;
  action: "accept" | "decline";
}): Promise<{ success: boolean }>

async function getPendingRequests(): Promise<GuidanceRequest[]>
```

## Notification Actions

```typescript
async function getUnreadCount(): Promise<{ count: number }>

async function getRecentNotifications(): Promise<Notification[]>

async function markAsRead(notificationId: string): Promise<void>
```

## Common Response Types

```typescript
type ApprovalStatus = "pending" | "approved" | "rejected";

interface ProfileCard {
  id: string;
  fullName: string;
  batchNumber: number;
  skills: { id: string; name: string; colorKey?: string }[];
  // Only present for authenticated users:
  avatarUrl?: string;
  section?: string;
  isAlumni?: boolean;
}

interface PendingItem {
  id: string;
  resourceType: string;
  resourceId: string;
  title: string;
  submitterName: string;
  submittedAt: string;
  status: "pending";
  details: Record<string, unknown>;  // Full resource data for review
}

interface Notification {
  id: string;
  type: string;
  title: string;
  message?: string;
  resourceType?: string;
  resourceId?: string;
  read: boolean;
  createdAt: string;
}
```
