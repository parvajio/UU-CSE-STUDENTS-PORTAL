import { pgTable, uuid, text, timestamp, index } from "drizzle-orm/pg-core"
import { profiles } from "./profiles"

export const profileAchievements = pgTable(
  "profile_achievements",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    profileId: uuid("profile_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    achievedDate: timestamp("achieved_date", { mode: "string" }),
    description: text("description"),
    imageUrl: text("image_url"),
    linkUrl: text("link_url"),
    createdAt: timestamp("created_at", { mode: "string" }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "string" }).notNull().defaultNow().$onUpdate(() => new Date().toISOString()),
  },
  (table) => ({
    profileIdIdx: index("idx_profile_achievements_profile_id").on(table.profileId),
  }),
)
