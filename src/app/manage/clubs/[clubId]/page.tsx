import { notFound } from "next/navigation"
import { auth } from "@/lib/auth/auth"
import { redirect } from "next/navigation"
import { getClubDetail } from "@/lib/db/queries/clubs"
import { ManageClubMembersClient } from "@/components/clubs/ManageClubMembersClient"

export default async function ManageClubDetailPage({
  params,
}: {
  params: { clubId: string }
}) {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")
  if (session.user.role !== "admin") redirect("/")

  const data = await getClubDetail(params.clubId)
  if (!data) notFound()

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
      <div className="mb-8">
        <h1 className="font-heading text-3xl font-bold text-foreground">
          Manage Club
        </h1>
      </div>
      <ManageClubMembersClient
        clubId={params.clubId}
        initialMembers={data.members}
      />
    </main>
  )
}
