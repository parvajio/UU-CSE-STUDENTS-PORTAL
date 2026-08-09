import { DirectoryGridSkeleton } from "@/components/shared/LoadingSkeleton"

export default function QuestionBankLoading() {
  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
      <div className="mb-8">
        <div className="h-8 w-56 rounded-md bg-muted" aria-hidden="true" />
        <div className="mt-2 h-4 w-96 max-w-full rounded-md bg-muted" aria-hidden="true" />
      </div>
      <DirectoryGridSkeleton count={12} />
    </main>
  )
}