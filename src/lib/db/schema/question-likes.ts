import { pgTable, uuid, timestamp, uniqueIndex } from "drizzle-orm/pg-core"
import { questions } from "./questions"
import { users } from "./users"

export const questionLikes = pgTable(
  "question_likes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    questionId: uuid("question_id")
      .notNull()
      .references(() => questions.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { mode: "string" }).notNull().defaultNow(),
  },
  (table) => ({
    questionUserUniqueIdx: uniqueIndex("uq_question_likes_question_user")
      .on(table.questionId, table.userId),
  }),
)