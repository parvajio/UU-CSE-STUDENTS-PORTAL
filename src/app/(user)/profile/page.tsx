import type { Metadata } from "next"
import { getAllSkills } from "@/lib/db/queries/skills"
import { getCurrentBatch } from "@/lib/db/queries/site-config"
import { ProfileForm } from "@/components/directory/ProfileForm"
import { getMyProfile } from "./actions"
import { getMyPortfolio } from "./portfolio-actions"
import { ProfileView } from "./ProfileView"

export const metadata: Metadata = {
  title: "My Profile",
}

export default async function ProfilePage() {
  const [profile, skills, currentBatch, portfolio] = await Promise.all([
    getMyProfile(),
    getAllSkills(),
    getCurrentBatch(),
    getMyPortfolio(),
  ])

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6">
      <div className="mb-8">
        <h1 className="font-heading text-3xl font-semibold text-foreground">
          My Profile
        </h1>
        <p className="mt-2 text-muted-foreground">
          Your profile powers your entry in the Student Expert Directory.
        </p>
      </div>

      {profile ? (
        <ProfileView
          profile={profile}
          skills={skills}
          currentBatch={currentBatch}
          portfolio={portfolio}
        />
      ) : (
        <ProfileForm skills={skills} currentBatch={currentBatch} />
      )}
    </main>
  )
}
