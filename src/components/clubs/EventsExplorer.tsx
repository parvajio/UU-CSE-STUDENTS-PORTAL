"use client"

import Link from "next/link"
import { useMemo, useState } from "react"
import {
  CalendarDays,
  ChevronRight,
  MapPin,
  Search,
  SearchX,
  Sparkles,
  Users,
  X,
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { EventTimer } from "./EventTimer"

export interface PublicEvent {
  id: string
  clubId: string | null
  name: string
  place: string | null
  description: string | null
  date: string
  deadline: string | null
  startTime: string | null
  endTime: string | null
  createdAt: string
  updatedAt: string
  status: string
  clubName: string
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  if (Number.isNaN(d.getTime())) return dateStr
  return d.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

function dateBlock(dateStr: string): { month: string; day: string } {
  const d = new Date(dateStr)
  if (Number.isNaN(d.getTime())) return { month: "—", day: "?" }
  return {
    month: d.toLocaleDateString(undefined, { month: "short" }).toUpperCase(),
    day: String(d.getDate()).padStart(2, "0"),
  }
}

function StatusBadge({ status }: { status: string }) {
  if (status === "ongoing") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-700 dark:text-emerald-300">
        <span className="relative flex size-1.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-60 motion-reduce:animate-none" />
          <span className="relative inline-flex size-1.5 rounded-full bg-emerald-500" />
        </span>
        Live now
      </span>
    )
  }
  if (status === "upcoming") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-primary/25 bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
        Upcoming
      </span>
    )
  }
  return (
    <span className="inline-flex items-center rounded-full border border-border bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
      Past
    </span>
  )
}

/** Club tag — static badge (the whole card already links to the event detail page). */
function ClubTag({ event }: { event: PublicEvent }) {
  if (event.clubId && event.clubName) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-secondary/25 bg-secondary/10 px-2.5 py-0.5 text-xs font-medium text-secondary">
        <Users className="size-3" strokeWidth={1.5} />
        {event.clubName}
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-border bg-muted/60 px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
      Individual
    </span>
  )
}

