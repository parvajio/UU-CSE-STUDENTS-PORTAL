"use server"

import { max } from "drizzle-orm"
import { revalidatePath, revalidateTag } from "next/cache"
import { redirect } from "next/navigation"
import { auth } from "@/lib/auth/auth"
import { db } from "@/lib/db"
import { profiles } from "@/lib/db/schema"
import {
  getCurrentBatch,
  upsertSiteConfig,
} from "@/lib/db/queries/site-config"

export type UpdateCurrentBatchResult =
  | { success: true; currentBatch: number }
  | { success: false; error: string }

function fail(error: string): UpdateCurrentBatchResult {
  return { success: false, error }
}

export async function updateCurrentBatch(
  batch: number
): Promise<UpdateCurrentBatchResult> {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")
  if (session.user.role !== "admin") {
    return fail("Only admins can change site settings.")
  }

  if (!Number.isInteger(batch) || batch < 1) {
    return fail("Batch must be a positive whole number.")
  }

  const current = await getCurrentBatch()
  if (batch < current) {
    const highest = await db
      .select({ value: max(profiles.batchNumber) })
      .from(profiles)
    const highestOnFile = highest[0]?.value ?? current
    const min = Math.max(current, highestOnFile)
    return fail(
      `Current batch can't be lowered below ${current}. It must stay at or above ${min} — existing profiles are on file up to batch ${highestOnFile}, and lowering it would make those profiles invalid.`
    )
  }

  await upsertSiteConfig("currentBatch", batch, session.user.id)

  revalidateTag("site-config")
  revalidatePath("/manage/settings")

  return { success: true, currentBatch: batch }
}
