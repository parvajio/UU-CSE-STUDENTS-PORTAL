"use server"

import { revalidateTag } from "next/cache"
import { auth } from "@/lib/auth/auth"
import { incrementDownloadCount } from "@/lib/db/queries/question-bank"

export async function recordDownload(
  questionId: string
): Promise<{ success: boolean }> {
  const session = await auth()
  if (!session?.user?.id) return { success: false }

  await incrementDownloadCount(questionId)
  revalidateTag("question-bank")
  return { success: true }
}