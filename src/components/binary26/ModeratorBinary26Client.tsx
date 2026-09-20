"use client"

import { Fragment, useMemo, useState } from "react"
import { getAllRegistrations, markBinary26Paid, searchBinary26Ticket, unmarkBinary26Paid } from "@/lib/binary26/actions"
import { Search, CheckCircle2, AlertCircle, Check, Loader2, History, Undo2, X, ShieldAlert, ChevronDown, User, Download, Printer, FileSpreadsheet } from "lucide-react"

function escapeCsv(value: string | null | undefined) {
  const s = value ?? ""
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

function escapeHtml(value: string | null | undefined) {
  return (value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

function formatDateTime(ts: string) {
  const d = new Date(ts)
  if (isNaN(d.getTime())) return ts
  return d.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

interface PaymentEventRecord {
  id: string
  action: string
  reason: string | null
  createdAt: string
  actor: {
    name?: string | null
    email?: string | null
  } | null
}

interface RegistrationRecord {
  id: string
  ticketNumber: string
  fullName: string
  studentId: string | null
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
  paymentEvents: PaymentEventRecord[]
}

interface ModeratorBinary26ClientProps {
  initialRegistrations: RegistrationRecord[]
  isAdmin: boolean
}

export function ModeratorBinary26Client({ initialRegistrations, isAdmin }: ModeratorBinary26ClientProps) {
  const [registrations, setRegistrations] = useState<RegistrationRecord[]>(initialRegistrations)
  const [searchQuery, setSearchQuery] = useState("")
  const [searching, setSearching] = useState(false)
  const [activeTab, setActiveTab] = useState<"all" | "unpaid" | "paid">("all")
  const [loadingTicket, setLoadingTicket] = useState<string | null>(null)
  const [actionMessage, setActionMessage] = useState<{ text: string; type: "success" | "error" } | null>(null)
  const [confirmReg, setConfirmReg] = useState<RegistrationRecord | null>(null)
  const [revertReg, setRevertReg] = useState<RegistrationRecord | null>(null)
  const [revertReason, setRevertReason] = useState("")
  const [expandedId, setExpandedId] = useState<string | null>(null)
  // Full (unfiltered) list — verifier counts are derived from this so they
  // stay global even while the ticket search box narrows the table.
  const [fullList, setFullList] = useState<RegistrationRecord[]>(initialRegistrations)
  const [selectedApproverId, setSelectedApproverId] = useState<string | null>(null)
  const [approverOpen, setApproverOpen] = useState(false)
  const [approverSearch, setApproverSearch] = useState("")
  const [exportOpen, setExportOpen] = useState(false)

  const refreshList = async () => {
    try {
      const res = await getAllRegistrations()
      if (res.success && "data" in res) {
        const fresh = res.data as RegistrationRecord[]
        setFullList(fresh)
        if (searchQuery.trim()) {
          const results = await searchBinary26Ticket(searchQuery)
          setRegistrations(results as RegistrationRecord[])
        } else {
          setRegistrations(fresh)
        }
      }
    } catch (err) {
      console.error(err)
    }
  }

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!searchQuery.trim()) {
      setRegistrations(fullList)
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

  const handleConfirmMarkPaid = async () => {
    if (!confirmReg) return
    const ticketNumber = confirmReg.ticketNumber
    setLoadingTicket(ticketNumber)
    setActionMessage(null)

    try {
      const res = await markBinary26Paid(ticketNumber)
      if (res.success) {
        setActionMessage({ text: `Ticket ${ticketNumber} successfully marked as Paid!`, type: "success" })
        setConfirmReg(null)
        await refreshList()
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

  const handleConfirmRevert = async () => {
    if (!revertReg) return
    if (revertReason.trim().length < 3) {
      setActionMessage({ text: "Please give a short reason for the revert (min 3 characters).", type: "error" })
      return
    }
    const ticketNumber = revertReg.ticketNumber
    setLoadingTicket(ticketNumber)
    setActionMessage(null)

    try {
      const res = await unmarkBinary26Paid(ticketNumber, revertReason.trim())
      if (res.success) {
        setActionMessage({ text: `Ticket ${ticketNumber} reverted to Unpaid. The action was logged.`, type: "success" })
        setRevertReg(null)
        setRevertReason("")
        await refreshList()
      } else if (!res.success) {
        setActionMessage({ text: res.error || "Failed to revert payment.", type: "error" })
      }
    } catch (err) {
      console.error(err)
      setActionMessage({ text: "An error occurred.", type: "error" })
    } finally {
      setLoadingTicket(null)
    }
  }

  // Verifiers (moderators/admins who marked payments) with global paid counts.
  const approvers = useMemo(() => {
    const map = new Map<string, { id: string; name: string; email: string; count: number }>()
    for (const r of fullList) {
      if (r.paymentStatus !== "paid" || !r.marker) continue
      const id = r.marker.id
      const entry = map.get(id) ?? {
        id,
        name: r.marker.name || "Unknown moderator",
        email: r.marker.email || "",
        count: 0,
      }
      entry.count += 1
      map.set(id, entry)
    }
    return [...map.values()].sort((a, b) => b.count - a.count)
  }, [fullList])

  const approverOptions = useMemo(() => {
    const q = approverSearch.trim().toLowerCase()
    if (!q) return approvers
    return approvers.filter(
      (a) => a.name.toLowerCase().includes(q) || a.email.toLowerCase().includes(q)
    )
  }, [approvers, approverSearch])

  const selectedApprover = selectedApproverId
    ? approvers.find((a) => a.id === selectedApproverId) ?? null
    : null

  const approverFiltered = selectedApproverId
    ? registrations.filter((r) => r.paymentStatus === "paid" && r.marker?.id === selectedApproverId)
    : registrations

  const filteredRegistrations = approverFiltered.filter(r => {
    if (activeTab === "paid") return r.paymentStatus === "paid"
    if (activeTab === "unpaid") return r.paymentStatus === "unpaid"
    return true
  })

  const paidCount = approverFiltered.filter(r => r.paymentStatus === "paid").length
  const unpaidCount = approverFiltered.filter(r => r.paymentStatus === "unpaid").length

  // ---- Export (always exports exactly the rows currently visible in the table) ----
  const exportFileName = (ext: string) => {
    const parts = ["binary26", activeTab]
    if (selectedApprover) {
      parts.push(
        selectedApprover.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "verifier"
      )
    }
    parts.push(new Date().toISOString().slice(0, 10))
    return `${parts.filter(Boolean).join("-")}.${ext}`
  }

  const handleExportCsv = () => {
    setExportOpen(false)
    if (filteredRegistrations.length === 0) return
    const header = ["Ticket Number", "Full Name", "Student ID", "Phone", "Email", "Batch", "Section", "Pickup Point", "Status", "Verified By", "Verifier Email", "Paid At"]
    const lines = filteredRegistrations.map((r) =>
      [
        r.ticketNumber,
        r.fullName,
        r.studentId,
        r.phone,
        r.email,
        r.batch,
        r.section,
        r.pickupPoint,
        r.paymentStatus,
        r.marker?.name,
        r.marker?.email,
        r.markedPaidAt ? formatDateTime(r.markedPaidAt) : "",
      ]
        .map(escapeCsv)
        .join(",")
    )
    // BOM prefix so Excel opens UTF-8 (Bangla names, etc.) correctly.
    const csv = "﻿" + [header.join(","), ...lines].join("\n")
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = exportFileName("csv")
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
    setActionMessage({ text: `Downloaded ${filteredRegistrations.length} ticket${filteredRegistrations.length === 1 ? "" : "s"} as CSV.`, type: "success" })
  }

  const handlePrintPdf = () => {
    setExportOpen(false)
    if (filteredRegistrations.length === 0) return
    const w = window.open("", "_blank", "width=1000,height=750")
    if (!w) {
      setActionMessage({ text: "Popup blocked — allow popups for this site to print the list.", type: "error" })
      return
    }
    const filters: string[] = [`View: ${activeTab}`]
    if (selectedApprover) filters.push(`Verifier: ${selectedApprover.name}${selectedApprover.email ? ` (${selectedApprover.email})` : ""}`)
    if (searchQuery.trim()) filters.push(`Search: “${searchQuery.trim()}”`)
    const exportedPaid = filteredRegistrations.filter((r) => r.paymentStatus === "paid").length
    const rows = filteredRegistrations
      .map(
        (r, i) => `<tr>
          <td>${i + 1}</td>
          <td class="mono">${escapeHtml(r.ticketNumber)}</td>
          <td>${escapeHtml(r.fullName)}</td>
          <td class="mono">${escapeHtml(r.studentId) || "—"}</td>
          <td>${escapeHtml(r.phone)}</td>
          <td>${escapeHtml(r.email)}</td>
          <td>${escapeHtml(r.batch)} / ${escapeHtml(r.section)}</td>
          <td>${escapeHtml(r.pickupPoint)}</td>
          <td>${escapeHtml(r.paymentStatus)}</td>
          <td>${escapeHtml(r.marker?.name) || "—"}</td>
          <td>${r.markedPaidAt ? escapeHtml(formatDateTime(r.markedPaidAt)) : "—"}</td>
        </tr>`
      )
      .join("")
    w.document.write(`<!doctype html>
<html><head><meta charset="utf-8"><title>Binary 26 Tickets — ${escapeHtml(activeTab)}</title>
<style>
  @page { size: landscape; margin: 12mm; }
  body { font-family: Arial, Helvetica, sans-serif; color: #111; margin: 24px; }
  h1 { font-size: 20px; margin: 0 0 4px; }
  .meta { font-size: 12px; color: #444; margin-bottom: 12px; }
  .meta span { margin-right: 16px; }
  table { width: 100%; border-collapse: collapse; font-size: 11px; }
  th, td { border: 1px solid #999; padding: 5px 7px; text-align: left; vertical-align: top; }
  th { background: #eee; }
  .mono { font-family: monospace; }
</style></head><body>
  <h1>Binary 26 — Ticket List</h1>
  <div class="meta">
    <span>Generated: ${escapeHtml(new Date().toLocaleString())}</span>
    <span>Total: ${filteredRegistrations.length}</span>
    <span>Paid: ${exportedPaid}</span>
    <span>Unpaid: ${filteredRegistrations.length - exportedPaid}</span><br>
    <span>${filters.map(escapeHtml).join(" &nbsp;•&nbsp; ")}</span>
  </div>
  <table><thead><tr>
    <th>#</th><th>Ticket</th><th>Name</th><th>Student ID</th><th>Phone</th><th>Email</th>
    <th>Batch/Sec</th><th>Pickup</th><th>Status</th><th>Verified By</th><th>Paid At</th>
  </tr></thead><tbody>${rows}</tbody></table>
</body></html>`)
    w.document.close()
    w.focus()
    window.setTimeout(() => w.print(), 350)
  }

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
              placeholder="Search by ticket number, student ID, phone, email, or name..."
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
                setRegistrations(fullList)
              }}
              className="px-4 py-2.5 rounded-xl bg-surface border border-border text-foreground text-sm hover:bg-accent"
            >
              Reset
            </button>
          )}
        </form>

        {/* Verifier filter: dropdown + name/email search, with per-verifier counts */}
        <div className="flex flex-wrap items-center gap-3 pt-1">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Filter by verifier
          </span>
          <div className="relative">
            <button
              type="button"
              onClick={() => setApproverOpen((v) => !v)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-background border border-border text-foreground text-sm font-medium hover:bg-accent transition-all min-w-52 justify-between"
            >
              <span className="inline-flex items-center gap-2 truncate">
                <User className="w-4 h-4 text-primary shrink-0" strokeWidth={1.5} />
                <span className="truncate">
                  {selectedApprover ? selectedApprover.name : "All verifiers"}
                </span>
              </span>
              {selectedApprover ? (
                <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[11px] font-bold shrink-0">
                  {selectedApprover.count}
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full bg-muted text-muted-foreground text-[11px] font-bold shrink-0">
                  {paidCount}
                </span>
              )}
              <ChevronDown className={`w-4 h-4 text-muted-foreground shrink-0 transition-transform ${approverOpen ? "rotate-180" : ""}`} />
            </button>

            {approverOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setApproverOpen(false)} />
                <div className="absolute z-20 mt-2 w-80 max-w-[calc(100vw-3rem)] rounded-xl border border-border bg-surface shadow-xl p-2 space-y-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                    <input
                      autoFocus
                      type="text"
                      placeholder="Search verifier by name or email..."
                      value={approverSearch}
                      onChange={(e) => setApproverSearch(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 rounded-lg bg-background border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => { setSelectedApproverId(null); setApproverOpen(false) }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${
                      !selectedApproverId ? "bg-primary/10 text-primary font-semibold" : "text-foreground hover:bg-accent"
                    }`}
                  >
                    <span>All verifiers</span>
                    <span className="text-[11px] font-bold text-muted-foreground">{paidCount} tickets</span>
                  </button>
                  {approverOptions.length === 0 ? (
                    <p className="px-3 py-2 text-xs text-muted-foreground">No verifier matches your search.</p>
                  ) : (
                    approverOptions.map((a) => (
                      <button
                        key={a.id}
                        type="button"
                        onClick={() => { setSelectedApproverId(a.id); setApproverOpen(false); setActiveTab("paid") }}
                        className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                          selectedApproverId === a.id ? "bg-primary/10 text-primary font-semibold" : "text-foreground hover:bg-accent"
                        }`}
                      >
                        <span className="min-w-0 text-left">
                          <span className="block truncate">{a.name}</span>
                          {a.email && <span className="block truncate text-[11px] font-normal text-muted-foreground">{a.email}</span>}
                        </span>
                        <span className="text-[11px] font-bold text-muted-foreground shrink-0">{a.count} ticket{a.count === 1 ? "" : "s"}</span>
                      </button>
                    ))
                  )}
                </div>
              </>
            )}
          </div>

          {selectedApprover && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/25 text-primary text-xs font-semibold">
              <span>
                {selectedApprover.name} · {approverFiltered.length} ticket{approverFiltered.length === 1 ? "" : "s"}
              </span>
              <button
                type="button"
                onClick={() => setSelectedApproverId(null)}
                className="p-0.5 rounded-full hover:bg-primary/20 transition-colors"
                aria-label="Clear verifier filter"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </span>
          )}
        </div>

        {actionMessage && (
          <div className={`p-3 rounded-xl text-xs font-medium flex items-center gap-2 ${
            actionMessage.type === 'success' ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20' : 'bg-destructive/10 text-destructive border border-destructive/20'
          }`}>
            {actionMessage.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
            <span>{actionMessage.text}</span>
          </div>
        )}
      </div>

      {/* Tabs + Export */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab("all")}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              activeTab === "all" ? "bg-primary text-primary-foreground shadow-sm" : "bg-surface border border-border text-foreground hover:bg-accent"
            }`}
          >
            All Registrations ({approverFiltered.length})
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

        <div className="relative">
          <button
            type="button"
            onClick={() => setExportOpen((v) => !v)}
            disabled={filteredRegistrations.length === 0}
            title="Download the currently filtered list for offline use"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-surface border border-border text-foreground text-sm font-medium hover:bg-accent transition-all disabled:opacity-50"
          >
            <Download className="w-4 h-4 text-primary" strokeWidth={1.5} />
            <span>Export ({filteredRegistrations.length})</span>
            <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${exportOpen ? "rotate-180" : ""}`} />
          </button>

          {exportOpen && filteredRegistrations.length > 0 && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setExportOpen(false)} />
              <div className="absolute right-0 z-20 mt-2 w-72 rounded-xl border border-border bg-surface shadow-xl p-2 space-y-1">
                <p className="px-3 pt-1.5 pb-1 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                  Exports current view
                </p>
                <button
                  type="button"
                  onClick={handleExportCsv}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-foreground hover:bg-accent transition-colors text-left"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" strokeWidth={1.5} />
                  <span>
                    <span className="block font-medium">Download CSV</span>
                    <span className="block text-[11px] text-muted-foreground">Excel-compatible offline spreadsheet</span>
                  </span>
                </button>
                <button
                  type="button"
                  onClick={handlePrintPdf}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-foreground hover:bg-accent transition-colors text-left"
                >
                  <Printer className="w-4 h-4 text-primary shrink-0" strokeWidth={1.5} />
                  <span>
                    <span className="block font-medium">Print / Save as PDF</span>
                    <span className="block text-[11px] text-muted-foreground">Opens print view — choose “Save as PDF”</span>
                  </span>
                </button>
              </div>
            </>
          )}
        </div>
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
                <th className="p-4">Paid At</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-sm">
              {filteredRegistrations.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-muted-foreground">
                    No registrations found.
                  </td>
                </tr>
              ) : (
                filteredRegistrations.map((reg) => (
                  <Fragment key={reg.id}>
                    <tr className="hover:bg-muted/30 transition-all">
                      <td className="p-4 font-mono font-bold text-primary">
                        {reg.ticketNumber}
                      </td>
                      <td className="p-4">
                        <div className="font-medium text-foreground">{reg.fullName}</div>
                        {reg.studentId ? (
                          <div className="mt-1 inline-flex items-center gap-1 rounded-md bg-muted px-1.5 py-0.5 font-mono text-[11px] font-semibold tracking-wide text-foreground">
                            {reg.studentId}
                          </div>
                        ) : (
                          <div className="mt-1 text-[11px] italic text-muted-foreground">No student ID (legacy)</div>
                        )}
                        <div className="text-xs text-muted-foreground mt-1">{reg.phone} • {reg.email}</div>
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
                      <td className="p-4 text-xs text-muted-foreground whitespace-nowrap">
                        {reg.paymentStatus === 'paid' && reg.markedPaidAt ? (
                          <span className="font-medium text-foreground">{formatDateTime(reg.markedPaidAt)}</span>
                        ) : (
                          <span className="italic">—</span>
                        )}
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex flex-col items-end gap-1.5">
                          {reg.paymentStatus === 'unpaid' ? (
                            <button
                              onClick={() => setConfirmReg(reg)}
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
                            <span className="flex flex-col items-end gap-1.5">
                              <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400 inline-flex items-center gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>Verified</span>
                              </span>
                              {isAdmin && (
                                <button
                                  onClick={() => { setRevertReg(reg); setRevertReason("") }}
                                  disabled={loadingTicket === reg.ticketNumber}
                                  title="Admin-only: revert this ticket to unpaid"
                                  className="px-3 py-1.5 rounded-lg bg-surface border border-destructive/30 text-destructive font-medium hover:bg-destructive/10 transition-all text-xs inline-flex items-center gap-1.5 disabled:opacity-50"
                                >
                                  {loadingTicket === reg.ticketNumber ? (
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                  ) : (
                                    <Undo2 className="w-3.5 h-3.5" />
                                  )}
                                  <span>Revert to Unpaid</span>
                                </button>
                              )}
                            </span>
                          )}
                          {(reg.paymentEvents?.length ?? 0) > 0 && (
                            <button
                              onClick={() => setExpandedId(expandedId === reg.id ? null : reg.id)}
                              className="text-[11px] font-medium text-muted-foreground hover:text-primary inline-flex items-center gap-1 transition-colors"
                            >
                              <History className="w-3 h-3" />
                              <span>{expandedId === reg.id ? "Hide history" : `History (${reg.paymentEvents.length})`}</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                    {expandedId === reg.id && (reg.paymentEvents?.length ?? 0) > 0 && (
                      <tr className="bg-muted/20">
                        <td colSpan={8} className="p-4">
                          <div className="space-y-2 max-w-2xl">
                            <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                              Payment history — {reg.ticketNumber}
                            </p>
                            {reg.paymentEvents.map((ev) => (
                              <div key={ev.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg border border-border bg-background px-3 py-2 text-xs">
                                <span className={`px-2 py-0.5 rounded-full font-semibold uppercase text-[10px] ${
                                  ev.action === 'paid'
                                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                                    : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                                }`}>
                                  {ev.action === 'paid' ? 'Marked paid' : 'Reverted to unpaid'}
                                </span>
                                <span className="font-medium text-foreground">
                                  {ev.actor?.name || "Unknown"} {ev.actor?.email ? <span className="font-normal text-muted-foreground">({ev.actor.email})</span> : null}
                                </span>
                                <span className="text-muted-foreground">
                                  {ev.createdAt ? new Date(ev.createdAt).toLocaleString() : ""}
                                </span>
                                {ev.reason && (
                                  <span className="w-full text-muted-foreground">
                                    <span className="font-medium text-foreground">Reason:</span> {ev.reason}
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mark-paid confirmation modal */}
      {confirmReg && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={() => (loadingTicket ? null : setConfirmReg(null))}
        >
          <div
            className="bg-surface border border-border rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-heading font-bold text-foreground">Confirm cash received?</h3>
                  <p className="text-xs text-muted-foreground">Double-check the identity before marking paid.</p>
                </div>
              </div>
              <button
                onClick={() => setConfirmReg(null)}
                className="p-1.5 rounded-lg text-muted-foreground hover:bg-accent transition-colors"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <dl className="rounded-xl border border-border bg-background p-4 grid grid-cols-2 gap-x-4 gap-y-2.5 text-sm">
              <div>
                <dt className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">Ticket</dt>
                <dd className="font-mono font-bold text-primary">{confirmReg.ticketNumber}</dd>
              </div>
              <div>
                <dt className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">Student ID</dt>
                <dd className="font-mono font-semibold text-foreground">{confirmReg.studentId || "—"}</dd>
              </div>
              <div className="col-span-2">
                <dt className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">Name</dt>
                <dd className="font-medium text-foreground">{confirmReg.fullName}</dd>
              </div>
              <div>
                <dt className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">Phone</dt>
                <dd className="text-foreground">{confirmReg.phone}</dd>
              </div>
              <div>
                <dt className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">Batch / Sec</dt>
                <dd className="text-foreground">{confirmReg.batch} / {confirmReg.section}</dd>
              </div>
            </dl>

            <div className="flex gap-3">
              <button
                onClick={() => setConfirmReg(null)}
                disabled={loadingTicket === confirmReg.ticketNumber}
                className="flex-1 py-2.5 px-4 rounded-xl bg-surface border border-border text-foreground font-medium hover:bg-accent transition-all text-sm disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmMarkPaid}
                disabled={loadingTicket === confirmReg.ticketNumber}
                className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-600 text-white font-medium hover:bg-emerald-700 transition-all text-sm inline-flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loadingTicket === confirmReg.ticketNumber ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Check className="w-4 h-4" />
                )}
                <span>Confirm — Mark Paid</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Admin revert modal */}
      {revertReg && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={() => (loadingTicket ? null : setRevertReg(null))}
        >
          <div
            className="bg-surface border border-border rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-destructive/10 text-destructive flex items-center justify-center">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-heading font-bold text-foreground">Revert to unpaid?</h3>
                  <p className="text-xs text-muted-foreground">Admin-only. This action is logged with your name.</p>
                </div>
              </div>
              <button
                onClick={() => setRevertReg(null)}
                className="p-1.5 rounded-lg text-muted-foreground hover:bg-accent transition-colors"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="rounded-xl border border-border bg-background p-4 text-sm space-y-1">
              <p><span className="text-muted-foreground">Ticket:</span> <span className="font-mono font-bold text-primary">{revertReg.ticketNumber}</span></p>
              <p><span className="text-muted-foreground">Student:</span> <span className="font-medium text-foreground">{revertReg.fullName}</span> {revertReg.studentId && <span className="font-mono text-xs text-muted-foreground">({revertReg.studentId})</span>}</p>
              {revertReg.marker && (
                <p><span className="text-muted-foreground">Currently marked paid by:</span> <span className="font-medium text-foreground">{revertReg.marker.name || revertReg.marker.email || "Unknown"}</span></p>
              )}
            </div>

            <div className="space-y-2">
              <label htmlFor="revert-reason" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Reason (required)
              </label>
              <textarea
                id="revert-reason"
                rows={3}
                value={revertReason}
                onChange={(e) => setRevertReason(e.target.value)}
                placeholder="e.g. Wrong ticket selected — cash was for BIN26-XXXX"
                maxLength={500}
                className="w-full px-4 py-2.5 rounded-xl bg-background border border-border text-foreground text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-destructive/50 transition-all resize-none"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setRevertReg(null)}
                disabled={loadingTicket === revertReg.ticketNumber}
                className="flex-1 py-2.5 px-4 rounded-xl bg-surface border border-border text-foreground font-medium hover:bg-accent transition-all text-sm disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmRevert}
                disabled={loadingTicket === revertReg.ticketNumber || revertReason.trim().length < 3}
                className="flex-1 py-2.5 px-4 rounded-xl bg-destructive text-destructive-foreground font-medium hover:opacity-90 transition-all text-sm inline-flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loadingTicket === revertReg.ticketNumber ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Undo2 className="w-4 h-4" />
                )}
                <span>Confirm Revert</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
