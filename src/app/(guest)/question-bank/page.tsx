import type { Metadata } from "next"
import { unstable_cache } from "next/cache"
import { Suspense } from "react"
import { getCatalog } from "@/lib/db/queries/catalog"
import { getCurrentBatch } from "@/lib/db/queries/site-config"
import {
  getPopularTags,
  getRecentBatches,
  getTopCourses,
} from "@/lib/db/queries/question-bank"
import { QuestionSearch } from "@/components/question-bank/QuestionSearch"
import { ResultsGate } from "@/components/question-bank/ResultsGate"
import { ResultsSkeleton } from "@/components/question-bank/ResultsSkeleton"
import { Results } from "./results"

export const metadata: Metadata = {
  title: "Question Bank",
}

type SearchParams = Record<string, string | string[] | undefined>

// Filter-independent shell data is cached and shared by every filter
// navigation. Invalidated via the "question-bank" tag on approve/reject/
// upload/like (see server actions); a 5-minute TTL guards against misses.
const cachedCatalog = unstable_cache(getCatalog, ["catalog"], {
  tags: ["question-bank"],
  revalidate: 300,
})
const cachedCurrentBatch = unstable_cache(getCurrentBatch, ["current-batch"], {
  tags: ["question-bank"],
  revalidate: 300,
})
const cachedTopCourses = unstable_cache(getTopCourses, ["top-courses"], {
  tags: ["question-bank"],
  revalidate: 300,
})
const cachedRecentBatches = unstable_cache(getRecentBatches, ["recent-batches"], {
  tags: ["question-bank"],
  revalidate: 300,
})
const cachedPopularTags = unstable_cache(getPopularTags, ["popular-tags"], {
  tags: ["question-bank"],
  revalidate: 300,
})

export default async function QuestionBankPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const [catalog, currentBatch, topCourses, recentBatches, popularTags] =
    await Promise.all([
      cachedCatalog(),
      cachedCurrentBatch(),
      cachedTopCourses(),
      cachedRecentBatches(),
      cachedPopularTags(),
    ])

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
      <div className="mb-8">
        <h1 className="font-heading text-3xl font-semibold text-foreground">
          Question Bank
        </h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Search and filter past papers and question papers shared by your
          department&apos;s students.
        </p>
      </div>

      <Suspense fallback={null}>
        <QuestionSearch
          catalog={catalog}
          currentBatch={currentBatch}
          topCourses={topCourses}
          recentBatches={recentBatches}
          popularTags={popularTags}
        />
      </Suspense>

      <Suspense fallback={<ResultsSkeleton />}>
        <ResultsGate>
          <Results searchParams={searchParams} />
        </ResultsGate>
      </Suspense>
    </main>
  )
}
