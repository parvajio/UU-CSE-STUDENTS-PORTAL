import { pgTable, uuid, text, integer, timestamp } from "drizzle-orm/pg-core"
import { clubGalleryAlbums } from "./club-gallery-albums"

export const clubGalleryImages = pgTable("club_gallery_images", {
  id: uuid("id").primaryKey().defaultRandom(),
  albumId: uuid("album_id")
    .notNull()
    .references(() => clubGalleryAlbums.id, { onDelete: "cascade" }),
  imageUrl: text("image_url").notNull(),
  caption: text("caption"),
  displayOrder: integer("display_order").notNull(),
  createdAt: timestamp("created_at", { mode: "string" }).notNull().defaultNow(),
})
