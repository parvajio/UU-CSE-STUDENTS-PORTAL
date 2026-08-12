import { pgTable, AnyPgColumn, uuid, text, boolean } from "drizzle-orm/pg-core"

export const skills = pgTable("skills", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  parentSkillId: uuid("parent_skill_id")
    .references((): AnyPgColumn => skills.id, { onDelete: "set null" }),
  colorKey: text("color_key"),
  isCustom: boolean("is_custom").default(false).notNull(),
})
