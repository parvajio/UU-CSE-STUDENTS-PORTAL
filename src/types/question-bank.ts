export type ExamType = "previous_year" | "midterm" | "final" | "lab" | "viva"

export type QuestionProgram = "regular" | "diploma"

export type QuestionStatus = "pending" | "approved" | "rejected"

export type SubjectOption = {
  id: string
  slug: string
  name: string
}

export type CourseOption = {
  id: string
  code: string
  title: string
  creditHours: string
  subjectId: string
}

export type CatalogEntry = SubjectOption & { courses: CourseOption[] }

export type QuestionCardBase = {
  id: string
  title: string
  batchNumber: number
  program: QuestionProgram
  evening: boolean
  examType: ExamType
  subjectName: string | null
  courseTitle: string | null
  courseCode: string | null
  customCourse: string | null
  tags: string[]
}

export type GuestQuestionCard = QuestionCardBase

export type QuestionCard = QuestionCardBase & {
  fileUrl: string
}

export type QuestionDetailBase = QuestionCardBase & {
  customSubject: string | null
  submitterName: string | null
  createdAt: string
  updatedAt: string
}

export type GuestQuestionDetail = QuestionDetailBase

export type QuestionDetail = QuestionDetailBase & {
  fileUrl: string
}

export type MyQuestionRow = QuestionCard & {
  status: QuestionStatus
  rejectionReason: string | null
  updatedAt: string
}

export type QuestionFilterParams = {
  query?: string
  subjectId?: string
  courseId?: string
  batchNumber?: number
  examType?: ExamType
  program?: QuestionProgram
  evening?: boolean
  tags?: string[]
  page?: number
  pageSize?: number
}
