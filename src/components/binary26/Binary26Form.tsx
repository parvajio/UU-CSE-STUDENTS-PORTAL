"use client"

import { useState } from "react"
import { submitBinary26Registration } from "@/lib/binary26/actions"
import { Binary26SuccessModal } from "./Binary26SuccessModal"
import { Ticket, User, Phone, Mail, GraduationCap, MapPin, Loader2, AlertCircle, IdCard, Users, Bus } from "lucide-react"

export function Binary26Form() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successTicket, setSuccessTicket] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    fullName: "",
    studentId: "",
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
            Fill in your details below to register for Binary 26. Your <span className="font-medium text-foreground">Student ID</span> is verified
            at offline payment — you will receive a unique ticket number upon submission.
          </p>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="space-y-8">
          {/* Personal details */}
          <fieldset className="space-y-4">
            <legend className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-primary pb-1">
              <User className="w-3.5 h-3.5" strokeWidth={1.5} />
              <span>Personal Details</span>
              <span className="h-px flex-1 bg-border ml-2" aria-hidden />
            </legend>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Full Name */}
              <div className="space-y-2">
                <label htmlFor="bin26-fullName" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-primary" strokeWidth={1.5} />
                  <span>Full Name <span className="text-destructive">*</span></span>
                </label>
                <input
                  id="bin26-fullName"
                  type="text"
                  required
                  autoComplete="name"
                  placeholder="e.g. Tanvir Ahmed"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-background border border-border text-foreground text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/60 transition-all"
                />
              </div>

              {/* Phone Number */}
              <div className="space-y-2">
                <label htmlFor="bin26-phone" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-primary" strokeWidth={1.5} />
                  <span>Phone Number <span className="text-destructive">*</span></span>
                </label>
                <input
                  id="bin26-phone"
                  type="tel"
                  required
                  autoComplete="tel"
                  inputMode="tel"
                  placeholder="e.g. 017XXXXXXXX"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-background border border-border text-foreground text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/60 transition-all"
                />
              </div>

              {/* Email */}
              <div className="space-y-2 md:col-span-2">
                <label htmlFor="bin26-email" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-primary" strokeWidth={1.5} />
                  <span>Email Address <span className="text-destructive">*</span></span>
                </label>
                <input
                  id="bin26-email"
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="e.g. student@gmail.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-background border border-border text-foreground text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/60 transition-all"
                />
              </div>
            </div>
          </fieldset>

          {/* Academic details */}
          <fieldset className="space-y-4">
            <legend className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-primary pb-1">
              <GraduationCap className="w-3.5 h-3.5" strokeWidth={1.5} />
              <span>Academic Details</span>
              <span className="h-px flex-1 bg-border ml-2" aria-hidden />
            </legend>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* Student ID */}
              <div className="space-y-2 md:col-span-1">
                <label htmlFor="bin26-studentId" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <IdCard className="w-3.5 h-3.5 text-primary" strokeWidth={1.5} />
                  <span>Student ID <span className="text-destructive">*</span></span>
                </label>
                <input
                  id="bin26-studentId"
                  type="text"
                  required
                  autoComplete="off"
                  spellCheck={false}
                  placeholder="e.g. CSE-68-001"
                  value={formData.studentId}
                  onChange={(e) => setFormData({ ...formData, studentId: e.target.value.toUpperCase() })}
                  pattern="[A-Za-z0-9\-/]+"
                  minLength={3}
                  maxLength={30}
                  title="Letters, numbers, dashes and slashes only"
                  className="w-full px-4 py-2.5 rounded-xl bg-background border border-border text-foreground text-sm font-mono uppercase tracking-wide placeholder:text-muted-foreground/60 placeholder:normal-case placeholder:font-sans focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/60 transition-all"
                />
                <p className="text-[11px] leading-relaxed text-muted-foreground">
                  As printed on your ID card — moderators verify this at payment.
                </p>
              </div>

              {/* Batch */}
              <div className="space-y-2">
                <label htmlFor="bin26-batch" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-primary" strokeWidth={1.5} />
                  <span>Batch <span className="text-destructive">*</span></span>
                </label>
                <select
                  id="bin26-batch"
                  value={formData.batch}
                  onChange={(e) => setFormData({ ...formData, batch: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-background border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/60 transition-all"
                >
                  {batches.map((b) => (
                    <option key={b} value={b}>Batch {b}</option>
                  ))}
                </select>
              </div>

              {/* Section */}
              <div className="space-y-2">
                <label htmlFor="bin26-section" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <GraduationCap className="w-3.5 h-3.5 text-primary" strokeWidth={1.5} />
                  <span>Section <span className="text-destructive">*</span></span>
                </label>
                <select
                  id="bin26-section"
                  value={formData.section}
                  onChange={(e) => setFormData({ ...formData, section: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-background border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/60 transition-all"
                >
                  {sections.map((sec) => (
                    <option key={sec} value={sec}>Section {sec}</option>
                  ))}
                </select>
              </div>
            </div>
          </fieldset>

          {/* Logistics */}
          <fieldset className="space-y-4">
            <legend className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-primary pb-1">
              <Bus className="w-3.5 h-3.5" strokeWidth={1.5} />
              <span>Transport</span>
              <span className="h-px flex-1 bg-border ml-2" aria-hidden />
            </legend>
            {/* Pickup Point */}
            <div className="space-y-2">
              <label htmlFor="bin26-pickup" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-primary" strokeWidth={1.5} />
                <span>Pickup Point <span className="text-destructive">*</span></span>
              </label>
              <input
                id="bin26-pickup"
                type="text"
                required
                list="bin26-pickup-suggestions"
                placeholder="e.g. Campus / Khalpar / Mirpur"
                value={formData.pickupPoint}
                onChange={(e) => setFormData({ ...formData, pickupPoint: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-background border border-border text-foreground text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/60 transition-all"
              />
              <datalist id="bin26-pickup-suggestions">
                <option value="Campus" />
                <option value="Khalpar" />
                <option value="Mirpur" />
                <option value="Uttara" />
              </datalist>
              <p className="text-[11px] leading-relaxed text-muted-foreground">
                Choose the closest boarding point — buses are assigned from this.
              </p>
            </div>
          </fieldset>
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
