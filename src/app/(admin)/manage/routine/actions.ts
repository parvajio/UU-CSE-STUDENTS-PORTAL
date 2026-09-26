"use server"

import { eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { auth } from "@/lib/auth/auth"
import { db } from "@/lib/db"
import { routineSlots } from "@/lib/db/schema"

export type RoutineSlotActionResult =
  | { success: true }
  | { success: false; error: string }

function fail(error: string): RoutineSlotActionResult {
  return { success: false, error }
}

function requireModerator(role: string | undefined) {
  return role === "admin" || role === "moderator"
}

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]

function normalizeDay(day: string | undefined): string | undefined {
  if (day === undefined) return undefined
  const normalized = day.trim()
  const match = DAYS.find((d) => d.toLowerCase() === normalized.toLowerCase())
  return match ?? undefined
}

function toNullableInt(value: unknown): number | null | undefined {
  if (value === undefined) return undefined
  if (value === null || value === "") return null
  const n = Number(value)
  if (!Number.isInteger(n) || n < 1) return undefined
  return n
}

export async function updateRoutineSlot(input: {
  id: string
  batch?: string
  section?: string
  day?: string
  startPeriod?: number | string | null
  endPeriod?: number | string | null
  startTime?: string | null
  endTime?: string | null
  classCode?: string
  courseTitle?: string | null
  teacherInitial?: string | null
  room?: string | null
  isLab?: boolean
}): Promise<RoutineSlotActionResult> {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")
  if (!requireModerator(session.user.role)) {
    return fail("Only admins or moderators can edit routine slots.")
  }

  const id = input.id?.trim()
  if (!id) return fail("Slot ID is required.")

  const updates: Partial<typeof routineSlots.$inferInsert> = {}

  if (input.batch !== undefined) {
    const batch = input.batch.trim()
    if (!batch) return fail("Batch cannot be empty.")
    updates.batch = batch
  }

  if (input.section !== undefined) {
    const section = input.section.trim()
    if (!section) return fail("Section cannot be empty.")
    updates.section = section
  }

  if (input.day !== undefined) {
    const day = normalizeDay(input.day)
    if (!day) return fail("Day must be a valid weekday.")
    updates.day = day
  }

  if (input.startPeriod !== undefined) {
    const n = toNullableInt(input.startPeriod)
    if (n === undefined) return fail("Start period must be a positive integer.")
    updates.startPeriod = n
  }

  if (input.endPeriod !== undefined) {
    const n = toNullableInt(input.endPeriod)
    if (n === undefined) return fail("End period must be a positive integer.")
    updates.endPeriod = n
  }

  if (input.startTime !== undefined) {
    updates.startTime = input.startTime?.trim() || null
  }

  if (input.endTime !== undefined) {
    updates.endTime = input.endTime?.trim() || null
  }

  if (input.classCode !== undefined) {
    const code = input.classCode.trim().toUpperCase()
    if (!code) return fail("Class code cannot be empty.")
    updates.classCode = code
  }

  if (input.courseTitle !== undefined) {
    updates.courseTitle = input.courseTitle?.trim() || null
  }

  if (input.teacherInitial !== undefined) {
    updates.teacherInitial = input.teacherInitial?.trim().toUpperCase() || null
  }

  if (input.room !== undefined) {
    updates.room = input.room?.trim() || null
  }

  if (input.isLab !== undefined) {
    updates.isLab = Boolean(input.isLab)
  }

  if (Object.keys(updates).length === 0) {
    return fail("No updates provided.")
  }

  const updated = await db
    .update(routineSlots)
    .set(updates)
    .where(eq(routineSlots.id, id))
    .returning({ id: routineSlots.id })

  if (updated.length === 0) {
    return fail("Slot not found. It may have been deleted by a newer upload.")
  }

  revalidatePath("/routine")
  revalidatePath("/manage/routine")

  return { success: true }
}

export async function deleteRoutineSlot(input: {
  id: string
}): Promise<RoutineSlotActionResult> {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")
  if (!requireModerator(session.user.role)) {
    return fail("Only admins or moderators can delete routine slots.")
  }

  const id = input.id?.trim()
  if (!id) return fail("Slot ID is required.")

  const deleted = await db
    .delete(routineSlots)
    .where(eq(routineSlots.id, id))
    .returning({ id: routineSlots.id })

  if (deleted.length === 0) {
    return fail("Slot not found. It may have been deleted already.")
  }

  revalidatePath("/routine")
  revalidatePath("/manage/routine")

  return { success: true }
}
