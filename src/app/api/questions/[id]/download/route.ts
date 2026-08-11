import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"
import { and, eq } from "drizzle-orm"
import { db } from "@/lib/db"
import { questionFiles, questions } from "@/lib/db/schema"
import { auth } from "@/lib/auth/auth"
import { safeCallbackUrl } from "@/lib/auth/safe-callback-url"
import { incrementDownloadCount } from "@/lib/db/queries/question-bank"

export const dynamic = "force-dynamic"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const session = await auth()
  if (!session?.user?.id) {
    const loginUrl = new URL("/login", request.url)
    // Send the user back to the paper they tried to download, not the API
    // path — same safeCallbackUrl discipline as every other login CTA.
    loginUrl.searchParams.set(
      "callbackUrl",
      safeCallbackUrl(`/question-bank/${id}`)
    )
    return NextResponse.redirect(loginUrl)
  }

  const row = await db.query.questions.findFirst({
    columns: { id: true, status: true, uploadedBy: true },
    where: eq(questions.id, id),
  })

  const allowed =
    row &&
    (row.status === "approved" || row.uploadedBy === session.user.id)
  if (!allowed) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  const fileParam = request.nextUrl.searchParams.get("file")
  const parsedOrder = fileParam ? Number.parseInt(fileParam, 10) : 0
  const order =
    Number.isInteger(parsedOrder) && parsedOrder >= 0 ? parsedOrder : 0

  // Public download only — `kind=file` counts toward `downloadCount`.
  // Approval-review links (`?file=<order>` only) skip the increment so a
  // reviewer browsing files doesn't inflate the public counter.
  if (request.nextUrl.searchParams.get("kind") === "file") {
    await incrementDownloadCount(id)
  }

  // `kind=file` without a `file=` param means the single PDF paper — a
  // question can only ever be 1 pdf XOR 1-5 images, so resolve the pdf row
  // directly rather than relying on the implicit order-0 fallthrough.
  if (fileParam === null) {
    const pdf = await db.query.questionFiles.findFirst({
      columns: { fileUrl: true },
      where: and(
        eq(questionFiles.questionId, id),
        eq(questionFiles.fileType, "pdf")
      ),
    })
    if (pdf) {
      return NextResponse.redirect(pdf.fileUrl, {
        headers: { "Cache-Control": "no-store" },
      })
    }
  }

  const file = await db.query.questionFiles.findFirst({
    columns: { fileUrl: true },
    where: and(
      eq(questionFiles.questionId, id),
      eq(questionFiles.order, order)
    ),
  })

  if (!file) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  return NextResponse.redirect(file.fileUrl, {
    headers: { "Cache-Control": "no-store" },
  })
}