"use client"

import { useMemo, useRef, useState } from "react"
import { Check, ChevronDown, Search } from "lucide-react"
import * as Popover from "@radix-ui/react-popover"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import type { CourseOption } from "@/types/question-bank"

export function CourseCombobox({
  courses,
  value,
  onValueChange,
  id,
  placeholder = "Search by code or title…",
}: {
  courses: CourseOption[]
  value: string | undefined
  onValueChange: (value: string | undefined) => void
  id?: string
  placeholder?: string
}) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")

  const selected = courses.find((course) => course.id === value)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return courses
    return courses.filter(
      (course) =>
        course.code.toLowerCase().includes(q) ||
        course.title.toLowerCase().includes(q)
    )
  }, [courses, query])

  const [activeIndex, setActiveIndex] = useState(0)
  const safeActive = Math.min(activeIndex, Math.max(filtered.length - 1, 0))

  function commit(courseId: string) {
    onValueChange(courseId)
    setOpen(false)
    setQuery("")
    setActiveIndex(0)
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown") {
      event.preventDefault()
      setActiveIndex((index) => Math.min(filtered.length - 1, index + 1))
    } else if (event.key === "ArrowUp") {
      event.preventDefault()
      setActiveIndex((index) => Math.max(0, index - 1))
    } else if (event.key === "Enter") {
      event.preventDefault()
      const match = filtered[safeActive]
      if (match) commit(match.id)
    } else if (event.key === "Escape" && open) {
      event.stopPropagation()
      setOpen(false)
    }
  }

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <button
          type="button"
          id={id}
          aria-label="Subject or course"
          aria-haspopup="listbox"
          aria-expanded={open}
          className={cn(
            "flex h-9 w-full items-center justify-between rounded-md border border-border bg-background px-3 py-2 text-sm font-normal text-foreground shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
            !selected && "text-muted-foreground"
          )}
        >
          <span className="truncate">
            {selected ? `${selected.code} · ${selected.title}` : "Select a course…"}
          </span>
          <ChevronDown className="size-4 shrink-0 opacity-60" strokeWidth={1.5} />
        </button>
      </Popover.Trigger>

      <Popover.Content
        align="start"
        sideOffset={6}
        className="z-50 w-72 rounded-md border border-border bg-popover p-0 text-popover-foreground shadow-md"
      >
        <div className="flex items-center gap-2 border-b border-border px-3">
          <Search className="size-4 shrink-0 text-muted-foreground" strokeWidth={1.5} />
          <Input
            value={query}
            onChange={(event) => {
              setQuery(event.target.value)
              setActiveIndex(0)
            }}
            onKeyDown={handleKeyDown}
            role="combobox"
            aria-label="Search courses"
            aria-controls="course-combobox-list"
            aria-expanded
            aria-activedescendant={filtered[safeActive] ? `course-option-${filtered[safeActive].id}` : undefined}
            placeholder={placeholder}
            className="h-9 border-0 bg-transparent px-0 shadow-none focus-visible:ring-0"
          />
        </div>

        <div
          id="course-combobox-list"
          role="listbox"
          aria-label="Search results"
          className="max-h-72 overflow-y-auto py-1"
        >
          {filtered.length === 0 ? (
            <p className="px-3 py-2 text-sm text-muted-foreground">
              No courses match &ldquo;{query}&rdquo;.
            </p>
          ) : (
            filtered.map((course, index) => (
              <button
                key={course.id}
                type="button"
                role="option"
                id={`course-option-${course.id}`}
                aria-selected={course.id === value}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => commit(course.id)}
                onMouseEnter={() => setActiveIndex(index)}
                className={cn(
                  "flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm",
                  index === safeActive && "bg-accent text-accent-foreground"
                )}
              >
                <span className="min-w-0">
                  <span className="block truncate font-medium text-foreground">
                    {course.title}
                  </span>
                  <span className="block text-xs text-muted-foreground">
                    {course.code}
                  </span>
                </span>
                {course.id === value ? (
                  <Check className="size-4 shrink-0" strokeWidth={1.5} />
                ) : null}
              </button>
            ))
          )}
        </div>
      </Popover.Content>
    </Popover.Root>
  )
}