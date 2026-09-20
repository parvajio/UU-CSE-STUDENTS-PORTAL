import { notFound } from "next/navigation"
import { and, eq, or } from "drizzle-orm"
import { auth } from "@/lib/auth/auth"
import { db } from "@/lib/db"
import { clubMembers } from "@/lib/db/schema/club-members"
import { profiles } from "@/lib/db/schema/profiles"
import { getClubDetail } from "@/lib/db/queries/clubs"
import { ClubDetailPage, type ClubMembershipContext } from "@/components/clubs/ClubDetailPage"

export default async function ClubDetailPageRoute({
  params,
}: {
  params: Promise<{ clubId: string }>
}) {
  const { clubId } = await params
  const data = await getClubDetail(clubId)
  if (!data) notFound()

  const session = await auth()

  let membership: ClubMembershipContext = {
    signedIn: false,
    isMember: false,
    viewer: null,
  }

  if (session?.user?.id) {
    // Joining needs no profile — the row links userId and picks up
    // profileId only when the user has one (for avatar deep-linking).
    const profile = await db.query.profiles.findFirst({
      where: eq(profiles.userId, session.user.id),
      columns: { id: true, fullName: true, avatarUrl: true },
    })
    // Two-sided identity, mirroring the membership API: a row may predate
    // the userId backfill and only carry this user's profileId.
    const orConds = profile
      ? or(
          eq(clubMembers.userId, session.user.id),
          eq(clubMembers.profileId, profile.id)
        )
      : eq(clubMembers.userId, session.user.id)
    const row = await db.query.clubMembers.findFirst({
      where: and(eq(clubMembers.clubId, clubId), orConds),
      columns: { id: true },
    })
    membership = {
      signedIn: true,
      isMember: !!row,
      viewer: {
        userId: session.user.id,
        profileId: profile?.id ?? null,
        // Display-name chain: profile name → OAuth name → email prefix.
        fullName:
          profile?.fullName ??
          session.user.name ??
          session.user.email?.split("@")[0] ??
          null,
        // Avatar chain: profile photo → OAuth/user image → initial fallback
        // (fallback initial is rendered by the avatar wall itself).
        avatarUrl: profile?.avatarUrl ?? session.user.image ?? null,
      },
    }
  }

  return <ClubDetailPage data={data} membership={membership} />
}
