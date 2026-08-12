import { pgTable, uuid, text, timestamp, index } from "drizzle-orm/pg-core"
import { profiles } from "./profiles"

export const profileCertificates = pgTable(
  "profile_certificates",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    profileId: uuid("profile_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    issuer: text("issuer").notNull(),
    issueDate: timestamp("issue_date", { mode: "string" }),
    credentialUrl: text("credential_url"),
    imageUrl: text("image_url"),
    createdAt: timestamp("created_at", { mode: "string" }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "string" }).notNull().defaultNow().$onUpdate(() => new Date().toISOString()),
  },
  (table) => ({
    profileIdIdx: index("idx_profile_certificates_profile_id").on(table.profileId),
  }),
)
