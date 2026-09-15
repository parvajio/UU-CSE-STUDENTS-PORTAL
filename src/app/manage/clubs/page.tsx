import { auth } from "@/lib/auth/auth"
import { redirect } from "next/navigation"
import { ShieldCheck } from "lucide-react"
import { getDepartmentsWithClubs } from "@/lib/db/queries/clubs"
import { ManageClubsClient } from "@/components/clubs/ManageClubsClient"

export default async function ManageClubsPage() {
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
        <div className="flex items-center gap-3 mb-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold">
            <ShieldCheck className="w-3.5 h-3.5" />
            Admin Management
          </span>
        </div>
        <h1 className="font-heading text-3xl font-bold text-foreground">
          Club Management
        </h1>
        <p className="text-muted-foreground mt-1">
          Manage departments, clubs, members, gallery, achievements, and events.
        </p>
      </div>

      <ManageClubsClient departments={departments} />
    </main>
  )
}
