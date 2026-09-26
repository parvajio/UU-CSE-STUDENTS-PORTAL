import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { count, eq } from "drizzle-orm"
import { auth } from "@/lib/auth/auth"
import { db } from "@/lib/db"
import { routineSlotReports, routineSlots } from "@/lib/db/schema"
import RoutineUploadClient from "@/components/admin/RoutineUploadClient"
import LiveRoutineSlotsTable from "@/components/admin/LiveRoutineSlotsTable"

export const metadata: Metadata = {
  title: "Manage Routine",
}

export default async function ManageRoutinePage() {
  const session = await auth()

  if (!session?.user?.id) redirect("/login")
  if (session.user.role !== "admin" && session.user.role !== "moderator") redirect("/")

  const [slots, pendingRows] = await Promise.all([
    db.query.routineSlots.findMany({
      orderBy: (table, { asc }) => [asc(table.batch), asc(table.section), asc(table.day)],
    }),
    db
      .select({ slotId: routineSlotReports.slotId, value: count() })
      .from(routineSlotReports)
      .where(eq(routineSlotReports.status, "pending"))
      .groupBy(routineSlotReports.slotId),
  ])

  const pendingCounts: Record<string, number> = {}
  for (const row of pendingRows) {
    if (row.slotId) pendingCounts[row.slotId] = row.value
  }
  const totalPending = pendingRows.reduce((sum, row) => sum + row.value, 0)

  return (
    <div className="container mx-auto max-w-6xl py-8 px-4 space-y-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Routine Management & Upload</h1>
        <p className="text-muted-foreground">
          Upload class routine PDFs to automatically extract slots via the AI parser, review flagged entries, and publish to the live schedule. Publishing replaces the live routine — all previous history is permanently deleted.
          {totalPending > 0 ? ` ${totalPending} user report(s) waiting in Approvals.` : ""}
        </p>
      </div>

      <RoutineUploadClient />

      <LiveRoutineSlotsTable slots={slots} pendingCounts={pendingCounts} />
    </div>
  )
}
