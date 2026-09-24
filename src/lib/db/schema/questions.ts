import { pgTable, pgEnum, uuid, text, integer, timestamp, index } from "drizzle-orm/pg-core"
import { courses } from "./courses"
import { users } from "./users"

export const questionProgramTypeEnum = pgEnum("question_program_type", [
  "regular",
  "diploma",
  "evening",
])

export const questionSeasonEnum = pgEnum("question_season", [
  "summer",
  "fall",
  "spring",
])

export const questionExamTypeEnum = pgEnum("question_exam_type", [
  "previous_year",
  "midterm",
  "final",
  "lab",
  "viva",
])

export const questionStatusEnum = pgEnum("question_status", [
  "pending",
  "approved",
  "rejected",
])

export const questions = pgTable(
  "questions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    // Nullable (title removed from upload form 2026-09): legacy rows keep
    // their title; new rows are NULL. Not read for new uploads.
    title: text("title"),
    // Required + restrict (004 revision): classification is combobox-only, exactly one courseId.
    courseId: uuid("course_id")
      .notNull()
      .references(() => courses.id, { onDelete: "restrict" }),
    batchNumber: integer("batch_number").notNull(),
    programType: questionProgramTypeEnum("program_type").notNull().default("regular"),
    season: questionSeasonEnum("season"),
    year: integer("year"),
    teacherName: text("teacher_name"),
    examType: questionExamTypeEnum("exam_type").notNull(),
    viewCount: integer("view_count").notNull().default(0),
    downloadCount: integer("download_count").notNull().default(0),
    // Nullable + SET NULL (resolved 2026-08-08): question row survives user deletion,
    // uploaded_by becomes NULL. Deviation from data-model.md's "required" uploadedBy.
    uploadedBy: uuid("uploaded_by")
      .references(() => users.id, { onDelete: "set null" }),
    status: questionStatusEnum("status").notNull().default("pending"),
    approvedBy: uuid("approved_by")
      .references(() => users.id, { onDelete: "set null" }),
    approvedAt: timestamp("approved_at", { mode: "string" }),
    createdAt: timestamp("created_at", { mode: "string" }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "string" }).notNull().defaultNow().$onUpdate(() => new Date().toISOString()),
  },
  (table) => ({
    statusBatchIdx: index("idx_questions_status_batch")
      .on(table.status, table.batchNumber),
    courseIdIdx: index("idx_questions_course_id")
      .on(table.courseId),
    examTypeIdx: index("idx_questions_exam_type")
      .on(table.examType),
    uploadedByIdx: index("idx_questions_uploaded_by")
      .on(table.uploadedBy),
  }),
)