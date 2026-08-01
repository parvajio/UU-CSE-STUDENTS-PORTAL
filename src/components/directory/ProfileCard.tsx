import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent } from "@/components/ui/card"
import { SkillTag } from "./SkillTag"
import type { ProfileCard as ProfileCardData } from "@/lib/db/queries/directory"

function initials(fullName: string): string {
  return fullName
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0))
    .join("")
    .toUpperCase()
}

export function ProfileCard({ profile }: { profile: ProfileCardData }) {
  const isAuthed = "avatarUrl" in profile

  return (
    <Card className="transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_4px_16px_rgba(0,0,0,0.06)]">
      <CardContent className="flex items-start gap-4 p-5">
        {isAuthed && profile.avatarUrl ? (
          <Avatar className="mt-0.5">
            <AvatarImage src={profile.avatarUrl} alt={profile.fullName} />
            <AvatarFallback>{initials(profile.fullName)}</AvatarFallback>
          </Avatar>
        ) : null}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="truncate font-heading text-base font-semibold text-foreground">
              {profile.fullName}
            </h3>
            {isAuthed && profile.isAlumni ? (
              <span className="soft-tag soft-tag--default px-2 py-0.5 text-xs">Alumni</span>
            ) : null}
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Batch {profile.batchNumber}
            {isAuthed && profile.section ? ` · Section ${profile.section}` : ""}
          </p>
          {profile.skills.length > 0 ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {profile.skills.map((skill) => (
                <SkillTag key={skill.id} skill={skill} />
              ))}
            </div>
          ) : null}
        </div>
      </CardContent>
    </Card>
  )
}
