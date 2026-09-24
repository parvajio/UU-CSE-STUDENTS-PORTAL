import { NextResponse } from "next/server"
import { auth } from "@/lib/auth/auth"
import { db } from "@/lib/db"
import { clubGalleryAlbums } from "@/lib/db/schema/club-gallery-albums"
import { clubGalleryImages } from "@/lib/db/schema/club-gallery-images"
import { eq } from "drizzle-orm"
import { enforceSubmissionLimit } from "@/lib/rate-limit"

type ManagerSession = { user?: { id?: string; role?: string } } | null

function requireManager(session: ManagerSession) {
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (session.user.role !== "admin" && session.user.role !== "moderator")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  return null
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const albumId = searchParams.get("albumId")
  if (!albumId) return NextResponse.json({ images: [] })
  const images = await db.query.clubGalleryImages.findMany({
    where: eq(clubGalleryImages.albumId, albumId),
    orderBy: [clubGalleryImages.displayOrder],
  })
  return NextResponse.json({ images })
}

export async function POST(req: Request) {
  const session = await auth()
  const denied = requireManager(session)
  if (denied) return denied

  const limit = enforceSubmissionLimit(session!.user.id)
  if (!limit.allowed) {
    return NextResponse.json(
      { error: `Rate limit reached — try again in ${limit.retryAfter} minutes` },
      { status: 429 }
    )
  }

  try {
    const body = await req.json()
    const { albumId, imageUrl, caption, displayOrder } = body

    if (!albumId || !imageUrl) {
      return NextResponse.json({ error: "Album ID and image URL are required." }, { status: 400 })
    }

    const album = await db.query.clubGalleryAlbums.findFirst({
      where: eq(clubGalleryAlbums.id, albumId),
    })
    if (!album) return NextResponse.json({ error: "Album not found" }, { status: 404 })

    const [row] = await db
      .insert(clubGalleryImages)
      .values({
        albumId,
        imageUrl,
        caption: caption?.trim() ? caption.trim() : null,
        displayOrder: Number(displayOrder) || 0,
        createdAt: new Date().toISOString(),
      })
      .returning()

    return NextResponse.json(row, { status: 201 })
  } catch {
    return NextResponse.json({ error: "Failed to add image" }, { status: 500 })
  }
}

export async function PUT(req: Request) {
  const session = await auth()
  const denied = requireManager(session)
  if (denied) return denied

  try {
    const body = await req.json()
    const { id, caption, displayOrder, imageUrl } = body

    if (!id) {
      return NextResponse.json({ error: "Image ID is required." }, { status: 400 })
    }

    const updates: Partial<{ caption: string | null; displayOrder: number; imageUrl: string }> = {}
    if (caption !== undefined) updates.caption = caption?.trim() ? caption.trim() : null
    if (displayOrder !== undefined) updates.displayOrder = Number(displayOrder) || 0
    if (imageUrl !== undefined) {
      if (!imageUrl.trim()) return NextResponse.json({ error: "Image URL cannot be empty." }, { status: 400 })
      updates.imageUrl = imageUrl.trim()
    }

    const [row] = await db
      .update(clubGalleryImages)
      .set(updates)
      .where(eq(clubGalleryImages.id, id))
      .returning()

    if (!row) return NextResponse.json({ error: "Image not found" }, { status: 404 })
    return NextResponse.json(row)
  } catch {
    return NextResponse.json({ error: "Failed to update image" }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  const session = await auth()
  const denied = requireManager(session)
  if (denied) return denied

  try {
    const body = await req.json()
    const { id } = body
    if (!id) return NextResponse.json({ error: "Image ID is required." }, { status: 400 })

    await db.delete(clubGalleryImages).where(eq(clubGalleryImages.id, id))
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: "Failed to delete image" }, { status: 500 })
  }
}
