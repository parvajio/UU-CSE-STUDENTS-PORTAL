"use server"

import { and, eq, desc } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { auth } from "@/lib/auth/auth"
import { db } from "@/lib/db"
import {
  profiles,
  profileAchievements,
  profileProjects,
  profileCertificates,
  profileExperiences,
} from "@/lib/db/schema"
import { checkRateLimit } from "@/lib/rate-limit"
import {
  achievementInputSchema,
  projectInputSchema,
  certificateInputSchema,
  experienceInputSchema,
  type AchievementInput,
  type ProjectInput,
  type CertificateInput,
  type ExperienceInput,
} from "@/lib/portfolio/validation"
import type { ProfilePortfolio } from "@/types/portfolio"
import { UTApi } from "uploadthing/server"

const utapi = new UTApi()

export type PortfolioActionResult =
  | { success: true }
  | { success: false; error: string; fieldErrors?: Record<string, string>; retryAfter?: number }

const PORTFOLIO_MAX = 10
const PORTFOLIO_WINDOW_MS = 60 * 60 * 1000 // 1 hour

function extractFileKey(url: string | null): string | null {
  if (!url) return null
  try {
    const parsed = new URL(url)
    const segments = parsed.pathname.split("/")
    return segments[segments.length - 1] || null
  } catch {
    return null
  }
}

async function tryDeleteImage(imageUrl: string | null) {
  if (!imageUrl) return
  const key = extractFileKey(imageUrl)
  if (key) {
    try {
      await utapi.deleteFiles([key])
    } catch (err) {
      console.error("Failed to delete portfolio image from UploadThing:", err)
    }
  }
}

async function getOwnerProfile(): Promise<{ id: string; userId: string } | null> {
  const session = await auth()
  if (!session?.user?.id) return null
  const profile = await db.query.profiles.findFirst({
    where: eq(profiles.userId, session.user.id),
    columns: { id: true, userId: true },
  })
  if (!profile || !profile.userId) return null
  return { id: profile.id, userId: profile.userId }
}

function checkRateLimitForUser(userId: string, entity: string): PortfolioActionResult | null {
  const limit = checkRateLimit(`portfolio:${entity}:${userId}`, PORTFOLIO_MAX, PORTFOLIO_WINDOW_MS)
  if (!limit.allowed) {
    return {
      success: false,
      error: `Too many portfolio updates for ${entity}. Try again in ${Math.ceil(limit.retryAfter / 60)} minutes.`,
      retryAfter: limit.retryAfter,
    }
  }
  return null
}

export async function getMyPortfolio(): Promise<ProfilePortfolio> {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  const profile = await db.query.profiles.findFirst({
    where: eq(profiles.userId, session.user.id),
    columns: { id: true },
  })

  if (!profile) {
    return { achievements: [], projects: [], certificates: [], experiences: [] }
  }

  const [achievements, projects, certificates, experiences] = await Promise.all([
    db.query.profileAchievements.findMany({
      where: eq(profileAchievements.profileId, profile.id),
      orderBy: [desc(profileAchievements.achievedDate), desc(profileAchievements.createdAt)],
    }),
    db.query.profileProjects.findMany({
      where: eq(profileProjects.profileId, profile.id),
      orderBy: [desc(profileProjects.startDate), desc(profileProjects.createdAt)],
    }),
    db.query.profileCertificates.findMany({
      where: eq(profileCertificates.profileId, profile.id),
      orderBy: [desc(profileCertificates.issueDate), desc(profileCertificates.createdAt)],
    }),
    db.query.profileExperiences.findMany({
      where: eq(profileExperiences.profileId, profile.id),
      orderBy: [desc(profileExperiences.startDate), desc(profileExperiences.createdAt)],
    }),
  ])

  return {
    achievements: achievements.map((a) => ({
      ...a,
      achievedDate: a.achievedDate ?? null,
      description: a.description ?? null,
      imageUrl: a.imageUrl ?? null,
      linkUrl: a.linkUrl ?? null,
    })),
    projects: projects.map((p) => ({
      ...p,
      description: p.description ?? null,
      techStack: p.techStack ?? [],
      demoUrl: p.demoUrl ?? null,
      repoUrl: p.repoUrl ?? null,
      startDate: p.startDate ?? null,
      endDate: p.endDate ?? null,
      imageUrl: p.imageUrl ?? null,
    })),
    certificates: certificates.map((c) => ({
      ...c,
      issueDate: c.issueDate ?? null,
      credentialUrl: c.credentialUrl ?? null,
      imageUrl: c.imageUrl ?? null,
    })),
    experiences: experiences.map((e) => ({
      ...e,
      startDate: e.startDate ?? null,
      endDate: e.endDate ?? null,
      description: e.description ?? null,
    })),
  }
}

