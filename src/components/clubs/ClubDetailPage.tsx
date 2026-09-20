"use client"

import React from "react"

import { ClubMembers } from "./ClubMembers"
import { ClubGallery } from "./ClubGallery"
import { ClubAchievements } from "./ClubAchievements"
import { EventTimer } from "./EventTimer"
import { ClubJoinButton, type ViewerInfo } from "./ClubJoinButton"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import {
  ArrowLeft,
  CalendarDays,
  MapPin,
  MessagesSquare,
  Globe,
  Share2,
  Mail,
  Phone,
  ChevronRight,
  Users,
  Images,
  Trophy,
  Sparkles,
} from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { linkifyText } from "@/lib/linkify"
import { splitGroupUrls } from "@/lib/club-links"

interface ClubMember {
  id: string
  userId: string | null
  profileId: string | null
  avatarUrl: string | null
  fullName: string | null
  roleInClub: string
  position: string | null
  designation: string | null
}

interface ClubEvent {
  id: string
  name: string
  place?: string | null
  description?: string | null
  date: string
  startTime?: string | null
  endTime?: string | null
  status: string
}

interface ClubDetailData {
  club: {
    id: string
    name: string
    description?: string | null
    logoUrl?: string | null
    coverImgUrl?: string | null
    msgGroupUrl?: string | null
    pageUrl?: string | null
    fbGroupUrl?: string | null
    contacts?: string | null
    mail?: string | null
    department: { name: string }
  }
  members: ClubMember[]
  albums: Array<{
    id: string
    title: string
    description?: string | null
    images: Array<{
      id: string
      imageUrl: string
      caption?: string | null
      displayOrder: number
    }>
  }>
  achievements: Array<{
    id: string
    title: string
    description?: string | null
    date?: string | null
    imageUrl?: string | null
    linkUrl?: string | null
  }>
  events: ClubEvent[]
}

function renderDescription(text: string | null | undefined) {
  if (!text) return null
  // URL auto-detection (FR-013, SC-006) via the shared linkify util.
  return (
    <div className="text-[15px] leading-relaxed text-muted-foreground space-y-2">
      {linkifyText(text).map((node, i) => (
        <React.Fragment key={i}>{node}</React.Fragment>
      ))}
    </div>
  )
}

function hostnameOf(href: string): string {
  try {
    return new URL(href).hostname.replace(/^www\./, "")
  } catch {
    return href
  }
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  if (Number.isNaN(d.getTime())) return dateStr
  return d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric", year: "numeric" })
}

function dateBlock(dateStr: string): { month: string; day: string } {
  const d = new Date(dateStr)
  if (Number.isNaN(d.getTime())) return { month: "—", day: "?" }
  return {
    month: d.toLocaleDateString(undefined, { month: "short" }).toUpperCase(),
    day: String(d.getDate()).padStart(2, "0"),
  }
}

