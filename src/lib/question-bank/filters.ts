import { EXAM_TYPES, PROGRAM_TYPES, SEASONS } from "./validation"
import { ALL_FILTER } from "./constants"
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
  const courseRaw = single(searchParams.course)?.trim()
  const batchRaw = single(searchParams.batch)?.trim()
  const examRaw = single(searchParams.exam)?.trim()
  const programTypeRaw = single(searchParams.programType)?.trim()
  const seasonRaw = single(searchParams.season)?.trim()
  const yearRaw = single(searchParams.year)?.trim()
  const tagsRaw = single(searchParams.tags)?.trim()
  const pageRaw = Number(single(searchParams.page))

  const batchNumber = batchRaw ? Number(batchRaw) : undefined
  const examType = EXAM_TYPES.includes(examRaw as never)
    ? (examRaw as QuestionFilterParams["examType"])
    : undefined
  const programType = PROGRAM_TYPES.includes(programTypeRaw as never)
    ? (programTypeRaw as QuestionFilterParams["programType"])
    : undefined
  const season = SEASONS.includes(seasonRaw as never)
    ? (seasonRaw as QuestionFilterParams["season"])
    : undefined
  const yearValue = yearRaw ? Number(yearRaw) : undefined
  const tags = tagsRaw
    ? tagsRaw.split(",").map((t) => t.trim()).filter(Boolean)
    : []

  const courseId =
    courseRaw && courseRaw !== ALL_FILTER ? courseRaw : undefined

  return {
    query: q || undefined,
    courseId,
    batchNumber:
      batchNumber && Number.isFinite(batchNumber) ? batchNumber : undefined,
    examType,
    programType,
    season,
    year: yearValue && Number.isFinite(yearValue) ? yearValue : undefined,
    tags,
    page: pageRaw && Number.isFinite(pageRaw) ? pageRaw : undefined,
  }
}