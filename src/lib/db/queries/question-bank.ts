import {
  and,
  asc,
  count,
  desc,
  eq,
  exists,
  ilike,
  inArray,
  max,
  or,
  sql,
  type SQL,
} from "drizzle-orm"
import { db } from "@/lib/db"
import {
  courses,
  profiles,
  questionFiles,
  questionLikes,
  questionTags,
  questions,
  users,
} from "@/lib/db/schema"
import {
  QUESTION_BANK_PAGE_SIZE,
  PROGRAM_TYPE_LABELS,
  SEASON_LABELS,
  TOP_CHIPS_N,
} from "@/lib/question-bank/constants"
import type {
  ExamType,
  GuestQuestionCard,
  GuestQuestionDetail,
  PopularTagChip,
  ProgramType,
  QuestionCard,
  QuestionDetail,
  QuestionFile,
  QuestionFilterParams,
  RecentBatchChip,
  Season,
  TopCourseChip,
} from "@/types/question-bank"
import type { ViewerRole } from "./directory"

type QuestionSearchRow = {
  id: string
  title: string
  batchNumber: number
  programType: ProgramType
  season: Season | null
  year: number | null
  teacherName: string | null
  examType: ExamType
  viewCount: number
  downloadCount: number
  createdAt: string
  questionTags: { tag: string }[]
  course: { code: string; title: string } | null
  uploader: { profile: { fullName: string } | null } | null
}

type QuestionDetailRow = QuestionSearchRow & {
  creditHours: string
  createdAt: string
  updatedAt: string
  course: { code: string; title: string; creditHours: string } | null
  uploader: { profile: { fullName: string } | null } | null
}

type LikeStats = {
  likeCounts: Map<string, number>
  likedQuestionIds: Set<string>
}

async function loadLikeStats(
  questionIds: string[],
  viewerUserId?: string
): Promise<LikeStats> {
  const likeCounts = new Map<string, number>()
  const likedQuestionIds = new Set<string>()

  if (questionIds.length === 0) {
    return { likeCounts, likedQuestionIds }
  }

  const likeRows = await db
    .select({
      questionId: questionLikes.questionId,
      value: count(),
    })
    .from(questionLikes)
    .where(inArray(questionLikes.questionId, questionIds))
    .groupBy(questionLikes.questionId)

  for (const row of likeRows) {
    likeCounts.set(row.questionId, row.value)
  }

  if (viewerUserId) {
    const mine = await db
      .select({ questionId: questionLikes.questionId })
      .from(questionLikes)
      .where(
        and(
          inArray(questionLikes.questionId, questionIds),
          eq(questionLikes.userId, viewerUserId)
        )
      )
    for (const row of mine) {
      likedQuestionIds.add(row.questionId)
    }
  }

  return { likeCounts, likedQuestionIds }
}

async function loadFilesForQuestions(
  questionIds: string[]
): Promise<Map<string, QuestionFile[]>> {
  const filesByQuestion = new Map<string, QuestionFile[]>()
  if (questionIds.length === 0) return filesByQuestion

  const files = await db
    .select({
      questionId: questionFiles.questionId,
      fileUrl: questionFiles.fileUrl,
      fileType: questionFiles.fileType,
      order: questionFiles.order,
    })
    .from(questionFiles)
    .where(inArray(questionFiles.questionId, questionIds))
    .orderBy(asc(questionFiles.order))

  for (const file of files) {
    const list = filesByQuestion.get(file.questionId) ?? []
    list.push({
      fileUrl: file.fileUrl,
      fileType: file.fileType,
      order: file.order,
    })
    filesByQuestion.set(file.questionId, list)
  }

  return filesByQuestion
}

function escapeLikePattern(value: string): string {
  return value.replace(/[\\%_]/g, (ch) => `\\${ch}`)
}

