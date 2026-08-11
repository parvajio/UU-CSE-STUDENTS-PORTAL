import { and, desc, eq, inArray } from "drizzle-orm"
import { db } from "@/lib/db"
import {
  notifications,
  questionFiles,
  questionLikes,
  questionTags,
  questions,
} from "@/lib/db/schema"
import type { MyQuestionRow, QuestionFile } from "@/types/question-bank"

export async function getMyQuestions(userId: string): Promise<MyQuestionRow[]> {
  const rows = await db.query.questions.findMany({
    where: eq(questions.uploadedBy, userId),
    with: {
      course: {
        columns: { code: true, title: true },
      },
      questionTags: {
        columns: { tag: true },
      },
      questionFiles: {
        columns: { fileUrl: true, fileType: true, order: true },
        orderBy: (table, { asc }) => [asc(table.order)],
      },
    },
    orderBy: (table, { desc }) => [desc(table.createdAt)],
  })

  if (rows.length === 0) return []

  const questionIds = rows.map((r) => r.id)

  const likeCountsMap = new Map<string, number>()
  const likedSet = new Set<string>()

  const likeRows = await db
    .select({
      questionId: questionLikes.questionId,
      userId: questionLikes.userId,
    })
    .from(questionLikes)
    .where(inArray(questionLikes.questionId, questionIds))

  for (const row of likeRows) {
    likeCountsMap.set(row.questionId, (likeCountsMap.get(row.questionId) ?? 0) + 1)
    if (row.userId === userId) {
      likedSet.add(row.questionId)
    }
  }

  const rejectionMap = new Map<string, string>()
  const notifRows = await db
    .select({
      resourceId: notifications.resourceId,
      message: notifications.message,
      createdAt: notifications.createdAt,
    })
    .from(notifications)
    .where(
      and(
        eq(notifications.userId, userId),
        eq(notifications.resourceType, "question"),
        eq(notifications.type, "rejection"),
        inArray(notifications.resourceId, questionIds)
      )
    )
    .orderBy(desc(notifications.createdAt))

  for (const n of notifRows) {
    if (n.resourceId && !rejectionMap.has(n.resourceId)) {
      rejectionMap.set(
        n.resourceId,
        n.message ?? "Your question submission was rejected."
      )
    }
  }

  return rows.map((row) => {
    const files: QuestionFile[] = row.questionFiles.map((f) => ({
      fileUrl: f.fileUrl,
      fileType: f.fileType,
      order: f.order,
    }))
    const tags = row.questionTags.map((t) => t.tag)
    const likeCount = likeCountsMap.get(row.id) ?? 0
    const isLikedByViewer = likedSet.has(row.id)
    const rejectionReason =
      row.status === "rejected" ? (rejectionMap.get(row.id) ?? null) : null

    return {
      id: row.id,
      title: row.title,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      batchNumber: row.batchNumber,
      programType: row.programType,
      season: row.season,
      year: row.year,
      teacherName: row.teacherName,
      examType: row.examType,
      courseCode: row.course?.code ?? "",
      courseTitle: row.course?.title ?? "",
      tags,
      likeCount,
      viewCount: row.viewCount,
      downloadCount: row.downloadCount,
      isLikedByViewer,
      files,
      status: row.status,
      rejectionReason,
    }
  })
}
