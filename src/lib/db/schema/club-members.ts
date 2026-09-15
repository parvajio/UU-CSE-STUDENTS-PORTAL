import { pgTable, pgEnum, uuid, text, timestamp } from "drizzle-orm/pg-core"
import { clubs } from "./clubs"
import { profiles } from "./profiles"

export const roleInClubEnum = pgEnum("role_in_club", [
  "member",
  "executive",
  "advisor",
])

export const clubMembers = pgTable("club_members", {
  id: uuid("id").primaryKey().defaultRandom(),
  clubId: uuid("club_id")
    .notNull()
    .references(() => clubs.id, { onDelete: "cascade" }),
  profileId: uuid("profile_id")
    .notNull()
    .references(() => profiles.id, { onDelete: "cascade" }),
  roleInClub: roleInClubEnum("role_in_club").notNull(),
  position: text("position"),
  designation: text("designation"),
  joinedAt: timestamp("joined_at", { mode: "string" }).notNull().defaultNow(),
})
