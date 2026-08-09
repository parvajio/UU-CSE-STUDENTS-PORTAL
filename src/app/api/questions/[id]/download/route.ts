import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"
import { eq } from "drizzle-orm"
import { db } from "@/lib/db"
import { questions } from "@/lib/db/schema"
import { auth } from "@/lib/auth/auth"
import { safeCallbackUrl } from "@/lib/auth/safe-callback-url"

export const dynamic = "force-dynamic"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    const loginUrl = new URL("/login", request.url)
    loginUrl.searchParams.set(
      "callbackUrl",
      safeCallbackUrl(request.nextUrl.pathname)
    )
    return NextResponse.redirect(loginUrl)
  }

  const { id } = await params
  const row = await db.query.questions.findFirst({
    columns: { id: true, status: true, uploadedBy: true, fileUrl: true },
    where: eq(questions.id, id),
  })

  const allowed =
    row &&
    (row.status === "approved" || row.uploadedBy === session.user.id)
  if (!allowed) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  return NextResponse.redirect(row.fileUrl, {
    headers: { "Cache-Control": "no-store" },
  })
}