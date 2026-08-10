import { pgTable, pgEnum, uuid, text, integer, timestamp, index } from "drizzle-orm/pg-core"
import { questions } from "./questions"

export const questionFileTypeEnum = pgEnum("question_file_type", [
  "image",
  "pdf",
])

export const questionFiles = pgTable(
  "question_files",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    questionId: uuid("question_id")
      .notNull()
      .references(() => questions.id, { onDelete: "cascade" }),
    fileUrl: text("file_url").notNull(),
    fileType: questionFileTypeEnum("file_type").notNull(),
    // Display order 0..n for images; pdf always 0. Column key is `order_`
    // because `order` is a reserved word in Postgres.
    order: integer("order_").notNull(),
    createdAt: timestamp("created_at", { mode: "string" }).notNull().defaultNow(),
  },
  (table) => ({
    questionOrderIdx: index("idx_question_files_question_order")
      .on(table.questionId, table.order),
  }),
)