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
    loginUrl.searchParams.set(
      "callbackUrl",
      safeCallbackUrl(`/question-bank/${id}`)
    )
    return NextResponse.redirect(loginUrl)
  }

  const row = await db.query.questions.findFirst({
    columns: { id: true, title: true, status: true, uploadedBy: true },
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

  if (request.nextUrl.searchParams.get("kind") === "file") {
    await incrementDownloadCount(id)
  }

  if (fileParam === null) {
    const pdf = await db.query.questionFiles.findFirst({
      columns: { fileUrl: true },
      where: and(
        eq(questionFiles.questionId, id),
        eq(questionFiles.fileType, "pdf")
      ),
    })
    if (pdf) {
      try {
        const fileRes = await fetch(pdf.fileUrl)
        const blob = await fileRes.blob()
        const filename = `${row.title?.trim() || "question-paper"}.pdf`
        return new NextResponse(blob, {
          headers: {
            "Content-Disposition": `attachment; filename="${encodeURIComponent(filename)}"`,
            "Content-Type": "application/pdf",
            "Cache-Control": "no-store",
          },
        })
      } catch {
        return NextResponse.redirect(pdf.fileUrl, {
          headers: { "Cache-Control": "no-store" },
        })
      }
    }
  }

  const file = await db.query.questionFiles.findFirst({
    columns: { fileUrl: true, fileType: true },
    where: and(
      eq(questionFiles.questionId, id),
      eq(questionFiles.order, order)
    ),
  })

  if (!file) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  try {
    const fileRes = await fetch(file.fileUrl)
    const blob = await fileRes.blob()
    const ext = file.fileType === "image" ? "png" : "pdf"
    const filename = `${row.title?.trim() || "question-paper"}-page-${order + 1}.${ext}`
    return new NextResponse(blob, {
      headers: {
        "Content-Disposition": `attachment; filename="${encodeURIComponent(filename)}"`,
        "Content-Type": file.fileType === "image" ? "image/png" : "application/pdf",
        "Cache-Control": "no-store",
      },
    })
  } catch {
    return NextResponse.redirect(file.fileUrl, {
      headers: { "Cache-Control": "no-store" },
    })
  }
}
