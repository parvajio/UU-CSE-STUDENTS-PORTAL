import { DirectoryGridSkeleton } from "@/components/shared/LoadingSkeleton"

export default function DirectoryLoading() {
  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
      <DirectoryGridSkeleton count={6} />
    </main>
  )
}
