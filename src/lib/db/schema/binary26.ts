import { pgTable, uuid, text, integer, timestamp } from "drizzle-orm/pg-core"
import { users } from "./users"

export const binary26Registrations = pgTable("binary26_registrations", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  ticketNumber: text("ticket_number").notNull().unique(),
  fullName: text("full_name").notNull(),
  phone: text("phone").notNull(),
  email: text("email").notNull(),
  batch: text("batch").notNull(), // "58" to "68"
  section: text("section").notNull(), // "A" to "L"
  pickupPoint: text("pickup_point").notNull(),
  paymentStatus: text("payment_status").notNull().default("unpaid"), // "unpaid" | "paid"
  markedPaidBy: uuid("marked_paid_by").references(() => users.id, { onDelete: "set null" }),
  markedPaidAt: timestamp("marked_paid_at", { mode: "string" }),
  createdAt: timestamp("created_at", { mode: "string" }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { mode: "string" }).notNull().defaultNow().$onUpdate(() => new Date().toISOString()),
})

export const binary26Gallery = pgTable("binary26_gallery", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  imageUrl: text("image_url").notNull(),
  year: text("year").notNull(),
  description: text("description"),
  displayOrder: integer("display_order").notNull().default(0),
  createdAt: timestamp("created_at", { mode: "string" }).notNull().defaultNow(),
})
