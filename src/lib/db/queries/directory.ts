import { and, eq, exists, inArray, sql, type SQL } from "drizzle-orm"
import { db } from "@/lib/db"
import { profiles, profileSkills } from "@/lib/db/schema"
import type { Role } from "@/lib/auth/types"

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
}

export type ProfileCard = GuestSearchProfile | FullSearchProfile

export async function searchDirectory(
  params: DirectoryParams = {},
  viewerRole: ViewerRole = "guest"
): Promise<ProfileCard[]> {
  const { query, skillIds, batchNumber, limit = 100 } = params

  const conditions: SQL[] = [eq(profiles.status, "approved")]

  const trimmed = query?.trim()
  if (trimmed) {
    conditions.push(sql`${profiles.fullName} ILIKE '%' || ${trimmed} || '%'`)
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
