import { notFound } from "next/navigation"
import Link from "next/link"
import { auth } from "@/lib/auth/auth"
import { redirect } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { computeEventStatus, getClubById } from "@/lib/db/queries/clubs"
import { db } from "@/lib/db"
import { events } from "@/lib/db/schema/events"
import { eq, desc } from "drizzle-orm"
import { ManageEventsClient } from "@/components/clubs/ManageEventsClient"

export default async function ManageClubEventsPage({
  params,
}: {
  params: Promise<{ clubId: string }>
}) {
  const { clubId } = await params
  const session = await auth()
  if (!session?.user?.id) redirect("/login")
  if (session.user.role !== "admin" && session.user.role !== "moderator") redirect("/")

  const club = await getClubById(clubId)
  if (!club) notFound()

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
        Back to {club.name}
      </Link>
      <div className="mb-8">
        <h1 className="font-heading text-3xl font-bold text-foreground">
          Manage Events
        </h1>
        <p className="text-muted-foreground mt-1">
          Create, edit, and remove events for {club.name}. Club events also appear on the main events page with a club tag.
        </p>
      </div>

      <ManageEventsClient
        fixedClubId={clubId}
        clubs={[{ id: club.id, name: club.name }]}
        initialEvents={clubEvents.map((e) => ({
          ...e,
          status: computeEventStatus(e.startTime, e.endTime),
          clubName: club.name,
        }))}
      />
    </main>
  )
}
