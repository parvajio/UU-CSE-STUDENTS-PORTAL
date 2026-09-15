import { notFound } from "next/navigation"
import { auth } from "@/lib/auth/auth"
import { redirect } from "next/navigation"
import { getClubDetail } from "@/lib/db/queries/clubs"
import { db } from "@/lib/db"
import { clubAchievements } from "@/lib/db/schema/club-achievements"
import { clubs } from "@/lib/db/schema/clubs"
import { eq } from "drizzle-orm"
import { AchievementsClient } from "@/components/clubs/AchievementsClient"

export default async function ManageAchievementsPage({
  params,
}: {
  params: { clubId: string }
}) {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")
  if (session.user.role !== "admin") redirect("/")

  const data = await getClubDetail(params.clubId)
  if (!data) notFound()

  const achievements = await db.query.clubAchievements.findMany({
    where: eq(clubAchievements.clubId, params.clubId),
    orderBy: [clubAchievements.createdAt],
  })

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
      <div className="mb-8">
        <h1 className="font-heading text-3xl font-bold text-foreground">
          Manage Achievements
        </h1>
        <p className="text-muted-foreground mt-1">
          Create and manage achievements for {data.club.name}.
        </p>
      </div>

      <AchievementsClient clubId={params.clubId} initialAchievements={achievements} />
    </main>
  )
}
