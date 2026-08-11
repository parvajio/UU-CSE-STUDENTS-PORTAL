import { Skeleton } from "@/components/ui/skeleton"
import { ResultsSkeleton } from "@/components/question-bank/ResultsSkeleton"

export default function QuestionBankLoading() {
  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Skeleton className="h-9 w-48" />
          <Skeleton className="mt-2 h-4 w-96 max-w-full" />
        </div>
        <Skeleton className="h-10 w-36 rounded-md" />
      </div>

      <div className="mt-8 grid gap-8 md:grid-cols-[300px_minmax(0,1fr)] md:items-start">
        <div className="hidden rounded-2xl border border-border bg-card p-5 md:block space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
        <div className="min-w-0">
          <ResultsSkeleton count={6} />
        </div>
      </div>
    </main>
  )
}