// ==================== ACHIEVEMENTS ====================

export async function addAchievement(data: AchievementInput): Promise<PortfolioActionResult> {
  const owner = await getOwnerProfile()
  if (!owner) redirect("/login")

  const rateLimitError = checkRateLimitForUser(owner.userId, "achievement")
  if (rateLimitError) return rateLimitError

  const parsed = achievementInputSchema.safeParse(data)
  if (!parsed.success) {
    return {
      success: false,
      error: "Invalid achievement data.",
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string>,
    }
  }

  await db.insert(profileAchievements).values({
    profileId: owner.id,
    ...parsed.data,
  })

  revalidatePath("/profile")
  revalidatePath(`/directory/${owner.id}`)
  return { success: true }
}

export async function updateAchievement(id: string, data: AchievementInput): Promise<PortfolioActionResult> {
  const owner = await getOwnerProfile()
  if (!owner) redirect("/login")

  const rateLimitError = checkRateLimitForUser(owner.userId, "achievement")
  if (rateLimitError) return rateLimitError

  const parsed = achievementInputSchema.safeParse(data)
  if (!parsed.success) {
    return {
      success: false,
      error: "Invalid achievement data.",
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string>,
    }
  }

  const existing = await db.query.profileAchievements.findFirst({
    where: and(eq(profileAchievements.id, id), eq(profileAchievements.profileId, owner.id)),
  })

  if (!existing) {
    return { success: false, error: "Achievement not found." }
  }

  if (existing.imageUrl && existing.imageUrl !== parsed.data.imageUrl) {
    await tryDeleteImage(existing.imageUrl)
  }

  await db
    .update(profileAchievements)
    .set(parsed.data)
    .where(and(eq(profileAchievements.id, id), eq(profileAchievements.profileId, owner.id)))

  revalidatePath("/profile")
  revalidatePath(`/directory/${owner.id}`)
  return { success: true }
}

export async function deleteAchievement(id: string): Promise<PortfolioActionResult> {
  const owner = await getOwnerProfile()
  if (!owner) redirect("/login")

  const rateLimitError = checkRateLimitForUser(owner.userId, "achievement")
  if (rateLimitError) return rateLimitError

  const existing = await db.query.profileAchievements.findFirst({
    where: and(eq(profileAchievements.id, id), eq(profileAchievements.profileId, owner.id)),
  })

  if (!existing) {
    return { success: false, error: "Achievement not found." }
  }

  if (existing.imageUrl) {
    await tryDeleteImage(existing.imageUrl)
  }

  await db
    .delete(profileAchievements)
    .where(and(eq(profileAchievements.id, id), eq(profileAchievements.profileId, owner.id)))

  revalidatePath("/profile")
  revalidatePath(`/directory/${owner.id}`)
  return { success: true }
}

// ==================== PROJECTS ====================

