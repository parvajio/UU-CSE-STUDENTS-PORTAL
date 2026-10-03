import { and, asc, eq, ilike, or } from "drizzle-orm"
import { db } from "@/lib/db"
import { routineSlots } from "@/lib/db/schema"
import { auth } from "@/lib/auth/auth"
import RoutineClientView from "@/components/routine/RoutineClientView"

export const metadata = {
  title: "Class Routine",
  description: "Browse clean and organized class routines by batch and section.",
}

const DAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const

/** Hard cap per filtered view — full ALL/ALL/ALL dumps stop here. */
const SLOT_LIMIT = 800

type RoutineSearchParams = {
  batch?: string | string[]
  section?: string | string[]
  day?: string | string[]
}

function first(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0]
  return value
}

function normalizeBatch(raw: string | undefined): string | undefined {
  if (!raw) return undefined
  const batch = raw.trim()
  if (!batch) return undefined
  return batch.toUpperCase() === "ALL" ? "ALL" : batch
}

function normalizeSection(raw: string | undefined): string {
  if (!raw) return "ALL"
  const section = raw.trim()
  if (!section || section.toUpperCase() === "ALL") return "ALL"
  return section.toUpperCase()
}

function normalizeDay(raw: string | undefined): string {
  if (!raw) return "ALL"
  const day = raw.trim()
  if (!day) return "ALL"
  if (day.toUpperCase() === "ALL") return "ALL"
  if (day.toLowerCase() === "today") return "Today"
  const capitalized = day.charAt(0).toUpperCase() + day.slice(1).toLowerCase()
  return (DAYS as readonly string[]).includes(capitalized) ? capitalized : "ALL"
}

/** Resolve "Today" in Asia/Dhaka so server + client agree on the weekday. */
function resolveToday(): string {
  try {
    return new Intl.DateTimeFormat("en-US", {
      weekday: "long",
      timeZone: "Asia/Dhaka",
    }).format(new Date())
  } catch {
    return DAYS[new Date().getDay()]
  }
}

function sortBatches(batches: string[]): string[] {
  return batches.sort((a, b) => {
    const numA = parseInt(a, 10)
    const numB = parseInt(b, 10)
    if (!isNaN(numA) && !isNaN(numB)) return numA - numB
    return a.localeCompare(b)
  })
}

export default async function RoutinePage({
  searchParams,
}: {
  searchParams: Promise<RoutineSearchParams>
}) {
  const params = await searchParams
  const batch = normalizeBatch(first(params.batch)?.trim() ? first(params.batch) : undefined)
  const section = normalizeSection(first(params.section))
  const dayParam = normalizeDay(first(params.day))
  const resolvedToday = resolveToday()
  const effectiveDay = dayParam === "Today" ? resolvedToday : dayParam

  const batchesPromise = (async () => {
    const rows = await db
      .selectDistinct({ batch: routineSlots.batch })
      .from(routineSlots)
    return sortBatches(
      rows.map((r) => r.batch).filter((b): b is string => Boolean(b)),
    )
  })()

  const sectionsPromise = (async () => {
    if (!batch) return [] as string[]
    const rows =
      batch === "ALL"
        ? await db.selectDistinct({ section: routineSlots.section }).from(routineSlots)
        : await db
            .selectDistinct({ section: routineSlots.section })
            .from(routineSlots)
            .where(or(eq(routineSlots.batch, batch), eq(routineSlots.batch, "All")))
    return Array.from(
      new Set(rows.map((r) => r.section.toUpperCase()).filter(Boolean)),
    ).sort()
  })()

  const slotsPromise = (async () => {
    if (!batch) return { slots: [], truncated: false }
    const conditions = []
    if (batch !== "ALL") {
      // Legacy rows with batch = "All" apply to every batch.
      conditions.push(
        or(eq(routineSlots.batch, batch), eq(routineSlots.batch, "All")),
      )
    }
    if (section !== "ALL") {
      conditions.push(ilike(routineSlots.section, section))
    }
    if (effectiveDay !== "ALL") {
      conditions.push(ilike(routineSlots.day, effectiveDay))
    }
    const rows = await db
      .select()
      .from(routineSlots)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(asc(routineSlots.startPeriod))
      .limit(SLOT_LIMIT + 1)
    return {
      slots: rows.slice(0, SLOT_LIMIT),
      truncated: rows.length > SLOT_LIMIT,
    }
  })()

  const [batches, sectionsForBatch, { slots, truncated }, session] =
    await Promise.all([batchesPromise, sectionsPromise, slotsPromise, auth()])

  return (
    <div className="container mx-auto max-w-7xl py-8 px-4 space-y-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Class Routine</h1>
        <p className="text-muted-foreground">
          Select a batch to view its schedule, then narrow by section or day.
        </p>
      </div>

      <RoutineClientView
        slots={slots}
        batches={batches}
        sectionsForBatch={sectionsForBatch}
        initialBatch={batch}
        initialSection={section}
        initialDay={dayParam}
        resolvedToday={resolvedToday}
        truncated={truncated}
        authenticated={Boolean(session?.user?.id)}
      />
    </div>
  )
}
