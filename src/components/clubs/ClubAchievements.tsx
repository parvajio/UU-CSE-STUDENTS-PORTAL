import { LinkIcon } from "lucide-react"

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
      <div className="text-center py-8 text-muted-foreground text-sm">
        No achievements yet.
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <h3 className="font-heading text-lg font-semibold text-foreground">
        Achievements
      </h3>
      <div className="grid gap-4 sm:grid-cols-2">
        {achievements.map((achievement) => (
          <div
            key={achievement.id}
            className="p-4 rounded-xl bg-surface border border-border"
          >
            {achievement.imageUrl && (
              <img
                src={achievement.imageUrl}
                alt={achievement.title}
                className="w-full h-32 object-cover rounded-lg mb-3"
              />
            )}
            <h4 className="font-heading font-semibold text-foreground">
              {achievement.title}
            </h4>
            {achievement.description && (
              <p className="mt-1 text-sm text-muted-foreground">
                {achievement.description}
              </p>
            )}
            {achievement.date && (
              <p className="mt-1 text-xs text-muted-foreground">
                {new Date(achievement.date).toLocaleDateString()}
              </p>
            )}
            {achievement.linkUrl && (
              <a
                href={achievement.linkUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-primary hover:underline mt-2"
              >
                <LinkIcon className="size-3" />
                View Details
              </a>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
