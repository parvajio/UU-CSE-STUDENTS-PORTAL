import { sql } from "drizzle-orm"
import { pgTable, pgEnum, uuid, text, timestamp, index } from "drizzle-orm/pg-core"
import { users } from "./users"
import { departments } from "./departments"

export const clubStatusEnum = pgEnum("club_status", [
  "pending",
  "approved",
  "rejected",
])

export const clubs = pgTable(
  "clubs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull().unique(),
    description: text("description"),
    departmentId: uuid("department_id")
      .notNull()
      .references(() => departments.id, { onDelete: "cascade" }),
    logoUrl: text("logo_url"),
    coverImgUrl: text("cover_img_url"),
    msgGroupUrl: text("msg_group_url"),
    pageUrl: text("page_url"),
    fbGroupUrl: text("fb_group_url"),
    contacts: text("contacts"),
    mail: text("mail"),
    status: clubStatusEnum("status").notNull().default("approved"),
    approvedBy: uuid("approved_by")
      .references(() => users.id, { onDelete: "set null" }),
    approvedAt: timestamp("approved_at", { mode: "string" }),
    createdAt: timestamp("created_at", { mode: "string" }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "string" }).notNull().defaultNow().$onUpdate(() => new Date().toISOString()),
  },
  (table) => ({
    nameTrgmIdx: index("idx_clubs_name_trgm")
      .using("gin", sql`${table.name} gin_trgm_ops`),
  }),
)
