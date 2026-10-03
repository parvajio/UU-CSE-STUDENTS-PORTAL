import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

/**
 * Loading placeholder that mirrors `ClubCard` layout (h-24 cover banner,
 * overlapping size-14 logo, name, 2-line description, icon footer) so the
 * swap from skeleton → real card causes minimal layout shift.
 */
export function ClubCardSkeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "flex h-full flex-col overflow-hidden rounded-2xl border border-border/60 bg-card",
        className
      )}
    >
      {/* Cover banner — matches h-24 */}
      <Skeleton className="h-24 w-full shrink-0 rounded-none" />

      <div className="flex flex-1 flex-col p-5 pt-0">
        {/* Logo straddles the cover — matches -mt-7 + size-14 */}
        <div className="relative z-10 -mt-7 mb-3">
          <Skeleton className="size-14 rounded-2xl" />
        </div>

        <Skeleton className="h-5 w-3/4" />
        <div className="mb-4 mt-2 space-y-1.5">
          <Skeleton className="h-3.5 w-full" />
          <Skeleton className="h-3.5 w-5/6" />
        </div>

        {/* Footer — matches border-t + icon row */}
        <div className="mt-auto flex items-center justify-between gap-2 border-t border-border pt-3">
          <div className="flex items-center gap-1.5">
            <Skeleton className="size-7 rounded-lg" />
            <Skeleton className="size-7 rounded-lg" />
            <Skeleton className="size-7 rounded-lg" />
          </div>
          <Skeleton className="h-4 w-12" />
        </div>
      </div>
    </div>
  )
}

/**
 * Loading placeholder that mirrors one department section in
 * `DepartmentGroup` (accent bar + heading + count badge + card grid).
 */
export function DepartmentGroupSkeleton({
  cards = 3,
  className,
}: {
  cards?: number
  className?: string
}) {
  return (
    <section aria-hidden="true" className={className}>
      <div className="mb-4">
        <div className="flex flex-wrap items-center gap-2.5">
          <Skeleton className="h-7 w-1 rounded-full" />
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-6 w-16 rounded-full" />
        </div>
        <Skeleton className="mt-2 h-4 w-72 max-w-full" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: cards }, (_, index) => (
          <ClubCardSkeleton key={index} />
        ))}
      </div>
    </section>
  )
}

/**
 * Clubs listing page skeleton: mirrors `ClubsExplorer` chrome (compact
 * header + counts, search + department filter) above department groups.
 */
export function ClubsListingSkeleton({
  groups = 2,
  cardsPerGroup = 3,
  className,
}: {
  groups?: number
  cardsPerGroup?: number
  className?: string
}) {
  return (
    <div role="status" className={className}>
      <span className="sr-only">Loading clubs…</span>
      <div aria-hidden="true">
        {/* Compact header — matches ClubsExplorer title + counts row */}
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 pt-2">
          <div className="min-w-0 space-y-1.5">
            <Skeleton className="h-7 w-44" />
            <Skeleton className="h-4 w-72 max-w-full" />
          </div>
          <Skeleton className="h-3 w-36" />
        </div>

        {/* Search + filter — matches Input + select row */}
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
          <Skeleton className="h-10 flex-1" />
          <Skeleton className="h-10 w-44" />
        </div>

        <div className="mt-4 space-y-10">
          {Array.from({ length: groups }, (_, index) => (
            <DepartmentGroupSkeleton key={index} cards={cardsPerGroup} />
          ))}
        </div>
      </div>
    </div>
  )
}

/**
 * Loading placeholder that mirrors the `ClubDetailPage` hero (cover,
 * overlapping logo, title, member/event counts, quick-stats row).
 */
