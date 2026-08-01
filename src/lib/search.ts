import { and, eq, exists, inArray, sql, type AnyColumn, type SQL } from "drizzle-orm"
import { db } from "@/lib/db"
import { profiles, profileSkills } from "@/lib/db/schema"
import type { Role } from "@/lib/auth/types"

export type ViewerRole = Role | "guest"

export type SearchFilters = {
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

export type SearchProfile = GuestSearchProfile | FullSearchProfile

export function buildSearchQuery(term: string, columns: AnyColumn[]): SQL {
  const trimmed = term.trim()
  if (!trimmed) return sql`true`
  const tsvector = sql.join(columns, sql` || ' ' `)
  return sql`to_tsvector('english', ${tsvector}) @@ plainto_tsquery('english', ${trimmed})`
}

export async function searchProfiles(
  term: string,
  filters: SearchFilters,
  viewerRole: "guest"
): Promise<GuestSearchProfile[]>
export async function searchProfiles(
  term: string,
  filters: SearchFilters,
  viewerRole: Exclude<Role, "guest">
): Promise<FullSearchProfile[]>
export async function searchProfiles(
  term: string,
  filters: SearchFilters,
  viewerRole: ViewerRole
): Promise<SearchProfile[]>
export async function searchProfiles(
  term: string,
  filters: SearchFilters = {},
  viewerRole: ViewerRole = "guest"
): Promise<SearchProfile[]> {
  const { skillIds, batchNumber, limit = 100 } = filters

  const conditions: SQL[] = [eq(profiles.status, "approved")]

  const trimmed = term.trim()
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

  if (viewerRole === "guest") {
    const rows = await db.query.profiles.findMany({
      columns: { id: true, fullName: true, batchNumber: true },
      with: withSkills,
      where: and(...conditions),
      orderBy: (profiles, { asc }) => [asc(profiles.fullName)],
      limit,
    })
    return rows.map((row) => {
      const { profileSkills: joinRows, ...rest } = row
      return { ...rest, skills: joinRows.map((joinRow) => joinRow.skill) }
    })
  }

  const rows = await db.query.profiles.findMany({
    columns: {
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
    return { ...rest, skills: joinRows.map((joinRow) => joinRow.skill) }
  })
}
