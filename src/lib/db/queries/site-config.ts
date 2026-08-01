import { eq } from "drizzle-orm"
import { db } from "@/lib/db"
import { siteConfig } from "@/lib/db/schema"
import { CURRENT_BATCH } from "../../../../config/site"

export const CURRENT_BATCH_KEY = "currentBatch"

export async function getCurrentBatch(): Promise<number> {
  const row = await db.query.siteConfig.findFirst({
    where: eq(siteConfig.key, CURRENT_BATCH_KEY),
    columns: { value: true },
  })
  const value = row?.value
  return typeof value === "number" ? value : CURRENT_BATCH
}

export async function upsertSiteConfig(
  key: string,
  value: unknown,
  updatedBy: string
): Promise<void> {
  await db
    .insert(siteConfig)
    .values({ key, value, updatedBy })
    .onConflictDoUpdate({
      target: siteConfig.key,
      set: { value, updatedBy },
    })
}
