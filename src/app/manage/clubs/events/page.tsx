import { notFound } from "next/navigation"
import { auth } from "@/lib/auth/auth"
import { redirect } from "next/navigation"
import { getClubDetail } from "@/lib/db/queries/clubs"
import { db } from "@/lib/db"
import { events } from "@/lib/db/schema/events"
import { clubs } from "@/lib/db/schema/clubs"
import { eq, desc } from "drizzle-orm"
import { EventsClient } from "@/components/clubs/EventsClient"

export default async function ManageEventsPage({
  params,
}: {
  params: { clubId: string }
}) {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")
  if (session.user.role !== "admin") redirect("/")

  const data = await getClubDetail(params.clubId)
  if (!data) notFound()

  const clubEvents = await db.query.events.findMany({
    where: eq(events.clubId, params.clubId),
    orderBy: [desc(events.createdAt)],
  })

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
      <div className="mb-8">
        <h1 className="font-heading text-3xl font-bold text-foreground">
          Manage Events
        </h1>
        <p className="text-muted-foreground mt-1">
          Create and manage events for {data.club.name}.
        </p>
      </div>

      <EventsClient clubId={params.clubId} initialEvents={clubEvents} />
    </main>
  )
}
