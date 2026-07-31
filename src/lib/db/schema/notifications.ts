import { pgTable, uuid, text, boolean, timestamp, index } from "drizzle-orm/pg-core"
import { users } from "./users"

export const notifications = pgTable(
  "notifications",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").notNull(),
    title: text("title").notNull(),
    message: text("message"),
    resourceType: text("resource_type"),
    resourceId: uuid("resource_id"),
    read: boolean("read").notNull().default(false),
    createdAt: timestamp("created_at", { mode: "string" }).notNull().defaultNow(),
  },
  (table) => ({
    userUnreadIdx: index("idx_notifications_user_unread")
      .on(table.userId, table.read),
  }),
)
