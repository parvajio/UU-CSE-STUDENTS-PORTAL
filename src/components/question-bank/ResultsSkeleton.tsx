import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

export function ResultsSkeleton({
  count = 6,
  className,
  ariaBusy = false,
}: {
  count?: number
  className?: string
  ariaBusy?: boolean
}) {
  return (
    <div
      role="status"
      aria-busy={ariaBusy}
      className={cn(
        "mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3",
        className
      )}
    >
      <span className="sr-only">Loading question papers…</span>
      {Array.from({ length: count }, (_, index) => (
        <div
          key={index}
          aria-hidden="true"
          className="flex flex-col gap-2 rounded-xl border border-border bg-card p-5"
        >
          <div className="flex items-center justify-between gap-2">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-3 w-14" />
          </div>
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
          <div className="mt-1 flex items-center gap-2">
            <Skeleton className="h-5 w-16 rounded-full" />
            <Skeleton className="h-3 w-20" />
          </div>
          <div className="mt-auto flex items-center justify-between pt-3">
            <div className="flex items-center gap-3">
              <Skeleton className="h-4 w-12" />
              <Skeleton className="h-4 w-8" />
            </div>
            <div className="flex items-center gap-2">
              <Skeleton className="h-8 w-20 rounded-md" />
              <Skeleton className="h-8 w-24 rounded-md" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
