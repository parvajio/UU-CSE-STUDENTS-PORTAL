import { auth } from "@/lib/auth/auth"
import { db } from "@/lib/db"
import { routineSlots } from "@/lib/db/schema"
import { eq, and } from "drizzle-orm"
import { revalidatePath } from "next/cache"

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }
  if (session.user.role !== "admin" && session.user.role !== "moderator") {
    return Response.json({ error: "Forbidden: Admin or Moderator access required" }, { status: 403 })
  }

  try {
    const { sections, semester, effectiveFrom } = await req.json()

    if (!sections || !Array.isArray(sections)) {
      return Response.json({ error: "Invalid sections data provided" }, { status: 400 })
    }

    if (!semester) {
      return Response.json({ error: "Semester is required" }, { status: 400 })
    }

    const rows = sections.flatMap((sec: any) => {
      const batch = String(sec.batch || "").trim()
      const section = String(sec.section || "").trim()
      const slots = Array.isArray(sec.slots) ? sec.slots : []

      return slots
        .filter((s: any) => s && s.classCode) // require classCode for valid slots
        .map((s: any) => ({
          batch: batch || "All",
          section: section || "A",
          day: String(s.day || "Sunday").trim(),
          startPeriod: s.startPeriod !== undefined && s.startPeriod !== null ? Number(s.startPeriod) : null,
          endPeriod: s.endPeriod !== undefined && s.endPeriod !== null ? Number(s.endPeriod) : null,
          startTime: s.startTime ? String(s.startTime).trim() : null,
          endTime: s.endTime ? String(s.endTime).trim() : null,
          classCode: String(s.classCode).trim().toUpperCase(),
          courseTitle: s.courseTitle ? String(s.courseTitle).trim() : null,
          teacherInitial: s.teacherInitial ? String(s.teacherInitial).trim().toUpperCase() : null,
          room: s.room ? String(s.room).trim() : null,
          isLab: Boolean(s.isLab),
          semester: String(semester).trim(),
          effectiveFrom: effectiveFrom ? String(effectiveFrom).trim() : null,
        }))
    })

    // If specific semester is targeted, we clean out old slots for this semester to replace cleanly,
    // or we can replace across all or per batch/section. The standard pattern is clearing by semester.
    await db.delete(routineSlots).where(eq(routineSlots.semester, semester))

    if (rows.length > 0) {
      // Insert in batches of 500 to prevent payload limits
      const batchSize = 500
      for (let i = 0; i < rows.length; i += batchSize) {
        const chunk = rows.slice(i, i + batchSize)
        await db.insert(routineSlots).values(chunk)
      }
    }

    revalidatePath("/routine")
    revalidatePath("/manage/routine")

    return Response.json({ inserted: rows.length })
  } catch (error: unknown) {
    console.error("Error confirming routine slots:", error)
    return Response.json(
      { error: error instanceof Error ? error.message : "Failed to save routine slots" },
      { status: 500 }
    )
  }
}
