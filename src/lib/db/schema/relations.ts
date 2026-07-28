import { relations } from "drizzle-orm"
import { users } from "./users"
import { profiles } from "./profiles"
import { skills } from "./skills"
import { profileSkills } from "./profile-skills"

export const usersRelations = relations(users, ({ one }) => ({
  profile: one(profiles, {
    fields: [users.id],
    references: [profiles.userId],
  }),
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
