import { and, eq, exists, inArray, sql, type SQL } from "drizzle-orm"
import { db } from "@/lib/db"
import { profiles, profileSkills, skills } from "@/lib/db/schema"
import type { Role } from "@/lib/auth/types"
import type { Achievement, Project, Certificate, Experience } from "@/types/portfolio"

export type ViewerRole = Role | "guest"

export type DirectoryParams = {
  query?: string
  skillIds?: string[]
  batchNumber?: number
  limit?: number
}

export type SearchProfileSkill = {
  id: string
  name: string
  slug: string
  colorKey: string | null
}

export type GuestSearchProfile = {
  id: string
  fullName: string
  batchNumber: number
  skills: SearchProfileSkill[]
}

export type FullSearchProfile = GuestSearchProfile & {
  section: string
  avatarUrl: string | null
  isAlumni: boolean
  bio: string | null
  facebookUrl: string | null
  linkedinUrl: string | null
  githubUrl: string | null
  portfolioUrl: string | null
  whatsappNumber: string | null
}

export type ProfileCard = GuestSearchProfile | FullSearchProfile

export type ProfileDetail = {
  id: string
  userId?: string | null
  fullName: string
  batchNumber: number
  section?: string
  avatarUrl?: string | null
  studentId?: string | null
  bio?: string | null
  facebookUrl?: string | null
  linkedinUrl?: string | null
  whatsappNumber?: string | null
  portfolioUrl?: string | null
  githubUrl?: string | null
  isAlumni?: boolean
  currentCompany?: string | null
  jobPosition?: string | null
  status?: string
  createdAt?: string
  updatedAt?: string
  skills: SearchProfileSkill[]
  achievements?: Achievement[]
  projects?: Project[]
  certificates?: Certificate[]
  experiences?: Experience[]
}

export async function searchDirectory(
  params: DirectoryParams = {},
  viewerRole: ViewerRole = "guest"
): Promise<ProfileCard[]> {
  const { query, skillIds, batchNumber, limit = 100 } = params

  const conditions: SQL[] = [eq(profiles.status, "approved")]

  const trimmed = query?.trim()
  if (trimmed) {
    conditions.push(sql`(
      ${profiles.fullName} ILIKE '%' || ${trimmed} || '%'
      OR EXISTS (
        SELECT 1 FROM ${profileSkills} ps
        JOIN ${skills} s ON s.id = ps.skill_id
        WHERE ps.profile_id = ${profiles.id}
          AND s.name ILIKE '%' || ${trimmed} || '%'
      )
    )`)
  }

  if (skillIds && skillIds.length > 0) {
    conditions.push(
      exists(
        db
          .select({ one: sql`1` })
          .from(profileSkills)
          .where(
            and(
              eq(profileSkills.profileId, profiles.id),
              inArray(profileSkills.skillId, skillIds)
            )
          )
      )
    )
  }

  if (batchNumber != null) {
    conditions.push(eq(profiles.batchNumber, batchNumber))
  }

  const withSkills = {
    profileSkills: {
      columns: {},
      with: {
        skill: {
          columns: { id: true, name: true, slug: true, colorKey: true },
        },
      },
    },
  } as const

  const isGuest = viewerRole === "guest"

  const rows = await db.query.profiles.findMany({
    columns: isGuest
      ? { id: true, fullName: true, batchNumber: true }
      : {
          id: true,
          fullName: true,
          batchNumber: true,
          section: true,
          avatarUrl: true,
          isAlumni: true,
          bio: true,
          facebookUrl: true,
          linkedinUrl: true,
          githubUrl: true,
          portfolioUrl: true,
          whatsappNumber: true,
        },
    with: withSkills,
    where: and(...conditions),
    orderBy: (profiles, { asc }) => [asc(profiles.fullName)],
    limit,
  })

  return rows.map((row) => {
    const { profileSkills: joinRows, ...rest } = row
    return { ...rest, skills: joinRows.map((j) => j.skill) }
  })
}

export async function getProfileDetail(
  profileId: string,
  viewerRole: ViewerRole = "guest"
): Promise<ProfileDetail | null> {
  const isGuest = viewerRole === "guest"

  const profile = await db.query.profiles.findFirst({
    where: and(eq(profiles.id, profileId), eq(profiles.status, "approved")),
    columns: isGuest
      ? { id: true, fullName: true, batchNumber: true }
      : {
          id: true,
          userId: true,
          fullName: true,
          studentId: true,
          batchNumber: true,
          section: true,
          avatarUrl: true,
          bio: true,
          facebookUrl: true,
          linkedinUrl: true,
          whatsappNumber: true,
          portfolioUrl: true,
          githubUrl: true,
          isAlumni: true,
          currentCompany: true,
          jobPosition: true,
          status: true,
          createdAt: true,
          updatedAt: true,
        },
    with: {
      profileSkills: {
        columns: {},
        with: {
          skill: {
            columns: { id: true, name: true, slug: true, colorKey: true },
          },
        },
      },
      ...(isGuest
        ? {}
        : {
            achievements: {
              orderBy: (achievements: any, { desc }: any) => [desc(achievements.achievedDate), desc(achievements.createdAt)],
            },
            projects: {
              orderBy: (projects: any, { desc }: any) => [desc(projects.startDate), desc(projects.createdAt)],
            },
            certificates: {
              orderBy: (certificates: any, { desc }: any) => [desc(certificates.issueDate), desc(certificates.createdAt)],
            },
            experiences: {
              orderBy: (experiences: any, { desc }: any) => [desc(experiences.startDate), desc(experiences.createdAt)],
            },
          }),
    },
  })

  if (!profile) return null

  const { profileSkills: joinRows, ...rest } = profile
  return {
    ...rest,
    skills: joinRows.map((j: any) => j.skill),
  }
}
