import { relations } from "drizzle-orm"
import { users } from "./users"
import { profiles } from "./profiles"
import { skills } from "./skills"
import { profileSkills } from "./profile-skills"
import { notifications } from "./notifications"
import { siteConfig } from "./site-config"
import { courses } from "./courses"
import { questions } from "./questions"
import { questionFiles } from "./question-files"
import { questionLikes } from "./question-likes"
import { questionTags } from "./question-tags"

export const usersRelations = relations(users, ({ one, many }) => ({
  profile: one(profiles, {
    fields: [users.id],
    references: [profiles.userId],
  }),
  notifications: many(notifications),
  siteConfigs: many(siteConfig),
  uploadedQuestions: many(questions, {
    relationName: "uploadedQuestions",
  }),
  approvedQuestions: many(questions, {
    relationName: "approvedQuestions",
  }),
  questionLikes: many(questionLikes),
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

export const questionsRelations = relations(questions, ({ one, many }) => ({
  course: one(courses, {
    fields: [questions.courseId],
    references: [courses.id],
  }),
  uploader: one(users, {
    fields: [questions.uploadedBy],
    references: [users.id],
    relationName: "uploadedQuestions",
  }),
  approver: one(users, {
    fields: [questions.approvedBy],
    references: [users.id],
    relationName: "approvedQuestions",
  }),
  questionFiles: many(questionFiles),
  questionLikes: many(questionLikes),
  questionTags: many(questionTags),
}))

export const questionFilesRelations = relations(questionFiles, ({ one }) => ({
  question: one(questions, {
    fields: [questionFiles.questionId],
    references: [questions.id],
  }),
}))

export const questionLikesRelations = relations(questionLikes, ({ one }) => ({
  question: one(questions, {
    fields: [questionLikes.questionId],
    references: [questions.id],
  }),
  user: one(users, {
    fields: [questionLikes.userId],
    references: [users.id],
  }),
}))

export const questionTagsRelations = relations(questionTags, ({ one }) => ({
  question: one(questions, {
    fields: [questionTags.questionId],
    references: [questions.id],
  }),
}))