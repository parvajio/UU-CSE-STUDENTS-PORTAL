import { EXAM_TYPES, PROGRAMS } from "./validation"
import {
  ALL_FILTER,
  EVENING_FALSE,
  EVENING_TRUE,
  OTHER_COURSE,
} from "./constants"
import type { QuestionFilterParams } from "@/types/question-bank"

function single(
  value: string | string[] | undefined
): string | undefined {
  if (Array.isArray(value)) return value[0]
  return value
}

export function parseQuestionFilters(
  searchParams: Record<string, string | string[] | undefined>
): QuestionFilterParams {
  const q = single(searchParams.q)?.trim()
  const subjectId = single(searchParams.subject)?.trim()
  const courseRaw = single(searchParams.course)?.trim()
  const batchRaw = single(searchParams.batch)?.trim()
  const examRaw = single(searchParams.exam)?.trim()
  const programRaw = single(searchParams.program)?.trim()
  const eveningRaw = single(searchParams.evening)?.trim()
  const tagsRaw = single(searchParams.tags)?.trim()
  const pageRaw = Number(single(searchParams.page))

  const batchNumber = batchRaw ? Number(batchRaw) : undefined
  const examType = EXAM_TYPES.includes(examRaw as never)
    ? (examRaw as QuestionFilterParams["examType"])
    : undefined
  const program = PROGRAMS.includes(programRaw as never)
    ? (programRaw as QuestionFilterParams["program"])
    : undefined
  const evening =
    eveningRaw === EVENING_TRUE
      ? true
      : eveningRaw === EVENING_FALSE
        ? false
        : undefined
  const tags = tagsRaw
    ? tagsRaw.split(",").map((t) => t.trim()).filter(Boolean)
    : []

  const courseId =
    courseRaw && courseRaw !== ALL_FILTER ? courseRaw : undefined

  return {
    query: q || undefined,
    subjectId:
      subjectId && subjectId !== ALL_FILTER ? subjectId : undefined,
    courseId,
    batchNumber:
      batchNumber && Number.isFinite(batchNumber) ? batchNumber : undefined,
    examType,
    program,
    evening,
    tags,
    page: pageRaw && Number.isFinite(pageRaw) ? pageRaw : undefined,
  }
}

export { OTHER_COURSE }