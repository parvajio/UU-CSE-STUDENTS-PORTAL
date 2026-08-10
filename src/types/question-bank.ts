export type ExamType = "previous_year" | "midterm" | "final" | "lab" | "viva"

export type ProgramType = "regular" | "diploma" | "evening"

export type Season = "summer" | "fall" | "spring"

export type QuestionFileType = "image" | "pdf"

export type QuestionStatus = "pending" | "approved" | "rejected"

export type CourseOption = {
  id: string
  code: string
  title: string
  creditHours: string
}

export type QuestionFile = {
  fileUrl: string
  fileType: QuestionFileType
  order: number
}

export type QuestionFileDraft = QuestionFile

export type TopCourseChip = {
  courseId: string
  code: string
  title: string
  count: number
}

export type TopBatchChip = {
  batchNumber: number
  count: number
}

export type TopChips = {
  topCourses: TopCourseChip[]
  topBatches: TopBatchChip[]
}

export type QuestionCardBase = {
  id: string
  title: string
  batchNumber: number
  programType: ProgramType
  season: Season | null
  year: number | null
  teacherName: string | null
  examType: ExamType
  courseCode: string
  courseTitle: string
  tags: string[]
  likeCount: number
  viewCount: number
  downloadCount: number
}

export type GuestQuestionCard = QuestionCardBase

export type QuestionCard = QuestionCardBase & {
  isLikedByViewer: boolean
  files: QuestionFileDraft[]
}

export type QuestionDetailBase = QuestionCardBase & {
  creditHours: string
  submitterName: string | null
  createdAt: string
  updatedAt: string
}

export type GuestQuestionDetail = QuestionDetailBase

export type QuestionDetail = QuestionDetailBase & {
  isLikedByViewer: boolean
  files: QuestionFileDraft[]
}

export type MyQuestionRow = QuestionCard & {
  status: QuestionStatus
  rejectionReason: string | null
  updatedAt: string
}

export type QuestionFilterParams = {
  query?: string
  courseId?: string
  batchNumber?: number
  examType?: ExamType
  programType?: ProgramType
  season?: Season
  year?: number
  tags?: string[]
  page?: number
  pageSize?: number
}