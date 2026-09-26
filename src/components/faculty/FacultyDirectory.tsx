"use client"

import { useMemo, useState } from "react"
import { Search, SearchX, X } from "lucide-react"
import { FacultyCard } from "./FacultyCard"
import { EmptyState } from "@/components/shared/EmptyState"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { FacultyMember } from "@/lib/faculty"
import { cn } from "@/lib/utils"

/** Seniority weight so designation chips read top-down by rank. */
function rankWeight(designation: string): number {
  const lower = designation.toLowerCase()
  if (lower.includes("associate professor")) return 1
  if (lower.includes("assistant professor")) return 2
  if (lower.includes("senior lecturer")) return 3
  if (lower === "professor" || lower.includes("professor")) return 0
  if (lower.includes("lecturer")) return 4
  return 5
}

export function FacultyDirectory({ faculty }: { faculty: FacultyMember[] }) {
  const [query, setQuery] = useState("")
  const [designation, setDesignation] = useState<string | null>(null)

  const designations = useMemo(() => {
    const counts = new Map<string, number>()
    for (const member of faculty) {
      counts.set(member.designation, (counts.get(member.designation) ?? 0) + 1)
    }
    return [...counts.entries()].sort(
      ([a], [b]) => rankWeight(a) - rankWeight(b) || a.localeCompare(b)
    )
  }, [faculty])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return faculty.filter((member) => {
      if (designation && member.designation !== designation) return false
      if (!q) return true
      const haystack = [
        member.name,
        member.designation,
        member.email ?? "",
        member.institute1 ?? "",
        member.institute2 ?? "",
      ]
        .join(" ")
        .toLowerCase()
      return q.split(/\s+/).every((token) => haystack.includes(token))
    })
  }, [faculty, query, designation])

  const hasFilters = query.trim().length > 0 || designation !== null

  function clearFilters() {
    setQuery("")
    setDesignation(null)
  }

  return (
    <div>
      <div className="mb-8 space-y-4">
        <div className="relative max-w-xl">
          <Search
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
            strokeWidth={1.5}
          />
          <Input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by name, designation, email, or university…"
            aria-label="Search faculty"
            className="pr-9 pl-9"
          />
          {query ? (
            <button
              type="button"
              onClick={() => setQuery("")}
              aria-label="Clear search"
              className="absolute top-1/2 right-2.5 -translate-y-1/2 rounded-md p-1 text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <X className="size-4" strokeWidth={1.5} />
            </button>
          ) : null}
        </div>

        {designations.length > 0 ? (
          <div
            className="flex items-center gap-2 overflow-x-auto pb-2"
            role="group"
            aria-label="Filter by designation"
          >
            <button
              type="button"
              onClick={() => setDesignation(null)}
              aria-pressed={designation === null}
              className={cn(
                "soft-tag shrink-0 cursor-pointer text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                designation === null
                  ? "bg-primary border-primary text-primary-foreground font-semibold"
                  : "soft-tag--default hover:border-primary/50"
              )}
            >
              All · {faculty.length}
            </button>
            {designations.map(([value, count]) => {
              const selected = designation === value
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => setDesignation(selected ? null : value)}
                  aria-pressed={selected}
                  title={value}
                  className={cn(
                    "soft-tag max-w-55 shrink-0 cursor-pointer truncate text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                    selected
                      ? "bg-primary border-primary text-primary-foreground font-semibold"
                      : "soft-tag--default hover:border-primary/50"
                  )}
                >
                  {value} · {count}
                </button>
              )
            })}
          </div>
        ) : null}

        <p className="text-xs text-muted-foreground" aria-live="polite">
          Showing {filtered.length} of {faculty.length} faculty members
          {designation ? ` · ${designation}` : ""}
          {query.trim() ? ` · “${query.trim()}”` : ""}
        </p>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title="No faculty members found"
          description="Try a different name, designation, or university — or clear your filters to browse everyone."
          icon={<SearchX className="size-10" strokeWidth={1.25} />}
          action={
            hasFilters ? (
              <Button variant="outline" size="sm" onClick={clearFilters}>
                <X className="size-4" strokeWidth={1.5} />
                Clear search & filters
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((member) => (
            <FacultyCard key={member.empId} faculty={member} />
          ))}
        </div>
      )}
    </div>
  )
}
