"use client"

import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { ArrowUpRight, MessagesSquare, Globe, Share2 } from "lucide-react"
import { type clubs } from "@/lib/db/schema"
import { linkifyText } from "@/lib/linkify"

export function ClubCard({
  club,
  departmentName,
}: {
  club: typeof clubs.$inferSelect
  departmentName?: string
}) {
  const availableLinks = [
    club.msgGroupUrl && { icon: MessagesSquare, label: "Chat group" },
    club.pageUrl && { icon: Globe, label: "Official page" },
    club.fbGroupUrl && { icon: Share2, label: "Facebook group" },
  ].filter(Boolean) as Array<{ icon: typeof Globe; label: string }>

  return (
    <Link
      href={`/clubs/${club.id}`}
      aria-label={`View ${club.name}`}
      className="rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
    >
      <Card className="group flex h-full flex-col transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(91,95,239,0.12),0_2px_6px_rgba(91,95,239,0.08)] motion-reduce:transition-none motion-reduce:hover:transform-none">
        {/* Cover banner */}
        <div className="relative h-24 shrink-0 overflow-hidden bg-muted">
          {club.coverImgUrl ? (
            <img
              src={club.coverImgUrl}
              alt=""
              loading="lazy"
              className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-[1.04] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
            />
          ) : (
            <div aria-hidden className="relative h-full w-full bg-[linear-gradient(135deg,#5B5FEF_0%,#8B5CF6_100%)]">
              <div className="absolute -right-6 -top-10 size-32 rounded-full bg-white/15 blur-xl" />
              <div className="absolute -left-8 bottom-[-2.5rem] size-28 rounded-full bg-white/10 blur-xl" />
              <span
                aria-hidden
                className="absolute bottom-0 right-4 font-heading text-6xl font-bold leading-none text-white/15 select-none"
              >
                {club.name.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
          <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-black/25 to-transparent" />
          {departmentName && (
            <span className="absolute left-3 top-3 inline-flex max-w-[70%] items-center truncate rounded-full border border-white/30 bg-black/30 px-2.5 py-0.5 text-[11px] font-medium text-white backdrop-blur-md">
              {departmentName}
            </span>
          )}
        </div>

        <CardContent className="flex flex-1 flex-col p-5 pt-0">
          {/* Logo straddles the cover — half on, half out */}
          <div className="relative z-10 -mt-7 mb-3">
            {club.logoUrl ? (
              <img
                src={club.logoUrl}
                alt={`${club.name} logo`}
                loading="lazy"
                className="size-14 rounded-2xl border border-border bg-card object-cover shadow-md ring-4 ring-card"
              />
            ) : (
              <div
                aria-hidden
                className="flex size-14 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#5B5FEF_0%,#8B5CF6_100%)] font-heading text-xl font-bold text-white shadow-md ring-4 ring-card"
              >
                {club.name.charAt(0).toUpperCase()}
              </div>
            )}
          </div>

          <h3 className="font-heading text-[17px] font-semibold leading-snug text-foreground transition-colors group-hover:text-primary line-clamp-1">
            {club.name}
          </h3>
          {club.description ? (
            <p className="mb-4 mt-1 text-sm leading-relaxed text-muted-foreground line-clamp-2">
              {/* stopPropagation: description URLs open externally
                  instead of triggering the wrapping card link. */}
              <span onClick={(e) => e.stopPropagation()}>
                {linkifyText(club.description).map((node, i) => (
                  <span key={i}>{node}</span>
                ))}
              </span>
            </p>
          ) : (
            <p className="mb-4 mt-1 text-sm italic text-muted-foreground/70">
              No description yet — tap to see more.
            </p>
          )}

          {/* Standard footer: where to find the club + view affordance */}
          <div className="mt-auto flex items-center justify-between gap-2 border-t border-border pt-3">
            <div className="flex items-center gap-1.5">
              {availableLinks.length > 0 ? (
                availableLinks.map((l, i) => (
                  <span
                    key={i}
                    title={l.label}
                    aria-label={l.label}
                    className="flex size-7 items-center justify-center rounded-lg bg-primary/[0.07] text-primary"
                  >
                    <l.icon className="size-3.5" strokeWidth={1.5} />
                  </span>
                ))
              ) : (
                <span className="text-xs text-muted-foreground/70">Links coming soon</span>
              )}
            </div>
            <span className="inline-flex shrink-0 items-center gap-0.5 text-sm font-medium text-primary">
              View
              <ArrowUpRight
                className="size-4 transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 motion-reduce:transition-none motion-reduce:group-hover:translate-x-0 motion-reduce:group-hover:translate-y-0"
                strokeWidth={1.5}
              />
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
