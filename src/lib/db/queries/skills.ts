import { asc, isNull } from "drizzle-orm"
import { db } from "@/lib/db"
import { skills } from "@/lib/db/schema"

export type SkillNode = {
  id: string
  name: string
  slug: string
  parentSkillId: string | null
  colorKey: string | null
  isCustom?: boolean
  children: SkillNode[]
}

export type FlatSkill = {
  id: string
  name: string
  slug: string
  parentSkillId: string | null
  colorKey: string | null
  isCustom?: boolean
}

export async function getAllSkills(): Promise<FlatSkill[]> {
  return db.query.skills.findMany({
    columns: {
      id: true,
      name: true,
      slug: true,
      parentSkillId: true,
      colorKey: true,
      isCustom: true,
    },
    orderBy: [asc(skills.name)],
  })
}

export async function getSkillsTree(): Promise<SkillNode[]> {
  const rows = await db.query.skills.findMany({
    columns: {
      id: true,
      name: true,
      slug: true,
      parentSkillId: true,
      colorKey: true,
      isCustom: true,
    },
    where: isNull(skills.parentSkillId),
    with: { children: true },
    orderBy: [asc(skills.name)],
  })

  return rows.map(({ children, ...node }) => ({
    ...node,
    children: [...children]
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((child) => ({
        id: child.id,
        name: child.name,
        slug: child.slug,
        parentSkillId: child.parentSkillId,
        colorKey: child.colorKey,
        isCustom: child.isCustom,
        children: [],
      })),
  }))
}
