import Link from "next/link"
import { ArrowRight, Lock } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent } from "@/components/ui/card"
import { SkillTag } from "./SkillTag"
import { ProfileSocials } from "./ProfileSocials"
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

export function ProfileCard({
  profile,
  viewerRole = "guest",
}: {
  profile: ProfileCardData
  viewerRole?: string
}) {
  const isGuest = viewerRole === "guest"
  const mainSkills = profile.skills.filter((skill) => !skill.parentSkillId && !skill.isCustom)

  if (isGuest) {
    return (
      <Card className="relative overflow-hidden border-border/60 bg-card/60 backdrop-blur-sm transition-all duration-200">
        <div className="h-16 bg-gradient-to-r from-primary/15 via-primary/5 to-transparent" />
        <CardContent className="relative px-5 pb-5 pt-0">
          <div className="-mt-7 mb-3 flex items-end justify-between">
            <Avatar className="size-14 border-2 border-background shadow-md">
              <AvatarFallback className="text-sm font-medium">
                {initials(profile.fullName)}
              </AvatarFallback>
            </Avatar>
          </div>
          <div className="min-w-0">
            <h3 className="truncate font-heading text-base font-semibold text-foreground">
              {profile.fullName}
            </h3>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Batch {profile.batchNumber}
            </p>
            {mainSkills.length > 0 ? (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {mainSkills.map((skill) => (
                  <SkillTag key={skill.id} skill={skill} />
                ))}
              </div>
            ) : null}
            <div className="mt-4 flex items-center gap-1.5 text-xs font-medium text-muted-foreground pt-2 border-t border-border/40">
              <Lock className="size-3.5" strokeWidth={1.5} />
              <span>Log in to view full profile</span>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  const authedProfile = profile as Extract<ProfileCardData, { avatarUrl: string | null }>

  return (
    <Card className="relative h-full overflow-hidden border-border/80 bg-card transition-all duration-200 hover:-translate-y-1 hover:border-primary/40 hover:shadow-[var(--card-shadow-hover)] motion-reduce:translate-y-0 motion-reduce:transition-none group">
      <Link
        href={`/experts/${profile.id}`}
        className="absolute inset-0 z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        aria-label={`View profile for ${authedProfile.fullName}`}
      />
      <div className="h-20 bg-gradient-to-r from-primary/20 via-primary/10 to-accent/20" />
      <CardContent className="relative px-5 pb-5 pt-0">
        <div className="-mt-8 mb-3 flex items-end justify-between">
          <Avatar className="size-16 border-2 border-background shadow-md">
            {authedProfile.avatarUrl ? (
              <AvatarImage src={authedProfile.avatarUrl} alt={authedProfile.fullName} />
            ) : null}
            <AvatarFallback className="text-base font-medium">
              {initials(authedProfile.fullName)}
            </AvatarFallback>
          </Avatar>
          {authedProfile.isAlumni ? (
            <span className="soft-tag soft-tag--default px-2 py-0.5 text-xs font-medium relative z-20">
              Alumni
            </span>
          ) : null}
        </div>

        <div className="min-w-0">
          <h3 className="truncate font-heading text-base font-semibold text-foreground group-hover:text-primary transition-colors">
            {authedProfile.fullName}
          </h3>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Batch {authedProfile.batchNumber}
            {authedProfile.section ? ` · Section ${authedProfile.section}` : ""}
          </p>

          {authedProfile.bio ? (
            <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">
              {authedProfile.bio}
            </p>
          ) : null}

          {mainSkills.length > 0 ? (
            <div className="mt-3 flex flex-wrap gap-1.5 relative z-20">
              {mainSkills.map((skill) => (
                <SkillTag key={skill.id} skill={skill} />
              ))}
            </div>
          ) : null}

          <div className="mt-4 flex items-center justify-between pt-3 border-t border-border/40 relative z-20">
            <ProfileSocials
              facebookUrl={authedProfile.facebookUrl}
              linkedinUrl={authedProfile.linkedinUrl}
              githubUrl={authedProfile.githubUrl}
              portfolioUrl={authedProfile.portfolioUrl}
              whatsappNumber={authedProfile.whatsappNumber}
            />
            <span className="inline-flex items-center gap-1 rounded-md bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
              View profile <ArrowRight className="size-3 transition-transform group-hover:translate-x-0.5" strokeWidth={2} />
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
