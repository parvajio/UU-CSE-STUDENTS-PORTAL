import { notFound, redirect } from "next/navigation"
import { auth } from "@/lib/auth/auth"
import { getProfileDetail } from "@/lib/db/queries/directory"
import { ProfileDetailView } from "./profile-detail-view"

type PageProps = {
  params: Promise<{ profileId: string }>
}

export default async function ProfileDetailPage({ params }: PageProps) {
  const { profileId } = await params
  const session = await auth()

  if (!session?.user?.id) {
    const callbackUrl = encodeURIComponent(`/directory/${profileId}`)
    redirect(`/login?callbackUrl=${callbackUrl}`)
  }

  const viewerRole = session.user.role ?? "user"
  const profile = await getProfileDetail(profileId, viewerRole)

  if (!profile || profile.status !== "approved") {
    notFound()
  }

  return <ProfileDetailView profile={profile} />
}
