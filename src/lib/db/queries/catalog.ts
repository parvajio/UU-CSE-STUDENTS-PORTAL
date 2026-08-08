import { asc } from "drizzle-orm"
import { db } from "@/lib/db"
import { subjects } from "@/lib/db/schema"
import type { CatalogEntry } from "@/types/question-bank"

export async function getSubjectsWithCourses(): Promise<CatalogEntry[]> {
  const rows = await db.query.subjects.findMany({
    columns: {
      id: true,
      slug: true,
      name: true,
    },
    with: {
      courses: {
        columns: {
          id: true,
          code: true,
          title: true,
          creditHours: true,
          subjectId: true,
        },
      },
    },
    orderBy: [asc(subjects.name)],
  })

  return rows.map(({ courses, ...subject }) => ({
    ...subject,
    courses: [...courses].sort((a, b) => a.title.localeCompare(b.title)),
  }))
}

export function getCatalog(): Promise<CatalogEntry[]> {
  return getSubjectsWithCourses()
}