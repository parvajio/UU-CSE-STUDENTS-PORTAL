import { ClubsListingSkeleton } from "@/components/clubs/ClubsSkeleton"

export default function ClubsLoading() {
  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6">
      <ClubsListingSkeleton />
    </main>
  )
}
