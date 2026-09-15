import { auth } from "@/lib/auth/auth"
import { redirect } from "next/navigation"
import { Badge } from "@/components/ui/badge"

export default async function ManageAchievementsPage({
  params,
}: {
  params: { clubId: string }
}) {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")
  if (session.user.role !== "admin") redirect("/")

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
      <h1 className="font-heading text-3xl font-bold text-foreground">
        Manage Achievements
      </h1>
    </main>
  )
}
