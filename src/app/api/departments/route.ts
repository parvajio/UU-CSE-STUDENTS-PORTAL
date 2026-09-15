import { NextResponse } from "next/server"
import { auth } from "@/lib/auth/auth"
import { db } from "@/lib/db"
import { departments } from "@/lib/db/schema/departments"
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
    const { name, slug, description, imageUrl } = body

    if (!name || !slug) {
      return NextResponse.json({ error: "Name and slug are required." }, { status: 400 })
    }

    const existing = await db.query.departments.findFirst({
      where: eq(departments.slug, slug),
    })
    if (existing) {
      return NextResponse.json({ error: "Department with this slug already exists." }, { status: 409 })
    }

    const [row] = await db
      .insert(departments)
      .values({ name, slug, description, imageUrl })
      .returning()

    return NextResponse.json(row, { status: 201 })
  } catch (err: unknown) {
    return NextResponse.json({ error: "Failed to create department" }, { status: 500 })
  }
}
