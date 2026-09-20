import { NextResponse } from "next/server"
import { auth } from "@/lib/auth/auth"
import { db } from "@/lib/db"
import { clubs } from "@/lib/db/schema/clubs"
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
    const body = await req.json()
    const {
      name,
      description,
      departmentId,
      logoUrl,
      coverImgUrl,
      msgGroupUrl,
      pageUrl,
      fbGroupUrl,
      contacts,
      mail,
    } = body

    if (!name || !departmentId) {
      return NextResponse.json({ error: "Name and departmentId are required." }, { status: 400 })
    }

    const dept = await db.query.departments.findFirst({
      where: eq(departments.id, departmentId),
    })
    if (!dept) {
      return NextResponse.json({ error: "Department not found." }, { status: 404 })
    }

    const [row] = await db
      .insert(clubs)
      .values({
        name,
        description: description ?? null,
        departmentId,
        logoUrl: logoUrl ?? null,
        coverImgUrl: coverImgUrl ?? null,
        msgGroupUrl: msgGroupUrl ?? null,
        pageUrl: pageUrl ?? null,
        fbGroupUrl: fbGroupUrl ?? null,
        contacts: contacts ?? null,
        mail: mail ?? null,
        status: "approved",
      })
      .returning()

    return NextResponse.json(row, { status: 201 })
  } catch (err: unknown) {
    return NextResponse.json({ error: "Failed to create club" }, { status: 500 })
  }
}
