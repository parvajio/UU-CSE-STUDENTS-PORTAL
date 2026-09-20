import { NextResponse } from "next/server"
import { and, eq, or } from "drizzle-orm"
import { auth } from "@/lib/auth/auth"
import { db } from "@/lib/db"
import { clubs } from "@/lib/db/schema/clubs"
import { clubMembers } from "@/lib/db/schema/club-members"
import { profiles } from "@/lib/db/schema/profiles"
import { insertNotification } from "@/lib/db/queries/notifications"
import { enforceSubmissionLimit } from "@/lib/rate-limit"

/**
 * POST /api/clubs/[clubId]/membership — logged-in user joins the club as a
 * plain `member`. No profile required: the row always carries `userId` and
 * links `profileId` when the user has one (so the avatar wall can link to
 * their profile page).
 */
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ clubId: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Sign in to join this club." }, { status: 401 })
  }

  const { clubId } = await params

  const club = await db.query.clubs.findFirst({
    where: eq(clubs.id, clubId),
    columns: { id: true, name: true },
  })
  if (!club) return NextResponse.json({ error: "Club not found." }, { status: 404 })

  // Link the user's profile when they have one (any status) so their avatar
  // can deep-link to their profile page.
  const profile = await db.query.profiles.findFirst({
    where: eq(profiles.userId, session.user.id),
    columns: { id: true },
  })

  // A row may already exist via the admin path (profile-linked, possibly
  // with no userId backfill). Match on either side so the same person can
  // never hold two rows for one club.
  const orConds = profile
    ? or(
        eq(clubMembers.userId, session.user.id),
        eq(clubMembers.profileId, profile.id)
      )
    : eq(clubMembers.userId, session.user.id)
  const existing = await db.query.clubMembers.findFirst({
    where: and(eq(clubMembers.clubId, clubId), orConds),
    columns: { id: true, userId: true },
  })
  if (existing) {
    // Claim an orphan admin-added row so leave/notifications keep working.
    if (!existing.userId) {
      await db
        .update(clubMembers)
        .set({ userId: session.user.id })
        .where(eq(clubMembers.id, existing.id))
    }
    return NextResponse.json(
      { error: "You are already a member of this club.", code: "ALREADY_MEMBER" },
      { status: 409 }
    )
  }

  const limit = enforceSubmissionLimit(session.user.id)
  if (!limit.allowed) {
    return NextResponse.json(
      { error: `Rate limit reached — try again in ${limit.retryAfter} minutes` },
      { status: 429 }
    )
  }

  try {
    await db.insert(clubMembers).values({
      clubId,
      userId: session.user.id,
      profileId: profile?.id ?? null,
      roleInClub: "member",
      joinedAt: new Date().toISOString(),
    })
  } catch {
    // Unique (clubId, userId)/(clubId, profileId) race — treat as
    // already-joined.
    return NextResponse.json(
      { error: "You are already a member of this club.", code: "ALREADY_MEMBER" },
      { status: 409 }
    )
  }

  await insertNotification({
    userId: session.user.id,
    type: "club-joined",
    title: `You joined ${club.name}`,
    message:
      "You're on the member list. To actually be part of the club, join its groups via the links on the club page — and you'll be notified about upcoming events here.",
    resourceType: "club",
    resourceId: clubId,
  })

  return NextResponse.json({ success: true }, { status: 201 })
}

/**
 * DELETE /api/clubs/[clubId]/membership — logged-in user leaves the club
 * (removes their own membership row).
 */
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ clubId: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Sign in to leave this club." }, { status: 401 })
  }

  const { clubId } = await params

  // Delete the viewer's own row, matching the same two-sided identity the
  // join path uses (userId, or their profile when the row predates backfill).
  const profile = await db.query.profiles.findFirst({
    where: eq(profiles.userId, session.user.id),
    columns: { id: true },
  })
  const orConds = profile
    ? or(
        eq(clubMembers.userId, session.user.id),
        eq(clubMembers.profileId, profile.id)
      )
    : eq(clubMembers.userId, session.user.id)

  const deleted = await db
    .delete(clubMembers)
    .where(and(eq(clubMembers.clubId, clubId), orConds))
    .returning({ id: clubMembers.id })

  if (!deleted.length) {
    return NextResponse.json({ error: "You are not a member of this club." }, { status: 404 })
  }

  return NextResponse.json({ success: true })
}
