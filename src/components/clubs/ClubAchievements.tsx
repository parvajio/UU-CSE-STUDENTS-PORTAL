import { ArrowUpRight, Trophy } from "lucide-react"
import React from "react"
import { linkifyText } from "@/lib/linkify"

interface Achievement {
  id: string
  title: string
  description?: string | null
  date?: string | null
  imageUrl?: string | null
  linkUrl?: string | null
}

export function ClubAchievements({ achievements }: { achievements: Achievement[] }) {
  if (achievements.length === 0) {
    return (
      <div className="rounded-xl border border-dashed px-4 py-8 text-center text-muted-foreground text-sm">
        No achievements yet.
      </div>
    )
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {achievements.map((achievement) => (
        <article
          key={achievement.id}
          className="overflow-hidden rounded-xl bg-card border border-border shadow-[var(--card-shadow)] transition-all hover:-translate-y-0.5 hover:shadow-[var(--card-shadow-hover)] motion-reduce:transition-none motion-reduce:hover:transform-none"
        >
          {achievement.imageUrl && (
            <div className="relative">
              <img
                src={achievement.imageUrl}
                alt={achievement.title}
                loading="lazy"
                className="w-full h-36 object-cover"
              />
              <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-black/25 to-transparent" />
            </div>
          )}
          <div className="p-4">
            <div className="flex items-start gap-2.5">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-amber-500/10">
                <Trophy className="size-4 text-amber-600 dark:text-amber-400" strokeWidth={1.5} />
              </span>
              <div className="min-w-0">
                <h4 className="font-heading text-[15px] font-semibold text-foreground">
                  {achievement.title}
                </h4>
                {achievement.date && (
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {new Date(achievement.date).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                  </p>
                )}
              </div>
            </div>
            {achievement.description && (
              <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-muted-foreground">
                {linkifyText(achievement.description).map((node, i) => (
                  <React.Fragment key={i}>{node}</React.Fragment>
                ))}
              </p>
            )}
            {achievement.linkUrl && (
              <a
                href={achievement.linkUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2.5 inline-flex items-center gap-1 text-[13px] font-medium text-primary hover:underline focus-visible:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 rounded-sm"
              >
                View details
                <ArrowUpRight className="size-3.5" strokeWidth={1.5} />
              </a>
            )}
          </div>
        </article>
      ))}
    </div>
  )
}
