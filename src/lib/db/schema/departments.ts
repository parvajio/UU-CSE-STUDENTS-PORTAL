import { sql } from "drizzle-orm"
import { pgTable, text, uuid, timestamp, index } from "drizzle-orm/pg-core"

export const departments = pgTable(
  "departments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull().unique(),
    slug: text("slug").notNull().unique(),
    description: text("description"),
    imageUrl: text("image_url"),
    createdAt: timestamp("created_at", { mode: "string" }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "string" }).notNull().defaultNow().$onUpdate(() => new Date().toISOString()),
  },
  (table) => ({
    nameTrgmIdx: index("idx_departments_name_trgm")
      .using("gin", sql`${table.name} gin_trgm_ops`),
  }),
)
