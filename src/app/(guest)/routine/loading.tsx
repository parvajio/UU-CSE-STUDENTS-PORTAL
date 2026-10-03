import { Skeleton } from "@/components/ui/skeleton"
import { RoutineGridSkeleton } from "@/components/routine/RoutineSkeleton"

export default function RoutineLoading() {
  return (
    <div className="container mx-auto max-w-7xl py-8 px-4 space-y-8">
      <div className="flex flex-col gap-2" aria-hidden="true">
        <Skeleton className="h-9 w-56" />
        <Skeleton className="h-5 w-full max-w-xl" />
      </div>

      <RoutineGridSkeleton days={6} />
    </div>
  )
}
