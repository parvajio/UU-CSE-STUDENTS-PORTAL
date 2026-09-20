import { NextResponse } from "next/server"
import { auth } from "@/lib/auth/auth"
import { db } from "@/lib/db"
import { departments } from "@/lib/db/schema/departments"
import { eq } from "drizzle-orm"
import { enforceSubmissionLimit } from "@/lib/rate-limit"

function isManager(role: unknown) {
  return role === "admin" || role === "moderator"
}

export async function PUT(req: Request, ctx: { params: Promise<{ departmentId: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (!isManager(session.user.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const limit = enforceSubmissionLimit(session.user.id)
  if (!limit.allowed) {
    return NextResponse.json(
      { error: `Rate limit reached — try again in ${limit.retryAfter} minutes` },
      { status: 429 }
    )
  }

  try {
    const { departmentId } = await ctx.params
    const body = await req.json()
    const { name, slug, description, imageUrl } = body

    const existing = await db.query.departments.findFirst({
      where: eq(departments.id, departmentId),
    })
    if (!existing) return NextResponse.json({ error: "Department not found" }, { status: 404 })

    if (slug && slug !== existing.slug) {
      const clash = await db.query.departments.findFirst({
        where: eq(departments.slug, slug),
      })
      if (clash) {
        return NextResponse.json({ error: "Department with this slug already exists." }, { status: 409 })
      }
    }

    const [row] = await db
      .update(departments)
      .set({
        ...(name !== undefined ? { name } : {}),
        ...(slug !== undefined ? { slug } : {}),
        ...(description !== undefined ? { description } : {}),
        ...(imageUrl !== undefined ? { imageUrl } : {}),
        updatedAt: new Date().toISOString(),
      })
      .where(eq(departments.id, departmentId))
      .returning()

    return NextResponse.json(row)
  } catch {
    return NextResponse.json({ error: "Failed to update department" }, { status: 500 })
  }
}

export async function DELETE(req: Request, ctx: { params: Promise<{ departmentId: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (!isManager(session.user.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  try {
    const { departmentId } = await ctx.params
    const existing = await db.query.departments.findFirst({
      where: eq(departments.id, departmentId),
    })
    if (!existing) return NextResponse.json({ error: "Department not found" }, { status: 404 })

    // Clubs cascade-delete (FK onDelete: cascade), which in turn
    // cascade-deletes members, gallery, achievements and club events.
    await db.delete(departments).where(eq(departments.id, departmentId))
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: "Failed to delete department" }, { status: 500 })
  }
}
