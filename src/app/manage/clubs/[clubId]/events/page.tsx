import { notFound } from "next/navigation"
import Link from "next/link"
import { auth } from "@/lib/auth/auth"
import { redirect } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { getClubDetail } from "@/lib/db/queries/clubs"
import { db } from "@/lib/db"
import { events } from "@/lib/db/schema/events"
import { eq, desc } from "drizzle-orm"
import { EventsClient } from "@/components/clubs/EventsClient"

export default async function ManageClubEventsPage({
  params,
}: {
  params: Promise<{ clubId: string }>
}) {
  const { clubId } = await params
  const session = await auth()
  if (!session?.user?.id) redirect("/login")
  if (session.user.role !== "admin" && session.user.role !== "moderator") redirect("/")

  const data = await getClubDetail(clubId)
  if (!data) notFound()

  const clubEvents = await db.query.events.findMany({
    where: eq(events.clubId, clubId),
    orderBy: [desc(events.createdAt)],
  })

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
      <Link
        href={`/manage/clubs/${clubId}`}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
      >
        <ArrowLeft className="size-4" strokeWidth={1.5} />
        Back to {data.club.name}
      </Link>
      <div className="mb-8">
        <h1 className="font-heading text-3xl font-bold text-foreground">
          Manage Events
        </h1>
        <p className="text-muted-foreground mt-1">
          Create and manage events for {data.club.name}. Club events also appear on the main events page.
        </p>
      </div>

      <EventsClient clubId={clubId} initialEvents={clubEvents} />
    </main>
  )
}
