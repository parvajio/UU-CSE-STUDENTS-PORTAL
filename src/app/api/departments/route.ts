import { NextResponse } from "next/server"
import { auth } from "@/lib/auth/auth"
import { db } from "@/lib/db"
import { departments } from "@/lib/db/schema/departments"
import { eq } from "drizzle-orm"
import { enforceSubmissionLimit } from "@/lib/rate-limit"

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
    const contentType = req.headers.get("content-type") ?? ""
    let name: unknown
    let slug: unknown
    let description: unknown
    let imageUrl: unknown
    if (contentType.includes("multipart/form-data") || contentType.includes("application/x-www-form-urlencoded")) {
      const form = await req.formData()
      name = form.get("name")
      slug = form.get("slug")
      description = form.get("description")
      imageUrl = form.get("imageUrl")
    } else {
      const body = await req.json()
      ;({ name, slug, description, imageUrl } = body)
    }

    if (typeof name !== "string" || typeof slug !== "string" || !name || !slug) {
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
      .values({
        name,
        slug,
        description: typeof description === "string" ? description : null,
        imageUrl: typeof imageUrl === "string" ? imageUrl : null,
      })
      .returning()

    return NextResponse.json(row, { status: 201 })
  } catch (err: unknown) {
    return NextResponse.json({ error: "Failed to create department" }, { status: 500 })
  }
}
