import Link from "next/link"
import { auth } from "@/lib/auth/auth"
import { redirect } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { getEventsForPage } from "@/lib/db/queries/clubs"
import { Badge } from "@/components/ui/badge"

export default async function ManageAllEventsPage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")
  if (session.user.role !== "admin" && session.user.role !== "moderator") redirect("/")

  const allEvents = await getEventsForPage()

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
          Every event across all clubs and standalone events. Create or edit events from a club&apos;s manage page.
        </p>
      </div>

      {allEvents.length === 0 ? (
        <p className="text-muted-foreground text-sm">No events yet.</p>
      ) : (
        <div className="space-y-2">
          {allEvents.map((event) => (
            <div key={event.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
              <div className="flex-1 min-w-0">
                <p className="font-medium text-foreground text-sm truncate">{event.name}</p>
                <p className="text-xs text-muted-foreground">
                  {event.date ? new Date(event.date).toLocaleDateString() : "No date"}
                  {event.clubName ? ` · From ${event.clubName}` : " · Standalone"}
                </p>
              </div>
              <Badge variant="secondary">{event.status}</Badge>
              {event.clubId && (
                <Link
                  href={`/manage/clubs/${event.clubId}/events`}
                  className="text-xs text-primary hover:underline shrink-0"
                >
                  Manage
                </Link>
              )}
            </div>
          ))}
        </div>
      )}
    </main>
  )
}
