import { and, count, desc, eq } from "drizzle-orm"
import { db } from "@/lib/db"
import { notifications } from "@/lib/db/schema"

export type NotificationItem = {
  id: string
  type: string
  title: string
  message: string | null
  resourceType: string | null
  resourceId: string | null
  read: boolean
  createdAt: string
}

export async function getUnreadCount(userId: string): Promise<number> {
  const rows = await db
    .select({ value: count() })
    .from(notifications)
    .where(and(eq(notifications.userId, userId), eq(notifications.read, false)))
  return rows[0]?.value ?? 0
}

export async function getRecentNotifications(
  userId: string,
  limit = 10
): Promise<NotificationItem[]> {
  const rows = await db.query.notifications.findMany({
    where: eq(notifications.userId, userId),
    orderBy: (table, { desc }) => [desc(table.createdAt)],
    limit,
  })
  return rows.map((row) => ({
    id: row.id,
    type: row.type,
    title: row.title,
    message: row.message,
    resourceType: row.resourceType,
    resourceId: row.resourceId,
    read: row.read,
    createdAt: row.createdAt,
  }))
}

export async function markAsRead(
  notificationId: string,
  userId: string
): Promise<void> {
  await db
    .update(notifications)
    .set({ read: true })
    .where(
      and(
        eq(notifications.id, notificationId),
        eq(notifications.userId, userId)
      )
    )
}

export async function insertNotification(input: {
  userId: string
  type: string
  title: string
  message?: string
  resourceType?: string
  resourceId?: string
}): Promise<void> {
  await db.insert(notifications).values({
    userId: input.userId,
    type: input.type,
    title: input.title,
    message: input.message ?? null,
    resourceType: input.resourceType ?? null,
    resourceId: input.resourceId ?? null,
  })
}
