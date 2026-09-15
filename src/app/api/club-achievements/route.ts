import { NextResponse } from "next/server"
import { auth } from "@/lib/auth/auth"
import { db } from "@/lib/db"
import { clubAchievements } from "@/lib/db/schema/club-achievements"
import { clubs } from "@/lib/db/schema/clubs"
import { eq } from "drizzle-orm"
import { enforceSubmissionLimit } from "@/lib/rate-limit"

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (session.user.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const limit = enforceSubmissionLimit(session.user.id)
  if (!limit.allowed) {
    return NextResponse.json(
      { error: `Rate limit reached — try again in ${limit.retryAfter} minutes` },
      { status: 429 }
    )
  }

  try {
    const body = await req.json()
    const { clubId, title, description, date, imageUrl, linkUrl } = body

    if (!clubId || !title) {
      return NextResponse.json({ error: "Club ID and title are required." }, { status: 400 })
    }

    const club = await db.query.clubs.findFirst({
      where: eq(clubs.id, clubId),
    })
    if (!club) return NextResponse.json({ error: "Club not found" }, { status: 404 })

    const [row] = await db
      .insert(clubAchievements)
      .values({ clubId, title, description, date, imageUrl, linkUrl })
      .returning()

    return NextResponse.json(row, { status: 201 })
  } catch (err: unknown) {
    return NextResponse.json({ error: "Failed to create achievement" }, { status: 500 })
  }
}
