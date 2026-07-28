import { pgTable, uuid, primaryKey } from "drizzle-orm/pg-core"
import { profiles } from "./profiles"
import { skills } from "./skills"

export const profileSkills = pgTable(
  "profile_skills",
  {
    profileId: uuid("profile_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    skillId: uuid("skill_id")
      .notNull()
      .references(() => skills.id, { onDelete: "cascade" }),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.profileId, table.skillId] }),
  }),
)
