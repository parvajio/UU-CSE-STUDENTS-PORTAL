import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { Settings2 } from "lucide-react"
import { auth } from "@/lib/auth/auth"
import { getCurrentBatch } from "@/lib/db/queries/site-config"
import { SiteSettingsForm } from "@/components/admin/SiteSettingsForm"

export const metadata: Metadata = {
  title: "Site Settings",
}

export default async function SettingsPage() {
  const session = await auth()

  if (!session?.user?.id) redirect("/login")
  if (session.user.role !== "admin") redirect("/")

  const currentBatch = await getCurrentBatch()

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6">
      <div className="mb-8 flex items-center gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
          <Settings2 className="size-6" strokeWidth={1.5} />
        </span>
        <div>
          <h1 className="font-heading text-3xl font-semibold text-foreground">
            Site Settings
          </h1>
          <p className="mt-1 text-muted-foreground">
            Manage department-wide configuration.
          </p>
        </div>
      </div>

      <SiteSettingsForm initialBatch={currentBatch} />
    </main>
  )
}
