"use client"

import { useState } from "react"
import { Pencil } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ProfileDetail } from "@/components/directory/ProfileDetail"
import { ProfileForm } from "@/components/directory/ProfileForm"
import type { FlatSkill } from "@/lib/db/queries/skills"
import type { MyProfile } from "./actions"

export function ProfileView({
  profile,
  skills,
}: {
  profile: MyProfile
  skills: FlatSkill[]
}) {
  const [editing, setEditing] = useState(false)

  if (editing) {
    return (
      <ProfileForm skills={skills} initial={profile} onSuccess={() => setEditing(false)} />
    )
  }

  return (
    <div className="flex flex-col gap-4">
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
