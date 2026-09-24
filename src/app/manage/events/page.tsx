import { auth } from "@/lib/auth/auth"
import { redirect } from "next/navigation"
import { CalendarDays } from "lucide-react"
import { getApprovedClubs, getEventsForPage } from "@/lib/db/queries/clubs"
import { ManageEventsClient } from "@/components/clubs/ManageEventsClient"

export default async function ManageEventsPage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")
  if (session.user.role !== "admin" && session.user.role !== "moderator") redirect("/")

  // Newest-created first (createdAt desc) — same order as the public /events page.
  const [allEvents, clubs] = await Promise.all([getEventsForPage(), getApprovedClubs()])

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
      <div className="mb-8 flex items-center gap-3">
        <span className="flex size-11 items-center justify-center rounded-xl bg-primary/10">
          <CalendarDays className="size-5 text-primary" strokeWidth={1.5} />
        </span>
        <div>
          <h1 className="font-heading text-3xl font-bold text-foreground">
            Manage Events
          </h1>
          <p className="text-muted-foreground mt-1">
            Every event — club gatherings and individual meetups, newest first. Create events as an
            individual or under a club, or edit and remove existing ones.
          </p>
        </div>
      </div>

      <ManageEventsClient
        initialEvents={allEvents}
        clubs={clubs.map((c) => ({ id: c.id, name: c.name }))}
      />
    </main>
  )
}
