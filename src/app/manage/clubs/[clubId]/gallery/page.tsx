import { notFound } from "next/navigation"
import { auth } from "@/lib/auth/auth"
import { redirect } from "next/navigation"
import { getClubDetail } from "@/lib/db/queries/clubs"
import { db } from "@/lib/db"
import { clubGalleryAlbums } from "@/lib/db/schema/club-gallery-albums"
import { clubs } from "@/lib/db/schema/clubs"
import { eq } from "drizzle-orm"
import { GalleryAlbumClient } from "@/components/clubs/GalleryAlbumClient"

export default async function ManageGalleryPage({
  params,
}: {
  params: { clubId: string }
}) {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")
  if (session.user.role !== "admin") redirect("/")

  const data = await getClubDetail(params.clubId)
  if (!data) notFound()

  const albums = await db.query.clubGalleryAlbums.findMany({
    where: eq(clubGalleryAlbums.clubId, params.clubId),
    orderBy: [clubGalleryAlbums.displayOrder],
  })

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
      <div className="mb-8">
        <h1 className="font-heading text-3xl font-bold text-foreground">
          Manage Gallery
        </h1>
        <p className="text-muted-foreground mt-1">
          Create and manage gallery albums for {data.club.name}.
        </p>
      </div>

      <GalleryAlbumClient clubId={params.clubId} initialAlbums={albums} />
    </main>
  )
}
