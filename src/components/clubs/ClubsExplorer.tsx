"use client"

import { useMemo, useState } from "react"
import { Building2, Search, SearchX, Sparkles, Users, X } from "lucide-react"
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
      {/* Hero — no background fill, only glossy glow behind centered text */}
      <section className="relative overflow-hidden px-6 py-10 text-center sm:py-14">
        <div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-0 h-64 w-[42rem] max-w-none -translate-x-1/2 rounded-full bg-primary/[0.12] blur-3xl dark:bg-primary/[0.18]"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -left-24 top-10 size-56 rounded-full bg-secondary/[0.10] blur-3xl dark:bg-secondary/[0.16]"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -right-24 top-10 size-56 rounded-full bg-secondary/[0.10] blur-3xl dark:bg-secondary/[0.16]"
        />
        {/* Glossy sheen */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-white/[0.35] to-transparent dark:from-white/[0.06]"
        />
        <div className="relative">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/25 bg-primary/[0.08] px-3 py-1 text-xs font-medium text-primary">
            <Sparkles className="size-3.5" strokeWidth={1.5} />
            Student life
          </span>
          <h1 className="mx-auto mt-3 max-w-2xl font-heading text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Student Clubs
          </h1>
          <p className="mx-auto mt-2 max-w-xl text-[15px] leading-relaxed text-muted-foreground">
            Find your people — coding circles, robotics crews, debate floors
            and everything in between. Every club lives under its department,
            so start where you study.
          </p>
          <dl className="mt-5 flex flex-wrap justify-center gap-2.5">
            <div className="flex items-center gap-2 rounded-full border border-border bg-card px-3.5 py-1.5 shadow-[0_2px_12px_rgba(91,95,239,0.06)]">
              <Users className="size-4 text-primary" strokeWidth={1.5} />
              <dt className="sr-only">Clubs</dt>
              <dd className="text-sm font-semibold text-foreground">
                {totalClubs}{" "}
                <span className="font-normal text-muted-foreground">
                  {totalClubs === 1 ? "club" : "clubs"}
                </span>
              </dd>
            </div>
            <div className="flex items-center gap-2 rounded-full border border-border bg-card px-3.5 py-1.5 shadow-[0_2px_12px_rgba(91,95,239,0.06)]">
              <Building2 className="size-4 text-primary" strokeWidth={1.5} />
              <dt className="sr-only">Departments</dt>
              <dd className="text-sm font-semibold text-foreground">
                {groups.length}{" "}
                <span className="font-normal text-muted-foreground">
                  {groups.length === 1 ? "department" : "departments"}
                </span>
              </dd>
            </div>
          </dl>
        </div>
      </section>

      {/* Search + filter — plain surface so inputs stay crisp and legible */}
      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
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
      <p className="mt-2.5 text-xs text-muted-foreground" aria-live="polite">
        {isFiltering ? (
          <>
            Showing {visibleClubs} of {totalClubs} {totalClubs === 1 ? "club" : "clubs"}
          </>
        ) : (
          <>
            {totalClubs} {totalClubs === 1 ? "club" : "clubs"} across {groups.length}{" "}
            {groups.length === 1 ? "department" : "departments"}
          </>
        )}
      </p>

      {/* Groups */}
      <div className="mt-6">
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
