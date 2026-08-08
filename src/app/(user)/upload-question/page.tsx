import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { auth } from "@/lib/auth/auth"
import { getCatalog } from "@/lib/db/queries/catalog"
import { getCurrentBatch } from "@/lib/db/queries/site-config"
import { UploadForm } from "@/components/question-bank/UploadForm"

export const metadata: Metadata = {
  title: "Upload Question",
}

export default async function UploadQuestionPage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  const [catalog, currentBatch] = await Promise.all([
    getCatalog(),
    getCurrentBatch(),
  ])

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6">
      <div className="mb-8">
        <h1 className="font-heading text-3xl font-semibold text-foreground">
          Upload Question
        </h1>
        <p className="mt-2 text-muted-foreground">
          Share a past paper or question with your department. It&apos;ll be
          reviewed by a moderator before it goes live.
        </p>
      </div>

      <UploadForm catalog={catalog} currentBatch={currentBatch} />
    </main>
  )
}