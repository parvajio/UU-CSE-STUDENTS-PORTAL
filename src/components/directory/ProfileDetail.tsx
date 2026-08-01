import Link from "next/link"
import {
  Building2,
  Code2,
  Contact,
  Globe,
  Link2,
  MessageCircle,
} from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent } from "@/components/ui/card"
import { StatusBadge } from "@/components/approval/StatusBadge"
import { SkillTag } from "@/components/directory/SkillTag"
import type { MyProfile } from "@/app/(user)/profile/actions"

function initials(fullName: string): string {
  return fullName
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0))
    .join("")
    .toUpperCase()
}

type SocialLink = {
  label: string
  value: string
  href?: string
  icon: typeof Link2
}

export function ProfileDetail({ profile }: { profile: MyProfile }) {
  const socials: SocialLink[] = [
    ...(profile.linkedinUrl
      ? [
          {
            label: "LinkedIn",
            value: profile.linkedinUrl,
            href: profile.linkedinUrl,
            icon: Contact,
          },
        ]
      : []),
    ...(profile.githubUrl
      ? [
          {
            label: "GitHub",
            value: profile.githubUrl,
            href: profile.githubUrl,
            icon: Code2,
          },
        ]
      : []),
    ...(profile.portfolioUrl
      ? [
          {
            label: "Portfolio",
            value: profile.portfolioUrl,
            href: profile.portfolioUrl,
            icon: Globe,
          },
        ]
      : []),
    ...(profile.facebookUrl
      ? [
          {
            label: "Facebook",
            value: profile.facebookUrl,
            href: profile.facebookUrl,
            icon: Link2,
          },
        ]
      : []),
    ...(profile.whatsappNumber
      ? [{ label: "WhatsApp", value: profile.whatsappNumber, icon: MessageCircle }]
      : []),
  ]

  return (
    <Card>
      <CardContent className="flex flex-col gap-5 p-6">
        <div className="flex items-start gap-4">
          <Avatar className="size-16">
            {profile.avatarUrl ? (
              <AvatarImage src={profile.avatarUrl} alt={profile.fullName} />
            ) : null}
            <AvatarFallback className="text-lg">
              {initials(profile.fullName)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="truncate font-heading text-xl font-semibold text-foreground">
                {profile.fullName}
              </h2>
              <StatusBadge status={profile.status} />
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              Batch {profile.batchNumber}
              {profile.section ? ` · Section ${profile.section}` : ""}
            </p>
            {profile.studentId ? (
              <p className="mt-1 text-sm text-muted-foreground">
                Student ID: {profile.studentId}
              </p>
            ) : null}
            {profile.isAlumni ? (
              <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
                <Building2 className="size-4" strokeWidth={1.5} />
                {profile.currentCompany ?? "Alumnus"}
                {profile.jobPosition ? ` · ${profile.jobPosition}` : ""}
              </p>
            ) : null}
          </div>
        </div>

        {profile.bio ? (
          <p className="whitespace-pre-line text-sm text-foreground">{profile.bio}</p>
        ) : null}

        {profile.skills.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {profile.skills.map((skill) => (
              <SkillTag key={skill.id} skill={skill} />
            ))}
          </div>
        ) : null}

        {socials.length > 0 ? (
          <div className="flex flex-wrap gap-3">
            {socials.map((social) => {
              const Icon = social.icon
              return (
                <div
                  key={social.label}
                  className="flex items-center gap-1.5 text-sm text-muted-foreground"
                >
                  <Icon className="size-4" strokeWidth={1.5} />
                  {social.href ? (
                    <Link
                      href={social.href}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="underline-offset-4 transition-colors hover:text-foreground hover:underline"
                    >
                      {social.label}
                    </Link>
                  ) : (
                    <span className="flex items-center gap-1.5">
                      {social.label}: {social.value}
                    </span>
                  )}
                </div>
              )
            })}
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}
