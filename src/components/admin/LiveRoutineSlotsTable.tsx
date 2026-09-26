"use client"

import { Suspense, useMemo, useState, useTransition } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { AlertTriangle, Check, Flag, Loader2, Pencil, Search, Trash2, X } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { deleteRoutineSlot, updateRoutineSlot } from "@/app/(admin)/manage/routine/actions"
import type { RoutineSlot } from "@/lib/db/schema"

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]

type Draft = {
  batch: string
  section: string
  day: string
  startPeriod: string
  endPeriod: string
  classCode: string
  courseTitle: string
  teacherInitial: string
  room: string
  isLab: boolean
}

function draftFromSlot(slot: RoutineSlot): Draft {
  return {
    batch: slot.batch,
    section: slot.section,
    day: slot.day,
    startPeriod: slot.startPeriod?.toString() ?? "",
    endPeriod: slot.endPeriod?.toString() ?? "",
    classCode: slot.classCode,
    courseTitle: slot.courseTitle ?? "",
    teacherInitial: slot.teacherInitial ?? "",
    room: slot.room ?? "",
    isLab: slot.isLab,
  }
}

function LiveRoutineSlotsInner({
  slots,
  pendingCounts,
}: {
  slots: RoutineSlot[]
  pendingCounts: Record<string, number>
}) {
  const searchParams = useSearchParams()
  const applySlotId = searchParams.get("applySlot")

  const [query, setQuery] = useState("")
  const [editingId, setEditingId] = useState<string | null>(() => applySlotId)
  const [appliedNotice, setAppliedNotice] = useState<boolean>(() => Boolean(applySlotId))
  const [draft, setDraft] = useState<Draft | null>(() => {
    if (!applySlotId) return null
    const slot = slots.find((s) => s.id === applySlotId)
    if (!slot) return null
    return {
      ...draftFromSlot(slot),
      classCode: searchParams.get("code") ?? slot.classCode,
      teacherInitial: searchParams.get("teacher") ?? slot.teacherInitial ?? "",
      room: searchParams.get("room") ?? slot.room ?? "",
    }
  })
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return slots
    return slots.filter((s) =>
      [s.batch, s.section, s.day, s.classCode, s.courseTitle ?? "", s.teacherInitial ?? "", s.room ?? ""]
        .join(" ")
        .toLowerCase()
        .includes(q)
    )
  }, [slots, query])

  function startEdit(slot: RoutineSlot, prefill?: Partial<Draft>) {
    setEditingId(slot.id)
    setDraft({ ...draftFromSlot(slot), ...prefill })
    setError(null)
  }

  function save(id: string) {
    if (!draft) return
    setError(null)
    startTransition(async () => {
      const result = await updateRoutineSlot({
        id,
        batch: draft.batch,
        section: draft.section,
        day: draft.day,
        startPeriod: draft.startPeriod === "" ? null : Number(draft.startPeriod),
        endPeriod: draft.endPeriod === "" ? null : Number(draft.endPeriod),
        classCode: draft.classCode,
        courseTitle: draft.courseTitle === "" ? null : draft.courseTitle,
        teacherInitial: draft.teacherInitial === "" ? null : draft.teacherInitial,
        room: draft.room === "" ? null : draft.room,
        isLab: draft.isLab,
      })
      if (result.success) {
        setEditingId(null)
        setDraft(null)
        setAppliedNotice(false)
      } else {
        setError(result.error)
      }
    })
  }

  function remove(id: string) {
    const ok = window.confirm("Delete this routine slot? Reports filed against it will be kept for audit. This cannot be undone.")
    if (!ok) return
    setError(null)
    startTransition(async () => {
      const result = await deleteRoutineSlot({ id })
      if (result.success) {
        if (editingId === id) {
          setEditingId(null)
          setDraft(null)
        }
      } else {
        setError(result.error)
      }
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>3. Live Slots — Edit or Delete</CardTitle>
        <CardDescription>
          Fix individual slots without re-uploading. {slots.length} slot(s) live.
          Amber flags link to open user reports in the approval queue.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {appliedNotice && editingId && (
          <div className="p-3 bg-sky-500/10 text-sky-700 dark:text-sky-300 border border-sky-500/20 rounded-md text-sm font-medium">
            Prefilled from a user report — review each field, then save. The report itself still needs
            approving/rejecting in <Link href="/approve?type=routine_report" className="underline">Approvals</Link>.
          </div>
        )}

        <div className="relative max-w-sm">
          <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
          <Input
            placeholder="Search batch, code, teacher, room..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        {error && (
          <div className="p-3 bg-destructive/10 text-destructive rounded-md text-sm font-medium flex items-center gap-2">
            <AlertTriangle className="size-4 shrink-0" />
            {error}
          </div>
        )}

        {filtered.length === 0 ? (
          <p className="text-sm text-muted-foreground py-6 text-center">
            {slots.length === 0 ? "No live slots. Upload a routine above to publish." : "No slots match your search."}
          </p>
        ) : (
          <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
            {filtered.map((slot) => {
              const pending = pendingCounts[slot.id] ?? 0
              const isEditing = editingId === slot.id && draft

              if (!isEditing) {
                return (
                  <div key={slot.id} className="flex flex-wrap items-center gap-2 border rounded-lg p-3 bg-card text-sm">
                    <Badge variant="outline" className="font-semibold">
                      Batch {slot.batch}-{slot.section}
                    </Badge>
                    <span className="font-medium">{slot.day}</span>
                    <span className="text-muted-foreground text-xs">
                      {slot.startPeriod ? `Period ${slot.startPeriod}${slot.endPeriod && slot.endPeriod !== slot.startPeriod ? `–${slot.endPeriod}` : ""}` : slot.startTime ?? ""}
                    </span>
                    <span className="font-bold">{slot.classCode}</span>
                    {slot.teacherInitial && (
                      <span className="text-xs text-muted-foreground">{slot.teacherInitial}</span>
                    )}
                    {slot.room && (
                      <span className="text-xs text-muted-foreground">Room {slot.room}</span>
                    )}
                    {slot.isLab && (
                      <Badge variant="secondary" className="text-[10px]">Lab</Badge>
                    )}
                    {pending > 0 && (
                      <Link href="/approve?type=routine_report">
                        <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-300 hover:bg-amber-500/25 gap-1">
                          <Flag className="size-3" strokeWidth={1.5} />
                          {pending} report{pending === 1 ? "" : "s"}
                        </Badge>
                      </Link>
                    )}
                    <div className="ml-auto flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => startEdit(slot)}
                        disabled={isPending}
                        aria-label={`Edit slot ${slot.classCode}`}
                      >
                        <Pencil className="size-4" strokeWidth={1.5} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => remove(slot.id)}
                        disabled={isPending}
                        aria-label={`Delete slot ${slot.classCode}`}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="size-4" strokeWidth={1.5} />
                      </Button>
                    </div>
                  </div>
                )
              }

              return (
                <div key={slot.id} className="border rounded-lg p-3 bg-muted/30 space-y-3">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <div className="space-y-1">
                      <span className="text-[10px] text-muted-foreground font-medium">Batch</span>
                      <Input value={draft.batch} onChange={(e) => setDraft({ ...draft, batch: e.target.value })} className="h-8 text-xs" />
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] text-muted-foreground font-medium">Section</span>
                      <Input value={draft.section} onChange={(e) => setDraft({ ...draft, section: e.target.value })} className="h-8 text-xs" />
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] text-muted-foreground font-medium">Day</span>
                      <Select value={draft.day} onValueChange={(v) => setDraft({ ...draft, day: v })}>
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {DAYS.map((d) => (
                            <SelectItem key={d} value={d}>{d}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-2 gap-1">
                      <div className="space-y-1">
                        <span className="text-[10px] text-muted-foreground font-medium">Start</span>
                        <Input value={draft.startPeriod} onChange={(e) => setDraft({ ...draft, startPeriod: e.target.value })} className="h-8 text-xs" inputMode="numeric" placeholder="1" />
                      </div>
                      <div className="space-y-1">
                        <span className="text-[10px] text-muted-foreground font-medium">End</span>
                        <Input value={draft.endPeriod} onChange={(e) => setDraft({ ...draft, endPeriod: e.target.value })} className="h-8 text-xs" inputMode="numeric" placeholder="1" />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] text-muted-foreground font-medium">Class code</span>
                      <Input value={draft.classCode} onChange={(e) => setDraft({ ...draft, classCode: e.target.value })} className="h-8 text-xs" />
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] text-muted-foreground font-medium">Teacher</span>
                      <Input value={draft.teacherInitial} onChange={(e) => setDraft({ ...draft, teacherInitial: e.target.value })} className="h-8 text-xs" />
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] text-muted-foreground font-medium">Room</span>
                      <Input value={draft.room} onChange={(e) => setDraft({ ...draft, room: e.target.value })} className="h-8 text-xs" />
                    </div>
                    <div className="flex items-end pb-1 gap-1.5">
                      <input
                        type="checkbox"
                        id={`live-lab-${slot.id}`}
                        checked={draft.isLab}
                        onChange={(e) => setDraft({ ...draft, isLab: e.target.checked })}
                        className="size-4 accent-primary"
                      />
                      <label htmlFor={`live-lab-${slot.id}`} className="text-xs cursor-pointer font-medium">Lab</label>
                    </div>
                  </div>
                  <div className="flex justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => { setEditingId(null); setDraft(null); setAppliedNotice(false); setError(null) }}
                      disabled={isPending}
                    >
                      <X className="size-4" strokeWidth={1.5} />
                      Cancel
                    </Button>
                    <Button size="sm" onClick={() => save(slot.id)} disabled={isPending}>
                      {isPending ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" strokeWidth={1.5} />}
                      Save
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default function LiveRoutineSlotsTable(props: {
  slots: RoutineSlot[]
  pendingCounts: Record<string, number>
}) {
  return (
    <Suspense fallback={null}>
      <LiveRoutineSlotsInner {...props} />
    </Suspense>
  )
}
