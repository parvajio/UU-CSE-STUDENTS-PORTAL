"use server"

import { z } from "zod"
import { eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { auth } from "@/lib/auth/auth"
import { db } from "@/lib/db"
import { courses, questionTags, questions } from "@/lib/db/schema"
import { enforceSubmissionLimit } from "@/lib/rate-limit"
import { getCurrentBatch } from "@/lib/db/queries/site-config"
import type { ExamType, QuestionProgram } from "@/types/question-bank"

export const EXAM_TYPES = [
  "previous_year",
  "midterm",
  "final",
  "lab",
  "viva",
] as const

export const PROGRAMS = ["regular", "diploma"] as const

const MAX_TAGS = 10

export const createQuestionInputSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(1, "Title is required.")
      .max(200, "Title must be 200 characters or fewer."),
    // Q-003: curated course is XOR with the custom subject/course fallback.
    courseId: z.string().uuid("Please choose a valid course.").nullish(),
    customSubject: z.string().trim().nullish(),
    customCourse: z.string().trim().nullish(),
    batchNumber: z
      .number({ message: "Batch is required." })
      .int("Batch must be a whole number.")
      .min(1, "Batch must be at least 1."),
    program: z.enum(PROGRAMS),
    evening: z.boolean(),
    examType: z.enum(EXAM_TYPES),
    fileUrl: z
      .string()
      .url("The uploaded file link is invalid.")
      .regex(/^https:\/\//i, "The uploaded file link must be an https URL."),
    tags: z
      .array(
        z.string().trim().min(1).max(40, "Tags must be 40 characters or fewer.")
      )
      .max(MAX_TAGS, `Add at most ${MAX_TAGS} tags.`),
  })
  .superRefine((data, ctx) => {
    const hasCourse = Boolean(data.courseId)
    const hasCustom = Boolean(data.customSubject && data.customCourse)
    if (hasCourse === hasCustom) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["courseId"],
        message:
          hasCourse && hasCustom
            ? "Choose either a curated course or the Other option — not both."
            : "Choose a course, or pick Other and fill in both the subject and course.",
      })
    }
  })

export type CreateQuestionInput = z.infer<typeof createQuestionInputSchema>

export type CreateQuestionResult =
  | { success: true; questionId: string; status: "pending" }
  | { success: false; error: string; retryAfter?: number }

function formatRetry(retryAfterSeconds: number): string {
  const minutes = Math.ceil(retryAfterSeconds / 60)
  return minutes > 1 ? `${minutes} minutes` : "1 minute"
}

function fieldError(error: z.ZodError): string {
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

  if (data.courseId) {
    const course = await db.query.courses.findFirst({
      where: eq(courses.id, data.courseId),
      columns: { id: true },
    })
    if (!course) {
      return { success: false, error: "The selected course no longer exists." }
    }
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
      courseId: data.courseId ?? null,
      customSubject: data.customSubject || null,
      customCourse: data.customCourse || null,
      batchNumber: data.batchNumber,
      program: data.program,
      evening: data.evening,
      examType: data.examType,
      fileUrl: data.fileUrl,
      uploadedBy: userId,
      status: "pending",
    }),
    ...(tags.length > 0
      ? [db.insert(questionTags).values(tags.map((tag) => ({ questionId, tag })))]
      : []),
  ] as const

  await db.batch(batchItems)

  revalidatePath("/my-submissions")
  revalidatePath("/upload-question")

  return { success: true, questionId, status: "pending" }
}