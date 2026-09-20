import { NextResponse } from "next/server"
import { auth } from "@/lib/auth/auth"
import { db } from "@/lib/db"
import { clubMembers } from "@/lib/db/schema/club-members"
import { clubs } from "@/lib/db/schema/clubs"
import { profiles } from "@/lib/db/schema/profiles"
import { eq, ilike, and } from "drizzle-orm"
import { enforceSubmissionLimit } from "@/lib/rate-limit"

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const query = searchParams.get("q")

  if (!query || query.length < 2) {
    return NextResponse.json({ members: [] })
  }

  const approvedProfiles = await db.query.profiles.findMany({
    where: and(eq(profiles.status, "approved"), ilike(profiles.fullName, `%${query}%`)),
    columns: {
      id: true,
      fullName: true,
      avatarUrl: true,
    },
  })

  return NextResponse.json({ members: approvedProfiles })
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
    const { clubId, profileId, roleInClub, position, designation } = body

    const club = await db.query.clubs.findFirst({
      where: eq(clubs.id, clubId),
    })
    if (!club) return NextResponse.json({ error: "Club not found" }, { status: 404 })

    const profile = await db.query.profiles.findFirst({
      where: eq(profiles.id, profileId),
      columns: { status: true, userId: true },
    })
    if (!profile || profile.status !== "approved") {
      return NextResponse.json({ error: "Profile not found or not approved" }, { status: 404 })
    }

    const existing = await db.query.clubMembers.findFirst({
      where: and(eq(clubMembers.clubId, clubId), eq(clubMembers.profileId, profileId)),
      columns: { id: true },
    })
    if (existing) {
      return NextResponse.json({ error: "Profile is already a member of this club" }, { status: 409 })
    }

    try {
      const [row] = await db
        .insert(clubMembers)
        .values({
          clubId,
          profileId,
          // Carry the linked login when known so a later self-join by the
          // same user hits the (clubId, userId) unique index instead of
          // creating a second row.
          userId: profile.userId,
          roleInClub,
          position,
          designation,
          joinedAt: new Date().toISOString(),
        })
        .returning()

      return NextResponse.json(row, { status: 201 })
    } catch {
      return NextResponse.json({ error: "Profile is already a member of this club" }, { status: 409 })
    }
  } catch (err: unknown) {
    return NextResponse.json({ error: "Failed to add member" }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (session.user.role !== "admin" && session.user.role !== "moderator") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  try {
    const body = await req.json()
    const { clubId, profileId, memberId } = body

    // Profile-less self-joined rows are removed by row id; profile-backed
    // rows by (clubId, profileId).
    const deleted = memberId
      ? await db
          .delete(clubMembers)
          .where(and(eq(clubMembers.id, memberId), eq(clubMembers.clubId, clubId)))
          .returning()
      : await db
          .delete(clubMembers)
          .where(
            and(eq(clubMembers.clubId, clubId), eq(clubMembers.profileId, profileId))
          )
          .returning()

    if (!deleted.length) return NextResponse.json({ error: "Member not found" }, { status: 404 })

    return NextResponse.json({ success: true })
  } catch (err: unknown) {
    return NextResponse.json({ error: "Failed to remove member" }, { status: 500 })
  }
}
