import { auth } from "@/lib/auth/auth"
import { getAllRegistrations } from "@/lib/binary26/actions"
import { ModeratorBinary26Client } from "@/components/binary26/ModeratorBinary26Client"
import { ShieldCheck, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { redirect } from "next/navigation"

export default async function ModeratorBinary26Page() {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")
  if (session.user.role !== "admin" && session.user.role !== "moderator") {
    redirect("/")
  }

  const res = await getAllRegistrations()
  const registrations = res.success && 'data' in res ? (res.data as any[]) : []

  return (
    <div className="min-h-screen bg-background text-foreground py-12">
      <div className="container mx-auto px-4 max-w-7xl space-y-8">
        
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Moderator & Admin Portal</span>
            </div>
            <h1 className="text-3xl font-heading font-bold text-foreground">
              Binary 26 Payment Verification
            </h1>
            <p className="text-sm text-muted-foreground">
              Search attendee ticket numbers, verify offline cash payments at the 5th floor, and review paid/unpaid lists.
            </p>
          </div>
          <Link
            href="/binary-26"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-surface border border-border text-foreground text-sm font-medium hover:bg-accent transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Event</span>
          </Link>
        </div>

        <ModeratorBinary26Client initialRegistrations={registrations} />

      </div>
    </div>
  )
}
