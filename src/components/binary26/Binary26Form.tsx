"use client"

import { useState } from "react"
import { submitBinary26Registration } from "@/lib/binary26/actions"
import { Binary26SuccessModal } from "./Binary26SuccessModal"
import { Ticket, User, Phone, Mail, GraduationCap, MapPin, Loader2, AlertCircle } from "lucide-react"

export function Binary26Form() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successTicket, setSuccessTicket] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    email: "",
    batch: "68",
    section: "A",
    pickupPoint: "",
  })

  const batches = ["68", "67", "66", "65", "64", "63", "62", "61", "60", "59", "58"]
  const sections = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L"]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const res = await submitBinary26Registration(formData)
      if (res.success && res.ticketNumber) {
        setSuccessTicket(res.ticketNumber)
      } else if (!res.success) {
        setError(res.error || "Failed to submit registration.")
      }
    } catch (err) {
      console.error(err)
      setError("An unexpected error occurred.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="bg-surface border border-border rounded-2xl p-6 md:p-8 shadow-sm space-y-6">
        <div className="space-y-2">
          <h3 className="text-xl font-heading font-bold text-foreground">
            Binary 26 Registration Form
          </h3>
          <p className="text-sm text-muted-foreground">
            Fill in your details below to register for Binary 26. You will receive a unique ticket number upon submission.
          </p>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Full Name */}
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-primary" />
              <span>Full Name</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Tanvir Ahmed"
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl bg-background border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
            />
          </div>

          {/* Phone Number */}
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-primary" />
              <span>Phone Number</span>
            </label>
            <input
              type="tel"
              required
              placeholder="e.g. 017xxxxxxxx"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl bg-background border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
            />
          </div>

          {/* Email */}
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-primary" />
              <span>Email Address</span>
            </label>
            <input
              type="email"
              required
              placeholder="e.g. student@gmail.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl bg-background border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
            />
          </div>

          {/* Batch */}
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <GraduationCap className="w-3.5 h-3.5 text-primary" />
              <span>Batch</span>
            </label>
            <select
              value={formData.batch}
              onChange={(e) => setFormData({ ...formData, batch: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl bg-background border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
            >
              {batches.map((b) => (
                <option key={b} value={b}>Batch {b}</option>
              ))}
            </select>
          </div>

          {/* Section */}
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <GraduationCap className="w-3.5 h-3.5 text-primary" />
              <span>Section</span>
            </label>
            <select
              value={formData.section}
              onChange={(e) => setFormData({ ...formData, section: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl bg-background border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
            >
              {sections.map((sec) => (
                <option key={sec} value={sec}>Section {sec}</option>
              ))}
            </select>
          </div>

          {/* Pickup Point */}
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-primary" />
              <span>Pickup Point</span>
            </label>
            <input
              type="text"
              required
              placeholder="E.g khalpar/campus"
              value={formData.pickupPoint}
              onChange={(e) => setFormData({ ...formData, pickupPoint: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl bg-background border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
            />
          </div>
        </div>

        <div className="pt-4 border-t border-border flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="w-full md:w-auto px-8 py-3 rounded-xl bg-primary text-primary-foreground font-medium shadow-[0_2px_10px_rgba(91,95,239,0.3)] hover:bg-primary-hover transition-all flex items-center justify-center gap-2 disabled:opacity-50 text-sm"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Generating Ticket...</span>
              </>
            ) : (
              <>
                <Ticket className="w-4 h-4" />
                <span>Submit & Get Ticket</span>
              </>
            )}
          </button>
        </div>
      </form>

      {successTicket && (
        <Binary26SuccessModal
          ticketNumber={successTicket}
          onClose={() => setSuccessTicket(null)}
        />
      )}
    </>
  )
}
