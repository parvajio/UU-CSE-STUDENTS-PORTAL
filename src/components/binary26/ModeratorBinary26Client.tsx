"use client"

import { useState } from "react"
import { markBinary26Paid, searchBinary26Ticket } from "@/lib/binary26/actions"
import { Search, CheckCircle2, AlertCircle, Ticket, User, Mail, Phone, MapPin, Calendar, Check, Loader2 } from "lucide-react"

interface RegistrationRecord {
  id: string
  ticketNumber: string
  fullName: string
  phone: string
  email: string
  batch: string
  section: string
  pickupPoint: string
  paymentStatus: string
  markedPaidAt: string | null
  createdAt: string
  user: {
    id: string
    name?: string | null
    email?: string | null
    [key: string]: any
  } | null
  marker: {
    id: string
    name?: string | null
    email?: string | null
    [key: string]: any
  } | null
}

interface ModeratorBinary26ClientProps {
  initialRegistrations: RegistrationRecord[]
}

export function ModeratorBinary26Client({ initialRegistrations }: ModeratorBinary26ClientProps) {
  const [registrations, setRegistrations] = useState<RegistrationRecord[]>(initialRegistrations)
  const [searchQuery, setSearchQuery] = useState("")
  const [searching, setSearching] = useState(false)
  const [activeTab, setActiveTab] = useState<"all" | "unpaid" | "paid">("all")
  const [loadingTicket, setLoadingTicket] = useState<string | null>(null)
  const [actionMessage, setActionMessage] = useState<{ text: string; type: "success" | "error" } | null>(null)

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!searchQuery.trim()) {
      setRegistrations(initialRegistrations)
      return
    }

    setSearching(true)
    try {
      const results = await searchBinary26Ticket(searchQuery)
      setRegistrations(results as RegistrationRecord[])
    } catch (err) {
      console.error(err)
    } finally {
      setSearching(false)
    }
  }

  const handleMarkPaid = async (ticketNumber: string) => {
    setLoadingTicket(ticketNumber)
    setActionMessage(null)

    try {
      const res = await markBinary26Paid(ticketNumber)
      if (res.success) {
        setActionMessage({ text: `Ticket ${ticketNumber} successfully marked as Paid!`, type: "success" })
        // Update local state
        setRegistrations(prev =>
          prev.map(r => r.ticketNumber === ticketNumber ? { ...r, paymentStatus: "paid" } : r)
        )
      } else if (!res.success) {
        setActionMessage({ text: res.error || "Failed to mark as paid.", type: "error" })
      }
    } catch (err) {
      console.error(err)
      setActionMessage({ text: "An error occurred.", type: "error" })
    } finally {
      setLoadingTicket(null)
    }
  }

  const filteredRegistrations = registrations.filter(r => {
    if (activeTab === "paid") return r.paymentStatus === "paid"
    if (activeTab === "unpaid") return r.paymentStatus === "unpaid"
    return true
  })

  const paidCount = registrations.filter(r => r.paymentStatus === "paid").length
  const unpaidCount = registrations.filter(r => r.paymentStatus === "unpaid").length

  return (
    <div className="space-y-8">
      
      {/* Search & Action Bar */}
      <div className="bg-surface border border-border rounded-2xl p-6 shadow-sm space-y-4">
        <h3 className="text-lg font-heading font-bold text-foreground">Ticket Verification & Search</h3>
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by ticket number, phone, email, or name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-background border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
          <button
            type="submit"
            disabled={searching}
            className="px-6 py-2.5 rounded-xl bg-primary text-primary-foreground font-medium hover:bg-primary-hover transition-all text-sm flex items-center justify-center gap-2"
          >
            {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            <span>Search</span>
          </button>
          {searchQuery && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery("")
                setRegistrations(initialRegistrations)
              }}
              className="px-4 py-2.5 rounded-xl bg-surface border border-border text-foreground text-sm hover:bg-accent"
            >
              Reset
            </button>
          )}
        </form>

        {actionMessage && (
          <div className={`p-3 rounded-xl text-xs font-medium flex items-center gap-2 ${
            actionMessage.type === 'success' ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20' : 'bg-destructive/10 text-destructive border border-destructive/20'
          }`}>
            {actionMessage.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
            <span>{actionMessage.text}</span>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-border pb-4">
        <button
          onClick={() => setActiveTab("all")}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
            activeTab === "all" ? "bg-primary text-primary-foreground shadow-sm" : "bg-surface border border-border text-foreground hover:bg-accent"
          }`}
        >
          All Registrations ({registrations.length})
        </button>
        <button
          onClick={() => setActiveTab("unpaid")}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
            activeTab === "unpaid" ? "bg-amber-500 text-white shadow-sm" : "bg-surface border border-border text-foreground hover:bg-accent"
          }`}
        >
          Unpaid ({unpaidCount})
        </button>
        <button
          onClick={() => setActiveTab("paid")}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
            activeTab === "paid" ? "bg-emerald-600 text-white shadow-sm" : "bg-surface border border-border text-foreground hover:bg-accent"
          }`}
        >
          Paid ({paidCount})
        </button>
      </div>

      {/* Table */}
      <div className="bg-surface border border-border rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border bg-muted/40 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <th className="p-4">Ticket ID</th>
                <th className="p-4">Student Info</th>
                <th className="p-4">Batch / Sec</th>
                <th className="p-4">Pickup Point</th>
                <th className="p-4">Status</th>
                <th className="p-4">Verified By (Moderator)</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-sm">
              {filteredRegistrations.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-muted-foreground">
                    No registrations found.
                  </td>
                </tr>
              ) : (
                filteredRegistrations.map((reg) => (
                  <tr key={reg.id} className="hover:bg-muted/30 transition-all">
                    <td className="p-4 font-mono font-bold text-primary">
                      {reg.ticketNumber}
                    </td>
                    <td className="p-4">
                      <div className="font-medium text-foreground">{reg.fullName}</div>
                      <div className="text-xs text-muted-foreground">{reg.phone} • {reg.email}</div>
                    </td>
                    <td className="p-4">
                      <span className="font-semibold">Batch {reg.batch}</span>
                      <span className="text-xs text-muted-foreground block">Sec {reg.section}</span>
                    </td>
                    <td className="p-4 text-muted-foreground">
                      {reg.pickupPoint}
                    </td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold uppercase ${
                        reg.paymentStatus === 'paid' 
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' 
                          : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                      }`}>
                        {reg.paymentStatus}
                      </span>
                    </td>
                    <td className="p-4 text-xs text-muted-foreground">
                      {reg.paymentStatus === 'paid' && reg.marker ? (
                        <div>
                          <div className="font-medium text-foreground">{reg.marker.name || "Unknown Moderator"}</div>
                          <div>{reg.marker.email}</div>
                        </div>
                      ) : (
                        <span className="italic">—</span>
                      )}
                    </td>
                    <td className="p-4 text-right">
                      {reg.paymentStatus === 'unpaid' ? (
                        <button
                          onClick={() => handleMarkPaid(reg.ticketNumber)}
                          disabled={loadingTicket === reg.ticketNumber}
                          className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white font-medium hover:bg-emerald-700 transition-all text-xs inline-flex items-center gap-1.5 disabled:opacity-50"
                        >
                          {loadingTicket === reg.ticketNumber ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Check className="w-3.5 h-3.5" />
                          )}
                          <span>Mark Paid</span>
                        </button>
                      ) : (
                        <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400 inline-flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Verified</span>
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  )
}
