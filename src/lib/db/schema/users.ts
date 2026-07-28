import { pgTable, pgEnum, uuid, text, timestamp } from "drizzle-orm/pg-core"

export const authProviderEnum = pgEnum("auth_provider", [
  "credentials",
  "google",
  "unclaimed",
])

export const roleEnum = pgEnum("role", ["user", "moderator", "admin"])

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash"),
  authProvider: authProviderEnum("auth_provider").notNull(),
  role: roleEnum("role").notNull().default("user"),
  createdAt: timestamp("created_at", { mode: "string" }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { mode: "string" }).notNull().defaultNow().$onUpdate(() => new Date().toISOString()),
})
