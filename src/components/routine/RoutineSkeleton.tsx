"use client"

import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

/**
 * Loading placeholder for one class slot row — mirrors the slot block in
 * `RoutineClientView` (title row, course subtitle, period/room pills row).
 */
export function RoutineSlotSkeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn("space-y-3 rounded-lg border bg-card p-3.5", className)}
    >
      <div className="flex items-start justify-between gap-2">
        <Skeleton className="h-4 w-2/5" />
        <Skeleton className="h-3 w-16" />
      </div>
      <Skeleton className="h-3 w-3/5" />
      <div className="flex flex-wrap items-center gap-2 border-t border-border/40 pt-2">
        <Skeleton className="h-7 w-28 rounded-md" />
        <Skeleton className="h-7 w-24 rounded-md" />
        <Skeleton className="ml-auto size-7 rounded-md" />
      </div>
    </div>
  )
}

/**
 * Loading placeholder for one day card — mirrors the day `Card` in
 * `RoutineClientView` (header with day name + count badge, section blocks
 * with header bar + slot rows).
 */
export function RoutineDayCardSkeleton({
  sections = 1,
  slotsPerSection = 2,
  className,
}: {
  sections?: number
  slotsPerSection?: number
  className?: string
}) {
  return (
    <Card aria-hidden="true" className={cn("flex h-full flex-col overflow-hidden", className)}>
      <CardHeader className="flex flex-row items-center justify-between border-b bg-muted/60 px-4 py-3.5">
        <Skeleton className="h-5 w-24" />
        <Skeleton className="h-5 w-16 rounded-full" />
      </CardHeader>
      <CardContent className="flex-1 space-y-5 p-4">
        {Array.from({ length: sections }, (_, sectionIndex) => (
          <div key={sectionIndex} className="space-y-2.5">
            <Skeleton className="h-8 w-full rounded-md" />
            <div className="space-y-2.5">
              {Array.from({ length: slotsPerSection }, (_, slotIndex) => (
                <RoutineSlotSkeleton key={slotIndex} />
              ))}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

/**
 * Routine-page-level skeleton: filter bar card + day-card grid. Mirrors the
 * `RoutineClientView` chrome above/around the results.
 */
export function RoutineGridSkeleton({
  days = 6,
  className,
}: {
  days?: number
  className?: string
}) {
  return (
    <div role="status" className={cn("space-y-6", className)}>
      <span className="sr-only">Loading class routine…</span>
      <div aria-hidden="true" className="space-y-6">
        <Card className="border bg-card/50 p-4 shadow-sm backdrop-blur-sm">
          <div className="grid grid-cols-1 items-center gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }, (_, index) => (
              <div key={index} className="space-y-1.5">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-10 w-full" />
              </div>
            ))}
          </div>
        </Card>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: days }, (_, index) => (
            <RoutineDayCardSkeleton key={index} />
          ))}
        </div>
      </div>
    </div>
  )
}
