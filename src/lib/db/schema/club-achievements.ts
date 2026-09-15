import { pgTable, uuid, text, timestamp } from "drizzle-orm/pg-core"
import { clubs } from "./clubs"

export const clubAchievements = pgTable(
  "club_achievements",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    clubId: uuid("club_id")
      .notNull()
      .references(() => clubs.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    description: text("description"),
    date: timestamp("date", { mode: "string" }),
    imageUrl: text("image_url"),
    linkUrl: text("link_url"),
    createdAt: timestamp("created_at", { mode: "string" }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "string" }).notNull().defaultNow().$onUpdate(() => new Date().toISOString()),
  },
)
