"use client"

import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { ArrowUpRight } from "lucide-react"
import { type clubs } from "@/lib/db/schema"
import { linkifyText } from "@/lib/linkify"

export function ClubCard({ club }: { club: typeof clubs.$inferSelect }) {
  return (
    <Link
      href={`/clubs/${club.id}`}
      className="rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
    >
      <Card className="group flex h-full flex-col overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[var(--card-shadow-hover)] motion-reduce:transition-none motion-reduce:transform-none motion-reduce:hover:translate-y-0">
        {/* Cover banner */}
        <div className="relative h-20 shrink-0 overflow-hidden bg-muted">
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
            </div>
          )}
          <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-black/25 to-transparent" />
        </div>

        <CardContent className="flex flex-1 flex-col p-5 pt-0">
          <div className="-mt-7 mb-2.5 flex items-end justify-between gap-2">
            {club.logoUrl ? (
              <img
                src={club.logoUrl}
                alt={`${club.name} logo`}
                loading="lazy"
                className="size-14 rounded-xl border border-border bg-card object-cover shadow-md ring-4 ring-card"
              />
            ) : (
              <div
                aria-hidden
                className="flex size-14 items-center justify-center rounded-xl bg-[linear-gradient(135deg,#5B5FEF_0%,#8B5CF6_100%)] font-heading text-xl font-bold text-white shadow-md ring-4 ring-card"
              >
                {club.name.charAt(0).toUpperCase()}
              </div>
            )}
            <span className="mb-0.5 flex size-8 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors group-hover:border-primary/40 group-hover:bg-primary/10 group-hover:text-primary">
              <ArrowUpRight className="size-4" strokeWidth={1.5} />
            </span>
          </div>

          <h3 className="font-heading font-semibold text-foreground transition-colors group-hover:text-primary line-clamp-1">
            {club.name}
          </h3>
          {club.description && (
            <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
              {/* stopPropagation: description URLs open externally
                  instead of triggering the wrapping card link. */}
              <span onClick={(e) => e.stopPropagation()}>
                {linkifyText(club.description).map((node, i) => (
                  <span key={i}>{node}</span>
                ))}
              </span>
            </p>
          )}
        </CardContent>
      </Card>
    </Link>
  )
}
