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
    status: text("status"),
    createdAt: timestamp("created_at", { mode: "string" }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "string" }).notNull().defaultNow().$onUpdate(() => new Date().toISOString()),
  },
)
