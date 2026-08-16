import { auth } from "@/lib/auth/auth"
import { getBinary26EventSettings, getBinary26Gallery } from "@/lib/binary26/actions"
import { AdminBinary26Client } from "@/components/binary26/AdminBinary26Client"
import { ShieldCheck, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { redirect } from "next/navigation"

export default async function AdminBinary26ManagePage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")
  if (session.user.role !== "admin") {
    redirect("/")
  }

  const initialSettings = await getBinary26EventSettings()
  const initialGallery = await getBinary26Gallery()

  return (
    <div className="min-h-screen bg-background text-foreground py-12">
      <div className="container mx-auto px-4 max-w-6xl space-y-8">
        
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Admin Management</span>
            </div>
            <h1 className="text-3xl font-heading font-bold text-foreground">
              Binary 26 Administration
            </h1>
            <p className="text-sm text-muted-foreground">
              Configure event timers, locations, titles, and manage previous binary clicks gallery photos.
            </p>
          </div>
          <Link
            href="/binary-26"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-surface border border-border text-foreground text-sm font-medium hover:bg-accent transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>View Event</span>
          </Link>
        </div>

        <AdminBinary26Client 
          initialSettings={initialSettings}
          initialGallery={initialGallery}
        />

      </div>
    </div>
  )
}
