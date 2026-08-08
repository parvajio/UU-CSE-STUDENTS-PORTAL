import { count, eq } from "drizzle-orm"
import { db } from "@/lib/db"
import { profiles, questions } from "@/lib/db/schema"
import { canApprove, type ResourceType } from "@/lib/auth/permissions"
import type { Role } from "@/lib/auth/types"

export const APPROVAL_PAGE_SIZE = 20

export type QuestionDetails = {
  title: string
  courseTitle: string | null
  courseCode: string | null
  subjectName: string | null
  customSubject: string | null
  customCourse: string | null
  batchNumber: number
  program: "regular" | "diploma"
  evening: boolean
  examType: "previous_year" | "midterm" | "final" | "lab" | "viva"
  fileUrl: string
  tags: string[]
}

export type PendingItem = {
  id: string
  resourceType: ResourceType
  resourceId: string
  title: string
  submitterName: string
  submittedAt: string
  status: "pending"
  details: Record<string, unknown>
}

export type PendingItemsResult = {
  items: PendingItem[]
  total: number
}

type ApprovalQuery = {
  fetchPending(
    page: number,
    pageSize: number
  ): Promise<{ items: PendingItem[]; total: number }>
  countPending(): Promise<number>
}

const approvalQueries: Partial<Record<ResourceType, ApprovalQuery>> = {
  profile: {
    async fetchPending(page, pageSize) {
      const offset = (Math.max(page, 1) - 1) * pageSize
      const [rows, countRows] = await Promise.all([
        db.query.profiles.findMany({
          where: eq(profiles.status, "pending"),
          with: {
            profileSkills: {
              columns: {},
              with: { skill: true },
            },
          },
          orderBy: (table, { desc }) => [desc(table.createdAt)],
          offset,
          limit: pageSize,
        }),
        db
          .select({ value: count() })
          .from(profiles)
          .where(eq(profiles.status, "pending")),
      ])
      const total = countRows[0]?.value ?? 0
      return {
        items: rows.map((row) => {
          const { profileSkills: joinRows, ...rest } = row
          return {
            id: row.id,
            resourceType: "profile" as const,
            resourceId: row.id,
            title: row.fullName,
            submitterName: row.fullName,
            submittedAt: row.createdAt,
            status: "pending" as const,
            details: { ...rest, skills: joinRows.map((j) => j.skill) },
          }
        }),
        total,
      }
    },
    async countPending() {
      const rows = await db
        .select({ value: count() })
        .from(profiles)
        .where(eq(profiles.status, "pending"))
      return rows[0]?.value ?? 0
    },
  },
  question: {
    async fetchPending(page, pageSize) {
      const offset = (Math.max(page, 1) - 1) * pageSize
      const [rows, countRows] = await Promise.all([
        db.query.questions.findMany({
          where: eq(questions.status, "pending"),
          with: {
            questionTags: { columns: { tag: true } },
            course: {
              columns: { code: true, title: true },
              with: { subject: { columns: { name: true } } },
            },
            uploader: {
              with: { profile: { columns: { fullName: true } } },
            },
          },
          orderBy: (table, { desc }) => [desc(table.createdAt)],
          offset,
          limit: pageSize,
        }),
        db
          .select({ value: count() })
          .from(questions)
          .where(eq(questions.status, "pending")),
      ])
      const total = countRows[0]?.value ?? 0
      return {
        items: rows.map((row) => {
          const { questionTags: joinRows, course, uploader } = row
          return {
            id: row.id,
            resourceType: "question" as const,
            resourceId: row.id,
            title: row.title,
            submitterName: uploader?.profile?.fullName ?? "Unknown",
            submittedAt: row.createdAt,
            status: "pending" as const,
            details: {
              title: row.title,
              courseTitle: course?.title ?? null,
              courseCode: course?.code ?? null,
              subjectName: course?.subject.name ?? null,
              customSubject: row.customSubject,
              customCourse: row.customCourse,
              batchNumber: row.batchNumber,
              program: row.program,
              evening: row.evening,
              examType: row.examType,
              fileUrl: row.fileUrl,
              tags: joinRows.map((j) => j.tag),
            },
          }
        }),
        total,
      }
    },
    async countPending() {
      const rows = await db
        .select({ value: count() })
        .from(questions)
        .where(eq(questions.status, "pending"))
      return rows[0]?.value ?? 0
    },
  },
}

export function visibleResourceTypes(role: Role): ResourceType[] {
  return (Object.keys(approvalQueries) as ResourceType[]).filter((type) =>
    canApprove(role, type)
  )
}

export async function getPendingCounts(
  viewerRole: Role
): Promise<Partial<Record<ResourceType, number>>> {
  const visible = visibleResourceTypes(viewerRole)
  const entries = await Promise.all(
    visible.map(async (type) => {
      const query = approvalQueries[type]
      return [type, query ? await query.countPending() : 0] as const
    })
  )
  return Object.fromEntries(entries)
}

export async function getPendingItems(
  viewerRole: Role,
  params: { resourceType?: ResourceType; page?: number } = {}
): Promise<PendingItemsResult> {
  const { resourceType, page = 1 } = params
  const visible = visibleResourceTypes(viewerRole)
  const targetTypes = resourceType
    ? visible.includes(resourceType)
      ? [resourceType]
      : []
    : visible

  if (targetTypes.length === 0) {
    return { items: [], total: 0 }
  }

  if (targetTypes.length === 1) {
    const query = approvalQueries[targetTypes[0]]
    return query
      ? query.fetchPending(page, APPROVAL_PAGE_SIZE)
      : { items: [], total: 0 }
  }

  const results = await Promise.all(
    targetTypes.map(async (type) => {
      const query = approvalQueries[type]
      return query
        ? query.fetchPending(1, APPROVAL_PAGE_SIZE)
        : { items: [], total: 0 }
    })
  )

  const total = results.reduce((sum, result) => sum + result.total, 0)
  const merged = results
    .flatMap((result) => result.items)
    .sort((a, b) => b.submittedAt.localeCompare(a.submittedAt))

  const offset = (Math.max(page, 1) - 1) * APPROVAL_PAGE_SIZE
  return { items: merged.slice(offset, offset + APPROVAL_PAGE_SIZE), total }
}