function SectionHeading({
  icon: Icon,
  title,
  count,
  hint,
}: {
  icon: React.ElementType
  title: string
  count?: number
  hint?: string
}) {
  return (
    <div className="mb-4 flex flex-wrap items-center gap-2.5">
      <span className="flex size-8 items-center justify-center rounded-lg bg-primary/10">
        <Icon className="size-4 text-primary" strokeWidth={1.5} />
      </span>
      <h2 className="font-heading text-xl font-semibold text-foreground">{title}</h2>
      {typeof count === "number" && (
        <Badge variant="secondary" className="rounded-full">
          {count}
        </Badge>
      )}
      {hint && <span className="w-full text-xs text-muted-foreground sm:w-auto sm:ml-1">{hint}</span>}
    </div>
  )
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

function EventCard({ event, featured = false }: { event: ClubEvent; featured?: boolean }) {
  const { month, day } = dateBlock(event.date)
  const done = event.status === "completed"

  return (
    <Card className={cn("transition-all hover:-translate-y-0.5 motion-reduce:transition-none motion-reduce:hover:transform-none", done && "opacity-75")}>
      <CardContent className={cn("p-5", featured && "sm:p-6")}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
          {/* Date block */}
          <div
            aria-hidden
            className={cn(
              "flex shrink-0 items-center gap-3 sm:flex-col sm:gap-0 sm:rounded-xl sm:border sm:px-4 sm:py-2.5 sm:text-center",
              featured
                ? "sm:border-primary/25 sm:bg-primary/[0.07]"
                : "sm:border-border sm:bg-muted/50"
            )}
          >
            <span className="text-xs font-semibold uppercase tracking-widest text-primary">{month}</span>
            <span className="font-heading text-2xl font-bold leading-none text-foreground">{day}</span>
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className={cn("font-heading font-semibold text-foreground", featured ? "text-lg" : "text-[15px]")}>
                {event.name}
              </h3>
              <StatusBadge status={event.status} />
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
              <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-muted-foreground">
                {linkifyText(event.description).map((node, i) => (
                  <React.Fragment key={i}>{node}</React.Fragment>
                ))}
              </p>
            )}
            <div className="mt-3 border-t border-dashed pt-3">
              <EventTimer endTime={event.endTime} startTime={event.startTime} />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export interface ClubMembershipContext {
  signedIn: boolean
  isMember: boolean
  viewer: ViewerInfo | null
}

export function ClubDetailPage({
  data,
  membership,
}: {
  data: ClubDetailData
  membership?: ClubMembershipContext
}) {
  const { club, albums, achievements, events } = data
  const [members, setMembers] = React.useState(data.members)

  function handleMembershipChange(member: ClubMember | null) {
    setMembers((prev) => {
      if (member) {
        if (prev.some((m) => m.userId === member.userId && member.userId !== null)) return prev
        return [...prev, member]
      }
      if (!membership?.viewer) return prev
      return prev.filter((m) => m.userId !== membership.viewer!.userId)
    })
  }

  // Upcoming / live first (soonest first), completed last (most recent first).
  const sortedEvents = React.useMemo(() => {
    const rank = (s: string) => (s === "ongoing" ? 0 : s === "upcoming" ? 1 : 2)
    return [...events].sort((a, b) => {
      const r = rank(a.status) - rank(b.status)
      if (r !== 0) return r
      const at = new Date(a.date).getTime()
      const bt = new Date(b.date).getTime()
      if (Number.isNaN(at) || Number.isNaN(bt)) return 0
      return rank(a.status) === 2 ? bt - at : at - bt
    })
  }, [events])
  const nextEvent = sortedEvents.find((e) => e.status !== "completed")
  const pastEvents = sortedEvents.filter((e) => e.status === "completed")
  const upcomingEvents = sortedEvents.filter((e) => e.status !== "completed" && e.id !== nextEvent?.id)
  const totalImages = albums.reduce((n, a) => n + a.images.length, 0)

  // msgGroupUrl may hold multiple newline-separated URLs (dynamic inputs in manage form).
  const groupUrls = splitGroupUrls(club.msgGroupUrl).filter(Boolean)
  const links = [
    ...groupUrls.map((href, i) => ({
      href,
      icon: MessagesSquare,
      title: groupUrls.length > 1 ? `Chat group ${i + 1}` : "Chat group",
      hint: `Join the conversation · ${hostnameOf(href)}`,
    })),
    club.pageUrl && {
      href: club.pageUrl,
      icon: Globe,
      title: "Official page",
      hint: hostnameOf(club.pageUrl),
    },
    club.fbGroupUrl && {
      href: club.fbGroupUrl,
      icon: Share2,
      title: "Facebook group",
      hint: hostnameOf(club.fbGroupUrl),
    },
  ].filter(Boolean) as Array<{ href: string; icon: React.ElementType; title: string; hint: string }>

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
      <Link
        href="/clubs"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-sm mb-6"
      >
        <ArrowLeft className="size-4" strokeWidth={1.5} />
        All clubs
      </Link>

      {/* Hero — cover + overlapping logo */}
      <header className="overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--card-shadow)]">
        <div className="relative h-44 sm:h-60">
          {club.coverImgUrl ? (
            <img src={club.coverImgUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="relative h-full w-full overflow-hidden bg-[linear-gradient(135deg,#5B5FEF_0%,#8B5CF6_100%)]">
              <div aria-hidden className="absolute -right-10 -top-16 size-64 rounded-full bg-white/15 blur-2xl" />
              <div aria-hidden className="absolute -left-12 bottom-[-4rem] size-56 rounded-full bg-white/10 blur-2xl" />
              <span aria-hidden className="absolute bottom-2 right-6 font-heading text-[7rem] font-bold leading-none text-white/15 select-none">
                {club.name.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
          <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-black/45 via-black/5 to-transparent" />
          <div className="absolute left-4 top-4 sm:left-6">
            <span className="inline-flex items-center rounded-full border border-white/30 bg-white/15 px-3 py-1 text-xs font-medium text-white backdrop-blur-md">
              {club.department.name}
            </span>
          </div>
        </div>

        <div className="px-5 pb-5 sm:px-7 sm:pb-6">
          <div className="relative -mt-10 flex items-end gap-4 sm:-mt-12">
            {club.logoUrl ? (
              <img
                src={club.logoUrl}
                alt={`${club.name} logo`}
                className="size-20 shrink-0 rounded-2xl border border-border bg-card object-cover shadow-lg ring-4 ring-card sm:size-24"
              />
            ) : (
              <div
                aria-hidden
                className="flex size-20 shrink-0 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#5B5FEF_0%,#8B5CF6_100%)] font-heading text-3xl font-bold text-white shadow-lg ring-4 ring-card sm:size-24 sm:text-4xl"
              >
                {club.name.charAt(0).toUpperCase()}
              </div>
            )}
          </div>

          <div className="mt-3 flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="font-heading text-3xl font-bold tracking-tight text-foreground">
                {club.name}
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                {club.department.name} · {members.length} {members.length === 1 ? "member" : "members"} · {events.length} {events.length === 1 ? "event" : "events"}
              </p>
            </div>
            {membership && (
              <ClubJoinButton
                clubId={club.id}
                clubName={club.name}
                signedIn={membership.signedIn}
                initialIsMember={membership.isMember}
                viewer={membership.viewer}
                groupLinks={{
                  msgGroupUrl: club.msgGroupUrl ?? null,
                  pageUrl: club.pageUrl ?? null,
                  fbGroupUrl: club.fbGroupUrl ?? null,
                }}
                onMembershipChange={handleMembershipChange}
              />
            )}
          </div>

          {/* Quick stats */}
          <dl className="mt-4 grid grid-cols-3 gap-2.5 border-t pt-4 sm:max-w-md">
            {[
              { icon: Users, value: String(members.length), label: "Members" },
              { icon: CalendarDays, value: String(events.length), label: "Events" },
              { icon: Trophy, value: String(achievements.length), label: "Awards" },
            ].map((s) => (
              <div key={s.label} className="flex items-center gap-2.5 rounded-xl bg-muted/50 px-3 py-2">
                <s.icon className="size-4 shrink-0 text-primary" strokeWidth={1.5} />
                <div className="min-w-0 leading-tight">
                  <dt className="sr-only">{s.label}</dt>
                  <dd className="font-heading text-base font-bold text-foreground">{s.value}</dd>
                  <dd className="truncate text-[11px] text-muted-foreground">{s.label}</dd>
                </div>
              </div>
            ))}
          </dl>
        </div>
      </header>

      {/* Events — on top */}
      <section aria-labelledby="club-events" className="mt-10">
        <div id="club-events" className="scroll-mt-24">
          <SectionHeading icon={CalendarDays} title="Events" count={events.length} hint={nextEvent ? "Upcoming first" : undefined} />
        </div>
        {events.length === 0 ? (
          <p className="rounded-xl border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">
            No events yet — check back soon.
          </p>
        ) : (
          <div className="space-y-4">
            {nextEvent && (
              <div className="rounded-2xl bg-[linear-gradient(135deg,#5B5FEF_0%,#8B5CF6_100%)] p-[1.5px] shadow-[0_8px_28px_rgba(91,95,239,0.22)]">
                <div className="rounded-[calc(1rem-1px)] bg-card p-5 sm:p-6">
                  <div className="mb-3 flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1 rounded-full bg-[#F97066]/10 px-2.5 py-0.5 text-xs font-semibold text-[#B4443C] dark:bg-[#FB8A80]/10 dark:text-[#FB8A80]">
                      <Sparkles className="size-3.5" strokeWidth={1.5} />
                      {nextEvent.status === "ongoing" ? "Happening now" : "Up next"}
                    </span>
                    {nextEvent.place && (
                      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                        <MapPin className="size-3.5" strokeWidth={1.5} />
                        {nextEvent.place}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="min-w-0">
                      <h3 className="font-heading text-xl font-semibold text-foreground">{nextEvent.name}</h3>
                      <p className="mt-1 text-sm text-muted-foreground">{formatDate(nextEvent.date)}</p>
                      {nextEvent.description && (
                        <p className="mt-2 line-clamp-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
                          {linkifyText(nextEvent.description).map((node, i) => (
                            <React.Fragment key={i}>{node}</React.Fragment>
                          ))}
                        </p>
                      )}
                    </div>
                    <div className="shrink-0 rounded-xl border border-primary/20 bg-primary/[0.04] p-3 dark:bg-primary/[0.07]">
                      <EventTimer endTime={nextEvent.endTime} startTime={nextEvent.startTime} />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {upcomingEvents.length > 0 && (
              <div className="grid gap-4 md:grid-cols-2">
                {upcomingEvents.map((event) => (
                  <EventCard key={event.id} event={event} />
                ))}
              </div>
            )}

            {pastEvents.length > 0 && (
              <details className="group rounded-xl border bg-muted/30 px-4 py-3">
                <summary className="cursor-pointer list-none text-sm font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-md [&::-webkit-details-marker]:hidden">
                  <span className="inline-flex items-center gap-1.5">
                    <ChevronRight className="size-4 transition-transform group-open:rotate-90 motion-reduce:transition-none" strokeWidth={1.5} />
                    Past events ({pastEvents.length})
                  </span>
                </summary>
                <div className="grid gap-4 pt-4 md:grid-cols-2">
                  {pastEvents.map((event) => (
                    <EventCard key={event.id} event={event} />
                  ))}
                </div>
              </details>
            )}
          </div>
        )}
      </section>

      {/* About + Connect */}
      <div className="mt-10 grid gap-4 lg:grid-cols-3">
        <section aria-labelledby="club-about" className="lg:col-span-2">
          <Card className="h-full">
            <CardContent className="p-5 sm:p-6">
              <h2 id="club-about" className="font-heading text-xl font-semibold text-foreground">
                About
              </h2>
              <div className="mt-3">
                {club.description ? (
                  renderDescription(club.description)
                ) : (
                  <p className="text-sm italic text-muted-foreground">No description yet.</p>
                )}
              </div>
              {totalImages > 0 && (
                <p className="mt-4 inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Images className="size-3.5" strokeWidth={1.5} />
                  {totalImages} {totalImages === 1 ? "photo" : "photos"} in the gallery below
                </p>
              )}
            </CardContent>
          </Card>
        </section>

        <section aria-labelledby="club-connect">
          <Card className="h-full">
            <CardContent className="p-5 sm:p-6">
              <h2 id="club-connect" className="font-heading text-xl font-semibold text-foreground">
                Connect
              </h2>
              {links.length === 0 && !club.mail && !club.contacts ? (
                <p className="mt-3 text-sm italic text-muted-foreground">No links shared yet.</p>
              ) : (
                <ul className="mt-3 space-y-2">
                  {links.map((l, i) => (
                    <li key={`${l.href}-${i}`}>
                      <a
                        href={l.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group flex items-center gap-3 rounded-xl border border-border p-3 transition-colors hover:border-primary/40 hover:bg-primary/[0.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 motion-reduce:transition-none"
                      >
                        <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                          <l.icon className="size-4 text-primary" strokeWidth={1.5} />
                        </span>
                        <span className="min-w-0 flex-1 leading-tight">
                          <span className="block truncate text-sm font-medium text-foreground">{l.title}</span>
                          <span className="block truncate text-xs text-muted-foreground">{l.hint}</span>
                        </span>
                        <ChevronRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none" strokeWidth={1.5} />
                      </a>
                    </li>
                  ))}
                  {club.mail && (
                    <li>
                      <a
                        href={`mailto:${club.mail}`}
                        className="group flex items-center gap-3 rounded-xl border border-border p-3 transition-colors hover:border-primary/40 hover:bg-primary/[0.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 motion-reduce:transition-none"
                      >
                        <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                          <Mail className="size-4 text-primary" strokeWidth={1.5} />
                        </span>
                        <span className="min-w-0 flex-1 leading-tight">
                          <span className="block truncate text-sm font-medium text-foreground">Email</span>
                          <span className="block truncate text-xs text-muted-foreground">{club.mail}</span>
                        </span>
                        <ChevronRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none" strokeWidth={1.5} />
                      </a>
                    </li>
                  )}
                  {club.contacts && (
                    <li className="flex items-center gap-3 rounded-xl border border-border p-3">
                      <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                        <Phone className="size-4 text-primary" strokeWidth={1.5} />
                      </span>
                      <span className="min-w-0 flex-1 leading-tight">
                        <span className="block text-sm font-medium text-foreground">Contacts</span>
                        <span className="block whitespace-pre-line text-xs text-muted-foreground">{club.contacts}</span>
                      </span>
                    </li>
                  )}
                </ul>
              )}
            </CardContent>
          </Card>
        </section>
      </div>

      {/* Members */}
      <section aria-labelledby="club-members" className="mt-10">
        <div id="club-members" className="scroll-mt-24">
          <SectionHeading icon={Users} title="Members" count={members.length} />
        </div>
        <ClubMembers members={members} />
      </section>

      {/* Gallery */}
      <section aria-labelledby="club-gallery" className="mt-10">
        <div id="club-gallery" className="scroll-mt-24">
          <SectionHeading icon={Images} title="Gallery" count={totalImages} />
        </div>
        <ClubGallery albums={albums} />
      </section>

      {/* Achievements */}
      <section aria-labelledby="club-achievements" className="mt-10">
        <div id="club-achievements" className="scroll-mt-24">
          <SectionHeading icon={Trophy} title="Achievements" count={achievements.length} />
        </div>
        <ClubAchievements achievements={achievements} />
      </section>
    </main>
  )
}