export async function addProject(data: ProjectInput): Promise<PortfolioActionResult> {
  const owner = await getOwnerProfile()
  if (!owner) redirect("/login")

  const rateLimitError = checkRateLimitForUser(owner.userId, "project")
  if (rateLimitError) return rateLimitError

  const parsed = projectInputSchema.safeParse(data)
  if (!parsed.success) {
    return {
      success: false,
      error: "Invalid project data.",
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string>,
    }
  }

  await db.insert(profileProjects).values({
    profileId: owner.id,
    ...parsed.data,
  })

  revalidatePath("/profile")
  revalidatePath(`/directory/${owner.id}`)
  return { success: true }
}

export async function updateProject(id: string, data: ProjectInput): Promise<PortfolioActionResult> {
  const owner = await getOwnerProfile()
  if (!owner) redirect("/login")

  const rateLimitError = checkRateLimitForUser(owner.userId, "project")
  if (rateLimitError) return rateLimitError

  const parsed = projectInputSchema.safeParse(data)
  if (!parsed.success) {
    return {
      success: false,
      error: "Invalid project data.",
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string>,
    }
  }

  const existing = await db.query.profileProjects.findFirst({
    where: and(eq(profileProjects.id, id), eq(profileProjects.profileId, owner.id)),
  })

  if (!existing) {
    return { success: false, error: "Project not found." }
  }

  if (existing.imageUrl && existing.imageUrl !== parsed.data.imageUrl) {
    await tryDeleteImage(existing.imageUrl)
  }

  await db
    .update(profileProjects)
    .set(parsed.data)
    .where(and(eq(profileProjects.id, id), eq(profileProjects.profileId, owner.id)))

  revalidatePath("/profile")
  revalidatePath(`/directory/${owner.id}`)
  return { success: true }
}

export async function deleteProject(id: string): Promise<PortfolioActionResult> {
  const owner = await getOwnerProfile()
  if (!owner) redirect("/login")

  const rateLimitError = checkRateLimitForUser(owner.userId, "project")
  if (rateLimitError) return rateLimitError

  const existing = await db.query.profileProjects.findFirst({
    where: and(eq(profileProjects.id, id), eq(profileProjects.profileId, owner.id)),
  })

  if (!existing) {
    return { success: false, error: "Project not found." }
  }

  if (existing.imageUrl) {
    await tryDeleteImage(existing.imageUrl)
  }

  await db
    .delete(profileProjects)
    .where(and(eq(profileProjects.id, id), eq(profileProjects.profileId, owner.id)))

  revalidatePath("/profile")
  revalidatePath(`/directory/${owner.id}`)
  return { success: true }
}

// ==================== CERTIFICATES ====================

export async function addCertificate(data: CertificateInput): Promise<PortfolioActionResult> {
  const owner = await getOwnerProfile()
  if (!owner) redirect("/login")

  const rateLimitError = checkRateLimitForUser(owner.userId, "certificate")
  if (rateLimitError) return rateLimitError

  const parsed = certificateInputSchema.safeParse(data)
  if (!parsed.success) {
    return {
      success: false,
      error: "Invalid certificate data.",
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string>,
    }
  }

  await db.insert(profileCertificates).values({
    profileId: owner.id,
    ...parsed.data,
  })

  revalidatePath("/profile")
  revalidatePath(`/directory/${owner.id}`)
  return { success: true }
}

export async function updateCertificate(id: string, data: CertificateInput): Promise<PortfolioActionResult> {
  const owner = await getOwnerProfile()
  if (!owner) redirect("/login")

  const rateLimitError = checkRateLimitForUser(owner.userId, "certificate")
  if (rateLimitError) return rateLimitError

  const parsed = certificateInputSchema.safeParse(data)
  if (!parsed.success) {
    return {
      success: false,
      error: "Invalid certificate data.",
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string>,
    }
  }

  const existing = await db.query.profileCertificates.findFirst({
    where: and(eq(profileCertificates.id, id), eq(profileCertificates.profileId, owner.id)),
  })

  if (!existing) {
    return { success: false, error: "Certificate not found." }
  }

  if (existing.imageUrl && existing.imageUrl !== parsed.data.imageUrl) {
    await tryDeleteImage(existing.imageUrl)
  }

  await db
    .update(profileCertificates)
    .set(parsed.data)
    .where(and(eq(profileCertificates.id, id), eq(profileCertificates.profileId, owner.id)))

  revalidatePath("/profile")
  revalidatePath(`/directory/${owner.id}`)
  return { success: true }
}

