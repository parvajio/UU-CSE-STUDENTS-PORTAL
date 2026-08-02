"use server"

import { and, eq } from "drizzle-orm"
import { revalidatePath, revalidateTag } from "next/cache"
import { redirect } from "next/navigation"
import { auth } from "@/lib/auth/auth"
import { db } from "@/lib/db"
import { notifications, profiles } from "@/lib/db/schema"
import { canApprove, type ResourceType } from "@/lib/auth/permissions"

type DecisionKind = "approved" | "rejected"

type DecideItemResult =
  | { success: true }
  | { success: false; error: string }

function fail(error: string): DecideItemResult {
  return { success: false, error }
}

type NotificationValues = typeof notifications.$inferInsert

function buildNotification(
  kind: DecisionKind,
  input: {
    userId: string
    label: string
    reason?: string
    resourceType: string
    resourceId: string
  }
): NotificationValues {
  const isApproved = kind === "approved"
  return {
    userId: input.userId,
    type: isApproved ? "approval" : "rejection",
    title: isApproved ? `${input.label} approved` : `${input.label} rejected`,
    message: isApproved
      ? `Your ${input.resourceType} has been approved.`
      : input.reason?.trim() || `Your ${input.resourceType} was not approved.`,
    resourceType: input.resourceType,
    resourceId: input.resourceId,
  }
}

type DecisionHandler = (
  kind: DecisionKind,
  resourceId: string,
  ctx: { approvedBy: string; approvedAt: string; reason?: string }
) => Promise<{ success: boolean; error?: string }>

const decisionHandlers: Partial<Record<ResourceType, DecisionHandler>> = {
  profile: async (kind, resourceId, ctx) => {
    const row = await db.query.profiles.findFirst({
      where: eq(profiles.id, resourceId),
      columns: { userId: true, fullName: true },
    })
    if (!row) {
      return { success: false, error: "Item not found." }
    }

    const updated = await db
      .update(profiles)
      .set({
        status: kind,
        approvedBy: ctx.approvedBy,
        approvedAt: ctx.approvedAt,
      })
      .where(and(eq(profiles.id, resourceId), eq(profiles.status, "pending")))
      .returning({ id: profiles.id })

    if (updated.length === 0) {
      return { success: false, error: "This item was already processed." }
    }

    await db.insert(notifications).values(
      buildNotification(kind, {
        userId: row.userId,
        label: row.fullName,
        reason: ctx.reason,
        resourceType: "profile",
        resourceId,
      })
    )

    return { success: true }
  },
}

async function decideItem(
  kind: DecisionKind,
  input: { resourceType: string; resourceId: string; reason?: string }
): Promise<DecideItemResult> {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  const resourceType = input.resourceType as ResourceType
  if (!canApprove(session.user.role, resourceType)) {
    return fail("You do not have permission to moderate this resource type.")
  }

  const handler = decisionHandlers[resourceType]
  if (!handler) return fail("Unknown resource type.")

  const result = await handler(kind, input.resourceId, {
    approvedBy: session.user.id,
    approvedAt: new Date().toISOString(),
    reason: input.reason,
  })

  if (!result.success) return fail(result.error ?? "Unable to update item.")

  revalidateTag("pending-items")
  revalidateTag("directory")
  revalidatePath("/approve")
  revalidatePath("/directory")
  revalidatePath("/my-submissions")

  return { success: true }
}

export async function approveItem(data: {
  resourceType: string
  resourceId: string
}): Promise<DecideItemResult> {
  return decideItem("approved", data)
}

export async function rejectItem(data: {
  resourceType: string
  resourceId: string
  reason?: string
}): Promise<DecideItemResult> {
  return decideItem("rejected", data)
}
