import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

type ProfileCardSkeletonProps = {
  showAvatar?: boolean
  className?: string
}

function ProfileCardSkeleton({ showAvatar = false, className }: ProfileCardSkeletonProps) {
  return (
    <Card className={cn("transition-none", className)} aria-hidden="true">
      <CardContent className="flex items-start gap-4 p-5">
        {showAvatar ? <Skeleton className="mt-0.5 size-10 shrink-0 rounded-full" /> : null}
        <div className="min-w-0 flex-1">
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="mt-2 h-3 w-1/3" />
          <div className="mt-3 flex flex-wrap gap-2">
            <Skeleton className="h-6 w-16 rounded-full" />
            <Skeleton className="h-6 w-20 rounded-full" />
            <Skeleton className="h-6 w-14 rounded-full" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

type DirectoryGridSkeletonProps = {
  count?: number
  showAvatar?: boolean
  className?: string
}

function DirectoryGridSkeleton({
  count = 6,
  showAvatar = false,
  className,
}: DirectoryGridSkeletonProps) {
  return (
    <div role="status" className={cn("grid gap-4 sm:grid-cols-2 lg:grid-cols-3", className)}>
      <span className="sr-only">Loading directory…</span>
      {Array.from({ length: count }, (_, index) => (
        <ProfileCardSkeleton key={index} showAvatar={showAvatar} />
      ))}
    </div>
  )
}

export { ProfileCardSkeleton, DirectoryGridSkeleton }
