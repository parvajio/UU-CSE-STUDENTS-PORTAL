import { getDepartmentsWithClubs } from "@/lib/db/queries/clubs"
import { ClubsExplorer } from "@/components/clubs/ClubsExplorer"
import { EmptyState } from "@/components/shared/EmptyState"
import { FolderOpen } from "lucide-react"

export default async function ClubsPage() {
  const groups = await getDepartmentsWithClubs()

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
      {groups.length === 0 ? (
        <>
          <div className="mb-8">
            <h1 className="font-heading text-3xl font-bold tracking-tight text-foreground">
              Student Clubs
            </h1>
            <p className="mt-1.5 text-muted-foreground">
              Browse clubs organized by department
            </p>
          </div>
          <EmptyState
            title="No departments yet"
            description="Clubs will appear here once departments are created."
            icon={<FolderOpen className="size-8" />}
          />
        </>
      ) : (
        <ClubsExplorer groups={groups} />
      )}
    </main>
  )
}
