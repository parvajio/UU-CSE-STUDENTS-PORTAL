import type { Metadata } from "next"
import Link from "next/link"
import { ClipboardList, Pencil } from "lucide-react"
import { Button } from "@/components/ui/button"
import { EmptyState } from "@/components/shared/EmptyState"
import { ProfileDetail } from "@/components/directory/ProfileDetail"
import { StatusBadge } from "@/components/approval/StatusBadge"
import { getMyProfile } from "../profile/actions"

export const metadata: Metadata = {
  title: "My Submissions",
}

export default async function MySubmissionsPage() {
  const profile = await getMyProfile()

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6">
      <div className="mb-8">
        <h1 className="font-heading text-3xl font-semibold text-foreground">
          My Submissions
        </h1>
        <p className="mt-2 text-muted-foreground">
          Track the review status of everything you&apos;ve submitted.
        </p>
      </div>

      {profile ? (
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <StatusBadge status={profile.status} />
            <Button asChild variant="outline" size="sm">
              <Link href="/profile">
                <Pencil className="size-4" strokeWidth={1.5} />
                Edit
              </Link>
            </Button>
          </div>
          <ProfileDetail profile={profile} />
        </div>
      ) : (
        <EmptyState
          title="No submissions yet"
          description="Create your profile and it will show up here once it's submitted for review."
          icon={<ClipboardList className="size-8" strokeWidth={1.5} />}
          action={
            <Button asChild>
              <Link href="/profile">Create your profile</Link>
            </Button>
          }
        />
      )}
    </main>
  )
}
