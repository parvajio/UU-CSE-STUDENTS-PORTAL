import { pgTable, uuid, text, numeric, timestamp } from "drizzle-orm/pg-core"

export const courses = pgTable("courses", {
  id: uuid("id").primaryKey().defaultRandom(),
  code: text("code").notNull().unique(),
  title: text("title").notNull(),
  creditHours: numeric("credit_hours").notNull(),
  createdAt: timestamp("created_at", { mode: "string" }).notNull().defaultNow(),
})