"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader2, UploadCloud, CheckCircle2, AlertTriangle, FileText, RefreshCw } from "lucide-react"

export default function RoutineUploadPage() {
  const [sections, setSections] = useState<any[]>([])
  const [semester, setSemester] = useState("Summer 2026")
  const [effectiveFrom, setEffectiveFrom] = useState("2026-05-13")
  const [busy, setBusy] = useState(false)
  const [saving, setSaving] = useState(false)
  const [successCount, setSuccessCount] = useState<number | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setBusy(true)
    setErrorMsg(null)
    setSuccessCount(null)

    const fd = new FormData()
    fd.append("file", file)

    try {
      const res = await fetch("/api/admin/routine/extract", {
        method: "POST",
        body: fd,
      })
      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || data.details || "Extraction failed")
      }

      setSections(data.sections || [])
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Failed to extract routine from PDF")
    } finally {
      setBusy(false)
    }
  }

  function updateSlot(secIdx: number, slotIdx: number, field: string, value: any) {
    setSections((prev) => {
      const next = structuredClone(prev)
      next[secIdx].slots[slotIdx][field] = value
      return next
    })
  }

  async function confirm() {
    if (sections.length === 0) return

    setSaving(true)
    setErrorMsg(null)

    try {
      const res = await fetch("/api/admin/routine/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sections, semester, effectiveFrom }),
      })
      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || "Failed to save routine")
      }

      setSuccessCount(data.inserted)
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Failed to confirm routine slots")
    } finally {
      setSaving(false)
    }
  }

  const flagged = sections.flatMap((sec, si) =>
    (sec.slots || [])
      .map((s: any, sli: number) => ({ ...s, si, sli, batch: sec.batch, section: sec.section }))
      .filter((s: any) => !s.classCode || !s.teacherInitial)
  )

  const totalSlotsCount = sections.reduce(
    (acc, sec) => acc + (sec.slots ? sec.slots.length : 0),
    0
  )

  return (
    <div className="container mx-auto max-w-6xl py-8 px-4 space-y-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Routine Management & Upload</h1>
        <p className="text-muted-foreground">
          Upload class routine PDFs to automatically extract slots via the AI parser, review flagged entries, and publish to the live schedule.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>1. Upload PDF & Set Semester</CardTitle>
          <CardDescription>
            Select the PDF file and specify active semester metadata before extracting.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="semester">Semester Name</Label>
              <Input
                id="semester"
                value={semester}
                onChange={(e) => setSemester(e.target.value)}
                placeholder="e.g. Summer 2026"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="effectiveFrom">Effective From Date</Label>
              <Input
                id="effectiveFrom"
                type="date"
                value={effectiveFrom}
                onChange={(e) => setEffectiveFrom(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="routine-pdf">Routine PDF File</Label>
            <div className="flex items-center gap-4">
              <Input
                id="routine-pdf"
                type="file"
                accept="application/pdf"
                onChange={handleUpload}
                disabled={busy}
                className="cursor-pointer"
              />
            </div>
          </div>

          {busy && (
            <div className="flex items-center gap-2 text-primary font-medium py-2">
              <Loader2 className="size-5 animate-spin" />
              Extracting routine slots using AI parser... This may take up to 30 seconds.
            </div>
          )}

          {errorMsg && (
            <div className="p-3 bg-destructive/10 text-destructive rounded-md text-sm font-medium flex items-center gap-2">
              <AlertTriangle className="size-4 shrink-0" />
              {errorMsg}
            </div>
          )}

          {successCount !== null && (
            <div className="p-3 bg-green-500/10 text-green-600 dark:text-green-400 rounded-md text-sm font-medium flex items-center gap-2">
              <CheckCircle2 className="size-4 shrink-0" />
              Successfully inserted {successCount} routine slots into the database!
            </div>
          )}
        </CardContent>
      </Card>

      {sections.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>2. Review & Edit Extracted Slots</CardTitle>
              <CardDescription>
                Found {sections.length} section groups with a total of {totalSlotsCount} slots. {flagged.length} slot(s) require manual review due to missing codes or teacher initials.
              </CardDescription>
            </div>
            <Button onClick={confirm} disabled={saving || busy} className="gap-2">
              {saving ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />}
              Confirm & Save to Database
            </Button>
          </CardHeader>
          <CardContent className="space-y-6">
            {flagged.length > 0 && (
              <div className="space-y-3 bg-amber-500/5 border border-amber-500/20 rounded-lg p-4">
                <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-semibold text-sm">
                  <AlertTriangle className="size-4" />
                  Flagged Slots Needing Attention ({flagged.length})
                </div>
                <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                  {flagged.map((f: any) => (
                    <div
                      key={`flag-${f.si}-${f.sli}`}
                      className="flex flex-wrap items-center gap-3 bg-background p-3 rounded border text-sm"
                    >
                      <Badge variant="outline" className="font-semibold">
                        Batch {f.batch}-{f.section}
                      </Badge>
                      <span className="font-medium text-muted-foreground">
                        {f.day} (Period {f.startPeriod ?? "?"})
                      </span>
                      <div className="flex items-center gap-2 ml-auto">
                        <Input
                          placeholder="Class Code (e.g. CSE311)"
                          defaultValue={f.classCode ?? ""}
                          className="w-36 h-8 text-xs"
                          onBlur={(e) => updateSlot(f.si, f.sli, "classCode", e.target.value)}
                        />
                        <Input
                          placeholder="Teacher Initial"
                          defaultValue={f.teacherInitial ?? ""}
                          className="w-32 h-8 text-xs"
                          onBlur={(e) => updateSlot(f.si, f.sli, "teacherInitial", e.target.value)}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-4">
              <h3 className="font-semibold text-base">All Extracted Sections Preview</h3>
              <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
                {sections.map((sec, secIdx) => (
                  <div key={`sec-${secIdx}`} className="border rounded-lg p-4 space-y-3 bg-card">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant="default" className="text-sm px-3 py-1">
                          Batch {sec.batch} — Section {sec.section}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {sec.slots?.length || 0} slots
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                      {(sec.slots || []).map((slot: any, slotIdx: number) => (
                        <div
                          key={`slot-${secIdx}-${slotIdx}`}
                          className="border rounded p-2.5 bg-muted/30 text-xs space-y-1.5"
                        >
                          <div className="flex justify-between font-medium">
                            <span>{slot.day}</span>
                            <span className="text-muted-foreground">
                              {slot.startTime && slot.endTime
                                ? `${slot.startTime} - ${slot.endTime}`
                                : `Period ${slot.startPeriod}`}
                            </span>
                          </div>
                          <div className="grid grid-cols-2 gap-1 pt-1">
                            <div>
                              <span className="text-[10px] text-muted-foreground block">Code</span>
                              <Input
                                defaultValue={slot.classCode || ""}
                                className="h-7 text-xs"
                                onBlur={(e) =>
                                  updateSlot(secIdx, slotIdx, "classCode", e.target.value)
                                }
                              />
                            </div>
                            <div>
                              <span className="text-[10px] text-muted-foreground block">Teacher</span>
                              <Input
                                defaultValue={slot.teacherInitial || ""}
                                className="h-7 text-xs"
                                onBlur={(e) =>
                                  updateSlot(secIdx, slotIdx, "teacherInitial", e.target.value)
                                }
                              />
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-1">
                            <div>
                              <span className="text-[10px] text-muted-foreground block">Room</span>
                              <Input
                                defaultValue={slot.room || ""}
                                className="h-7 text-xs"
                                placeholder="Room"
                                onBlur={(e) =>
                                  updateSlot(secIdx, slotIdx, "room", e.target.value)
                                }
                              />
                            </div>
                            <div className="flex items-center pt-3 gap-1">
                              <input
                                type="checkbox"
                                id={`lab-${secIdx}-${slotIdx}`}
                                defaultChecked={slot.isLab}
                                onChange={(e) =>
                                  updateSlot(secIdx, slotIdx, "isLab", e.target.checked)
                                }
                                className="size-3.5 accent-primary"
                              />
                              <label
                                htmlFor={`lab-${secIdx}-${slotIdx}`}
                                className="text-[11px] cursor-pointer font-medium"
                              >
                                Is Lab
                              </label>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <Button onClick={confirm} disabled={saving || busy} className="gap-2">
                {saving ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />}
                Confirm & Save to Database
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
