import { NextResponse } from "next/server"
import { auth } from "@/lib/auth/auth"
import {
  getRecentNotifications,
  getUnreadCount,
  markAsRead,
} from "@/lib/db/queries/notifications"

export async function GET(request: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const userId = session.user.id

  const { searchParams } = new URL(request.url)
  const markReadId = searchParams.get("markRead")
  if (markReadId) {
    await markAsRead(markReadId, userId)
  }

  const [unreadCount, notifications] = await Promise.all([
    getUnreadCount(userId),
    getRecentNotifications(userId, 10),
  ])

  return NextResponse.json(
    { unreadCount, notifications },
    { headers: { "Cache-Control": "no-store" } }
  )
}