function EventCard({ event }: { event: PublicEvent }) {
  const { month, day } = dateBlock(event.date)
  const done = event.status === "completed"

  return (
    <Link
      href={`/events/${event.id}`}
      className="block rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      aria-label={`View details for ${event.name}`}
    >
      <Card
        className={cn(
          "transition-all hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(91,95,239,0.12)] motion-reduce:transition-none motion-reduce:hover:transform-none",
          done && "opacity-75"
        )}
      >
        <CardContent className="p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
            <div
              aria-hidden
              className="flex shrink-0 items-center gap-3 sm:flex-col sm:gap-0 sm:rounded-xl sm:border sm:border-border sm:bg-muted/50 sm:px-4 sm:py-2.5 sm:text-center"
            >
              <span className="text-xs font-semibold uppercase tracking-widest text-primary">
                {month}
              </span>
              <span className="font-heading text-2xl font-bold leading-none text-foreground">
                {day}
              </span>
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-heading text-[15px] font-semibold text-foreground">
                  {event.name}
                </h3>
                <StatusBadge status={event.status} />
                <ClubTag event={event} />
              </div>
              <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  <CalendarDays className="size-3.5" strokeWidth={1.5} />
                  {formatDate(event.date)}
                </span>
                {event.place && (
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="size-3.5" strokeWidth={1.5} />
                    {event.place}
                  </span>
                )}
              </div>
              {event.description && (
                <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
                  {event.description}
                </p>
              )}
              <div className="mt-3 flex items-center justify-between gap-3 border-t border-dashed pt-3">
                <EventTimer endTime={event.endTime} startTime={event.startTime} />
                <span className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-primary">
                  View details
                  <ChevronRight className="size-3.5" strokeWidth={1.5} />
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}

type SourceFilter = "all" | "club" | "individual"

export function EventsExplorer({ events }: { events: PublicEvent[] }) {
  const [query, setQuery] = useState("")
  const [source, setSource] = useState<SourceFilter>("all")

  const clubCount = useMemo(() => events.filter((e) => e.clubId).length, [events])

  // NOTE: events arrive ordered by most-recently-created first
  // (getEventsForPage sorts by createdAt desc) — filters preserve that order.
  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    return events.filter((e) => {
      if (source === "club" && !e.clubId) return false
      if (source === "individual" && e.clubId) return false
      if (!q) return true
      return (
        e.name.toLowerCase().includes(q) ||
        (e.place ?? "").toLowerCase().includes(q) ||
        (e.description ?? "").toLowerCase().includes(q) ||
        (e.clubName ?? "").toLowerCase().includes(q)
      )
    })
  }, [events, query, source])

  const isFiltering = query.trim() !== "" || source !== "all"

  function clearFilters() {
    setQuery("")
    setSource("all")
  }

  return (
    <div>
      {/* Hero — the page's single special surface (glow only, no glass fill) */}
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
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-white/[0.35] to-transparent dark:from-white/[0.06]"
        />
        <div className="relative">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/25 bg-primary/[0.08] px-3 py-1 text-xs font-medium text-primary">
            <Sparkles className="size-3.5" strokeWidth={1.5} />
            What&apos;s happening
          </span>
          <h1 className="mx-auto mt-3 max-w-2xl font-heading text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Events
          </h1>
          <p className="mx-auto mt-2 max-w-xl text-[15px] leading-relaxed text-muted-foreground">
            Every event, newest first — club gatherings and individual
            meetups, all in one place.
          </p>
          <dl className="mt-5 flex flex-wrap justify-center gap-2.5">
            <div className="flex items-center gap-2 rounded-full border border-border bg-card px-3.5 py-1.5 shadow-[0_2px_12px_rgba(91,95,239,0.06)]">
              <CalendarDays className="size-4 text-primary" strokeWidth={1.5} />
              <dt className="sr-only">Events</dt>
              <dd className="text-sm font-semibold text-foreground">
                {events.length}{" "}
                <span className="font-normal text-muted-foreground">
                  {events.length === 1 ? "event" : "events"}
                </span>
              </dd>
            </div>
            <div className="flex items-center gap-2 rounded-full border border-border bg-card px-3.5 py-1.5 shadow-[0_2px_12px_rgba(91,95,239,0.06)]">
              <Users className="size-4 text-primary" strokeWidth={1.5} />
              <dt className="sr-only">Club events</dt>
              <dd className="text-sm font-semibold text-foreground">
                {clubCount}{" "}
                <span className="font-normal text-muted-foreground">
                  from {clubCount === 1 ? "club" : "clubs"}
                </span>
              </dd>
            </div>
          </dl>
        </div>
      </section>

      {/* Search + source filter — plain surface so inputs stay legible */}
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
            placeholder="Search events by name, place, or club…"
            aria-label="Search events"
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-2">
          <select
            value={source}
            onChange={(e) => setSource(e.target.value as SourceFilter)}
            aria-label="Filter events by source"
            className="flex h-10 rounded-lg border border-input bg-transparent px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="all">All events</option>
            <option value="club">From clubs</option>
            <option value="individual">Individual</option>
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
            Showing {visible.length} of {events.length} {events.length === 1 ? "event" : "events"}
          </>
        ) : (
          <>
            {events.length} {events.length === 1 ? "event" : "events"}, newest first
          </>
        )}
      </p>

      {/* List — newest-created first */}
      <div className="mt-6">
        {events.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed px-6 py-14 text-center">
            <span className="flex size-11 items-center justify-center rounded-xl bg-primary/10">
              <CalendarDays className="size-5 text-primary" strokeWidth={1.5} />
            </span>
            <p className="font-heading text-base font-semibold text-foreground">
              No events yet
            </p>
            <p className="max-w-sm text-sm text-muted-foreground">
              Check back soon — new club gatherings and meetups will show up here.
            </p>
          </div>
        ) : visible.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed px-6 py-14 text-center">
            <span className="flex size-11 items-center justify-center rounded-xl bg-primary/10">
              <SearchX className="size-5 text-primary" strokeWidth={1.5} />
            </span>
            <p className="font-heading text-base font-semibold text-foreground">
              No events match your search
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
          <div className="space-y-4">
            {visible.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        )}
      </div>

      {visible.length > 0 && (
        <div className="mt-6 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <Badge variant="secondary" className="gap-1">
            <Users className="size-3" strokeWidth={1.5} />
            Club name
          </Badge>
          <span>= hosted by that club (full details + club link on the event page)</span>
          <span aria-hidden>·</span>
          <Badge variant="outline">Individual</Badge>
          <span>= standalone meetup, not tied to a club</span>
        </div>
      )}
    </div>
  )
}
