import { z } from "zod"

export const EXAM_TYPES = [
  "previous_year",
  "midterm",
  "final",
  "lab",
  "viva",
] as const

export const EXAM_TYPE_LABELS: Record<(typeof EXAM_TYPES)[number], string> = {
  previous_year: "Previous year",
  midterm: "Midterm",
  final: "Final",
  lab: "Lab",
  viva: "Viva/Seminar",
}

export const PROGRAM_TYPES = ["regular", "diploma", "evening"] as const

export const SEASONS = ["summer", "fall", "spring"] as const

export const FILE_TYPES = ["image", "pdf"] as const

export const MAX_TAGS = 10

const questionFileSchema = z.object({
  fileUrl: z
    .string()
    .url("The uploaded file link is invalid.")
    .regex(/^https:\/\//i, "The uploaded file link must be an https URL."),
  fileType: z.enum(FILE_TYPES),
  order: z.number().int("File order must be a whole number.").min(0),
})

export const createQuestionInputSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(1, "Title is required.")
      .max(200, "Title must be 200 characters or fewer."),
    // Q-001: combobox-only classification — exactly one curated courseId.
    courseId: z.string().uuid("Please choose a valid course."),
    batchNumber: z
      .number({ message: "Batch is required." })
      .int("Batch must be a whole number.")
      .min(1, "Batch must be at least 1."),
    programType: z.enum(PROGRAM_TYPES).default("regular"),
    season: z.enum(SEASONS, { message: "Season is required." }),
    year: z.number({ message: "Year is required." }).int("Year must be a whole number."),
    teacherName: z.string().trim().nullish(),
    examType: z.enum(EXAM_TYPES),
    // Q-004: 1–5 images XOR exactly 1 pdf (enforced across the array below).
    files: z
      .array(questionFileSchema, { message: "Please attach the paper file(s)." })
      .min(1, "Please attach the paper file(s).")
      .max(5, "You can attach at most 5 files."),
    tags: z
      .array(
        z.string().trim().min(1).max(40, "Tags must be 40 characters or fewer.")
      )
      .max(MAX_TAGS, `Add at most ${MAX_TAGS} tags.`),
  })
  .superRefine((data, ctx) => {
    const images = data.files.filter((file) => file.fileType === "image")
    const pdfs = data.files.filter((file) => file.fileType === "pdf")

    const imagesOnly =
      images.length === data.files.length &&
      images.length >= 1 &&
      images.length <= 5
    const singlePdf = pdfs.length === 1 && data.files.length === 1

    if (!imagesOnly && !singlePdf) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["files"],
        message: "Attach 1–5 image files, or exactly one PDF — not a mix.",
      })
    }
  })

export type CreateQuestionInput = z.infer<typeof createQuestionInputSchema>

export type CreateQuestionParseError = z.ZodError<CreateQuestionInput>