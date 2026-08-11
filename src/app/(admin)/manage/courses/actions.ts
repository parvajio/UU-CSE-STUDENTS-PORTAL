"use server"

import { eq } from "drizzle-orm"
import { revalidatePath, revalidateTag } from "next/cache"
import { redirect } from "next/navigation"
import { auth } from "@/lib/auth/auth"
import { db } from "@/lib/db"
import { courses } from "@/lib/db/schema"

export type CourseActionResult =
  | { success: true }
  | { success: false; error: string }

function fail(error: string): CourseActionResult {
  return { success: false, error }
}

export async function createCourse(input: {
  code: string
  title: string
  creditHours: string | number
}): Promise<CourseActionResult> {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")
  if (session.user.role !== "admin") {
    return fail("Only admins can manage courses.")
  }

  const code = input.code?.trim().toUpperCase()
  const title = input.title?.trim()
  const creditHours = typeof input.creditHours === "number" 
    ? input.creditHours.toString() 
    : input.creditHours?.trim()

  if (!code) return fail("Course code is required.")
  if (!title) return fail("Course title is required.")
  if (!creditHours || Number.isNaN(Number(creditHours)) || Number(creditHours) <= 0) {
    return fail("Valid credit hours are required.")
  }

  try {
    await db.insert(courses).values({
      code,
      title,
      creditHours,
    })
  } catch (err: unknown) {
    // Postgres unique constraint error code is 23505
    if (
      err &&
      typeof err === "object" &&
      "code" in err &&
      err.code === "23505"
    ) {
      return fail(`A course with code "${code}" already exists.`)
    }
    throw err
  }

  revalidatePath("/manage/courses")
  revalidateTag("question-bank")

  return { success: true }
}

export async function updateCourse(input: {
  id: string
  title?: string
  creditHours?: string | number
}): Promise<CourseActionResult> {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")
  if (session.user.role !== "admin") {
    return fail("Only admins can manage courses.")
  }

  const id = input.id?.trim()
  if (!id) return fail("Course ID is required.")

  const updates: { title?: string; creditHours?: string } = {}

  if (input.title !== undefined) {
    const title = input.title.trim()
    if (!title) return fail("Course title cannot be empty.")
    updates.title = title
  }

  if (input.creditHours !== undefined) {
    const ch = typeof input.creditHours === "number"
      ? input.creditHours.toString()
      : input.creditHours.trim()
    if (!ch || Number.isNaN(Number(ch)) || Number(ch) <= 0) {
      return fail("Valid credit hours are required.")
    }
    updates.creditHours = ch
  }

  if (Object.keys(updates).length === 0) {
    return fail("No updates provided.")
  }

  await db
    .update(courses)
    .set(updates)
    .where(eq(courses.id, id))

  revalidatePath("/manage/courses")
  revalidateTag("question-bank")

  return { success: true }
}
