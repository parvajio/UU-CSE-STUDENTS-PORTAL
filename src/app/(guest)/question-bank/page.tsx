import type { Metadata } from "next"
import Link from "next/link"
import { Suspense } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { auth } from "@/lib/auth/auth"
import { getCatalog } from "@/lib/db/queries/catalog"
import { getCurrentBatch } from "@/lib/db/queries/site-config"
import { searchQuestions } from "@/lib/db/queries/question-bank"
import { parseQuestionFilters } from "@/lib/question-bank/filters"
import { QUESTION_BANK_PAGE_SIZE } from "@/lib/question-bank/constants"
import { QuestionCard } from "@/components/question-bank/QuestionCard"
import { QuestionSearch } from "@/components/question-bank/QuestionSearch"
import { EmptyState } from "@/components/shared/EmptyState"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export const metadata: Metadata = {
  title: "Question Bank",
}

type SearchParams = Record<string, string | string[] | undefined>

function buildPageHref(raw: SearchParams, page: number): string {
  const next = new URLSearchParams()
  for (const [key, value] of Object.entries(raw)) {
    if (key === "page") continue
    if (Array.isArray(value)) {
      value.forEach((v) => next.append(key, v))
    } else if (value) {
      next.set(key, value)
    }
  }
  next.set("page", String(page))
  return `?${next.toString()}`
}

function PagerLink({
  href,
  disabled,
  label,
  icon: Icon,
}: {
  href: string
  disabled: boolean
  label: string
  icon: typeof ChevronLeft
}) {
  return disabled ? (
    <Button variant="outline" size="sm" disabled aria-label={label}>
      <Icon className="size-4" strokeWidth={1.5} />
    </Button>
  ) : (
    <Button asChild variant="outline" size="sm">
      <Link href={href} aria-label={label}>
        <Icon className="size-4" strokeWidth={1.5} />
      </Link>
    </Button>
  )
}

export default async function QuestionBankPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const session = await auth()
  const viewerRole = session?.user?.role ?? "guest"

  const [catalog, currentBatch, raw] = await Promise.all([
    getCatalog(),
    getCurrentBatch(),
    searchParams,
  ])

  const params = parseQuestionFilters(raw)
  const result = await searchQuestions(params, viewerRole)
  const page = params.page ?? 1
  const totalPages = Math.max(
    1,
    Math.ceil(result.total / QUESTION_BANK_PAGE_SIZE)
  )

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
          total={result.total}
        />
      </Suspense>

      {result.items.length === 0 ? (
        <EmptyState
          title="No question papers found"
          description="Try removing a filter or searching for a different term."
        />
      ) : (
        <>
          <div
            className={cn(
              "mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
            )}
          >
            {result.items.map((question) => (
              <QuestionCard key={question.id} question={question} />
            ))}
          </div>

          {totalPages > 1 ? (
            <nav
              aria-label="Pagination"
              className="mt-8 flex items-center justify-center gap-4"
            >
              <PagerLink
                href={buildPageHref(raw, page - 1)}
                disabled={page <= 1}
                label="Previous page"
                icon={ChevronLeft}
              />
              <p className="text-sm text-muted-foreground">
                Page {page} of {totalPages}
              </p>
              <PagerLink
                href={buildPageHref(raw, page + 1)}
                disabled={page >= totalPages}
                label="Next page"
                icon={ChevronRight}
              />
            </nav>
          ) : null}
        </>
      )}
    </main>
  )
}