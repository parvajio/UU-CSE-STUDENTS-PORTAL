import { EventsListingSkeleton } from "@/components/clubs/ClubsSkeleton"

export default function EventsLoading() {
  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6">
      <EventsListingSkeleton />
    </main>
  )
}
