import Link from "next/link"
import { ArrowLeft, Building2, IdCard } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ProfileSocials } from "@/components/directory/ProfileSocials"
import { ProfilePortfolioSections } from "@/components/directory/ProfilePortfolioSections"
import type { ProfileDetail as ProfileDetailType } from "@/lib/db/queries/directory"

function initials(fullName: string): string {
  return fullName
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0))
    .join("")
    .toUpperCase()
}

export function ProfileDetailView({ profile }: { profile: ProfileDetailType }) {
  return (
    <div className="min-h-screen bg-background pb-16">
      {/* Hero Banner Region */}
      <div className="relative h-48 sm:h-60 w-full bg-gradient-to-r from-[#5B5FEF] via-[#7C3AED] to-[#8B5CF6] overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.15),transparent_60%)]" />
        <div className="mx-auto max-w-6xl px-4 sm:px-6 pt-6">
          <Link
            href="/experts"
            className="inline-flex items-center gap-1.5 rounded-full bg-background/20 backdrop-blur-md px-3.5 py-1.5 text-xs font-medium text-white transition-colors hover:bg-background/35"
          >
            <ArrowLeft className="size-3.5" strokeWidth={1.5} />
            Back to Experts
          </Link>
        </div>
      </div>

      {/* Main Content Container */}
      <div className="mx-auto max-w-6xl px-4 sm:px-6 -mt-16 sm:-mt-20 relative z-10 space-y-8">
        {/* Glass Identity Card */}
        <div className="rounded-3xl border border-white/20 bg-card/80 backdrop-blur-xl p-6 sm:p-8 shadow-xl">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
            <Avatar className="size-24 sm:size-28 border-4 border-background shadow-lg">
              {profile.avatarUrl ? (
                <AvatarImage src={profile.avatarUrl} alt={profile.fullName} />
              ) : null}
              <AvatarFallback className="text-2xl font-bold">
                {initials(profile.fullName)}
              </AvatarFallback>
            </Avatar>

            <div className="min-w-0 flex-1 space-y-2">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="font-heading text-2xl sm:text-3xl font-bold text-foreground">
                  {profile.fullName}
                </h1>
                {profile.isAlumni ? (
                  <span className="soft-tag soft-tag--default px-2.5 py-1 text-xs font-semibold">
                    Alumni
                  </span>
                ) : null}
              </div>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-1 font-medium text-foreground">
                  Batch {profile.batchNumber}
                  {profile.section ? ` · Section ${profile.section}` : ""}
                </span>
                {profile.studentId ? (
                  <span className="inline-flex items-center gap-1">
                    <IdCard className="size-4" strokeWidth={1.5} />
                    SID: {profile.studentId}
                  </span>
                ) : null}
                {profile.isAlumni && profile.currentCompany ? (
                  <span className="inline-flex items-center gap-1 font-medium text-foreground">
                    <Building2 className="size-4 text-primary" strokeWidth={1.5} />
                    {profile.jobPosition ? `${profile.jobPosition} at ` : ""}
                    {profile.currentCompany}
                  </span>
                ) : null}
              </div>

              <div className="pt-2">
                <ProfileSocials
                  facebookUrl={profile.facebookUrl}
                  linkedinUrl={profile.linkedinUrl}
                  githubUrl={profile.githubUrl}
                  portfolioUrl={profile.portfolioUrl}
                  whatsappNumber={profile.whatsappNumber}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Portfolio & About Body (Projects on top of Experience, Core Skills & Subskills in right column) */}
        <div className="mt-8">
          <ProfilePortfolioSections profile={profile} />
        </div>
      </div>
    </div>
  )
}
