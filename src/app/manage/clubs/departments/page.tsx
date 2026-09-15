import { auth } from "@/lib/auth/auth"
import { redirect } from "next/navigation"
import { getDepartmentsWithClubs } from "@/lib/db/queries/clubs"
import { ManageClubsClient } from "@/components/clubs/ManageClubsClient"

export default async function ManageDepartmentsPage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")
  if (session.user.role !== "admin") redirect("/")

  const groups = await getDepartmentsWithClubs()
  const departments = groups.map((g) => ({
    id: g.department.id,
    name: g.department.name,
    slug: g.department.slug,
    description: g.department.description,
    clubs: g.clubs.map((c) => ({ id: c.id, name: c.name, description: c.description })),
  }))

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
      <div className="mb-8">
        <h1 className="font-heading text-3xl font-bold text-foreground">
          Departments
        </h1>
        <p className="text-muted-foreground mt-1">
          Create and manage academic departments.
        </p>
      </div>

      <ManageClubsClient departments={departments} />
    </main>
  )
}
