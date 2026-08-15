import { auth } from "@/lib/auth/auth"
import { db } from "@/lib/db"
import { routineSlots } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
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

    const targetSemester = semester ? String(semester).trim() : "Current"

    // Map all slots without dropping unflagged/missing entries (even if admin didn't modify)
    const rows = sections.flatMap((sec: any) => {
      const batch = String(sec.batch || "General").trim()
      const section = String(sec.section || "A").trim()
      const slots = Array.isArray(sec.slots) ? sec.slots : []

      return slots.map((s: any) => ({
        batch,
        section,
        day: String(s.day || "Sunday").trim(),
        startPeriod: s.startPeriod !== undefined && s.startPeriod !== null && s.startPeriod !== "" ? Number(s.startPeriod) : null,
        endPeriod: s.endPeriod !== undefined && s.endPeriod !== null && s.endPeriod !== "" ? Number(s.endPeriod) : null,
        startTime: s.startTime ? String(s.startTime).trim() : null,
        endTime: s.endTime ? String(s.endTime).trim() : null,
        classCode: s.classCode ? String(s.classCode).trim().toUpperCase() : "TBD",
        courseTitle: s.courseTitle ? String(s.courseTitle).trim() : null,
        teacherInitial: s.teacherInitial ? String(s.teacherInitial).trim().toUpperCase() : "TBD",
        room: s.room ? String(s.room).trim() : "TBD",
        isLab: Boolean(s.isLab),
        semester: targetSemester,
        effectiveFrom: effectiveFrom ? String(effectiveFrom).trim() : null,
      }))
    })

    // Clear old slots for this semester and insert new ones
    await db.delete(routineSlots).where(eq(routineSlots.semester, targetSemester))

    if (rows.length > 0) {
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
