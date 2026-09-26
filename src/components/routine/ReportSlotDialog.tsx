"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Flag, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { safeCallbackUrl } from "@/lib/auth/safe-callback-url"
import type { RoutineSlot } from "@/lib/db/schema"

export default function ReportSlotDialog({
  slot,
  authenticated,
}: {
  slot: RoutineSlot
  authenticated: boolean
}) {
  const pathname = usePathname()
  const callbackUrl = encodeURIComponent(safeCallbackUrl(pathname || "/routine"))

  const [open, setOpen] = useState(false)
  const [message, setMessage] = useState("")
  const [suggestedClassCode, setSuggestedClassCode] = useState("")
  const [suggestedTeacherInitial, setSuggestedTeacherInitial] = useState("")
  const [suggestedRoom, setSuggestedRoom] = useState("")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  if (!authenticated) {
    return (
      <Button asChild variant="ghost" size="sm" className="h-7 px-2 text-xs text-muted-foreground">
        <Link href={`/login?callbackUrl=${callbackUrl}`} aria-label="Log in to report this slot">
          <Flag className="size-3.5" strokeWidth={1.5} />
          Report
        </Link>
      </Button>
    )
  }

  async function submit() {
    setError(null)
    setSaving(true)
    try {
      const res = await fetch(`/api/routine/${slot.id}/report`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, suggestedClassCode, suggestedTeacherInitial, suggestedRoom }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || "Failed to submit report")
      setDone(true)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to submit report")
    } finally {
      setSaving(false)
    }
  }

  function close(next: boolean) {
    setOpen(next)
    if (!next) {
      setMessage("")
      setSuggestedClassCode("")
      setSuggestedTeacherInitial("")
      setSuggestedRoom("")
      setError(null)
      setDone(false)
    }
  }

  const period = slot.startPeriod
    ? `Period ${slot.startPeriod}${slot.endPeriod && slot.endPeriod !== slot.startPeriod ? `–${slot.endPeriod}` : ""}`
    : [slot.startTime, slot.endTime].filter(Boolean).join(" - ") || ""

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="h-7 px-2 text-xs text-muted-foreground" aria-label="Report an issue with this slot">
          <Flag className="size-3.5" strokeWidth={1.5} />
          Report
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Report routine issue</DialogTitle>
          <DialogDescription>
            Batch {slot.batch}-{slot.section} · {slot.day}{period ? ` · ${period}` : ""}
            <br />
            Current: {slot.classCode}
            {slot.teacherInitial ? ` · ${slot.teacherInitial}` : ""}
            {slot.room ? ` · Room ${slot.room}` : ""}. Admins will recheck against the official routine.
          </DialogDescription>
        </DialogHeader>

        {done ? (
          <p className="rounded-md border border-green-500/40 bg-green-500/10 px-3 py-2 text-sm text-green-700 dark:text-green-300">
            Thanks — your report was sent for admin review.
          </p>
        ) : (
          <div className="grid gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor={`report-msg-${slot.id}`}>What&apos;s wrong? (required, min 10 characters)</Label>
              <Textarea
                id={`report-msg-${slot.id}`}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="e.g. Wrong course on Monday period 3 — should be CSE311, not CSE312…"
                rows={3}
                maxLength={1000}
              />
              <p
                className={
                  message.trim().length < 10
                    ? "text-xs font-medium text-destructive"
                    : "text-xs text-muted-foreground"
                }
                aria-live="polite"
              >
                {message.trim().length < 10
                  ? `Write at least ${10 - message.trim().length} more character${10 - message.trim().length === 1 ? "" : "s"} to enable submit.`
                  : `${message.trim().length}/1000 characters.`}
              </p>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="grid gap-1.5">
                <Label htmlFor={`report-code-${slot.id}`} className="text-xs">Correct code</Label>
                <Input
                  id={`report-code-${slot.id}`}
                  value={suggestedClassCode}
                  onChange={(e) => setSuggestedClassCode(e.target.value)}
                  placeholder="CSE311"
                  maxLength={20}
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor={`report-teacher-${slot.id}`} className="text-xs">Teacher</Label>
                <Input
                  id={`report-teacher-${slot.id}`}
                  value={suggestedTeacherInitial}
                  onChange={(e) => setSuggestedTeacherInitial(e.target.value)}
                  placeholder="ABC"
                  maxLength={20}
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor={`report-room-${slot.id}`} className="text-xs">Room</Label>
                <Input
                  id={`report-room-${slot.id}`}
                  value={suggestedRoom}
                  onChange={(e) => setSuggestedRoom(e.target.value)}
                  placeholder="604"
                  maxLength={20}
                />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Suggestions are optional — describing the problem is enough.
            </p>
            {error && (
              <p role="alert" className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </p>
            )}
          </div>
        )}

        <DialogFooter>
          {done ? (
            <Button variant="outline" onClick={() => close(false)}>Close</Button>
          ) : (
            <>
              <Button variant="outline" onClick={() => close(false)} disabled={saving}>
                Cancel
              </Button>
              <Button onClick={submit} disabled={saving || message.trim().length < 10}>
                {saving && <Loader2 className="size-4 animate-spin" />}
                Submit report
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