export function ClubDetailHeroSkeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn("overflow-hidden rounded-2xl border border-border/60 bg-card", className)}
    >
      {/* Cover — matches h-44 sm:h-60 */}
      <Skeleton className="h-44 w-full rounded-none sm:h-60" />

      <div className="px-5 pb-5 sm:px-7 sm:pb-6">
        <div className="relative -mt-10 sm:-mt-12">
          <Skeleton className="size-20 rounded-2xl sm:size-24" />
        </div>
        <div className="mt-3 space-y-2">
          <Skeleton className="h-8 w-64 max-w-full" />
          <Skeleton className="h-4 w-56 max-w-full" />
        </div>
        {/* Quick stats — matches grid-cols-3 row */}
        <div className="mt-4 grid grid-cols-3 gap-2.5 border-t pt-4 sm:max-w-md">
          {Array.from({ length: 3 }, (_, index) => (
            <Skeleton key={index} className="h-[52px] w-full rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  )
}

/**
 * Loading placeholder that mirrors one event card (date block, title +
 * badges, meta rows, timer strip) as rendered on the club detail page
 * and in `EventsExplorer`.
 */
export function EventCardSkeleton({ className }: { className?: string }) {
  return (
    <Card aria-hidden="true" className={cn("transition-none", className)}>
      <CardContent className="p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
          {/* Date block */}
          <div className="flex shrink-0 items-center gap-3 sm:flex-col sm:gap-1 sm:rounded-xl sm:border sm:px-4 sm:py-2.5">
            <Skeleton className="h-3 w-8 sm:mx-auto" />
            <Skeleton className="h-7 w-8 sm:mx-auto" />
          </div>
          <div className="min-w-0 flex-1 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <Skeleton className="h-5 w-48 max-w-full" />
              <Skeleton className="h-5 w-20 rounded-full" />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Skeleton className="h-3.5 w-32" />
              <Skeleton className="h-3.5 w-24" />
            </div>
            <Skeleton className="h-3.5 w-full" />
            <div className="border-t border-dashed pt-3">
              <Skeleton className="h-9 w-56 max-w-full rounded-lg" />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * Full club detail page skeleton: hero, featured event, About + Connect,
 * Members, Gallery, Achievements — mirrors `ClubDetailPage` section order.
 */
export function ClubDetailSkeleton({ className }: { className?: string }) {
  return (
    <div role="status" className={className}>
      <span className="sr-only">Loading club details…</span>
      <div aria-hidden="true" className="space-y-10">
        <ClubDetailHeroSkeleton />

        {/* Events — featured panel + grid */}
        <div className="space-y-4">
          <div className="flex items-center gap-2.5">
            <Skeleton className="size-8 rounded-lg" />
            <Skeleton className="h-6 w-28" />
            <Skeleton className="h-5 w-10 rounded-full" />
          </div>
          <div className="rounded-2xl border border-border/60 bg-card p-5 sm:p-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="min-w-0 flex-1 space-y-2">
                <Skeleton className="h-6 w-64 max-w-full" />
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-3.5 w-full max-w-2xl" />
              </div>
              <Skeleton className="h-16 w-64 max-w-full shrink-0 rounded-xl" />
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <EventCardSkeleton />
            <EventCardSkeleton />
          </div>
        </div>

        {/* About + Connect */}
        <div className="grid gap-4 lg:grid-cols-3">
          <Card className="transition-none lg:col-span-2">
            <CardContent className="space-y-2.5 p-5 sm:p-6">
              <Skeleton className="h-6 w-24" />
              <Skeleton className="h-3.5 w-full" />
              <Skeleton className="h-3.5 w-full" />
              <Skeleton className="h-3.5 w-2/3" />
            </CardContent>
          </Card>
          <Card className="transition-none">
            <CardContent className="space-y-2.5 p-5 sm:p-6">
              <Skeleton className="h-6 w-28" />
              <Skeleton className="h-[52px] w-full rounded-xl" />
              <Skeleton className="h-[52px] w-full rounded-xl" />
              <Skeleton className="h-[52px] w-full rounded-xl" />
            </CardContent>
          </Card>
        </div>

        {/* Members — executive cards + avatar wall */}
        <div className="space-y-4">
          <div className="flex items-center gap-2.5">
            <Skeleton className="size-8 rounded-lg" />
            <Skeleton className="h-6 w-28" />
            <Skeleton className="h-5 w-10 rounded-full" />
          </div>
          <div className="grid gap-2.5 sm:grid-cols-2">
            {Array.from({ length: 2 }, (_, index) => (
              <div
                key={index}
                className="flex items-center gap-3 rounded-xl border border-border/60 bg-card p-3"
              >
                <Skeleton className="size-10 shrink-0 rounded-full" />
                <div className="min-w-0 flex-1 space-y-1.5">
                  <Skeleton className="h-4 w-2/3" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
                <Skeleton className="h-5 w-16 shrink-0 rounded-full" />
              </div>
            ))}
          </div>
          <div className="rounded-xl border border-border/60 bg-card p-4">
            <div className="flex items-center gap-3">
              <div className="flex">
                {Array.from({ length: 5 }, (_, index) => (
                  <Skeleton
                    key={index}
                    className="size-10 rounded-full ring-2 ring-card [&:not(:first-child)]:-ml-2.5"
                  />
                ))}
              </div>
              <Skeleton className="h-4 w-24" />
            </div>
          </div>
        </div>

        {/* Gallery */}
        <div className="space-y-3">
          <div className="flex items-center gap-2.5">
            <Skeleton className="size-8 rounded-lg" />
            <Skeleton className="h-6 w-28" />
            <Skeleton className="h-5 w-10 rounded-full" />
          </div>
          <Skeleton className="h-5 w-48" />
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }, (_, index) => (
              <Skeleton key={index} className="h-48 w-full rounded-xl" />
            ))}
          </div>
        </div>

        {/* Achievements */}
        <div className="space-y-3">
          <div className="flex items-center gap-2.5">
            <Skeleton className="size-8 rounded-lg" />
            <Skeleton className="h-6 w-36" />
            <Skeleton className="h-5 w-10 rounded-full" />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {Array.from({ length: 2 }, (_, index) => (
              <div
                key={index}
                className="space-y-2.5 overflow-hidden rounded-xl border border-border/60 bg-card p-4"
              >
                <div className="flex items-start gap-2.5">
                  <Skeleton className="size-8 shrink-0 rounded-lg" />
                  <div className="min-w-0 flex-1 space-y-1.5">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
                <Skeleton className="h-3.5 w-full" />
                <Skeleton className="h-3.5 w-5/6" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * Events listing page skeleton: mirrors `EventsExplorer` chrome (compact
 * header + counts, search + source filter) above the event card list.
 */
export function EventsListingSkeleton({
  count = 4,
  className,
}: {
  count?: number
  className?: string
}) {
  return (
    <div role="status" className={className}>
      <span className="sr-only">Loading events…</span>
      <div aria-hidden="true">
        {/* Compact header — matches EventsExplorer title + counts row */}
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 pt-2">
          <div className="min-w-0 space-y-1.5">
            <Skeleton className="h-7 w-32" />
            <Skeleton className="h-4 w-72 max-w-full" />
          </div>
          <Skeleton className="h-3 w-40" />
        </div>

        {/* Search + source filter */}
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
          <Skeleton className="h-10 flex-1" />
          <Skeleton className="h-10 w-36" />
        </div>

        <div className="mt-4 space-y-4">
          {Array.from({ length: count }, (_, index) => (
            <EventCardSkeleton key={index} />
          ))}
        </div>
      </div>
    </div>
  )
}

/**
 * Event detail page skeleton: mirrors `/events/[eventId]` (featured panel
 * with timer, Details card, About card, host-club row).
 */
export function EventDetailSkeleton({ className }: { className?: string }) {
  return (
    <div role="status" className={className}>
      <span className="sr-only">Loading event details…</span>
      <div aria-hidden="true" className="space-y-4">
        {/* Featured panel */}
        <div className="rounded-2xl border border-border/60 bg-card p-5 sm:p-6">
          <div className="flex flex-wrap items-center gap-2">
            <Skeleton className="h-5 w-20 rounded-full" />
            <Skeleton className="h-5 w-28 rounded-full" />
          </div>
          <Skeleton className="mt-3 h-8 w-72 max-w-full" />
          <Skeleton className="mt-1.5 h-4 w-44" />
          <Skeleton className="mt-4 h-16 w-full rounded-xl" />
        </div>

        {/* Details card */}
        <Card className="transition-none">
          <CardContent className="space-y-3 p-5 sm:p-6">
            <Skeleton className="h-6 w-24" />
            {Array.from({ length: 3 }, (_, index) => (
              <div key={index} className="flex items-start gap-3">
                <Skeleton className="size-8 shrink-0 rounded-lg" />
                <div className="min-w-0 flex-1 space-y-1.5">
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-4 w-56 max-w-full" />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* About card */}
        <Card className="transition-none">
          <CardContent className="space-y-2.5 p-5 sm:p-6">
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-3.5 w-full" />
            <Skeleton className="h-3.5 w-full" />
            <Skeleton className="h-3.5 w-2/3" />
          </CardContent>
        </Card>

        {/* Host club row */}
        <div className="flex items-center gap-3 rounded-2xl border border-border/60 bg-card p-4">
          <Skeleton className="size-10 shrink-0 rounded-xl" />
          <div className="min-w-0 flex-1 space-y-1.5">
            <Skeleton className="h-4 w-48 max-w-full" />
            <Skeleton className="h-3 w-64 max-w-full" />
          </div>
        </div>
      </div>
    </div>
  )
}
