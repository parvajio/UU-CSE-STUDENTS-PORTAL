import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { auth } from "@/lib/auth/auth"
import { getQuestionDetail } from "@/lib/db/queries/question-bank"
import { QuestionDetailView } from "@/components/question-bank/QuestionDetailView"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  const session = await auth()
  const viewerRole = session?.user?.role ?? "guest"
  const question = await getQuestionDetail(id, viewerRole)
  return {
    title: question?.title ?? "Question not found",
  }
}

export default async function QuestionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const session = await auth()
  const viewerRole = session?.user?.role ?? "guest"
  const question = await getQuestionDetail(id, viewerRole)

  if (!question) notFound()

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6">
      <QuestionDetailView question={question} viewerRole={viewerRole} />
    </main>
  )
}