"use server"

import { and, eq, inArray, ne } from "drizzle-orm"
import { redirect } from "next/navigation"
import { auth } from "@/lib/auth/auth"
import { db } from "@/lib/db"
import { profiles, profileSkills, skills } from "@/lib/db/schema"
import { checkRateLimit } from "@/lib/rate-limit"
import { CURRENT_BATCH, SECTIONS } from "../../../../config/site"

const PROFILE_EDIT_MAX = 1
const PROFILE_EDIT_WINDOW_MS = 60 * 60 * 1000

function formatRetry(retryAfterSeconds: number): string {
  const minutes = Math.ceil(retryAfterSeconds / 60)
  return minutes > 1 ? `${minutes} minutes` : "1 minute"
}

export type UpsertProfileInput = {
  fullName: string
  studentId?: string
  batchNumber: number
  section: string
  avatarUrl?: string
  bio?: string
  facebookUrl?: string
  linkedinUrl?: string
  whatsappNumber?: string
  portfolioUrl?: string
  githubUrl?: string
  skillIds: string[]
  isAlumni?: boolean
  currentCompany?: string
  jobPosition?: string
}

type UpsertProfileResult =
  | { success: true; profileId: string; status: "pending" }
  | { success: false; error: string; retryAfter?: number }

function fail(error: string): UpsertProfileResult {
  return { success: false, error }
}

function opt(value?: string): string | null {
  const trimmed = value?.trim()
  return trimmed ? trimmed : null
}

export async function upsertProfile(
  input: UpsertProfileInput
): Promise<UpsertProfileResult> {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")
  const userId = session.user.id

  const fullName = input.fullName?.trim()
  if (!fullName) return fail("Full name is required.")

  const batchNumber = input.batchNumber
  if (
    !Number.isInteger(batchNumber) ||
    batchNumber < 1 ||
    batchNumber > CURRENT_BATCH
  ) {
    return fail(`Batch must be between 1 and ${CURRENT_BATCH}.`)
  }

  if (!SECTIONS.includes(input.section as (typeof SECTIONS)[number])) {
    return fail("Section must be one of A–F.")
  }

  const isAlumni = input.isAlumni === true

  const studentId = opt(input.studentId)
  if (!isAlumni && !studentId) {
    return fail("Student ID is required for current students.")
  }

  const bio = opt(input.bio)
  if (bio && bio.length > 500) {
    return fail("Bio must be 500 characters or fewer.")
  }

  const urlFields: Record<string, string | undefined> = {
    avatarUrl: input.avatarUrl,
    facebookUrl: input.facebookUrl,
    linkedinUrl: input.linkedinUrl,
    portfolioUrl: input.portfolioUrl,
    githubUrl: input.githubUrl,
  }
  for (const [field, value] of Object.entries(urlFields)) {
    const trimmed = value?.trim()
    if (trimmed && !/^https?:\/\//.test(trimmed)) {
      return fail(`${field} must be a valid http(s) URL.`)
    }
  }

  const uniqueSkillIds = [...new Set(input.skillIds ?? [])]
  if (uniqueSkillIds.length > 0) {
    const found = await db
      .select({ id: skills.id })
      .from(skills)
      .where(inArray(skills.id, uniqueSkillIds))
    if (found.length !== uniqueSkillIds.length) {
      return fail("One or more selected skills no longer exist.")
    }
  }

  if (studentId) {
    const existingSid = await db.query.profiles.findFirst({
      where: and(eq(profiles.studentId, studentId), ne(profiles.userId, userId)),
      columns: { id: true },
    })
    if (existingSid) {
      return fail("Student ID is already registered to another profile.")
    }
  }

  const existing = await db.query.profiles.findFirst({
    where: eq(profiles.userId, userId),
    columns: { id: true, status: true },
  })

  // T048: 1 profile edit per hour per user (creation is not rate-limited).
  if (existing) {
    const limit = checkRateLimit(
      `profile-upsert:${userId}`,
      PROFILE_EDIT_MAX,
      PROFILE_EDIT_WINDOW_MS
    )
    if (!limit.allowed) {
      return {
        success: false,
        error: `You've reached the profile edit limit. Try again in ${formatRetry(limit.retryAfter)}.`,
        retryAfter: limit.retryAfter,
      }
    }
  }

  // T046: only an APPROVED profile loses its approval on edit. Pending and
  // rejected profiles are already not approved (approval columns already
  // null), so their status/approval fields stay untouched. Every save
  // re-queues as pending (creation, approved-edit, rejected-resubmit);
  // a pending edit simply remains pending.
  const resetApproval = existing?.status === "approved"

  const values = {
    userId,
    fullName,
    studentId,
    batchNumber,
    section: input.section,
    avatarUrl: opt(input.avatarUrl),
    bio,
    facebookUrl: opt(input.facebookUrl),
    linkedinUrl: opt(input.linkedinUrl),
    whatsappNumber: opt(input.whatsappNumber),
    portfolioUrl: opt(input.portfolioUrl),
    githubUrl: opt(input.githubUrl),
    isAlumni,
    currentCompany: isAlumni ? opt(input.currentCompany) : null,
    jobPosition: isAlumni ? opt(input.jobPosition) : null,
    status: "pending" as const,
    approvedBy: resetApproval ? null : undefined,
    approvedAt: resetApproval ? null : undefined,
  }

  const profileId = existing ? existing.id : crypto.randomUUID()

  const batchItems = [
    existing
      ? db.update(profiles).set(values).where(eq(profiles.id, existing.id))
      : db.insert(profiles).values({ ...values, id: profileId }),
    db.delete(profileSkills).where(eq(profileSkills.profileId, profileId)),
    ...(uniqueSkillIds.length > 0
      ? [
          db.insert(profileSkills).values(
            uniqueSkillIds.map((skillId) => ({ profileId, skillId }))
          ),
        ]
      : []),
  ] as const

  await db.batch(batchItems)

  return { success: true, profileId, status: "pending" }
}

export type MyProfileSkill = {
  id: string
  name: string
  slug: string
  parentSkillId: string | null
  colorKey: string | null
}

export type MyProfile = {
  id: string
  userId: string
  fullName: string
  studentId: string | null
  batchNumber: number
  section: string
  avatarUrl: string | null
  bio: string | null
  facebookUrl: string | null
  linkedinUrl: string | null
  whatsappNumber: string | null
  portfolioUrl: string | null
  githubUrl: string | null
  isAlumni: boolean
  currentCompany: string | null
  jobPosition: string | null
  status: "pending" | "approved" | "rejected"
  approvedBy: string | null
  approvedAt: string | null
  createdAt: string
  updatedAt: string
  skills: MyProfileSkill[]
}

export async function getMyProfile(): Promise<MyProfile | null> {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")
  const userId = session.user.id

  const row = await db.query.profiles.findFirst({
    where: eq(profiles.userId, userId),
    with: {
      profileSkills: {
        columns: {},
        with: { skill: true },
      },
    },
  })

  if (!row) return null

  const { profileSkills: joinRows, ...profile } = row
  return {
    ...profile,
    skills: joinRows.map((j) => ({
      id: j.skill.id,
      name: j.skill.name,
      slug: j.skill.slug,
      parentSkillId: j.skill.parentSkillId,
      colorKey: j.skill.colorKey,
    })),
  }
}
