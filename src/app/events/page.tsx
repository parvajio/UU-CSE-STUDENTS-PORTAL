import { getEventsForPage } from "@/lib/db/queries/clubs"
import { EventsExplorer } from "@/components/clubs/EventsExplorer"

export default async function EventsPage() {
  // Ordered by most-recently-created first (createdAt desc).
  const events = await getEventsForPage()

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
      <EventsExplorer events={events} />
    </main>
  )
}
