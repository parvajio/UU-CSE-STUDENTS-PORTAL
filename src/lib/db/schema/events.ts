import { pgTable, uuid, text, timestamp } from "drizzle-orm/pg-core"
import { clubs } from "./clubs"

export const events = pgTable(
  "events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    clubId: uuid("club_id")
      .references(() => clubs.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    place: text("place"),
    description: text("description"),
    date: timestamp("date", { mode: "string" }).notNull(),
    deadline: timestamp("deadline", { mode: "string" }),
    startTime: timestamp("start_time", { mode: "string" }),
    endTime: timestamp("end_time", { mode: "string" }),
    // NOTE: event status (upcoming | ongoing | completed) is computed
    // dynamically via computeEventStatus() in src/lib/db/queries/clubs.ts —
    // never stored as a DB column (spec §events, T054).
    createdAt: timestamp("created_at", { mode: "string" }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "string" }).notNull().defaultNow().$onUpdate(() => new Date().toISOString()),
  },
)
