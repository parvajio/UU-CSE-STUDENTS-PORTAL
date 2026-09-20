import { NextResponse } from "next/server"
import { auth } from "@/lib/auth/auth"
import { db } from "@/lib/db"
import { events } from "@/lib/db/schema/events"
import { clubs } from "@/lib/db/schema/clubs"
import { clubMembers } from "@/lib/db/schema/club-members"
import { profiles } from "@/lib/db/schema/profiles"
import { notifications } from "@/lib/db/schema/notifications"
import { eq, desc } from "drizzle-orm"
import { enforceSubmissionLimit } from "@/lib/rate-limit"

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const clubId = searchParams.get("clubId")

  if (clubId) {
    const clubEvents = await db.query.events.findMany({
      where: eq(events.clubId, clubId),
      orderBy: [desc(events.createdAt)],
    })
    return NextResponse.json({ events: clubEvents })
  }

  const allEvents = await db.query.events.findMany({
    orderBy: [desc(events.createdAt)],
  })
  return NextResponse.json({ events: allEvents })
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (session.user.role !== "admin" && session.user.role !== "moderator") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const limit = enforceSubmissionLimit(session.user.id)
  if (!limit.allowed) {
    return NextResponse.json(
      { error: `Rate limit reached — try again in ${limit.retryAfter} minutes` },
      { status: 429 }
    )
  }

  try {
    const body = await req.json()
    const { clubId, name, place, description, date, deadline, startTime, endTime } = body

    if (!name || !date) {
      return NextResponse.json({ error: "Name and date are required." }, { status: 400 })
    }

    const [row] = await db
      .insert(events)
      .values({ clubId: clubId ?? null, name, place, description, date, deadline, startTime, endTime })
      .returning()

    // Notify joined members when a club event is created — single batched
    // insert of one row per member with a linked users account.
    if (row && clubId) {
      const club = await db.query.clubs.findFirst({
        where: eq(clubs.id, clubId),
        columns: { name: true },
      })
      const memberProfiles = await db
        .select({ userId: profiles.userId })
        .from(clubMembers)
        .innerJoin(profiles, eq(clubMembers.profileId, profiles.id))
        .where(eq(clubMembers.clubId, clubId))
      const memberUserIds = [
        ...new Set(
          memberProfiles
            .map((m) => m.userId)
            .filter((id): id is string => id !== null)
        ),
      ]
      if (memberUserIds.length > 0) {
        await db.insert(notifications).values(
          memberUserIds.map((userId) => ({
            userId,
            type: "club-event",
            title: `New event in ${club?.name ?? "a club you joined"}`,
            message: `${name} — check the club page for details and join the group links so you don't miss it.`,
            resourceType: "event",
            resourceId: row.id,
          }))
        )
      }
    }

    return NextResponse.json(row, { status: 201 })
  } catch (err: unknown) {
    return NextResponse.json({ error: "Failed to create event" }, { status: 500 })
  }
}

export async function PUT(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (session.user.role !== "admin" && session.user.role !== "moderator") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const limit = enforceSubmissionLimit(session.user.id)
  if (!limit.allowed) {
    return NextResponse.json(
      { error: `Rate limit reached — try again in ${limit.retryAfter} minutes` },
      { status: 429 }
    )
  }

  try {
    const body = await req.json()
    const { id, ...updates } = body

    // Whitelist updatable columns — event status is computed dynamically
    // (computeEventStatus) and must never be persisted (T054).
    const allowed = ["clubId", "name", "place", "description", "date", "deadline", "startTime", "endTime"] as const
    const patch: Record<string, unknown> = {}
    for (const key of allowed) {
      if (key in updates) patch[key] = updates[key]
    }

    const [row] = await db
      .update(events)
      .set({ ...patch, updatedAt: new Date().toISOString() })
      .where(eq(events.id, id))
      .returning()

    if (!row) return NextResponse.json({ error: "Event not found" }, { status: 404 })
    return NextResponse.json(row)
  } catch (err: unknown) {
    return NextResponse.json({ error: "Failed to update event" }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (session.user.role !== "admin" && session.user.role !== "moderator") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  try {
    const body = await req.json()
    const { id } = body

    await db.delete(events).where(eq(events.id, id))
    return NextResponse.json({ success: true })
  } catch (err: unknown) {
    return NextResponse.json({ error: "Failed to delete event" }, { status: 500 })
  }
}
