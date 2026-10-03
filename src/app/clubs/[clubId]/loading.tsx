import { ClubDetailSkeleton } from "@/components/clubs/ClubsSkeleton"

export default function ClubDetailLoading() {
  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
      <ClubDetailSkeleton />
    </main>
  )
}
