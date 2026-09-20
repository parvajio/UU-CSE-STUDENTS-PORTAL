import { sql } from "drizzle-orm"
import { pgTable, pgEnum, uuid, text, timestamp, uniqueIndex, check } from "drizzle-orm/pg-core"
import { clubs } from "./clubs"
import { profiles } from "./profiles"
import { users } from "./users"

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
  // Either side may be null, but never both (see table check below):
  // - admin-added rows always carry profileId (userId too when the profile
  //   has a linked login);
  // - self-service joins always carry userId, plus profileId when the user
  //   has a profile (so the avatar wall can link to it).
  userId: uuid("user_id")
    .references(() => users.id, { onDelete: "cascade" }),
  profileId: uuid("profile_id")
    .references(() => profiles.id, { onDelete: "cascade" }),
  roleInClub: roleInClubEnum("role_in_club").notNull(),
  position: text("position"),
  designation: text("designation"),
  joinedAt: timestamp("joined_at", { mode: "string" }).notNull().defaultNow(),
}, (table) => ({
  // One profile can hold at most one membership row per club — prevents
  // double-join via self-service Join and duplicate admin adds.
  // (NULL profileIds are distinct, so profile-less self-joins are covered
  // by clubUserUnique instead.)
  clubProfileUnique: uniqueIndex("idx_club_members_club_profile_unique")
    .on(table.clubId, table.profileId),
  clubUserUnique: uniqueIndex("idx_club_members_club_user_unique")
    .on(table.clubId, table.userId),
  hasUserOrProfile: check(
    "chk_club_members_user_or_profile",
    sql`${table.userId} IS NOT NULL OR ${table.profileId} IS NOT NULL`
  ),
}))
