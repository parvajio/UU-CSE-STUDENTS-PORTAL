import { notFound } from "next/navigation"
import { getClubDetail } from "@/lib/db/queries/clubs"
import { ClubDetailPage } from "@/components/clubs/ClubDetailPage"

export default async function ClubDetailPageRoute({
  params,
}: {
  params: { clubId: string }
}) {
  const data = await getClubDetail(params.clubId)
  if (!data) notFound()

  return <ClubDetailPage data={data} />
}
