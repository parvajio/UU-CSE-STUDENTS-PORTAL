import Link from "next/link"
import { ChevronLeft, ChevronRight, RotateCcw } from "lucide-react"
import { auth } from "@/lib/auth/auth"
import { searchQuestions } from "@/lib/db/queries/question-bank"
import { parseQuestionFilters } from "@/lib/question-bank/filters"
import { QUESTION_BANK_PAGE_SIZE } from "@/lib/question-bank/constants"
import { QuestionCard } from "@/components/question-bank/QuestionCard"
import { EmptyState } from "@/components/shared/EmptyState"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type SearchParams = Record<string, string | string[] | undefined>

const FILTER_KEYS = [
  "course",
  "batch",
  "exam",
  "programType",
  "season",
  "year",
  "q",
  "tags",
]

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

export async function Results({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const session = await auth()
  const viewerRole = session?.user?.role ?? "guest"
  const raw = await searchParams
  const params = parseQuestionFilters(raw)
  const result = await searchQuestions(params, viewerRole, session?.user?.id)
  const page = params.page ?? 1
  const totalPages = Math.max(
    1,
    Math.ceil(result.total / QUESTION_BANK_PAGE_SIZE)
  )
  const hasActiveFilters = FILTER_KEYS.some(
    (key) => raw[key] !== undefined
  )

  return (
    <section aria-label="Search results">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground" aria-live="polite">
          {result.total.toLocaleString()}{" "}
          {result.total === 1 ? "paper" : "papers"}
        </p>
        {hasActiveFilters ? (
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="text-muted-foreground"
          >
            <Link href="/question-bank">
              <RotateCcw className="mr-1.5 size-3.5" strokeWidth={1.5} />
              Clear all filters
            </Link>
          </Button>
        ) : null}
      </div>

      {result.items.length === 0 ? (
        <div className="mt-4">
          <EmptyState
            title="No question papers found"
            description="Try removing a filter or searching for a different term."
          />
        </div>
      ) : (
        <>
          <div
            className={cn(
              "mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
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
    </section>
  )
}
