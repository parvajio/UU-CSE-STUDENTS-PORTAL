import { NextResponse } from "next/server"
import { auth } from "@/lib/auth/auth"
import { db } from "@/lib/db"
import { clubGalleryAlbums } from "@/lib/db/schema/club-gallery-albums"
import { clubs } from "@/lib/db/schema/clubs"
import { clubGalleryImages } from "@/lib/db/schema/club-gallery-images"
import { eq } from "drizzle-orm"
import { enforceSubmissionLimit } from "@/lib/rate-limit"
import { notFound } from "next/navigation"

export async function GET(req: Request, ctx: { params: Promise<{ clubId: string }> }) {
  const { clubId } = await ctx.params
  const albums = await db.query.clubGalleryAlbums.findMany({
    where: eq(clubGalleryAlbums.clubId, clubId),
    orderBy: [clubGalleryAlbums.displayOrder],
    with: {
      clubGalleryImages: {
        orderBy: [clubGalleryImages.displayOrder],
      },
    },
  })
  return NextResponse.json({ albums })
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
    const { clubId, title, description } = body

    if (!clubId || !title) {
      return NextResponse.json({ error: "Club ID and title are required." }, { status: 400 })
    }

    const club = await db.query.clubs.findFirst({
      where: eq(clubs.id, clubId),
    })
    if (!club) return NextResponse.json({ error: "Club not found" }, { status: 404 })

    const [row] = await db
      .insert(clubGalleryAlbums)
      .values({ clubId, title, description, displayOrder: 0 })
      .returning()

    return NextResponse.json(row, { status: 201 })
  } catch (err: unknown) {
    return NextResponse.json({ error: "Failed to create album" }, { status: 500 })
  }
}

export async function PUT(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (session.user.role !== "admin" && session.user.role !== "moderator") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  try {
    const body = await req.json()
    const { albumId, title, description, displayOrder } = body

    if (!albumId) {
      return NextResponse.json({ error: "Album ID is required." }, { status: 400 })
    }
    if (title !== undefined && !title.trim()) {
      return NextResponse.json({ error: "Title cannot be empty." }, { status: 400 })
    }

    const updates: Partial<{ title: string; description: string | null; displayOrder: number; updatedAt: string }> = {
      updatedAt: new Date().toISOString(),
    }
    if (title !== undefined) updates.title = title.trim()
    if (description !== undefined) updates.description = description?.trim() ? description.trim() : null
    if (displayOrder !== undefined) updates.displayOrder = Number(displayOrder) || 0

    const [row] = await db
      .update(clubGalleryAlbums)
      .set(updates)
      .where(eq(clubGalleryAlbums.id, albumId))
      .returning()

    if (!row) return NextResponse.json({ error: "Album not found" }, { status: 404 })
    return NextResponse.json(row)
  } catch (err: unknown) {
    return NextResponse.json({ error: "Failed to update album" }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (session.user.role !== "admin" && session.user.role !== "moderator") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  try {
    const body = await req.json()
    const { albumId } = body

    await db.delete(clubGalleryImages).where(eq(clubGalleryImages.albumId, albumId))
    await db.delete(clubGalleryAlbums).where(eq(clubGalleryAlbums.id, albumId))

    return NextResponse.json({ success: true })
  } catch (err: unknown) {
    return NextResponse.json({ error: "Failed to delete album" }, { status: 500 })
  }
}
