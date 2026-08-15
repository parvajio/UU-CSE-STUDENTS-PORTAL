import { db } from "@/lib/db"
import { routineSlots } from "@/lib/db/schema"
import RoutineClientView from "@/components/routine/RoutineClientView"

export const metadata = {
  title: "Class Routine",
  description: "Browse clean and organized class routines by batch and section.",
}

export default async function RoutinePage() {
  // Fetch all routine slots from the database
  const allSlots = await db.select().from(routineSlots)

  // Extract distinct batches and semesters
  const batchesSet = new Set<string>()
  const semestersSet = new Set<string>()
  const sectionsSet = new Set<string>()

  allSlots.forEach((slot) => {
    if (slot.batch) batchesSet.add(slot.batch)
    if (slot.semester) semestersSet.add(slot.semester)
    if (slot.section) sectionsSet.add(slot.section.toUpperCase())
  })

  const batches = Array.from(batchesSet).sort((a, b) => {
    const numA = parseInt(a, 10)
    const numB = parseInt(b, 10)
    if (!isNaN(numA) && !isNaN(numB)) return numA - numB
    return a.localeCompare(b)
  })

  const semesters = Array.from(semestersSet).sort().reverse()
  const sections = Array.from(sectionsSet).sort()

  return (
    <div className="container mx-auto max-w-7xl py-8 px-4 space-y-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Class Routine</h1>
        <p className="text-muted-foreground">
          Clean and structured class schedules for all batches and sections. Filter by batch, section, or search course codes/teachers.
        </p>
      </div>

      <RoutineClientView
        initialSlots={allSlots}
        batches={batches}
        semesters={semesters}
        sections={sections}
      />
    </div>
  )
}
