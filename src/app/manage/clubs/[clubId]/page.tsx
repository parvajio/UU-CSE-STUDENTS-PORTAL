import { notFound } from "next/navigation"
import Link from "next/link"
import { auth } from "@/lib/auth/auth"
import { redirect } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { getClubDetail, getDepartmentsWithClubs } from "@/lib/db/queries/clubs"
import { ManageClubMembersClient } from "@/components/clubs/ManageClubMembersClient"
import { ManageClubDetailClient } from "@/components/clubs/ManageClubDetailClient"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"

export default async function ManageClubDetailPage({
  params,
}: {
  params: Promise<{ clubId: string }>
}) {
  const { clubId } = await params
  const session = await auth()
  if (!session?.user?.id) redirect("/login")
  if (session.user.role !== "admin" && session.user.role !== "moderator") redirect("/")

  const data = await getClubDetail(clubId)
  if (!data) notFound()

  const groups = await getDepartmentsWithClubs()
  const departments = groups.map((g) => ({
    id: g.department.id,
    name: g.department.name,
    slug: g.department.slug,
  }))

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
      <Link
        href="/manage/clubs"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
      >
        <ArrowLeft className="size-4" strokeWidth={1.5} />
        Back to Club Management
      </Link>

      <div className="mb-8 flex items-center gap-4">
        <Avatar className="h-14 w-14 shrink-0">
          <AvatarImage src={data.club.logoUrl ?? undefined} alt={`${data.club.name} logo`} />
          <AvatarFallback className="bg-primary/10 text-primary font-bold text-lg">
            {data.club.name.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="font-heading text-3xl font-bold text-foreground truncate">
              {data.club.name}
            </h1>
            <Badge variant="secondary">{data.club.department?.name}</Badge>
            <Badge variant="default">{data.club.status}</Badge>
          </div>
          <p className="text-muted-foreground mt-1">
            Edit details, manage members, gallery, achievements and events.
          </p>
        </div>
      </div>

      <div className="space-y-8">
        <ManageClubDetailClient
          club={{
            id: data.club.id,
            name: data.club.name,
            description: data.club.description,
            departmentId: data.club.departmentId,
            departmentName: data.club.department?.name ?? "",
            status: data.club.status,
            logoUrl: data.club.logoUrl,
            coverImgUrl: data.club.coverImgUrl,
            msgGroupUrl: data.club.msgGroupUrl,
            pageUrl: data.club.pageUrl,
            fbGroupUrl: data.club.fbGroupUrl,
            contacts: data.club.contacts,
            mail: data.club.mail,
            updatedAt: data.club.updatedAt,
          }}
          departments={departments}
          counts={{
            members: data.members.length,
            albums: data.albums.length,
            achievements: data.achievements.length,
            events: data.events.length,
          }}
        />

        <div id="club-members" className="scroll-mt-24">
          <ManageClubMembersClient
            clubId={clubId}
            initialMembers={data.members}
          />
        </div>
      </div>
    </main>
  )
}
