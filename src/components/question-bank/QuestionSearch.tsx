"use client"

import {
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  useTransition,
} from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { ChevronDown, SlidersHorizontal, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  PROGRAM_TYPE_LABELS,
  SEASON_LABELS,
} from "@/lib/question-bank/constants"
import {
  EXAM_TYPE_LABELS,
  EXAM_TYPES,
  PROGRAM_TYPES,
  SEASONS,
} from "@/lib/question-bank/validation"
import type {
  CourseOption,
  PopularTagChip,
  RecentBatchChip,
  TopCourseChip,
} from "@/types/question-bank"
import { cn } from "@/lib/utils"
import { setSearchPending } from "@/lib/question-bank/search-pending"
import { CourseCombobox } from "@/components/question-bank/CourseCombobox"
import { BatchCombobox } from "@/components/question-bank/BatchCombobox"

const BATCH = "batch"
const COURSE = "course"
const EXAM = "exam"
const PAGE = "page"
const PROGRAM_TYPE = "programType"
const QUERY = "q"
const SEASON = "season"
const TAGS = "tags"
const YEAR = "year"

const FILTER_KEYS = [COURSE, BATCH, EXAM, PROGRAM_TYPE, SEASON, YEAR, QUERY, TAGS]

const MOBILE_QUERY = "(max-width: 767.98px)"

const COMMIT_DEBOUNCE_MS = 275

const PRIMARY_HUE = 238

const CHIP_PALETTE = [238, 265, 330, 40, 175, 150, 205, 285, 12, 350]

function chipHue(key: string): number {
  let hash = 0
  for (let i = 0; i < key.length; i++) {
    hash = (hash * 31 + key.charCodeAt(i)) >>> 0
  }
  return CHIP_PALETTE[hash % CHIP_PALETTE.length]
}

function subscribeMobile(callback: () => void) {
  const mql = window.matchMedia(MOBILE_QUERY)
  mql.addEventListener("change", callback)
  return () => mql.removeEventListener("change", callback)
}

function getMobileSnapshot(): boolean {
  return window.matchMedia(MOBILE_QUERY).matches
}

function getMobileServerSnapshot(): boolean {
  return false
}

function useIsMobile(): boolean {
  return useSyncExternalStore(
    subscribeMobile,
    getMobileSnapshot,
    getMobileServerSnapshot
  )
}

function toValue(entries: URLSearchParams, key: string): string {
  return entries.get(key) ?? ""
}

const pillClassName =
  "soft-tag shrink-0 cursor-pointer text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"

function activePillStyle(hue: number): React.CSSProperties {
  return { "--tag-h": hue } as React.CSSProperties
}

