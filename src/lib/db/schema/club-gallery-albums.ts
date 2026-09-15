import { pgTable, uuid, text, integer, timestamp } from "drizzle-orm/pg-core"
import { clubs } from "./clubs"

export const clubGalleryAlbums = pgTable(
  "club_gallery_albums",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    clubId: uuid("club_id")
      .notNull()
      .references(() => clubs.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    description: text("description"),
    displayOrder: integer("display_order").notNull(),
    createdAt: timestamp("created_at", { mode: "string" }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "string" }).notNull().defaultNow().$onUpdate(() => new Date().toISOString()),
  },
)
