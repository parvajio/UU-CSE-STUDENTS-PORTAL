import { pgTable, pgEnum, uuid, text, integer, timestamp, index } from "drizzle-orm/pg-core"
import { users } from "./users"
import { routineSlots } from "./routine-slots"

export const routineReportStatusEnum = pgEnum("routine_report_status", [
  "pending",
  "approved",
  "rejected",
])

// User-submitted correction reports for AI-extracted routine slots.
// Follows the universal approval pattern: status/approvedBy/approvedAt.
// Snapshot columns freeze the slot context so the report stays meaningful
// even if the slot is edited, deleted, or wiped by a replace-all upload
// (slotId uses SET NULL to preserve audit history).
export const routineSlotReports = pgTable(
  "routine_slot_reports",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    slotId: uuid("slot_id").references(() => routineSlots.id, { onDelete: "set null" }),
    reportedBy: uuid("reported_by")
      .references(() => users.id, { onDelete: "cascade" }),
    message: text("message").notNull(),
    suggestedClassCode: text("suggested_class_code"),
    suggestedTeacherInitial: text("suggested_teacher_initial"),
    suggestedRoom: text("suggested_room"),
    // Frozen copy of the reported slot at submit time
    snapshotBatch: text("snapshot_batch"),
    snapshotSection: text("snapshot_section"),
    snapshotDay: text("snapshot_day"),
    snapshotStartPeriod: integer("snapshot_start_period"),
    snapshotClassCode: text("snapshot_class_code"),
    snapshotTeacherInitial: text("snapshot_teacher_initial"),
    snapshotRoom: text("snapshot_room"),
    status: routineReportStatusEnum("status").notNull().default("pending"),
    approvedBy: uuid("approved_by")
      .references(() => users.id, { onDelete: "set null" }),
    approvedAt: timestamp("approved_at", { mode: "string" }),
    createdAt: timestamp("created_at", { mode: "string" }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "string" })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date().toISOString()),
  },
  (table) => ({
    statusIdx: index("idx_routine_reports_status").on(table.status),
    slotIdIdx: index("idx_routine_reports_slot_id").on(table.slotId),
    reporterIdx: index("idx_routine_reports_reported_by").on(table.reportedBy),
  })
)

export type RoutineSlotReport = typeof routineSlotReports.$inferSelect
export type NewRoutineSlotReport = typeof routineSlotReports.$inferInsert
