import { pgTable, uuid, text, timestamp } from "drizzle-orm/pg-core"

export const subjects = pgTable("subjects", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  createdAt: timestamp("created_at", { mode: "string" }).notNull().defaultNow(),
})