import { z } from "zod"

const optionalUrlSchema = z
  .string()
  .trim()
  .url("Must be a valid URL.")
  .regex(/^https:\/\//i, "Must be an https URL.")
  .nullish()
  .or(z.literal(""))
  .transform((val) => (val === "" ? null : val))

export const achievementInputSchema = z.object({
  title: z.string().trim().min(1, "Title is required.").max(200, "Title must be 200 characters or fewer."),
  achievedDate: z.string().trim().nullish().transform((val) => (val === "" ? null : val)),
  description: z.string().trim().max(1000, "Description must be 1000 characters or fewer.").nullish(),
  imageUrl: optionalUrlSchema,
  linkUrl: optionalUrlSchema,
})

export const projectInputSchema = z.object({
  title: z.string().trim().min(1, "Title is required.").max(200, "Title must be 200 characters or fewer."),
  description: z.string().trim().max(2000, "Description must be 2000 characters or fewer.").nullish(),
  techStack: z
    .array(z.string().trim().min(1).max(50, "Tech tag must be 50 chars or fewer."))
    .max(20, "At most 20 tech tags.")
    .nullish(),
  demoUrl: optionalUrlSchema,
  repoUrl: optionalUrlSchema,
  startDate: z.string().trim().nullish().transform((val) => (val === "" ? null : val)),
  endDate: z.string().trim().nullish().transform((val) => (val === "" ? null : val)),
  imageUrl: optionalUrlSchema,
})

export const certificateInputSchema = z.object({
  title: z.string().trim().min(1, "Title is required.").max(200, "Title must be 200 characters or fewer."),
  issuer: z.string().trim().min(1, "Issuer is required.").max(200, "Issuer must be 200 characters or fewer."),
  issueDate: z.string().trim().nullish().transform((val) => (val === "" ? null : val)),
  credentialUrl: optionalUrlSchema,
  imageUrl: optionalUrlSchema,
})

export const experienceInputSchema = z.object({
  company: z.string().trim().min(1, "Company is required.").max(200, "Company must be 200 characters or fewer."),
  role: z.string().trim().min(1, "Role is required.").max(200, "Role must be 200 characters or fewer."),
  startDate: z.string().trim().nullish().transform((val) => (val === "" ? null : val)),
  endDate: z.string().trim().nullish().transform((val) => (val === "" ? null : val)),
  description: z.string().trim().max(2000, "Description must be 2000 characters or fewer.").nullish(),
})

export type AchievementInput = z.infer<typeof achievementInputSchema>
export type ProjectInput = z.infer<typeof projectInputSchema>
export type CertificateInput = z.infer<typeof certificateInputSchema>
export type ExperienceInput = z.infer<typeof experienceInputSchema>
