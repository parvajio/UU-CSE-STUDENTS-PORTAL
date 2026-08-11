import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"
import { incrementViewCount } from "@/lib/db/queries/question-bank"

export const dynamic = "force-dynamic"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const viewedKey = `viewed_${id}`
  const hasViewed = request.cookies.get(viewedKey)

  if (!hasViewed) {
    await incrementViewCount(id)
    const response = NextResponse.json({ success: true, counted: true })
    response.cookies.set(viewedKey, "true", { maxAge: 86400, path: "/" })
    return response
  }

  return NextResponse.json({ success: true, counted: false })
}
