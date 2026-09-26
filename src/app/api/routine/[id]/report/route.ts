import { and, eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { auth } from "@/lib/auth/auth"
import { db } from "@/lib/db"
import { routineSlotReports, routineSlots } from "@/lib/db/schema"
import { enforceSubmissionLimit } from "@/lib/rate-limit"

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return Response.json({ error: "You must be logged in to report a routine issue." }, { status: 401 })
  }

  const { id: slotId } = await params
  if (!slotId) {
    return Response.json({ error: "Slot ID is required." }, { status: 400 })
  }

  const limit = enforceSubmissionLimit(session.user.id)
  if (!limit.allowed) {
    return Response.json(
      { error: `Too many reports. Try again in ${limit.retryAfter} seconds.` },
      { status: 429 }
    )
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return Response.json({ error: "Invalid request body." }, { status: 400 })
  }

  const data = body as Record<string, unknown>
  const message = typeof data.message === "string" ? data.message.trim() : ""
  if (message.length < 10) {
    return Response.json({ error: "Please describe the issue in at least 10 characters." }, { status: 400 })
  }
  if (message.length > 1000) {
    return Response.json({ error: "Description must be under 1000 characters." }, { status: 400 })
  }

  const clean = (v: unknown): string | null => {
    if (typeof v !== "string") return null
    const t = v.trim()
    return t.length > 0 && t.length <= 20 ? t : null
  }
  const suggestedClassCode = clean(data.suggestedClassCode)?.toUpperCase() ?? null
  const suggestedTeacherInitial = clean(data.suggestedTeacherInitial)?.toUpperCase() ?? null
  const suggestedRoom = clean(data.suggestedRoom) ?? null

  const slot = await db.query.routineSlots.findFirst({
    where: eq(routineSlots.id, slotId),
  })
  if (!slot) {
    return Response.json({ error: "This slot no longer exists." }, { status: 404 })
  }

  const existing = await db.query.routineSlotReports.findFirst({
    where: and(
      eq(routineSlotReports.slotId, slotId),
      eq(routineSlotReports.reportedBy, session.user.id),
      eq(routineSlotReports.status, "pending")
    ),
    columns: { id: true },
  })
  if (existing) {
    return Response.json(
      { error: "You already have a pending report for this slot." },
      { status: 409 }
    )
  }

  await db.insert(routineSlotReports).values({
    slotId,
    reportedBy: session.user.id,
    message,
    suggestedClassCode,
    suggestedTeacherInitial,
    suggestedRoom,
    snapshotBatch: slot.batch,
    snapshotSection: slot.section,
    snapshotDay: slot.day,
    snapshotStartPeriod: slot.startPeriod,
    snapshotClassCode: slot.classCode,
    snapshotTeacherInitial: slot.teacherInitial,
    snapshotRoom: slot.room,
    status: "pending",
  })

  revalidatePath("/approve")
  revalidatePath("/manage/routine")

  return Response.json({ success: true })
}
