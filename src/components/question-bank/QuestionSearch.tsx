"use client"

import { useEffect, useState } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { RotateCcw, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  ALL_FILTER,
  EVENING_FALSE,
  EVENING_TRUE,
  OTHER_COURSE,
  QUESTION_BANK_PAGE_SIZE,
} from "@/lib/question-bank/constants"
import { EXAM_TYPE_LABELS, EXAM_TYPES } from "@/lib/question-bank/validation"
import type { CatalogEntry } from "@/types/question-bank"

const BATCH = "batch"
const COURSE = "course"
const EVENING = "evening"
const EXAM = "exam"
const PAGE = "page"
const PROGRAM = "program"
const QUERY = "q"
const SUBJECT = "subject"
const TAGS = "tags"

function toValue(entries: URLSearchParams, key: string): string {
  return entries.get(key) ?? ""
}

export function QuestionSearch({
  catalog,
  currentBatch,
  total,
  pageSize = QUESTION_BANK_PAGE_SIZE,
}: {
  catalog: CatalogEntry[]
  currentBatch: number
  total: number
  pageSize?: number
}) {
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const router = useRouter()

  const subjectId = toValue(searchParams, SUBJECT)
  const courseChoice = toValue(searchParams, COURSE)
  const batchChoice = toValue(searchParams, BATCH)
  const examChoice = toValue(searchParams, EXAM)
  const programChoice = toValue(searchParams, PROGRAM)
  const eveningChoice = toValue(searchParams, EVENING)
  const tags = (toValue(searchParams, TAGS) || "").split(",").filter(Boolean)
  const pageRaw = Number(searchParams.get(PAGE))
  const page = Number.isFinite(pageRaw) && pageRaw > 0 ? pageRaw : 1
  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  const activeSubject =
    subjectId && subjectId !== ALL_FILTER
      ? catalog.find((subject) => subject.id === subjectId)
      : undefined

  // When a course is set without a subject (e.g. cleared subject), keep its
  // parent subject's course list in the dropdown so the selection stays valid.
  const courseParent =
    catalog.find((subject) =>
      subject.courses.some((course) => course.id === courseChoice)
    ) ?? activeSubject

  const batchOptions = Array.from({ length: currentBatch }, (_, i) => i + 1)

  const [searchText, setSearchText] = useState(
    toValue(searchParams, QUERY)
  )
  const [previousQuery, setPreviousQuery] = useState(
    toValue(searchParams, QUERY)
  )
  const [tagInput, setTagInput] = useState("")

  // External URL changes (Clear all, browser back, pagination) reset the
  // search input to what the URL actually says. Adjusted during render to
  // avoid a setState-in-effect cascade.
  const currentQuery = toValue(searchParams, QUERY)
  if (currentQuery !== previousQuery) {
    setPreviousQuery(currentQuery)
    setSearchText(currentQuery)
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const nextQuery = searchText.trim()
      if (nextQuery !== toValue(searchParams, QUERY)) {
        updateParams({ [QUERY]: nextQuery })
      }
    }, 400)
    return () => window.clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchText])

  function updateParams(
    changes: Record<string, string | string[] | null | undefined>
  ) {
    const next = new URLSearchParams(searchParams.toString())
    for (const [key, value] of Object.entries(changes)) {
      if (
        value === null ||
        value === undefined ||
        (typeof value === "string" && !value.trim()) ||
        (Array.isArray(value) && value.length === 0)
      ) {
        next.delete(key)
      } else if (Array.isArray(value)) {
        next.set(key, value.join(","))
      } else {
        next.set(key, value)
      }
    }
    // Any filter change resets pagination to the first page.
    next.delete(PAGE)
    const query = next.toString()
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false })
  }

  function clearAll() {
    router.replace(pathname, { scroll: false })
  }

  function addTag() {
    const value = tagInput.trim()
    if (!value) return
    const exists = tags.some(
      (tag) => tag.toLowerCase() === value.toLowerCase()
    )
    if (!exists) updateParams({ [TAGS]: [...tags, value] })
    setTagInput("")
  }

  function handleTagKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter" || event.key === ",") {
      event.preventDefault()
      addTag()
    }
  }

  const hasFilters = searchParams.toString() !== ""
  const isOtherCourse = courseChoice === OTHER_COURSE

  return (
    <section
      aria-label="Filter question papers"
      className="rounded-xl border border-border bg-muted/40 p-4"
    >
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <div className="grid gap-1.5">
          <Label htmlFor="q-search">Search</Label>
          <Input
            id="q-search"
            type="text"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            placeholder="Search titles…"
            aria-label="Search question titles"
          />
        </div>

        <div className="grid gap-1.5">
          <Label htmlFor="subject-filter">Subject</Label>
          <Select
            value={subjectId || ALL_FILTER}
            onValueChange={(value) =>
              updateParams({ [SUBJECT]: value === ALL_FILTER ? null : value, [COURSE]: null })
            }
          >
            <SelectTrigger id="subject-filter" aria-label="Subject">
              <SelectValue placeholder="All subjects" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_FILTER}>All subjects</SelectItem>
              {catalog.map((subject) => (
                <SelectItem key={subject.id} value={subject.id}>
                  {subject.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-1.5 sm:col-span-2 lg:col-span-1">
          <Label htmlFor="course-filter">Course</Label>
          <Select
            value={courseChoice || ALL_FILTER}
            onValueChange={(value) => {
              if (value === OTHER_COURSE) {
                // "Other" is a global bucket — a custom course has no subject.
                updateParams({ [COURSE]: value, [SUBJECT]: null })
              } else if (value === ALL_FILTER) {
                updateParams({ [COURSE]: null })
              } else {
                const parent = catalog.find((subject) =>
                  subject.courses.some((course) => course.id === value)
                )
                updateParams({
                  [COURSE]: value,
                  [SUBJECT]: parent?.id ?? null,
                })
              }
            }}
          >
            <SelectTrigger id="course-filter" aria-label="Course">
              <SelectValue placeholder="All courses" />
            </SelectTrigger>
            <SelectContent className="max-h-72">
              <SelectItem value={ALL_FILTER}>All courses</SelectItem>
              {(courseParent ?? activeSubject)?.courses.map((course) => (
                <SelectItem key={course.id} value={course.id}>
                  {course.title} ({course.code})
                </SelectItem>
              ))}
              <SelectSeparator />
              <SelectItem value={OTHER_COURSE}>Other papers</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-1.5">
          <Label htmlFor="batch-filter">Batch</Label>
          <Select
            value={batchChoice || ALL_FILTER}
            onValueChange={(value) =>
              updateParams({
                [BATCH]: value === ALL_FILTER ? null : value,
              })
            }
          >
            <SelectTrigger id="batch-filter" aria-label="Batch">
              <SelectValue placeholder="All batches" />
            </SelectTrigger>
            <SelectContent className="max-h-72">
              <SelectItem value={ALL_FILTER}>All batches</SelectItem>
              {batchOptions.map((batch) => (
                <SelectItem key={batch} value={String(batch)}>
                  {batch}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-1.5">
          <Label htmlFor="exam-filter">Exam type</Label>
          <Select
            value={examChoice || ALL_FILTER}
            onValueChange={(value) =>
              updateParams({ [EXAM]: value === ALL_FILTER ? null : value })
            }
          >
            <SelectTrigger id="exam-filter" aria-label="Exam type">
              <SelectValue placeholder="All exam types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_FILTER}>All exam types</SelectItem>
              {EXAM_TYPES.map((type) => (
                <SelectItem key={type} value={type}>
                  {EXAM_TYPE_LABELS[type]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-1.5">
          <Label htmlFor="program-filter">Program</Label>
          <Select
            value={programChoice || ALL_FILTER}
            onValueChange={(value) =>
              updateParams({ [PROGRAM]: value === ALL_FILTER ? null : value })
            }
          >
            <SelectTrigger id="program-filter" aria-label="Program">
              <SelectValue placeholder="All programs" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_FILTER}>All programs</SelectItem>
              <SelectItem value="regular">Regular</SelectItem>
              <SelectItem value="diploma">Diploma</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-1.5">
          <Label htmlFor="evening-filter">Shift</Label>
          <Select
            value={eveningChoice || ALL_FILTER}
            onValueChange={(value) =>
              updateParams({ [EVENING]: value === ALL_FILTER ? null : value })
            }
          >
            <SelectTrigger id="evening-filter" aria-label="Shift">
              <SelectValue placeholder="All shifts" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_FILTER}>All shifts</SelectItem>
              <SelectItem value={EVENING_FALSE}>Regular shift</SelectItem>
              <SelectItem value={EVENING_TRUE}>Evening shift</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-1.5 sm:col-span-2 lg:col-span-1">
          <Label htmlFor="tag-filter">Tags</Label>
          <div className="flex flex-wrap items-center gap-1.5">
            {tags.map((tag) => (
              <button
                key={tag}
                type="button"
                aria-label={`Remove tag ${tag}`}
                onClick={() =>
                  updateParams({
                    [TAGS]: tags.filter((t) => t !== tag),
                  })
                }
                className="soft-tag soft-tag--default cursor-pointer px-2 py-0.5 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                {tag}
                <X className="ml-1 size-3" strokeWidth={1.5} />
              </button>
            ))}
            <Input
              id="tag-filter"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleTagKeyDown}
              onBlur={addTag}
              placeholder="Add a tag and press Enter"
              aria-label="Add a tag"
              className="h-8 min-w-40 flex-1 text-sm"
            />
          </div>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground" aria-live="polite">
          {total.toLocaleString()}{" "}
          {total === 1 ? "paper" : "papers"}
          {courseChoice === OTHER_COURSE ? " under Other" : ""}
        </p>
        {hasFilters ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={clearAll}
            className="text-muted-foreground"
          >
            <RotateCcw className="mr-1.5 size-3.5" strokeWidth={1.5} />
            Clear all filters
          </Button>
        ) : null}
      </div>
    </section>
  )
}