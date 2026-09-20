import { notFound } from "next/navigation"
import Link from "next/link"
import { auth } from "@/lib/auth/auth"
import { redirect } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { getClubDetail } from "@/lib/db/queries/clubs"
import { db } from "@/lib/db"
import { clubGalleryAlbums } from "@/lib/db/schema/club-gallery-albums"
import { clubs } from "@/lib/db/schema/clubs"
import { eq } from "drizzle-orm"
import { GalleryAlbumClient } from "@/components/clubs/GalleryAlbumClient"

export default async function ManageGalleryPage({
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

  const albums = await db.query.clubGalleryAlbums.findMany({
    where: eq(clubGalleryAlbums.clubId, clubId),
    orderBy: [clubGalleryAlbums.displayOrder],
  })

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
      <Link
        href={`/manage/clubs/${clubId}`}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
      >
        <ArrowLeft className="size-4" strokeWidth={1.5} />
        Back to {data.club.name}
      </Link>
      <div className="mb-8">
        <h1 className="font-heading text-3xl font-bold text-foreground">
          Manage Gallery
        </h1>
        <p className="text-muted-foreground mt-1">
          Create and manage gallery albums for {data.club.name}.
        </p>
      </div>

      <GalleryAlbumClient clubId={clubId} initialAlbums={albums} />
    </main>
  )
}
