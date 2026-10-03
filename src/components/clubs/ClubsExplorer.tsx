"use client"

import { useMemo, useState } from "react"
import { Search, SearchX, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { DepartmentGroup } from "./DepartmentGroup"
import type { DepartmentGroup as DepartmentGroupData } from "@/lib/db/queries/clubs"

export function ClubsExplorer({ groups }: { groups: DepartmentGroupData[] }) {
  const [query, setQuery] = useState("")
  const [deptFilter, setDeptFilter] = useState<string>("all")

  const totalClubs = useMemo(
    () => groups.reduce((n, g) => n + g.clubs.length, 0),
    [groups]
  )

  const visibleGroups = useMemo(() => {
    const q = query.trim().toLowerCase()
    return groups
      .filter((g) => deptFilter === "all" || g.department.id === deptFilter)
      .map((g) => ({
        ...g,
        clubs: q
          ? g.clubs.filter(
              (c) =>
                c.name.toLowerCase().includes(q) ||
                (c.description ?? "").toLowerCase().includes(q)
            )
          : g.clubs,
      }))
      .filter((g) => g.clubs.length > 0 || (!q && deptFilter !== "all"))
  }, [groups, query, deptFilter])

  const visibleClubs = useMemo(
    () => visibleGroups.reduce((n, g) => n + g.clubs.length, 0),
    [visibleGroups]
  )
  const isFiltering = query.trim() !== "" || deptFilter !== "all"

  function clearFilters() {
    setQuery("")
    setDeptFilter("all")
  }

  return (
    <div>
      {/* Compact header — title + counts on one row so club cards get space first */}
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 pt-2">
        <div className="min-w-0">
          <h1 className="font-heading text-xl font-bold tracking-tight text-foreground sm:text-2xl">
            Student Clubs
          </h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Coding circles, robotics crews, debate floors — find yours.
          </p>
        </div>
        <p className="shrink-0 text-xs text-muted-foreground" aria-live="polite">
          {totalClubs} {totalClubs === 1 ? "club" : "clubs"} · {groups.length}{" "}
          {groups.length === 1 ? "department" : "departments"}
        </p>
      </div>

      {/* Search + filter — plain surface so inputs stay crisp and legible */}
      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search
            aria-hidden
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            strokeWidth={1.5}
          />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search clubs by name or interest…"
            aria-label="Search clubs"
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-2">
          <select
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            aria-label="Filter by department"
            className="flex h-10 rounded-lg border border-input bg-transparent px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="all">All departments</option>
            {groups.map((g) => (
              <option key={g.department.id} value={g.department.id}>
                {g.department.name} ({g.clubs.length})
              </option>
            ))}
          </select>
          {isFiltering && (
            <Button variant="ghost" size="sm" onClick={clearFilters} aria-label="Clear search and filters">
              <X className="size-4" strokeWidth={1.5} />
              Clear
            </Button>
          )}
        </div>
      </div>
      {isFiltering && (
        <p className="mt-2 text-xs text-muted-foreground" aria-live="polite">
          Showing {visibleClubs} of {totalClubs} {totalClubs === 1 ? "club" : "clubs"}
        </p>
      )}

      {/* Groups */}
      <div className="mt-4">
        {visibleGroups.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed px-6 py-14 text-center">
            <span className="flex size-11 items-center justify-center rounded-xl bg-primary/10">
              <SearchX className="size-5 text-primary" strokeWidth={1.5} />
            </span>
            <p className="font-heading text-base font-semibold text-foreground">
              No clubs match your search
            </p>
            <p className="max-w-sm text-sm text-muted-foreground">
              Try a different keyword, or browse everything instead.
            </p>
            <Button variant="outline" size="sm" onClick={clearFilters} className="mt-2">
              <X className="size-4 mr-1.5" strokeWidth={1.5} />
              Clear search
            </Button>
          </div>
        ) : (
          <div className="space-y-10">
            {visibleGroups.map(({ department, clubs }) => (
              <DepartmentGroup key={department.id} department={department} clubList={clubs} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
