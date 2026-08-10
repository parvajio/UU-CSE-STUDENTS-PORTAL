import { asc } from "drizzle-orm"
import { db } from "@/lib/db"
import { courses } from "@/lib/db/schema"
import type { CourseOption } from "@/types/question-bank"

export async function getCourses(): Promise<CourseOption[]> {
  const rows = await db.query.courses.findMany({
    columns: {
      id: true,
      code: true,
      title: true,
      creditHours: true,
    },
    orderBy: [asc(courses.title)],
  })

  return rows
}

export function getCatalog(): Promise<CourseOption[]> {
  return getCourses()
}