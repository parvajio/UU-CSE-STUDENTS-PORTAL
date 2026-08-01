import { relations } from "drizzle-orm"
import { users } from "./users"
import { profiles } from "./profiles"
import { skills } from "./skills"
import { profileSkills } from "./profile-skills"
import { notifications } from "./notifications"
import { siteConfig } from "./site-config"

export const usersRelations = relations(users, ({ one, many }) => ({
  profile: one(profiles, {
    fields: [users.id],
    references: [profiles.userId],
  }),
  notifications: many(notifications),
  siteConfigs: many(siteConfig),
}))

export const profilesRelations = relations(profiles, ({ one, many }) => ({
  user: one(users, {
    fields: [profiles.userId],
    references: [users.id],
  }),
  approver: one(users, {
    fields: [profiles.approvedBy],
    references: [users.id],
  }),
  profileSkills: many(profileSkills),
}))

export const skillsRelations = relations(skills, ({ one, many }) => ({
  parent: one(skills, {
    fields: [skills.parentSkillId],
    references: [skills.id],
    relationName: "parentSkill",
  }),
  children: many(skills, {
    relationName: "parentSkill",
  }),
  profileSkills: many(profileSkills),
}))

export const profileSkillsRelations = relations(profileSkills, ({ one }) => ({
  profile: one(profiles, {
    fields: [profileSkills.profileId],
    references: [profiles.id],
  }),
  skill: one(skills, {
    fields: [profileSkills.skillId],
    references: [skills.id],
  }),
}))

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
}))

export const siteConfigRelations = relations(siteConfig, ({ one }) => ({
  updater: one(users, {
    fields: [siteConfig.updatedBy],
    references: [users.id],
  }),
}))
