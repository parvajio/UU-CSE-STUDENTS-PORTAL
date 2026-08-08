import { z } from "zod"

export const EXAM_TYPES = [
  "previous_year",
  "midterm",
  "final",
  "lab",
  "viva",
] as const

export const PROGRAMS = ["regular", "diploma"] as const

export const MAX_TAGS = 10

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

export type CreateQuestionParseError = z.ZodError<CreateQuestionInput>