export async function deleteCertificate(id: string): Promise<PortfolioActionResult> {
  const owner = await getOwnerProfile()
  if (!owner) redirect("/login")

  const rateLimitError = checkRateLimitForUser(owner.userId, "certificate")
  if (rateLimitError) return rateLimitError

  const existing = await db.query.profileCertificates.findFirst({
    where: and(eq(profileCertificates.id, id), eq(profileCertificates.profileId, owner.id)),
  })

  if (!existing) {
    return { success: false, error: "Certificate not found." }
  }

  if (existing.imageUrl) {
    await tryDeleteImage(existing.imageUrl)
  }

  await db
    .delete(profileCertificates)
    .where(and(eq(profileCertificates.id, id), eq(profileCertificates.profileId, owner.id)))

  revalidatePath("/profile")
  revalidatePath(`/directory/${owner.id}`)
  return { success: true }
}

// ==================== EXPERIENCES ====================

export async function addExperience(data: ExperienceInput): Promise<PortfolioActionResult> {
  const owner = await getOwnerProfile()
  if (!owner) redirect("/login")

  const rateLimitError = checkRateLimitForUser(owner.userId, "experience")
  if (rateLimitError) return rateLimitError

  const parsed = experienceInputSchema.safeParse(data)
  if (!parsed.success) {
    return {
      success: false,
      error: "Invalid experience data.",
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string>,
    }
  }

  await db.insert(profileExperiences).values({
    profileId: owner.id,
    ...parsed.data,
  })

  revalidatePath("/profile")
  revalidatePath(`/directory/${owner.id}`)
  return { success: true }
}

export async function updateExperience(id: string, data: ExperienceInput): Promise<PortfolioActionResult> {
  const owner = await getOwnerProfile()
  if (!owner) redirect("/login")

  const rateLimitError = checkRateLimitForUser(owner.userId, "experience")
  if (rateLimitError) return rateLimitError

  const parsed = experienceInputSchema.safeParse(data)
  if (!parsed.success) {
    return {
      success: false,
      error: "Invalid experience data.",
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string>,
    }
  }

  const existing = await db.query.profileExperiences.findFirst({
    where: and(eq(profileExperiences.id, id), eq(profileExperiences.profileId, owner.id)),
  })

  if (!existing) {
    return { success: false, error: "Experience not found." }
  }

  await db
    .update(profileExperiences)
    .set(parsed.data)
    .where(and(eq(profileExperiences.id, id), eq(profileExperiences.profileId, owner.id)))

  revalidatePath("/profile")
  revalidatePath(`/directory/${owner.id}`)
  return { success: true }
}

export async function deleteExperience(id: string): Promise<PortfolioActionResult> {
  const owner = await getOwnerProfile()
  if (!owner) redirect("/login")

  const rateLimitError = checkRateLimitForUser(owner.userId, "experience")
  if (rateLimitError) return rateLimitError

  const existing = await db.query.profileExperiences.findFirst({
    where: and(eq(profileExperiences.id, id), eq(profileExperiences.profileId, owner.id)),
  })

  if (!existing) {
    return { success: false, error: "Experience not found." }
  }

  await db
    .delete(profileExperiences)
    .where(and(eq(profileExperiences.id, id), eq(profileExperiences.profileId, owner.id)))

  revalidatePath("/profile")
  revalidatePath(`/directory/${owner.id}`)
  return { success: true }
}
