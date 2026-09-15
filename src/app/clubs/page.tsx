import { notFound } from "next/navigation"
import { getDepartmentsWithClubs } from "@/lib/db/queries/clubs"
import { DepartmentGroup } from "@/components/clubs/DepartmentGroup"
import { EmptyState } from "@/components/shared/EmptyState"
import { FolderOpen } from "lucide-react"

export default async function ClubsPage() {
  const groups = await getDepartmentsWithClubs()

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
      <div className="mb-8">
        <h1 className="font-heading text-3xl font-bold text-foreground">
          Student Clubs
        </h1>
        <p className="mt-2 text-muted-foreground">
          Browse clubs organized by department
        </p>
      </div>

      {groups.length === 0 ? (
        <EmptyState
          title="No departments yet"
          description="Clubs will appear here once departments are created."
          icon={<FolderOpen className="size-8" />}
        />
      ) : (
        <div className="space-y-12">
          {groups.map(({ department, clubs }) => (
            <DepartmentGroup
              key={department.id}
              department={department}
              clubList={clubs}
            />
          ))}
        </div>
      )}
    </main>
  )
}