// Universal free-text search: partial/substring match across question title,
// course code/title, tags, teacher name, submitter name, season/program labels,
// and (for numeric terms) year + batch number. Still ANDed with structured filters.
function buildUniversalTerm(term: string): SQL | undefined {
  const trimmed = term.trim()
  if (!trimmed) return undefined

  const pattern = `%${escapeLikePattern(trimmed)}%`
  const lower = trimmed.toLowerCase()
  const numeric = /^\d+$/.test(trimmed) ? Number(trimmed) : null

  const clauses: SQL[] = [
    sql`${questions.titleTsv} @@ plainto_tsquery('english', ${trimmed})`,
    exists(
      db
        .select()
        .from(courses)
        .where(
          and(
            eq(courses.id, questions.courseId),
            or(ilike(courses.code, pattern), ilike(courses.title, pattern))
          )
        )
    ),
    exists(
      db
        .select()
        .from(questionTags)
        .where(
          and(
            eq(questionTags.questionId, questions.id),
            ilike(questionTags.tag, pattern)
          )
        )
    ),
    ilike(questions.teacherName, pattern),
    exists(
      db
        .select()
        .from(users)
        .innerJoin(profiles, eq(profiles.userId, users.id))
        .where(
          and(
            eq(users.id, questions.uploadedBy),
            ilike(profiles.fullName, pattern)
          )
        )
    ),
  ]

  const seasonMatch = (Object.keys(SEASON_LABELS) as Season[]).find((season) =>
    SEASON_LABELS[season].toLowerCase().includes(lower)
  )
  if (seasonMatch) clauses.push(eq(questions.season, seasonMatch))

  const programMatch = (Object.keys(PROGRAM_TYPE_LABELS) as ProgramType[]).find(
    (program) => PROGRAM_TYPE_LABELS[program].toLowerCase().includes(lower)
  )
  if (programMatch) clauses.push(eq(questions.programType, programMatch))

  if (numeric !== null) {
    const yearOrBatch = or(
      eq(questions.year, numeric),
      eq(questions.batchNumber, numeric)
    )
    if (yearOrBatch) clauses.push(yearOrBatch)
  }

  return or(...clauses)
}

