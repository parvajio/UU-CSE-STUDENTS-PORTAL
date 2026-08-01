"use client"

import { useState } from "react"
import { Clock, Pencil } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ProfileDetail } from "@/components/directory/ProfileDetail"
import { ProfileForm } from "@/components/directory/ProfileForm"
import type { FlatSkill } from "@/lib/db/queries/skills"
import type { MyProfile } from "./actions"

export function ProfileView({
  profile,
  skills,
  currentBatch,
}: {
  profile: MyProfile
  skills: FlatSkill[]
  currentBatch: number
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

  return (
    <div className="flex flex-col gap-4">
      {profile.status === "pending" ? (
        <div className="flex items-start gap-3 rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-700 dark:text-amber-300">
          <Clock className="mt-0.5 size-4 shrink-0" strokeWidth={1.5} />
          <p>
            Your profile is under review. It will be hidden from the directory
            until an admin approves it.
          </p>
        </div>
      ) : null}
      <div className="flex justify-end">
        <Button variant="outline" onClick={() => setEditing(true)}>
          <Pencil className="size-4" strokeWidth={1.5} />
          Edit Profile
        </Button>
      </div>
      <ProfileDetail profile={profile} />
    </div>
  )
}
