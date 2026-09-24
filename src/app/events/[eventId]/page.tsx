import React from "react"
import Link from "next/link"
import { notFound } from "next/navigation"
import {
  ArrowLeft,
  CalendarDays,
  Clock,
  MapPin,
  Users,
} from "lucide-react"
import { getEventById } from "@/lib/db/queries/clubs"
import { EventTimer } from "@/components/clubs/EventTimer"
import { Card, CardContent } from "@/components/ui/card"
import { linkifyText } from "@/lib/linkify"

function formatDateTime(value: string): string {
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return value
  return d.toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function formatDate(value: string): string {
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return value
  return d.toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  })
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

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ eventId: string }>
}) {
  const { eventId } = await params
  const event = await getEventById(eventId)
  if (!event) notFound()

  const details = [
    event.place && {
      icon: MapPin,
      label: "Place",
      value: event.place,
    },
    {
      icon: CalendarDays,
      label: "Date",
      value: formatDate(event.date),
    },
    event.startTime && {
      icon: Clock,
      label: "Starts",
      value: formatDateTime(event.startTime),
    },
    event.endTime && {
      icon: Clock,
      label: "Ends (registration deadline)",
      value: formatDateTime(event.endTime),
    },
  ].filter(Boolean) as Array<{
    icon: React.ElementType
    label: string
    value: string
  }>

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6">
      <Link
        href="/events"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-sm mb-6"
      >
        <ArrowLeft className="size-4" strokeWidth={1.5} />
        All events
      </Link>

      {/* Featured panel — the page's single special surface */}
      <div className="rounded-2xl bg-[linear-gradient(135deg,#5B5FEF_0%,#8B5CF6_100%)] p-[1.5px] shadow-[0_8px_28px_rgba(91,95,239,0.22)]">
        <div className="rounded-[calc(1rem-1px)] bg-card p-5 sm:p-6">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={event.status} />
            {event.clubId && event.clubName ? (
              <Link
                href={`/clubs/${event.clubId}`}
                className="inline-flex items-center gap-1 rounded-full border border-secondary/25 bg-secondary/10 px-2.5 py-0.5 text-xs font-medium text-secondary hover:bg-secondary/[0.16] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 motion-reduce:transition-none"
              >
                <Users className="size-3" strokeWidth={1.5} />
                {event.clubName}
              </Link>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full border border-border bg-muted/60 px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                Individual
              </span>
            )}
          </div>

          <h1 className="mt-3 font-heading text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            {event.name}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">{formatDate(event.date)}</p>

          <div className="mt-4 rounded-xl border border-primary/20 bg-primary/[0.04] p-3 dark:bg-primary/[0.07]">
            <EventTimer endTime={event.endTime} startTime={event.startTime} />
          </div>
        </div>
      </div>

      {/* Details */}
      <Card className="mt-4">
        <CardContent className="p-5 sm:p-6">
          <h2 className="font-heading text-lg font-semibold text-foreground">Details</h2>
          <dl className="mt-3 space-y-3">
            {details.map((d) => (
              <div key={d.label} className="flex items-start gap-3">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <d.icon className="size-4 text-primary" strokeWidth={1.5} />
                </span>
                <div className="min-w-0">
                  <dt className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    {d.label}
                  </dt>
                  <dd className="mt-0.5 text-sm font-medium text-foreground">{d.value}</dd>
                </div>
              </div>
            ))}
          </dl>
        </CardContent>
      </Card>

      {/* Description */}
      <Card className="mt-4">
        <CardContent className="p-5 sm:p-6">
          <h2 className="font-heading text-lg font-semibold text-foreground">About</h2>
          <div className="mt-3 text-[15px] leading-relaxed text-muted-foreground">
            {event.description ? (
              linkifyText(event.description).map((node, i) => (
                <React.Fragment key={i}>{node}</React.Fragment>
              ))
            ) : (
              <p className="text-sm italic">No description yet.</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Host club */}
      {event.clubId && event.clubName && (
        <Link
          href={`/clubs/${event.clubId}`}
          className="group mt-4 flex items-center gap-3 rounded-2xl border border-border bg-card p-4 shadow-[0_2px_12px_rgba(91,95,239,0.06)] transition-all hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(91,95,239,0.12)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 motion-reduce:transition-none motion-reduce:hover:transform-none"
        >
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-secondary/15 font-heading text-lg font-bold text-secondary">
            {event.clubName.charAt(0).toUpperCase()}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-semibold text-foreground">
              Hosted by {event.clubName}
            </span>
            <span className="block text-xs text-muted-foreground">
              Visit the club page for more events and updates
            </span>
          </span>
          <ArrowLeft className="size-4 shrink-0 rotate-180 text-muted-foreground transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none" strokeWidth={1.5} />
        </Link>
      )}
    </main>
  )
}
