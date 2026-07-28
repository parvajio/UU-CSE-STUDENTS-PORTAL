import { sql } from "drizzle-orm"
import { pgTable, pgEnum, uuid, text, integer, boolean, timestamp, index } from "drizzle-orm/pg-core"
import { users } from "./users"

export const profileStatusEnum = pgEnum("profile_status", [
  "pending",
  "approved",
  "rejected",
])

export const profiles = pgTable(
  "profiles",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .unique()
      .references(() => users.id, { onDelete: "cascade" }),
    fullName: text("full_name").notNull(),
    studentId: text("student_id").unique(),
    batchNumber: integer("batch_number").notNull(),
    section: text("section").notNull(),
    avatarUrl: text("avatar_url"),
    bio: text("bio"),
    facebookUrl: text("facebook_url"),
    linkedinUrl: text("linkedin_url"),
    whatsappNumber: text("whatsapp_number"),
    portfolioUrl: text("portfolio_url"),
    githubUrl: text("github_url"),
    isAlumni: boolean("is_alumni").notNull().default(false),
    currentCompany: text("current_company"),
    jobPosition: text("job_position"),
    status: profileStatusEnum("status").notNull().default("pending"),
    approvedBy: uuid("approved_by")
      .references(() => users.id, { onDelete: "set null" }),
    approvedAt: timestamp("approved_at", { mode: "string" }),
    createdAt: timestamp("created_at", { mode: "string" }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "string" }).notNull().defaultNow().$onUpdate(() => new Date().toISOString()),
  },
  (table) => ({
    fullNameTrgmIdx: index("idx_profiles_fullname_trgm")
      .using("gin", sql`${table.fullName} gin_trgm_ops`),
    batchIdx: index("idx_profiles_batch")
      .on(table.batchNumber),
    statusAlumniIdx: index("idx_profiles_status_alumni")
      .on(table.status, table.isAlumni),
  }),
)
