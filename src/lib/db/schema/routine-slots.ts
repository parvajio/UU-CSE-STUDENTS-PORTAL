import { pgTable, uuid, text, integer, boolean, timestamp } from "drizzle-orm/pg-core"

export const routineSlots = pgTable("routine_slots", {
  id: uuid("id").primaryKey().defaultRandom(),
  batch: text("batch").notNull(),
  section: text("section").notNull(),
  day: text("day").notNull(),
  startPeriod: integer("start_period"),
  endPeriod: integer("end_period"),
  startTime: text("start_time"),
  endTime: text("end_time"),
  classCode: text("class_code").notNull(),
  courseTitle: text("course_title"),
  teacherInitial: text("teacher_initial"),
  room: text("room"),
  isLab: boolean("is_lab").default(false).notNull(),
  semester: text("semester"),
  effectiveFrom: text("effective_from"),
  createdAt: timestamp("created_at", { mode: "string" }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { mode: "string" })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date().toISOString()),
})

export type RoutineSlot = typeof routineSlots.$inferSelect
export type NewRoutineSlot = typeof routineSlots.$inferInsert
