import { getUserRegistrations } from "@/lib/binary26/actions"
import { Ticket, CheckCircle2, Clock, MapPin } from "lucide-react"
import Link from "next/link"

export async function UserTicketsCard() {
  const regs = await getUserRegistrations()

  if (!regs || regs.length === 0) {
    return (
      <div className="bg-surface border border-border rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-heading font-bold text-foreground flex items-center gap-2">
            <Ticket className="w-5 h-5 text-primary" />
            <span>Binary 26 Tickets</span>
          </h3>
          <Link href="/binary-26" className="text-xs font-medium text-primary hover:underline">
            Register Now
          </Link>
        </div>
        <p className="text-sm text-muted-foreground">
          You have not registered for Binary 26 yet. Get your ticket and pay offline at the 5th floor.
        </p>
      </div>
    )
  }

  return (
    <div className="bg-surface border border-border rounded-2xl p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-heading font-bold text-foreground flex items-center gap-2">
          <Ticket className="w-5 h-5 text-primary" />
          <span>Your Binary 26 Tickets ({regs.length})</span>
        </h3>
        <Link href="/binary-26" className="text-xs font-medium text-primary hover:underline">
          Register Another
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {regs.map((reg) => (
          <div key={reg.id} className="bg-background border border-border rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-mono font-bold text-primary text-sm tracking-wide">{reg.ticketNumber}</span>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase ${
                reg.paymentStatus === 'paid' 
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' 
                  : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
              }`}>
                {reg.paymentStatus}
              </span>
            </div>

            <div className="text-xs text-muted-foreground space-y-1">
              <p><strong>Name:</strong> {reg.fullName}</p>
              <p><strong>Batch:</strong> {reg.batch} • Section {reg.section}</p>
              <p className="flex items-center gap-1">
                <MapPin className="w-3 h-3 text-primary" />
                <span>Pickup: {reg.pickupPoint}</span>
              </p>
            </div>

            {reg.paymentStatus === 'unpaid' && (
              <div className="text-[11px] text-amber-600 dark:text-amber-400 bg-amber-500/10 p-2 rounded-lg border border-amber-500/20 space-y-1">
                <p>Pending offline payment at 5th floor using ticket ID <strong>{reg.ticketNumber}</strong>.</p>
                <p>টিকেট আইডি <strong>{reg.ticketNumber}</strong> দিয়ে ৫ তলায় অফলাইন পেমেন্ট সম্পন্ন করুন।</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
