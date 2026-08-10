"use server"

import { eq } from "drizzle-orm"
import { revalidatePath, revalidateTag } from "next/cache"
import { redirect } from "next/navigation"
import { auth } from "@/lib/auth/auth"
import { db } from "@/lib/db"
import { courses, questionFiles, questionTags, questions } from "@/lib/db/schema"
import { enforceSubmissionLimit } from "@/lib/rate-limit"
import { getCurrentBatch } from "@/lib/db/queries/site-config"
import { createQuestionInputSchema } from "@/lib/question-bank/validation"
import type {
  CreateQuestionInput,
  CreateQuestionParseError,
} from "@/lib/question-bank/validation"

export type CreateQuestionResult =
  | { success: true; questionId: string; status: "pending" }
  | { success: false; error: string; retryAfter?: number }

function formatRetry(retryAfterSeconds: number): string {
  const minutes = Math.ceil(retryAfterSeconds / 60)
  return minutes > 1 ? `${minutes} minutes` : "1 minute"
}

function fieldError(error: CreateQuestionParseError): string {
  return error.issues[0]?.message ?? "Please check your submission."
}

export async function createQuestion(
  input: CreateQuestionInput
): Promise<CreateQuestionResult> {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")
  const userId = session.user.id

  const parsed = createQuestionInputSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: fieldError(parsed.error) }
  }
  const data = parsed.data

  const currentBatch = await getCurrentBatch()
  if (data.batchNumber > currentBatch) {
    return {
      success: false,
      error: `Batch must be between 1 and ${currentBatch}.`,
    }
  }

  // Q-001: combobox-only classification — courseId is required and must exist.
  const course = await db.query.courses.findFirst({
    where: eq(courses.id, data.courseId),
    columns: { id: true },
  })
  if (!course) {
    return { success: false, error: "The selected course no longer exists." }
  }

  const isStaff = session.user.role === "moderator" || session.user.role === "admin"
  if (!isStaff) {
    const limit = enforceSubmissionLimit(userId)
    if (!limit.allowed) {
      return {
        success: false,
        error: `You've reached the question submission limit. Try again in ${formatRetry(limit.retryAfter)}.`,
        retryAfter: limit.retryAfter,
      }
    }
  }

  // Normalize tags: case-insensitive dedupe, keep the first casing seen.
  const seen = new Set<string>()
  const tags: string[] = []
  for (const tag of data.tags) {
    const key = tag.toLowerCase()
    if (!seen.has(key)) {
      seen.add(key)
      tags.push(tag)
    }
  }

  const questionId = crypto.randomUUID()
  const batchItems = [
    db.insert(questions).values({
      id: questionId,
      title: data.title,
      courseId: data.courseId,
      batchNumber: data.batchNumber,
      programType: data.programType,
      season: data.season,
      year: data.year,
      teacherName: data.teacherName ?? null,
      examType: data.examType,
      uploadedBy: userId,
      status: "pending",
    }),
    db.insert(questionFiles).values(
      data.files.map((file) => ({
        questionId,
        fileUrl: file.fileUrl,
        fileType: file.fileType,
        order: file.order,
      }))
    ),
    ...(tags.length > 0
      ? [db.insert(questionTags).values(tags.map((tag) => ({ questionId, tag })))]
      : []),
  ] as const

  await db.batch(batchItems)

  revalidatePath("/my-submissions")
  revalidatePath("/upload-question")
  revalidatePath("/question-bank")
  revalidateTag("question-bank")

  return { success: true, questionId, status: "pending" }
}