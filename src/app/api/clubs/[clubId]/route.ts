import { NextResponse } from "next/server"
import { auth } from "@/lib/auth/auth"
import { db } from "@/lib/db"
import { clubs } from "@/lib/db/schema/clubs"
import { eq } from "drizzle-orm"
import { enforceSubmissionLimit } from "@/lib/rate-limit"
import { notFound } from "next/navigation"

export async function GET(req: Request, ctx: { params: Promise<{ clubId: string }> }) {
  const { clubId } = await ctx.params
  const club = await db.query.clubs.findFirst({
    where: eq(clubs.id, clubId),
  })
  if (!club) return NextResponse.json({ error: "Club not found" }, { status: 404 })
  return NextResponse.json(club)
}

export async function PUT(req: Request, ctx: { params: Promise<{ clubId: string }> }) {
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
    const { updatedAt: clientUpdatedAt, ...updates } = body

    const club = await db.query.clubs.findFirst({
      where: eq(clubs.id, (await ctx.params).clubId),
    })
    if (!club) return NextResponse.json({ error: "Club not found" }, { status: 404 })

    if (clientUpdatedAt && club.updatedAt && new Date(clientUpdatedAt) < new Date(club.updatedAt)) {
      return NextResponse.json({ error: "Conflict: record has been modified since last fetch", status: 409 }, { status: 409 })
    }

    const [row] = await db
      .update(clubs)
      .set({ ...updates, updatedAt: new Date().toISOString() })
      .where(eq(clubs.id, (await ctx.params).clubId))
      .returning()

    return NextResponse.json(row)
  } catch (err: unknown) {
    return NextResponse.json({ error: "Failed to update club" }, { status: 500 })
  }
}

export async function DELETE(req: Request, ctx: { params: Promise<{ clubId: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (session.user.role !== "admin" && session.user.role !== "moderator") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  try {
    const club = await db.query.clubs.findFirst({
      where: eq(clubs.id, (await ctx.params).clubId),
    })
    if (!club) return NextResponse.json({ error: "Club not found" }, { status: 404 })

    await db.delete(clubs).where(eq(clubs.id, (await ctx.params).clubId))
    return NextResponse.json({ success: true })
  } catch (err: unknown) {
    return NextResponse.json({ error: "Failed to delete club" }, { status: 500 })
  }
}
