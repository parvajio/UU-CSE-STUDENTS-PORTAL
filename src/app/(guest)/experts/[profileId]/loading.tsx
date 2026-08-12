import { Skeleton } from "@/components/ui/skeleton"

export default function ExpertDetailLoading() {
  return (
    <div className="min-h-screen bg-background pb-16">
      <div className="relative h-48 sm:h-60 w-full bg-muted animate-pulse" />
      <div className="mx-auto max-w-6xl px-4 sm:px-6 -mt-16 sm:-mt-20 relative z-10 space-y-8">
        <div className="rounded-3xl border bg-card p-6 sm:p-8 space-y-4">
          <Skeleton className="size-24 rounded-full" />
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-48" />
        </div>
      </div>
    </div>
  )
}
