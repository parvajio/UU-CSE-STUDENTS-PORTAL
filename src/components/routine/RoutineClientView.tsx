"use client"

import { memo, useDeferredValue, useMemo, useState, useTransition } from "react"
import { usePathname, useRouter } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Calendar, Clock, MapPin, User, BookOpen, Layers, CalendarX } from "lucide-react"
import ReportSlotDialog from "@/components/routine/ReportSlotDialog"
import type { RoutineSlot } from "@/lib/db/schema"

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]

const NONE_VALUE = "__NONE__"

function normalizeDayName(day: string | null | undefined): string {
  if (!day) return "Sunday"
  return day.charAt(0).toUpperCase() + day.slice(1).toLowerCase()
}

const SlotCard = memo(function SlotCard({
  slot,
  authenticated,
}: {
  slot: RoutineSlot
  authenticated: boolean
}) {
  const classCode = slot.classCode || "N/A"
  const teacherInitial = slot.teacherInitial || "N/A"
  const room = slot.room || "N/A"
  const periodText =
    slot.startTime && slot.endTime
      ? `${slot.startTime} - ${slot.endTime}`
      : slot.startPeriod
        ? `Period ${slot.startPeriod}`
        : "N/A"

  return (
    <div className="p-3.5 rounded-lg border bg-card hover:bg-accent/5 transition-colors space-y-3 relative overflow-hidden shadow-xs">
      {slot.isLab && (
        <div className="absolute top-0 right-0 bg-gradient-to-l from-violet-600 to-indigo-600 text-white px-2 py-0.5 text-[10px] font-extrabold rounded-bl uppercase tracking-wider shadow-xs">
          Lab
        </div>
      )}

      <div className="flex items-start justify-between gap-2 pr-6">
        <div className="font-bold text-sm tracking-tight text-foreground flex items-center gap-1.5">
          <BookOpen className="size-3.5 text-indigo-500 shrink-0" />
          <span>{classCode}</span>
          <span className="inline-flex items-center gap-1 bg-violet-500/15 dark:bg-violet-500/20 text-violet-700 dark:text-violet-300 px-1.5 py-0.5 rounded text-[11px] font-bold ml-1.5">
            <User className="size-3 text-violet-600 dark:text-violet-400" />
            <span>{teacherInitial}</span>
          </span>
        </div>
        <span className="text-[11px] font-medium text-muted-foreground">
          Batch {slot.batch}-{slot.section}
        </span>
      </div>

      {slot.courseTitle && (
        <p className="text-xs text-muted-foreground line-clamp-1 font-medium">
          {slot.courseTitle}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-border/40">
        <div className="inline-flex items-center gap-1 bg-sky-500/15 dark:bg-sky-500/20 text-sky-700 dark:text-sky-300 px-2.5 py-1 rounded-md text-xs font-bold shadow-2xs">
          <Clock className="size-3.5 text-sky-600 dark:text-sky-400" />
          <span>{periodText}</span>
        </div>

        <div className="inline-flex items-center gap-1 bg-emerald-500/15 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 px-2.5 py-1 rounded-md text-xs font-bold shadow-2xs">
          <MapPin className="size-3.5 text-emerald-600 dark:text-emerald-400" />
          <span>Room {room}</span>
        </div>

        <div className="ml-auto">
          <ReportSlotDialog slot={slot} authenticated={authenticated} />
        </div>
      </div>
    </div>
  )
})

export default function RoutineClientView({
  slots,
  batches,
  sectionsForBatch,
  initialBatch,
  initialSection,
  initialDay,
  resolvedToday,
  truncated = false,
  authenticated = false,
}: {
  slots: RoutineSlot[]
  batches: string[]
  sectionsForBatch: string[]
  initialBatch: string | undefined
  initialSection: string
  initialDay: string
  resolvedToday: string
  truncated?: boolean
  authenticated?: boolean
}) {
  const router = useRouter()
  const pathname = usePathname()
  const [isPending, startTransition] = useTransition()
  const [searchInput, setSearchInput] = useState("")
  const deferredQuery = useDeferredValue(searchInput)

  const hasBatch = Boolean(initialBatch)
  const effectiveDay = initialDay === "Today" ? resolvedToday : initialDay

  function pushFilters(next: { batch?: string; section?: string; day?: string }) {
    startTransition(() => {
      const sp = new URLSearchParams()
      if (next.batch) sp.set("batch", next.batch)
      // Server defaults section/day to ALL when omitted.
      if (next.batch && next.section && next.section !== "ALL") {
        sp.set("section", next.section)
      }
      if (next.batch && next.day && next.day !== "ALL") {
        sp.set("day", next.day)
      }
      const qs = sp.toString()
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false })
    })
  }

  function handleBatchChange(value: string) {
    if (value === NONE_VALUE) {
      pushFilters({})
      return
    }
    // Changing batch resets section (sections differ per batch) but keeps day.
    pushFilters({ batch: value, section: "ALL", day: initialDay })
  }

  function handleSectionChange(value: string) {
    if (!initialBatch) return
    pushFilters({ batch: initialBatch, section: value, day: initialDay })
  }

  function handleDayChange(value: string) {
    if (!initialBatch) return
    pushFilters({ batch: initialBatch, section: initialSection, day: value })
  }

  // Server already filtered by batch/section/day — only search runs client-side.
  const filteredSlots = useMemo(() => {
    const q = deferredQuery.trim().toLowerCase()
    if (!q) return slots
    return slots.filter((slot) => {
      return (
        slot.classCode?.toLowerCase().includes(q) ||
        slot.courseTitle?.toLowerCase().includes(q) ||
        slot.teacherInitial?.toLowerCase().includes(q) ||
        slot.room?.toLowerCase().includes(q)
      )
    })
  }, [slots, deferredQuery])

  // Group slots by day, then by section.
  const structuredRoutine = useMemo(() => {
    const daysToIterate = effectiveDay !== "ALL" ? [effectiveDay] : DAYS
    const map: Record<string, Record<string, RoutineSlot[]>> = {}

    daysToIterate.forEach((day) => {
      map[day] = {}
    })

    filteredSlots.forEach((slot) => {
      const dayName = normalizeDayName(slot.day)
      if (!map[dayName]) map[dayName] = {}

      const secName = slot.section ? `Section ${slot.section.toUpperCase()}` : "Section A"
      if (!map[dayName][secName]) map[dayName][secName] = []

      map[dayName][secName].push(slot)
    })

    Object.keys(map).forEach((day) => {
      Object.keys(map[day]).forEach((sec) => {
        map[day][sec].sort((a: RoutineSlot, b: RoutineSlot) => {
          if (a.startPeriod !== null && b.startPeriod !== null) {
            return a.startPeriod - b.startPeriod
          }
          if (a.startTime && b.startTime) {
            return a.startTime.localeCompare(b.startTime)
          }
          return 0
        })
      })
    })

    return map
  }, [filteredSlots, effectiveDay])

  const totalSlots = filteredSlots.length

  return (
    <div className="space-y-6">
      {/* Filter Bar */}
      <Card className="p-4 bg-card border shadow-sm">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-center">
          {/* Batch Selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground">Batch Number</label>
            <Select
              value={initialBatch ?? NONE_VALUE}
              onValueChange={handleBatchChange}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select batch" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE_VALUE}>Select batch</SelectItem>
                <SelectItem value="ALL">All Batches</SelectItem>
                {batches.map((b) => (
                  <SelectItem key={b} value={b}>
                    Batch {b}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Section Selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground">Section</label>
            <Select
              value={initialSection}
              onValueChange={handleSectionChange}
              disabled={!hasBatch}
            >
              <SelectTrigger>
                <SelectValue placeholder={hasBatch ? "All Sections" : "Select batch first"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Sections</SelectItem>
                {sectionsForBatch.map((sec) => (
                  <SelectItem key={sec} value={sec}>
                    Section {sec}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Day Selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground">Day of Week</label>
            <Select
              value={initialDay}
              onValueChange={handleDayChange}
              disabled={!hasBatch}
            >
              <SelectTrigger>
                <SelectValue placeholder={hasBatch ? "All Days" : "Select batch first"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Days</SelectItem>
                <SelectItem value="Today">Today ({resolvedToday})</SelectItem>
                {DAYS.map((d) => (
                  <SelectItem key={d} value={d}>
                    {d}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Search Input — client-side within the loaded slice */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground">Search</label>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
              <Input
                placeholder={hasBatch ? "Code, teacher, room..." : "Select batch first"}
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                disabled={!hasBatch}
                className="pl-9"
              />
            </div>
          </div>
        </div>
      </Card>

      {!hasBatch ? (
        <Card className="p-12 text-center space-y-3">
          <div className="mx-auto size-12 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
            <CalendarX className="size-6" />
          </div>
          <h3 className="text-lg font-semibold">Select a batch to view routine</h3>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto">
            Pick a batch above (or All Batches), then narrow by section or day.
          </p>
        </Card>
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary" className="text-xs font-semibold">
              {isPending ? "Updating…" : `${totalSlots} class${totalSlots === 1 ? "" : "es"}`}
            </Badge>
            {truncated && !deferredQuery.trim() && (
              <span className="text-xs text-muted-foreground">
                Showing first {slots.length} — narrow by section or day to see more.
              </span>
            )}
            {initialBatch && (
              <Button
                variant="ghost"
                size="sm"
                className="ml-auto h-7 px-2 text-xs text-muted-foreground"
                onClick={() => {
                  setSearchInput("")
                  pushFilters({})
                }}
              >
                Clear filters
              </Button>
            )}
          </div>

          {/* Routine Display Grid by Days */}
          <div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            aria-busy={isPending}
          >
            {Object.keys(structuredRoutine).map((day) => {
              const sectionsMap = structuredRoutine[day]
              const sectionKeys = Object.keys(sectionsMap).sort()
              const totalDaySlots = sectionKeys.reduce(
                (acc, sec) => acc + sectionsMap[sec].length,
                0,
              )

              if (totalDaySlots === 0) return null

              return (
                <Card
                  key={day}
                  className="flex flex-col h-full overflow-hidden border-border/60 shadow-sm hover:shadow-md transition-shadow"
                >
                  <CardHeader className="bg-muted/60 py-3.5 px-4 border-b flex flex-row items-center justify-between">
                    <CardTitle className="text-base font-bold flex items-center gap-2">
                      <Calendar className="size-4 text-primary" />
                      {day}
                    </CardTitle>
                    <Badge variant="secondary" className="text-xs font-semibold">
                      {totalDaySlots} class{totalDaySlots === 1 ? "" : "es"}
                    </Badge>
                  </CardHeader>
                  <CardContent className="p-4 flex-1 space-y-5">
                    {sectionKeys.map((secName) => {
                      const daySlots = sectionsMap[secName]
                      if (daySlots.length === 0) return null

                      return (
                        <div key={secName} className="space-y-2.5">
                          {initialSection === "ALL" && (
                            <div className="py-1.5 px-3 rounded-md bg-primary/10 dark:bg-primary/15 border border-primary/20 flex items-center justify-between">
                              <span className="text-xs font-extrabold text-primary tracking-wider uppercase">
                                {secName}
                              </span>
                              <span className="text-[11px] font-semibold text-muted-foreground">
                                {daySlots.length} slot{daySlots.length === 1 ? "" : "s"}
                              </span>
                            </div>
                          )}

                          <div className="space-y-2.5">
                            {daySlots.map((slot) => (
                              <SlotCard
                                key={slot.id}
                                slot={slot}
                                authenticated={authenticated}
                              />
                            ))}
                          </div>
                        </div>
                      )
                    })}
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {totalSlots === 0 && (
            <Card className="p-12 text-center space-y-3">
              <div className="mx-auto size-12 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
                <Layers className="size-6" />
              </div>
              <h3 className="text-lg font-semibold">No routine slots found</h3>
              <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                No class schedule matches the selected filters. Try a different batch, section, or day.
              </p>
            </Card>
          )}
        </>
      )}
    </div>
  )
}
