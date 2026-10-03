import { EventDetailSkeleton } from "@/components/clubs/ClubsSkeleton"

export default function EventDetailLoading() {
  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6">
      <EventDetailSkeleton />
    </main>
  )
}
