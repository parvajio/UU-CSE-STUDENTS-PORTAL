import {
  and,
  count,
  eq,
  exists,
  inArray,
  isNotNull,
  sql,
  type SQL,
} from "drizzle-orm"
import { db } from "@/lib/db"
import { courses, questionTags, questions } from "@/lib/db/schema"
import { buildSearchQuery } from "@/lib/search"
import {
  OTHER_COURSE,
  QUESTION_BANK_PAGE_SIZE,
} from "@/lib/question-bank/constants"
import type {
  ExamType,
  GuestQuestionCard,
  GuestQuestionDetail,
  QuestionCard,
  QuestionDetail,
  QuestionFilterParams,
  QuestionProgram,
} from "@/types/question-bank"
import type { ViewerRole } from "./directory"

type QuestionSearchRow = {
  id: string
  title: string
  batchNumber: number
  program: QuestionProgram
  evening: boolean
  examType: ExamType
  customCourse: string | null
  fileUrl?: string
  questionTags: { tag: string }[]
  course: {
    code: string
    title: string
    subject: { name: string }
  } | null
}

function buildWhereClause(params: QuestionFilterParams): SQL[] {
  const conditions: SQL[] = [eq(questions.status, "approved")]

  const term = params.query?.trim()
  if (term) {
    conditions.push(buildSearchQuery(term, [questions.title]))
  }

  if (params.courseId === OTHER_COURSE) {
    // "Other" is the global custom-course bucket; it overrides the subject filter.
    conditions.push(isNotNull(questions.customCourse))
  } else if (params.courseId) {
    conditions.push(eq(questions.courseId, params.courseId))
  } else if (params.subjectId) {
    conditions.push(
      inArray(
        questions.courseId,
        db
          .select({ id: courses.id })
          .from(courses)
          .where(eq(courses.subjectId, params.subjectId))
      )
    )
  }

  if (params.batchNumber != null) {
    conditions.push(eq(questions.batchNumber, params.batchNumber))
  }
  if (params.examType) {
    conditions.push(eq(questions.examType, params.examType))
  }
  if (params.program) {
    conditions.push(eq(questions.program, params.program))
  }
  if (params.evening != null) {
    conditions.push(eq(questions.evening, params.evening))
  }
  for (const raw of params.tags ?? []) {
    const tag = raw.trim()
    if (!tag) continue
    conditions.push(
      exists(
        db
          .select()
          .from(questionTags)
          .where(
            and(
              eq(questionTags.questionId, questions.id),
              eq(questionTags.tag, tag)
            )
          )
      )
    )
  }

  return conditions
}

export async function searchQuestions(
  params: QuestionFilterParams = {},
  viewerRole: ViewerRole = "guest"
): Promise<{ items: Array<GuestQuestionCard | QuestionCard>; total: number }> {
  const isGuest = viewerRole === "guest"
  const page = Math.max(1, params.page ?? 1)
  const pageSize = Math.min(
    50,
    Math.max(1, params.pageSize ?? QUESTION_BANK_PAGE_SIZE)
  )
  const offset = (page - 1) * pageSize
  const where = and(...buildWhereClause(params))

  const [rows, countRows] = await Promise.all([
    db.query.questions.findMany({
      columns: isGuest
        ? {
            id: true,
            title: true,
            batchNumber: true,
            program: true,
            evening: true,
            examType: true,
            customCourse: true,
          }
        : {
            id: true,
            title: true,
            batchNumber: true,
            program: true,
            evening: true,
            examType: true,
            customCourse: true,
            fileUrl: true,
          },
      with: {
        questionTags: { columns: { tag: true } },
        course: {
          columns: { code: true, title: true },
          with: { subject: { columns: { name: true } } },
        },
      },
      where,
      orderBy: (table, { desc }) => [desc(table.createdAt)],
      offset,
      limit: pageSize,
    }),
    db
      .select({ value: count() })
      .from(questions)
      .where(where),
  ])

  const total = countRows[0]?.value ?? 0

  const items: Array<GuestQuestionCard | QuestionCard> = (
    rows as unknown as QuestionSearchRow[]
  ).map((row) => {
    const base: GuestQuestionCard = {
      id: row.id,
      title: row.title,
      batchNumber: row.batchNumber,
      program: row.program,
      evening: row.evening,
      examType: row.examType,
      customCourse: row.customCourse,
      subjectName: row.course?.subject?.name ?? null,
      courseCode: row.course?.code ?? null,
      courseTitle: row.course?.title ?? null,
      tags: row.questionTags.map((t) => t.tag),
    }
    return isGuest ? base : { ...base, fileUrl: row.fileUrl ?? "" }
  })

  return { items, total }
}

type QuestionDetailRow = {
  id: string
  title: string
  batchNumber: number
  program: QuestionProgram
  evening: boolean
  examType: ExamType
  customSubject: string | null
  customCourse: string | null
  fileUrl?: string
  createdAt: string
  updatedAt: string
  questionTags: { tag: string }[]
  course: {
    code: string
    title: string
    subject: { name: string }
  } | null
  uploader: {
    profile: { fullName: string } | null
  } | null
}

export async function getQuestionDetail(
  id: string,
  viewerRole: ViewerRole = "guest"
): Promise<GuestQuestionDetail | QuestionDetail | null> {
  const isGuest = viewerRole === "guest"

  const row = await db.query.questions.findFirst({
    columns: isGuest
      ? {
          id: true,
          title: true,
          batchNumber: true,
          program: true,
          evening: true,
          examType: true,
          customSubject: true,
          customCourse: true,
          createdAt: true,
          updatedAt: true,
        }
      : {
          id: true,
          title: true,
          batchNumber: true,
          program: true,
          evening: true,
          examType: true,
          customSubject: true,
          customCourse: true,
          fileUrl: true,
          createdAt: true,
          updatedAt: true,
        },
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
    where: and(eq(questions.id, id), eq(questions.status, "approved")),
  })

  if (!row) return null

  const q = row as unknown as QuestionDetailRow
  const base: GuestQuestionDetail = {
    id: q.id,
    title: q.title,
    batchNumber: q.batchNumber,
    program: q.program,
    evening: q.evening,
    examType: q.examType,
    customSubject: q.customSubject,
    customCourse: q.customCourse,
    subjectName: q.course?.subject?.name ?? null,
    courseCode: q.course?.code ?? null,
    courseTitle: q.course?.title ?? null,
    tags: q.questionTags.map((t) => t.tag),
    submitterName: q.uploader?.profile?.fullName ?? null,
    createdAt: q.createdAt,
    updatedAt: q.updatedAt,
  }
  return isGuest ? base : { ...base, fileUrl: q.fileUrl ?? "" }
}