function SegmentedPills({
  ariaLabel,
  value,
  onChange,
  options,
  allLabel = "All",
  hue = PRIMARY_HUE,
}: {
  ariaLabel: string
  value: string
  onChange: (value: string) => void
  options: { value: string; label: string }[]
  allLabel?: string
  hue?: number
}) {
  return (
    <div role="group" aria-label={ariaLabel} className="flex flex-wrap gap-1.5">
      <button
        type="button"
        aria-pressed={value === ""}
        onClick={() => onChange("")}
        className={cn(
          pillClassName,
          "soft-tag--hue",
          value === "" && "soft-tag--active"
        )}
        style={activePillStyle(hue)}
      >
        {allLabel}
      </button>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          aria-pressed={value === option.value}
          onClick={() => onChange(option.value)}
          className={cn(
            pillClassName,
            "soft-tag--hue",
            value === option.value && "soft-tag--active"
          )}
          style={activePillStyle(hue)}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}

function QuickChips({
  items,
  isActive,
  onToggle,
  isMobile,
}: {
  items: { key: string; label: string; count?: number }[]
  isActive: (key: string) => boolean
  onToggle: (key: string) => void
  isMobile: boolean
}) {
  if (items.length === 0) return null
  return (
    <div className={cn("flex gap-1.5", isMobile ? "overflow-x-auto pb-1" : "flex-wrap")}>
      {items.map((item) => {
        const active = isActive(item.key)
        const hue = chipHue(item.key)
        return (
          <button
            key={item.key}
            type="button"
            aria-pressed={active}
            onClick={() => onToggle(item.key)}
            className={cn(
              pillClassName,
              "soft-tag--hue",
              active && "soft-tag--active"
            )}
            style={activePillStyle(hue)}
          >
            <span className="max-w-40 truncate">{item.label}</span>
            {typeof item.count === "number" ? (
              <span
                className={cn(
                  "ml-1.5 rounded-full px-1.5 py-0.5 text-[10px] font-semibold tabular-nums",
                  active
                    ? "bg-white/25 text-white"
                    : "bg-[hsla(var(--tag-h),var(--tag-s),var(--tag-l),0.18)] text-foreground dark:bg-[hsla(var(--tag-h),var(--tag-s),var(--tag-l),0.3)]"
                )}
              >
                {item.count}
              </span>
            ) : null}
          </button>
        )
      })}
    </div>
  )
}

function SearchField({
  value,
  onChange,
}: {
  value: string
  onChange: (value: string) => void
}) {
  return (
    <div className="grid gap-1.5">
      <Label htmlFor="q-search">Search</Label>
      <Input
        id="q-search"
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search titles, courses, tags, teacher, season, year…"
        aria-label="Search question titles, courses, tags, teacher, season, year"
      />
    </div>
  )
}

function FilterFields({
  courses,
  courseValue,
  onCourseChange,
  topCourses,
  onCourseChipChange,
  batchMax,
  batchValue,
  onBatchChange,
  recentBatches,
  onBatchChipChange,
  examValue,
  onExamChange,
  programTypeValue,
  onProgramTypeChange,
  seasonValue,
  onSeasonChange,
  yearValue,
  onYearChange,
  tags,
  tagInput,
  onTagInputChange,
  onAddTag,
  onRemoveTag,
  onTagKeyDown,
  popularTags,
  onTagChipChange,
  isMobile,
}: {
  courses: CourseOption[]
  courseValue: string | undefined
  onCourseChange: (value: string | undefined) => void
  topCourses: TopCourseChip[]
  onCourseChipChange: (courseId: string) => void
  batchMax: number
  batchValue: number | undefined
  onBatchChange: (value: number | undefined) => void
  recentBatches: RecentBatchChip[]
  onBatchChipChange: (batchNumber: number) => void
  examValue: string
  onExamChange: (value: string) => void
  programTypeValue: string
  onProgramTypeChange: (value: string) => void
  seasonValue: string
  onSeasonChange: (value: string) => void
  yearValue: string
  onYearChange: (value: string) => void
  tags: string[]
  tagInput: string
  onTagInputChange: (value: string) => void
  onAddTag: () => void
  onRemoveTag: (tag: string) => void
  onTagKeyDown: (event: React.KeyboardEvent<HTMLInputElement>) => void
  popularTags: PopularTagChip[]
  onTagChipChange: (tag: string) => void
  isMobile: boolean
}) {
  const thisYear = new Date().getFullYear()

  return (
    <div className="flex flex-col gap-3">
      <div className="grid gap-1.5">
        <Label htmlFor="course-filter">Subject/course</Label>
        <QuickChips
          items={topCourses.map((chip) => ({
            key: chip.courseId,
            label: `${chip.title}`,
            count: chip.count,
          }))}
          isActive={(key) => key === courseValue}
          onToggle={onCourseChipChange}
          isMobile={isMobile}
        />
        <CourseCombobox
          id="course-filter"
          courses={courses}
          value={courseValue}
          onValueChange={onCourseChange}
          clearable
        />
      </div>

      <div className="grid gap-1.5">
        <Label htmlFor="batch-filter">Batch</Label>
        <QuickChips
          items={recentBatches.map((chip) => ({
            key: String(chip.batchNumber),
            label: String(chip.batchNumber),
            count: chip.count,
          }))}
          isActive={(key) => key === String(batchValue)}
          onToggle={(key) => onBatchChipChange(Number(key))}
          isMobile={isMobile}
        />
        <BatchCombobox
          id="batch-filter"
          max={batchMax}
          value={batchValue}
          onValueChange={onBatchChange}
          clearable
        />
      </div>

      <div className="grid gap-1.5">
        <Label>Exam type</Label>
        <SegmentedPills
          ariaLabel="Exam type"
          value={examValue}
          onChange={onExamChange}
          options={EXAM_TYPES.map((type) => ({
            value: type,
            label: EXAM_TYPE_LABELS[type],
          }))}
          hue={270}
        />
      </div>

      <div className="grid gap-1.5">
        <Label>Program</Label>
        <SegmentedPills
          ariaLabel="Program"
          value={programTypeValue}
          onChange={onProgramTypeChange}
          options={PROGRAM_TYPES.map((type) => ({
            value: type,
            label: PROGRAM_TYPE_LABELS[type],
          }))}
          hue={210}
        />
      </div>

      <div className="grid gap-1.5">
        <Label>Season</Label>
        <SegmentedPills
          ariaLabel="Season"
          value={seasonValue}
          onChange={onSeasonChange}
          options={SEASONS.map((season) => ({
            value: season,
            label: SEASON_LABELS[season],
          }))}
          hue={170}
        />
      </div>

      <div className="grid gap-1.5">
        <Label htmlFor="year-filter">Year</Label>
        <SegmentedPills
          ariaLabel="Year"
          value={yearValue}
          onChange={onYearChange}
          options={[thisYear - 1, thisYear].map((year) => ({
            value: String(year),
            label: String(year),
          }))}
          hue={35}
        />
        <Input
          id="year-filter"
          type="number"
          min={2000}
          max={2100}
          value={yearValue}
          onChange={(e) => onYearChange(e.target.value)}
          placeholder="e.g. 2024"
          aria-label="Year"
        />
      </div>

      <div className="grid gap-1.5">
        <Label htmlFor="tag-filter">Tags</Label>
        <QuickChips
          items={popularTags.map((chip) => ({
            key: chip.tag,
            label: chip.tag,
            count: chip.count,
          }))}
          isActive={(key) =>
            tags.some((tag) => tag.toLowerCase() === key.toLowerCase())
          }
          onToggle={onTagChipChange}
          isMobile={isMobile}
        />
        <div className="flex flex-wrap items-center gap-1.5">
          {tags.map((tag) => (
            <button
              key={tag}
              type="button"
              aria-label={`Remove tag ${tag}`}
              onClick={() => onRemoveTag(tag)}
              className="soft-tag soft-tag--default cursor-pointer px-2 py-0.5 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              {tag}
              <X className="ml-1 size-3" strokeWidth={1.5} />
            </button>
          ))}
          <Input
            id="tag-filter"
            value={tagInput}
            onChange={(e) => onTagInputChange(e.target.value)}
            onKeyDown={onTagKeyDown}
            onBlur={onAddTag}
            placeholder="Add a tag and press Enter"
            aria-label="Add a tag"
            className="h-8 min-w-40 flex-1 text-sm"
          />
        </div>
      </div>
    </div>
  )
}

export function QuestionSearch({
  catalog,
  currentBatch,
  topCourses = [],
  recentBatches = [],
  popularTags = [],
  isMobileDrawer,
}: {
  catalog: CourseOption[]
  currentBatch: number
  topCourses?: TopCourseChip[]
  recentBatches?: RecentBatchChip[]
  popularTags?: PopularTagChip[]
  isMobileDrawer?: boolean
}) {
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const router = useRouter()
  const detectedMobile = useIsMobile()
  const isMobile = isMobileDrawer ?? detectedMobile
  const [filtersOpen, setFiltersOpen] = useState(false)

  // Optimistic pending params: the URL remains the source of truth, but chip
  // selection is read/written against a local copy so the highlight is instant.
  // Commits to the URL are coalesced (trailing debounce) so rapid taps produce
  // a single navigation + server render.
  const [pending, setPending] = useState(
    () => new URLSearchParams(searchParams.toString())
  )
  const pendingRef = useRef(pending)
  pendingRef.current = pending
  const commitTimer = useRef<number | null>(null)
  const [, startTransition] = useTransition()

  // Adopt external URL changes (Clear all, browser back, pagination links).
  // Adjusted during render (same pattern as the search input below) so an
  // in-flight optimistic change isn't clobbered by our own committed URL.
  const currentUrlString = searchParams.toString()
  const lastSyncedParamsRef = useRef(currentUrlString)
  if (currentUrlString !== lastSyncedParamsRef.current) {
    lastSyncedParamsRef.current = currentUrlString
    if (pendingRef.current.toString() !== currentUrlString) {
      const next = new URLSearchParams(currentUrlString)
      pendingRef.current = next
      setPending(next)
    }
  }

  const courseChoice = toValue(pending, COURSE)
  const batchChoice = toValue(pending, BATCH)
  const examChoice = toValue(pending, EXAM)
  const programTypeChoice = toValue(pending, PROGRAM_TYPE)
  const seasonChoice = toValue(pending, SEASON)
  const yearChoice = toValue(pending, YEAR)
  const tags = (toValue(pending, TAGS) || "").split(",").filter(Boolean)

  const [searchText, setSearchText] = useState(toValue(searchParams, QUERY))
  const [previousQuery, setPreviousQuery] = useState(toValue(searchParams, QUERY))
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
      if (nextQuery !== toValue(pendingRef.current, QUERY)) {
        applyChanges({ [QUERY]: nextQuery }, "now")
      }
    }, 400)
    return () => window.clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchText])

  function commitParams(next: URLSearchParams) {
    const query = next.toString()
    const href = query ? `${pathname}?${query}` : pathname
    if (href === window.location.pathname + window.location.search) return
    setSearchPending(true)
    startTransition(() => {
      router.replace(href, { scroll: false })
    })
  }

  function scheduleCommit(
    next: URLSearchParams,
    mode: "debounce" | "now" = "debounce"
  ) {
    if (commitTimer.current) window.clearTimeout(commitTimer.current)
    if (mode === "now") {
      commitTimer.current = null
      commitParams(next)
      return
    }
    commitTimer.current = window.setTimeout(() => {
      commitTimer.current = null
      commitParams(next)
    }, COMMIT_DEBOUNCE_MS)
  }

  function applyChanges(
    changes: Record<string, string | string[] | null | undefined>,
    mode: "debounce" | "now" = "debounce"
  ) {
    const next = new URLSearchParams(pendingRef.current.toString())
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
    pendingRef.current = next
    setPending(next)
    scheduleCommit(next, mode)
  }

  function addTag() {
    const value = tagInput.trim()
    if (!value) return
    const exists = tags.some(
      (tag) => tag.toLowerCase() === value.toLowerCase()
    )
    if (!exists) applyChanges({ [TAGS]: [...tags, value] }, "now")
    setTagInput("")
  }

  function handleTagKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter" || event.key === ",") {
      event.preventDefault()
      addTag()
    }
  }

  function toggleCourseChip(courseId: string) {
    applyChanges({ [COURSE]: courseChoice === courseId ? null : courseId })
  }

  function toggleBatchChip(batchNumber: number) {
    const value = String(batchNumber)
    applyChanges({ [BATCH]: batchChoice === value ? null : value })
  }

  function toggleQuickTag(tag: string) {
    const exists = tags.some((t) => t.toLowerCase() === tag.toLowerCase())
    applyChanges({
      [TAGS]: exists
        ? tags.filter((t) => t.toLowerCase() !== tag.toLowerCase())
        : [...tags, tag],
    })
  }

  const activeFilterCount = FILTER_KEYS.reduce(
    (count, key) => (pending.get(key) ? count + 1 : count),
    0
  )

  const filterFields = (
    <FilterFields
      courses={catalog}
      courseValue={courseChoice || undefined}
      onCourseChange={(value) => applyChanges({ [COURSE]: value })}
      topCourses={topCourses}
      onCourseChipChange={toggleCourseChip}
      batchMax={currentBatch}
      batchValue={batchChoice ? Number(batchChoice) : undefined}
      onBatchChange={(value) =>
        applyChanges({ [BATCH]: value == null ? null : String(value) })
      }
      recentBatches={recentBatches}
      onBatchChipChange={toggleBatchChip}
      examValue={examChoice}
      onExamChange={(value) => applyChanges({ [EXAM]: value })}
      programTypeValue={programTypeChoice}
      onProgramTypeChange={(value) => applyChanges({ [PROGRAM_TYPE]: value })}
      seasonValue={seasonChoice}
      onSeasonChange={(value) => applyChanges({ [SEASON]: value })}
      yearValue={yearChoice}
      onYearChange={(value) => applyChanges({ [YEAR]: value })}
      tags={tags}
      tagInput={tagInput}
      onTagInputChange={setTagInput}
      onAddTag={addTag}
      onRemoveTag={(tag) =>
        applyChanges({ [TAGS]: tags.filter((t) => t !== tag) })
      }
      onTagKeyDown={handleTagKeyDown}
      popularTags={popularTags}
      onTagChipChange={toggleQuickTag}
      isMobile={isMobile}
    />
  )

  return (
    <section aria-label="Filter question papers" className="flex flex-col gap-3">
      <SearchField value={searchText} onChange={setSearchText} />
      {isMobile ? (
        <div>
          <button
            type="button"
            onClick={() => setFiltersOpen((open) => !open)}
            aria-expanded={filtersOpen}
            aria-controls="question-filters-panel"
            className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm font-medium text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            <SlidersHorizontal className="size-4 shrink-0 text-muted-foreground" strokeWidth={1.5} />
            <span>Filters</span>
            {activeFilterCount > 0 ? (
              <span className="rounded-full bg-foreground/10 px-1.5 py-0.5 text-[10px] font-semibold tabular-nums text-foreground">
                {activeFilterCount}
              </span>
            ) : null}
            <ChevronDown
              className={cn(
                "ml-auto size-4 shrink-0 transition-transform duration-200 ease-out",
                filtersOpen && "rotate-180"
              )}
              strokeWidth={1.5}
            />
          </button>
          <div
            id="question-filters-panel"
            className={cn(
              "grid transition-all duration-200 ease-out",
              filtersOpen
                ? "mt-3 grid-rows-[1fr] opacity-100"
                : "grid-rows-[0fr] opacity-0"
            )}
          >
            <div className="overflow-hidden" inert={!filtersOpen}>
              {filterFields}
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-3">{filterFields}</div>
      )}
    </section>
  )
}