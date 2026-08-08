import { sql } from "drizzle-orm"
import { customType, pgTable, pgEnum, uuid, text, integer, boolean, timestamp, index } from "drizzle-orm/pg-core"
import { courses } from "./courses"
import { users } from "./users"

export const questionProgramEnum = pgEnum("question_program", [
  "regular",
  "diploma",
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

const tsvector = customType<{ data: string; driverData: string }>({
  dataType() {
    return "tsvector"
  },
})

export const questions = pgTable(
  "questions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    title: text("title").notNull(),
    // Postgres-maintained (GENERATED ALWAYS AS ... STORED) — DB keeps it in sync with `title`
    // automatically; no app-side writes (remediation 2026-08-08, T003).
    titleTsv: tsvector("title_tsv")
      .generatedAlwaysAs(sql`to_tsvector('english', "title")`)
      .notNull(),
    courseId: uuid("course_id")
      .references(() => courses.id, { onDelete: "restrict" }),
    customSubject: text("custom_subject"),
    customCourse: text("custom_course"),
    batchNumber: integer("batch_number").notNull(),
    program: questionProgramEnum("program").notNull().default("regular"),
    evening: boolean("evening").notNull().default(false),
    examType: questionExamTypeEnum("exam_type").notNull(),
    fileUrl: text("file_url").notNull(),
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
    titleTsvIdx: index("idx_questions_title_tsv")
      .using("gin", table.titleTsv),
    statusBatchIdx: index("idx_questions_status_batch")
      .on(table.status, table.batchNumber),
    courseIdIdx: index("idx_questions_course_id")
      .on(table.courseId),
    examTypeIdx: index("idx_questions_exam_type")
      .on(table.examType),
    programEveningIdx: index("idx_questions_program_evening")
      .on(table.program, table.evening),
    uploadedByIdx: index("idx_questions_uploaded_by")
      .on(table.uploadedBy),
  }),
)