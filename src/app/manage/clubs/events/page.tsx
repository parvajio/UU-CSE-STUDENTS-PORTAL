import Link from "next/link"
import { auth } from "@/lib/auth/auth"
import { redirect } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { getApprovedClubs, getEventsForPage } from "@/lib/db/queries/clubs"
import { ManageEventsClient } from "@/components/clubs/ManageEventsClient"

export default async function ManageAllEventsPage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")
  if (session.user.role !== "admin" && session.user.role !== "moderator") redirect("/")

  // Newest-created first (createdAt desc) — same order as the public /events page.
  const [allEvents, clubs] = await Promise.all([getEventsForPage(), getApprovedClubs()])

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
      <Link
        href="/manage/clubs"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
      >
        <ArrowLeft className="size-4" strokeWidth={1.5} />
        Back to Club Management
      </Link>
      <div className="mb-8">
        <h1 className="font-heading text-3xl font-bold text-foreground">
          All Events
        </h1>
        <p className="text-muted-foreground mt-1">
          Every event across all clubs and standalone meetups, newest first. Create events as an
          individual or under a club — club events also appear on the club page and the public
          events page with a club tag.
        </p>
      </div>

      <ManageEventsClient
        initialEvents={allEvents}
        clubs={clubs.map((c) => ({ id: c.id, name: c.name }))}
      />
    </main>
  )
}
