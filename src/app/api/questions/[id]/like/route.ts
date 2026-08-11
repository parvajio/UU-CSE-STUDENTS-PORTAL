import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"
import { revalidateTag } from "next/cache"
import { and, count, eq } from "drizzle-orm"
import { db } from "@/lib/db"
import { questionLikes, questions } from "@/lib/db/schema"
import { auth } from "@/lib/auth/auth"

export const dynamic = "force-dynamic"

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 })
  }

  const { id } = await params

  const question = await db.query.questions.findFirst({
    columns: { id: true, status: true },
    where: eq(questions.id, id),
  })
  if (!question || question.status !== "approved") {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  const existing = await db.query.questionLikes.findFirst({
    columns: { id: true },
    where: and(
      eq(questionLikes.questionId, id),
      eq(questionLikes.userId, session.user.id)
    ),
  })

  let liked: boolean
  if (existing) {
    await db.delete(questionLikes).where(eq(questionLikes.id, existing.id))
    liked = false
  } else {
    await db
      .insert(questionLikes)
      .values({ questionId: id, userId: session.user.id })
      .onConflictDoNothing({
        target: [questionLikes.questionId, questionLikes.userId],
      })
    liked = true
  }

  const countRows = await db
    .select({ value: count() })
    .from(questionLikes)
    .where(eq(questionLikes.questionId, id))
  const likeCount = countRows[0]?.value ?? 0

  revalidateTag("question-bank")

  return NextResponse.json(
    { liked, count: likeCount },
    {
      headers: { "Cache-Control": "no-store" },
    }
  )
}