import { pgTable, uuid, text, numeric, timestamp, index } from "drizzle-orm/pg-core"
import { subjects } from "./subjects"

export const courses = pgTable(
  "courses",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    code: text("code").notNull().unique(),
    title: text("title").notNull(),
    creditHours: numeric("credit_hours").notNull(),
    subjectId: uuid("subject_id")
      .notNull()
      .references(() => subjects.id, { onDelete: "restrict" }),
    createdAt: timestamp("created_at", { mode: "string" }).notNull().defaultNow(),
  },
  (table) => ({
    subjectIdIdx: index("idx_courses_subject_id")
      .on(table.subjectId),
  }),
)