function buildWhereClause(params: QuestionFilterParams): SQL[] {
  const conditions: SQL[] = [eq(questions.status, "approved")]

  const term = params.query?.trim()
  if (term) {
    const universal = buildUniversalTerm(term)
    if (universal) conditions.push(universal)
  }

  if (params.courseId) {
    conditions.push(eq(questions.courseId, params.courseId))
  }

  if (params.batchNumber != null) {
    conditions.push(eq(questions.batchNumber, params.batchNumber))
  }
  if (params.examType) {
    conditions.push(eq(questions.examType, params.examType))
  }
  if (params.programType) {
    conditions.push(eq(questions.programType, params.programType))
  }
  if (params.season) {
    conditions.push(eq(questions.season, params.season))
  }
  if (params.year != null) {
    conditions.push(eq(questions.year, params.year))
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
  viewerRole: ViewerRole = "guest",
  viewerUserId?: string
): Promise<{ items: Array<GuestQuestionCard | QuestionCard>; total: number }> {
  const isGuest = viewerRole === "guest"
  const page = Math.max(1, params.page ?? 1)
  const pageSize = Math.min(
    50,
    Math.max(1, params.pageSize ?? QUESTION_BANK_PAGE_SIZE)
  )
  const offset = (page - 1) * pageSize
  const where = and(...buildWhereClause(params))

  // Guests never touch `question_files` — the whitelist keeps it out of both
  // the query and the payload (SC-004). Files are loaded separately, non-guest only.
  const [rows, countRows] = await Promise.all([
    db.query.questions.findMany({
      columns: {
        id: true,
        title: true,
        batchNumber: true,
        programType: true,
        season: true,
        year: true,
        teacherName: true,
        examType: true,
        viewCount: true,
        downloadCount: true,
        createdAt: true,
      },
      with: {
        questionTags: { columns: { tag: true } },
        course: { columns: { code: true, title: true } },
        uploader: {
          with: { profile: { columns: { fullName: true } } },
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
  const ids = rows.map((row) => row.id)
  const [likeStats, filesByQuestion] = await Promise.all([
    loadLikeStats(ids, isGuest ? undefined : viewerUserId),
    isGuest ? Promise.resolve(new Map<string, QuestionFile[]>()) : loadFilesForQuestions(ids),
  ])

  const items: Array<GuestQuestionCard | QuestionCard> = (
    rows as unknown as QuestionSearchRow[]
  ).map((row) => {
    const base: GuestQuestionCard = {
      id: row.id,
      title: row.title,
      createdAt: row.createdAt,
      batchNumber: row.batchNumber,
      programType: row.programType,
      season: row.season,
      year: row.year,
      teacherName: row.teacherName,
      submitterName: row.uploader?.profile?.fullName ?? null,
      examType: row.examType,
      courseCode: row.course?.code ?? "",
      courseTitle: row.course?.title ?? "",
      tags: row.questionTags.map((t) => t.tag),
      likeCount: likeStats.likeCounts.get(row.id) ?? 0,
      viewCount: row.viewCount,
      downloadCount: row.downloadCount,
    }
    if (isGuest) return base
    return {
      ...base,
      isLikedByViewer: likeStats.likedQuestionIds.has(row.id),
      files: filesByQuestion.get(row.id) ?? [],
    }
  })

  return { items, total }
}

export async function getTopCourses(n: number = TOP_CHIPS_N): Promise<TopCourseChip[]> {
  const limit = Math.max(1, n)

  const courseRows = await db
    .select({
      courseId: questions.courseId,
      count: count(),
      latest: max(questions.createdAt),
    })
    .from(questions)
    .where(eq(questions.status, "approved"))
    .groupBy(questions.courseId)
    .orderBy(desc(count()), desc(max(questions.createdAt)))
    .limit(limit)

  const courseMap = new Map<string, { code: string; title: string }>()
  const courseIds = courseRows.map((row) => row.courseId)
  if (courseIds.length > 0) {
    const courseList = await db.query.courses.findMany({
      columns: { id: true, code: true, title: true },
      where: inArray(courses.id, courseIds),
    })
    for (const course of courseList) {
      courseMap.set(course.id, { code: course.code, title: course.title })
    }
  }

  return courseRows.map((row) => ({
    courseId: row.courseId,
    code: courseMap.get(row.courseId)?.code ?? "",
    title: courseMap.get(row.courseId)?.title ?? "",
    count: row.count,
  }))
}

export async function getRecentBatches(
  n: number = TOP_CHIPS_N
): Promise<RecentBatchChip[]> {
  const limit = Math.max(1, n)

  const rows = await db
    .select({
      batchNumber: questions.batchNumber,
      count: count(),
    })
    .from(questions)
    .where(eq(questions.status, "approved"))
    .groupBy(questions.batchNumber)
    .orderBy(desc(questions.batchNumber), desc(count()))
    .limit(limit)

  return rows.map((row) => ({
    batchNumber: row.batchNumber,
    count: row.count,
  }))
}

export async function getPopularTags(
  n: number = TOP_CHIPS_N
): Promise<PopularTagChip[]> {
  const limit = Math.max(1, n)

  const rows = await db
    .select({
      tag: questionTags.tag,
      count: count(),
    })
    .from(questionTags)
    .innerJoin(questions, eq(questions.id, questionTags.questionId))
    .where(eq(questions.status, "approved"))
    .groupBy(questionTags.tag)
    .orderBy(desc(count()), asc(questionTags.tag))
    .limit(limit)

  return rows.map((row) => ({
    tag: row.tag,
    count: row.count,
  }))
}

export async function incrementViewCount(id: string): Promise<void> {
  await db
    .update(questions)
    .set({ viewCount: sql`${questions.viewCount} + 1` })
    .where(eq(questions.id, id))
}

export async function incrementDownloadCount(id: string): Promise<void> {
  await db
    .update(questions)
    .set({ downloadCount: sql`${questions.downloadCount} + 1` })
    .where(eq(questions.id, id))
}

export async function getQuestionDetail(
  id: string,
  viewerRole: ViewerRole = "guest",
  viewerUserId?: string
): Promise<GuestQuestionDetail | QuestionDetail | null> {
  const isGuest = viewerRole === "guest"

  const row = await db.query.questions.findFirst({
    columns: {
      id: true,
      title: true,
      batchNumber: true,
      programType: true,
      season: true,
      year: true,
      teacherName: true,
      examType: true,
      viewCount: true,
      downloadCount: true,
      createdAt: true,
      updatedAt: true,
    },
    with: {
      questionTags: { columns: { tag: true } },
      course: { columns: { code: true, title: true, creditHours: true } },
      uploader: {
        with: { profile: { columns: { fullName: true } } },
      },
    },
    where: and(eq(questions.id, id), eq(questions.status, "approved")),
  })

  if (!row) return null

  const q = row as unknown as QuestionDetailRow
  const likeStats = await loadLikeStats(
    [q.id],
    isGuest ? undefined : viewerUserId
  )

  const files = isGuest
    ? []
    : await db
        .select({
          fileUrl: questionFiles.fileUrl,
          fileType: questionFiles.fileType,
          order: questionFiles.order,
        })
        .from(questionFiles)
        .where(eq(questionFiles.questionId, q.id))
        .orderBy(asc(questionFiles.order))

  const base: GuestQuestionDetail = {
    id: q.id,
    title: q.title,
    batchNumber: q.batchNumber,
    programType: q.programType,
    season: q.season,
    year: q.year,
    teacherName: q.teacherName,
    examType: q.examType,
    courseCode: q.course?.code ?? "",
    courseTitle: q.course?.title ?? "",
    creditHours: q.course?.creditHours ?? "",
    tags: q.questionTags.map((t) => t.tag),
    likeCount: likeStats.likeCounts.get(q.id) ?? 0,
    viewCount: q.viewCount,
    downloadCount: q.downloadCount,
    submitterName: q.uploader?.profile?.fullName ?? null,
    createdAt: q.createdAt,
    updatedAt: q.updatedAt,
  }

  if (isGuest) return base

  return {
    ...base,
    isLikedByViewer: likeStats.likedQuestionIds.has(q.id),
    files: files.map((file) => ({
      fileUrl: file.fileUrl,
      fileType: file.fileType,
      order: file.order,
    })),
  }
}