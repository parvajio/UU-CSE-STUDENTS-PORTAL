import { asc, count, eq } from "drizzle-orm"
import { db } from "@/lib/db"
import { profiles, questions, routineSlotReports } from "@/lib/db/schema"
import { canApprove, type ResourceType } from "@/lib/auth/permissions"
import type { Role } from "@/lib/auth/types"
import type {
  ExamType,
  ProgramType,
  QuestionFile,
  Season,
} from "@/types/question-bank"

export const APPROVAL_PAGE_SIZE = 20

export type QuestionDetails = {
  title: string | null
  courseTitle: string | null
  courseCode: string | null
  batchNumber: number
  programType: ProgramType
  season: Season | null
  year: number | null
  teacherName: string | null
  examType: ExamType
  files: QuestionFile[]
  tags: string[]
}

export type RoutineReportLiveSlot = {
  batch: string
  section: string
  day: string
  startPeriod: number | null
  classCode: string
  teacherInitial: string | null
  room: string | null
} | null

export type RoutineReportDetails = {
  message: string
  slotId: string | null
  suggestedClassCode: string | null
  suggestedTeacherInitial: string | null
  suggestedRoom: string | null
  snapshotBatch: string | null
  snapshotSection: string | null
  snapshotDay: string | null
  snapshotStartPeriod: number | null
  snapshotClassCode: string | null
  snapshotTeacherInitial: string | null
  snapshotRoom: string | null
  liveSlot: RoutineReportLiveSlot
  slotExists: boolean
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
          columns: {
            id: true,
            title: true,
            batchNumber: true,
            programType: true,
            season: true,
            year: true,
            teacherName: true,
            examType: true,
            createdAt: true,
          },
          with: {
            questionTags: { columns: { tag: true } },
            course: { columns: { code: true, title: true } },
            questionFiles: {
              columns: { fileUrl: true, fileType: true, order: true },
              orderBy: (table, { asc }) => [asc(table.order)],
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
          const {
            questionTags: joinRows,
            course,
            uploader,
            questionFiles: fileRows,
          } = row
          return {
            id: row.id,
            resourceType: "question" as const,
            resourceId: row.id,
            title: row.title ?? course?.code ?? "Question paper",
            submitterName: uploader?.profile?.fullName ?? "Unknown",
            submittedAt: row.createdAt,
            status: "pending" as const,
            details: {
              title: row.title,
              courseTitle: course?.title ?? null,
              courseCode: course?.code ?? null,
              batchNumber: row.batchNumber,
              programType: row.programType,
              season: row.season,
              year: row.year,
              teacherName: row.teacherName,
              examType: row.examType,
              files: fileRows.map((file) => ({
                fileUrl: file.fileUrl,
                fileType: file.fileType,
                order: file.order,
              })),
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
  routine_report: {
    async fetchPending(page, pageSize) {
      const offset = (Math.max(page, 1) - 1) * pageSize
      const [rows, countRows] = await Promise.all([
        db.query.routineSlotReports.findMany({
          where: eq(routineSlotReports.status, "pending"),
          with: {
            slot: {
              columns: {
                batch: true,
                section: true,
                day: true,
                startPeriod: true,
                classCode: true,
                teacherInitial: true,
                room: true,
              },
            },
            reporter: {
              with: { profile: { columns: { fullName: true } } },
            },
          },
          orderBy: (table, { desc }) => [desc(table.createdAt)],
          offset,
          limit: pageSize,
        }),
        db
          .select({ value: count() })
          .from(routineSlotReports)
          .where(eq(routineSlotReports.status, "pending")),
      ])
      const total = countRows[0]?.value ?? 0
      return {
        items: rows.map((row) => {
          const batch = row.snapshotBatch ?? row.slot?.batch ?? "—"
          const section = row.snapshotSection ?? row.slot?.section ?? "—"
          return {
            id: row.id,
            resourceType: "routine_report" as const,
            resourceId: row.id,
            title: `Routine report · Batch ${batch}-${section}`,
            submitterName: row.reporter?.profile?.fullName ?? "Student",
            submittedAt: row.createdAt,
            status: "pending" as const,
            details: {
              message: row.message,
              slotId: row.slotId,
              suggestedClassCode: row.suggestedClassCode,
              suggestedTeacherInitial: row.suggestedTeacherInitial,
              suggestedRoom: row.suggestedRoom,
              snapshotBatch: row.snapshotBatch,
              snapshotSection: row.snapshotSection,
              snapshotDay: row.snapshotDay,
              snapshotStartPeriod: row.snapshotStartPeriod,
              snapshotClassCode: row.snapshotClassCode,
              snapshotTeacherInitial: row.snapshotTeacherInitial,
              snapshotRoom: row.snapshotRoom,
              liveSlot: row.slot
                ? {
                    batch: row.slot.batch,
                    section: row.slot.section,
                    day: row.slot.day,
                    startPeriod: row.slot.startPeriod,
                    classCode: row.slot.classCode,
                    teacherInitial: row.slot.teacherInitial,
                    room: row.slot.room,
                  }
                : null,
              slotExists: Boolean(row.slot),
            },
          }
        }),
        total,
      }
    },
    async countPending() {
      const rows = await db
        .select({ value: count() })
        .from(routineSlotReports)
        .where(eq(routineSlotReports.status, "pending"))
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
