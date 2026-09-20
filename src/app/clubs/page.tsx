import { getDepartmentsWithClubs } from "@/lib/db/queries/clubs"
import { DepartmentGroup } from "@/components/clubs/DepartmentGroup"
import { EmptyState } from "@/components/shared/EmptyState"
import { FolderOpen } from "lucide-react"

export default async function ClubsPage() {
  const groups = await getDepartmentsWithClubs()
  const totalClubs = groups.reduce((n, g) => n + g.clubs.length, 0)

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
      <div className="mb-8">
        <h1 className="font-heading text-3xl font-bold tracking-tight text-foreground">
          Student Clubs
        </h1>
        <p className="mt-1.5 text-muted-foreground">
          {groups.length === 0
            ? "Browse clubs organized by department"
            : `${totalClubs} ${totalClubs === 1 ? "club" : "clubs"} across ${groups.length} ${groups.length === 1 ? "department" : "departments"}`}
        </p>
      </div>

      {groups.length === 0 ? (
        <EmptyState
          title="No departments yet"
          description="Clubs will appear here once departments are created."
          icon={<FolderOpen className="size-8" />}
        />
      ) : (
        <div className="space-y-10">
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
