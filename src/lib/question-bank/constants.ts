import type { ProgramType, QuestionFileType, Season } from "@/types/question-bank"

export const QUESTION_BANK_PAGE_SIZE = 12

export const ALL_FILTER = "__all__"

export const TOP_CHIPS_N = 5

export const PROGRAM_TYPE_LABELS: Record<ProgramType, string> = {
  regular: "Regular",
  diploma: "Diploma",
  evening: "Evening",
}

export const SEASON_LABELS: Record<Season, string> = {
  summer: "Summer",
  fall: "Fall",
  spring: "Spring",
}

export const FILE_TYPE_LABELS: Record<QuestionFileType, string> = {
  image: "Image",
  pdf: "PDF",
}