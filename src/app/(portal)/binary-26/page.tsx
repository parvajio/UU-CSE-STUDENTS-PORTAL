import { auth } from "@/lib/auth/auth"
import { getBinary26Gallery, getBinary26EventSettings, getUserRegistrations } from "@/lib/binary26/actions"
import { Binary26Form } from "@/components/binary26/Binary26Form"
import { Binary26Gallery } from "@/components/binary26/Binary26Gallery"
import { Ticket, Calendar, MapPin, CheckCircle, Clock, ArrowRight, ShieldAlert } from "lucide-react"
import Link from "next/link"

export default async function Binary26Page() {
  const session = await auth()
  const galleryItems = await getBinary26Gallery()
  const eventSettings = await getBinary26EventSettings()
  const userRegs = session?.user?.id ? await getUserRegistrations() : []

  return (
    <div className="min-h-screen bg-background text-foreground py-12">
      <div className="container mx-auto px-4 max-w-6xl space-y-16">
        
        {/* Header Section */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/10 border border-primary/25 text-primary text-xs font-semibold tracking-wide">
            <Ticket className="w-3.5 h-3.5" />
            <span>Official Event Registration</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-heading font-bold tracking-tight text-foreground">
            {eventSettings.title}
          </h1>
          <p className="text-lg text-muted-foreground leading-relaxed">
            Register for Binary 26, secure your ticket, and complete your offline payment at the 5th floor. Join your peers and batchmates for the ultimate departmental gathering.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-6 pt-2 text-sm font-medium text-muted-foreground">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-primary" />
              <span>{new Date(eventSettings.eventTime).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-primary" />
              <span>{eventSettings.location}</span>
            </div>
          </div>
        </div>

        {/* User Existing Tickets Summary (if logged in) */}
        {session?.user?.id && userRegs.length > 0 && (
          <div className="bg-primary/5 border border-primary/20 rounded-2xl p-6 md:p-8 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-heading font-bold text-foreground flex items-center gap-2">
                <Ticket className="w-5 h-5 text-primary" />
                <span>Your Registered Tickets ({userRegs.length})</span>
              </h3>
              <Link href="/profile" className="text-sm font-medium text-primary hover:underline inline-flex items-center gap-1">
                <span>View Profile & Tickets</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {userRegs.map((reg) => (
                <div key={reg.id} className="bg-surface border border-border rounded-xl p-4 space-y-3 shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-primary text-sm">{reg.ticketNumber}</span>
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
                    <p><strong>Batch:</strong> {reg.batch} (Sec {reg.section})</p>
                    <p><strong>Pickup:</strong> {reg.pickupPoint}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Registration Form / Login Prompt */}
        {session?.user?.id ? (
          <Binary26Form />
        ) : (
          <div className="bg-surface border border-border rounded-2xl p-10 text-center max-w-xl mx-auto space-y-4">
            <div className="w-12 h-12 rounded-full bg-primary/10 text-primary mx-auto flex items-center justify-center">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-heading font-bold text-foreground">Authentication Required</h3>
            <p className="text-sm text-muted-foreground">
              Please log in to your student account to submit your Binary 26 registration and obtain your ticket.
            </p>
            <div className="pt-2">
              <Link
                href="/login?callbackUrl=/binary-26"
                className="inline-flex items-center justify-center px-6 py-3 rounded-xl bg-primary text-primary-foreground font-medium hover:bg-primary-hover transition-all text-sm"
              >
                Log In to Register
              </Link>
            </div>
          </div>
        )}

        {/* Previous Binary Clicks Gallery / Carousel */}
        <Binary26Gallery items={galleryItems} />

      </div>
    </div>
  )
}
