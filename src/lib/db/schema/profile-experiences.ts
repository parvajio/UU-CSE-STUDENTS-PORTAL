import { pgTable, uuid, text, timestamp, index } from "drizzle-orm/pg-core"
import { profiles } from "./profiles"

export const profileExperiences = pgTable(
  "profile_experiences",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    profileId: uuid("profile_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    company: text("company").notNull(),
    role: text("role").notNull(),
    startDate: timestamp("start_date", { mode: "string" }),
    endDate: timestamp("end_date", { mode: "string" }),
    description: text("description"),
    createdAt: timestamp("created_at", { mode: "string" }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "string" }).notNull().defaultNow().$onUpdate(() => new Date().toISOString()),
  },
  (table) => ({
    profileIdIdx: index("idx_profile_experiences_profile_id").on(table.profileId),
  }),
)
