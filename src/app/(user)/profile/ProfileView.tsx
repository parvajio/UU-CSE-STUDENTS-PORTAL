"use client"

import { useState } from "react"
import { Clock, Pencil, Eye } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ProfileDetail } from "@/components/directory/ProfileDetail"
import { ProfilePortfolioSections } from "@/components/directory/ProfilePortfolioSections"
import { ProfileForm } from "@/components/directory/ProfileForm"
import { PortfolioManager } from "./PortfolioManager"
import type { FlatSkill } from "@/lib/db/queries/skills"
import type { MyProfile } from "./actions"
import type { ProfilePortfolio } from "@/types/portfolio"

export function ProfileView({
  profile,
  skills,
  currentBatch,
  portfolio,
}: {
  profile: MyProfile
  skills: FlatSkill[]
  currentBatch: number
  portfolio: ProfilePortfolio
}) {
  const [editing, setEditing] = useState(false)

  if (editing) {
    return (
      <ProfileForm
        skills={skills}
        initial={profile}
        currentBatch={currentBatch}
        onSuccess={() => setEditing(false)}
      />
    )
  }

  const profileDetail = {
    ...profile,
    skills: profile.skills.map((s) => ({ ...s, colorKey: s.colorKey ?? null })),
    achievements: portfolio.achievements,
    projects: portfolio.projects,
    certificates: portfolio.certificates,
    experiences: portfolio.experiences,
  }

  return (
    <div className="flex flex-col gap-8">
      {profile.status === "pending" ? (
        <div className="flex items-start gap-3 rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-700 dark:text-amber-300">
          <Clock className="mt-0.5 size-4 shrink-0" strokeWidth={1.5} />
          <div>
            <p className="font-medium">Profile under review (Draft mode)</p>
            <p className="mt-0.5">
              Your profile is currently pending approval. Below is your live draft preview of how it will appear once approved.
            </p>
          </div>
        </div>
      ) : null}

      <div className="flex justify-end">
        <Button variant="outline" onClick={() => setEditing(true)}>
          <Pencil className="size-4 mr-1.5" strokeWidth={1.5} />
          Edit Profile Details
        </Button>
      </div>

      {/* Profile Details & Draft Preview */}
      <div className="space-y-6">
        <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground uppercase tracking-wider">
          <Eye className="size-4" strokeWidth={1.5} />
          {profile.status === "pending" ? "Draft Public Layout Preview" : "Profile Summary"}
        </div>
        <ProfileDetail profile={profile} />
        <div className="pt-4">
          <h3 className="font-heading text-lg font-semibold text-foreground mb-4">Portfolio Preview</h3>
          <ProfilePortfolioSections profile={profileDetail} />
        </div>
      </div>

      {/* Portfolio Manager (CRUD) */}
      <PortfolioManager portfolio={portfolio} />
    </div>
  )
}
