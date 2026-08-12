import { pgTable, uuid, text, timestamp, index } from "drizzle-orm/pg-core"
import { profiles } from "./profiles"

export const profileProjects = pgTable(
  "profile_projects",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    profileId: uuid("profile_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    description: text("description"),
    techStack: text("tech_stack").array(),
    demoUrl: text("demo_url"),
    repoUrl: text("repo_url"),
    startDate: timestamp("start_date", { mode: "string" }),
    endDate: timestamp("end_date", { mode: "string" }),
    imageUrl: text("image_url"),
    createdAt: timestamp("created_at", { mode: "string" }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "string" }).notNull().defaultNow().$onUpdate(() => new Date().toISOString()),
  },
  (table) => ({
    profileIdIdx: index("idx_profile_projects_profile_id").on(table.profileId),
  }),
)
