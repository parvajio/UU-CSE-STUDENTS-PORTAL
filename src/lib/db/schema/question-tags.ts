import { pgTable, uuid, text, timestamp, index, uniqueIndex } from "drizzle-orm/pg-core"
import { questions } from "./questions"

export const questionTags = pgTable(
  "question_tags",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    questionId: uuid("question_id")
      .notNull()
      .references(() => questions.id, { onDelete: "cascade" }),
    tag: text("tag").notNull(),
    createdAt: timestamp("created_at", { mode: "string" }).notNull().defaultNow(),
  },
  (table) => ({
    tagIdx: index("idx_question_tags_tag")
      .on(table.tag),
    questionTagUniqueIdx: uniqueIndex("uq_question_tags_question_tag")
      .on(table.questionId, table.tag),
  }),
)