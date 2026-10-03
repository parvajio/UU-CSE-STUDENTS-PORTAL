"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

/**
 * Loading placeholder that mirrors `FacultyCard` layout (cover, overlapping
 * round avatar, name, designation pill, institute box, email row, buttons)
 * so the swap from skeleton → real card causes minimal layout shift.
 */
export function FacultyCardSkeleton({ className }: { className?: string }) {
  return (
    <Card
      aria-hidden="true"
      className={cn("h-full transition-none", className)}
    >
      {/* Cover — matches h-28 gradient banner */}
      <div className="h-28 overflow-hidden rounded-t-xl">
        <Skeleton className="h-full w-full rounded-none" />
      </div>

      <CardContent className="relative px-5 pb-5 text-center">
        <div className="-mt-16 mb-3 flex justify-center">
          <Skeleton className="size-32 rounded-full border-4 border-background" />
        </div>

        <Skeleton className="mx-auto h-6 w-2/3" />
        <Skeleton className="mx-auto mt-1.5 h-3 w-40" />
        <div className="mt-2 flex justify-center">
          <Skeleton className="h-6 w-28 rounded-full" />
        </div>

        <div className="mt-3 space-y-1.5 rounded-xl border border-border/60 bg-background px-3 py-2.5">
          <Skeleton className="h-3.5 w-full" />
          <Skeleton className="h-3.5 w-5/6" />
        </div>

        <Skeleton className="mt-2 h-9 w-full rounded-xl" />

        <div className="mt-3 grid grid-cols-2 gap-2">
          <Skeleton className="h-9 w-full rounded-md" />
          <Skeleton className="h-9 w-full rounded-md" />
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * Directory-level skeleton: search bar, designation chips, result count,
 * then the card grid. Mirrors `FacultyDirectory` chrome above the grid.
 */
export function FacultyDirectorySkeleton({
  count = 6,
  className,
}: {
  count?: number
  className?: string
}) {
  return (
    <div role="status" className={className}>
      <span className="sr-only">Loading faculty directory…</span>
      <div aria-hidden="true">
        <div className="mb-8 space-y-4">
          <Skeleton className="h-10 w-full max-w-xl" />
          <div className="flex items-center gap-2 overflow-hidden pb-2">
            <Skeleton className="h-7 w-20 shrink-0 rounded-full" />
            <Skeleton className="h-7 w-32 shrink-0 rounded-full" />
            <Skeleton className="h-7 w-36 shrink-0 rounded-full" />
            <Skeleton className="h-7 w-24 shrink-0 rounded-full" />
          </div>
          <Skeleton className="h-3 w-56" />
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: count }, (_, index) => (
            <FacultyCardSkeleton key={index} />
          ))}
        </div>
      </div>
    </div>
  )
}
