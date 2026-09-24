"use client"

import { useMemo, useState, useTransition } from "react"
import Link from "next/link"
import {
  CalendarDays,
  Loader2,
  MapPin,
  Pencil,
  Plus,
  Search,
  Trash2,
  Users,
  X,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { cn } from "@/lib/utils"

export interface ManagedEvent {
  id: string
  clubId: string | null
  name: string
  place: string | null
  description: string | null
  date: string
  deadline: string | null
  startTime: string | null
  endTime: string | null
  createdAt: string
  updatedAt: string
  status: string
  clubName: string
}

export interface EventClubOption {
  id: string
  name: string
}

type Feedback = { type: "success"; text: string } | { type: "error"; text: string }

/** Convert a stored timestamp to the `datetime-local` input shape (local time). */
function toDateTimeLocal(value: string | null): string {
  if (!value) return ""
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return ""
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

/** Convert a stored timestamp to the `date` input shape (YYYY-MM-DD). */
function toDateInput(value: string): string {
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return ""
  return d.toISOString().slice(0, 10)
}

function emptyForm(clubId: string | null) {
  return {
    name: "",
    place: "",
    description: "",
    date: "",
    startTime: "",
    endTime: "",
    clubId: clubId ?? "individual",
  }
}

export function ManageEventsClient({
  initialEvents,
  clubs,
  fixedClubId = null,
}: {
  initialEvents: ManagedEvent[]
  clubs: EventClubOption[]
  /** When set (per-club manage page), the club selector is locked to this club. */
  fixedClubId?: string | null
}) {
  const [isPending, startTransition] = useTransition()
  const [feedback, setFeedback] = useState<Feedback | null>(null)
  const [events, setEvents] = useState<ManagedEvent[]>(initialEvents)
  const [search, setSearch] = useState("")
  const [sourceFilter, setSourceFilter] = useState<"all" | "club" | "individual">("all")
  const [formOpen, setFormOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [form, setForm] = useState(() => emptyForm(fixedClubId))

  const editing = editingId ? events.find((e) => e.id === editingId) ?? null : null

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return events.filter((e) => {
      if (sourceFilter === "club" && !e.clubId) return false
      if (sourceFilter === "individual" && e.clubId) return false
      if (!q) return true
      return (
        e.name.toLowerCase().includes(q) ||
        (e.place ?? "").toLowerCase().includes(q) ||
        (e.clubName ?? "").toLowerCase().includes(q)
      )
    })
  }, [events, search, sourceFilter])

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  function openCreate() {
    setEditingId(null)
    setForm(emptyForm(fixedClubId))
    setFeedback(null)
    setFormOpen(true)
  }

  function openEdit(event: ManagedEvent) {
    setFormOpen(false)
    setEditingId(event.id)
    setForm({
      name: event.name,
      place: event.place ?? "",
      description: event.description ?? "",
      date: toDateInput(event.date),
      startTime: toDateTimeLocal(event.startTime),
      endTime: toDateTimeLocal(event.endTime),
      clubId: fixedClubId ?? event.clubId ?? "individual",
    })
    setFeedback(null)
  }

  function closeForms() {
    setFormOpen(false)
    setEditingId(null)
  }

  function payload() {
    return {
      name: form.name.trim(),
      place: form.place.trim() || null,
      description: form.description.trim() || null,
      date: form.date ? new Date(form.date).toISOString() : null,
      startTime: form.startTime ? new Date(form.startTime).toISOString() : null,
      endTime: form.endTime ? new Date(form.endTime).toISOString() : null,
      clubId: form.clubId === "individual" ? null : form.clubId,
    }
  }

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setFeedback(null)
    const body = payload()
    if (!body.name || !body.date) {
      setFeedback({ type: "error", text: "Name and date are required." })
      return
    }
    startTransition(async () => {
      try {
        const res = await fetch("/api/events", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || "Failed to create event")
        setFeedback({ type: "success", text: `Event "${body.name}" created.` })
        setFormOpen(false)
        window.location.reload()
      } catch (err: unknown) {
        setFeedback({ type: "error", text: err instanceof Error ? err.message : "Failed to create event" })
      }
    })
  }

  async function handleEdit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!editing) return
    setFeedback(null)
    const body = payload()
    if (!body.name || !body.date) {
      setFeedback({ type: "error", text: "Name and date are required." })
      return
    }
    startTransition(async () => {
      try {
        const res = await fetch("/api/events", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: editing.id, ...body }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || "Failed to update event")
        setEditingId(null)
        window.location.reload()
      } catch (err: unknown) {
        setFeedback({ type: "error", text: err instanceof Error ? err.message : "Failed to update event" })
      }
    })
  }

  async function handleDelete(event: ManagedEvent) {
    const confirmed = window.confirm(
      `Delete event "${event.name}"? This cannot be undone.`
    )
    if (!confirmed) return
    setDeletingId(event.id)
    setFeedback(null)
    try {
      const res = await fetch("/api/events", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: event.id }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error((data as { error?: string }).error || "Failed to delete event")
      setEvents((prev) => prev.filter((item) => item.id !== event.id))
      if (editingId === event.id) closeForms()
      setFeedback({ type: "success", text: `Event "${event.name}" deleted.` })
    } catch (err: unknown) {
      setFeedback({ type: "error", text: err instanceof Error ? err.message : "Failed to delete event" })
    } finally {
      setDeletingId(null)
    }
  }

  const formVisible = formOpen || editing !== null

  const formFields = (prefix: string, forEdit: boolean) => (
    <>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor={`${prefix}-name`}>Name *</Label>
          <Input
            id={`${prefix}-name`}
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
            placeholder="e.g. Hack Night 2026"
            required
            disabled={isPending}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${prefix}-club`}>Host *</Label>
          {fixedClubId ? (
            <Input id={`${prefix}-club`} value={clubs.find((c) => c.id === fixedClubId)?.name ?? "This club"} disabled />
          ) : (
            <select
              id={`${prefix}-club`}
              value={form.clubId}
              onChange={(e) => set("clubId", e.target.value)}
              disabled={isPending}
              className="flex h-10 w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="individual">Individual — standalone event</option>
              {clubs.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor={`${prefix}-date`}>Date *</Label>
          <Input
            id={`${prefix}-date`}
            type="date"
            value={form.date}
            onChange={(e) => set("date", e.target.value)}
            required
            disabled={isPending}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${prefix}-place`}>Place</Label>
          <Input
            id={`${prefix}-place`}
            value={form.place}
            onChange={(e) => set("place", e.target.value)}
            placeholder="e.g. CSE Lab 3"
            disabled={isPending}
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor={`${prefix}-desc`}>Description</Label>
        <Textarea
          id={`${prefix}-desc`}
          value={form.description}
          onChange={(e) => set("description", e.target.value)}
          rows={3}
          disabled={isPending}
          placeholder="What is this event about? Links become clickable on the events page."
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor={`${prefix}-start`}>Start time</Label>
          <Input
            id={`${prefix}-start`}
            type="datetime-local"
            value={form.startTime}
            onChange={(e) => set("startTime", e.target.value)}
            disabled={isPending}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${prefix}-end`}>End time (registration deadline)</Label>
          <Input
            id={`${prefix}-end`}
            type="datetime-local"
            value={form.endTime}
            onChange={(e) => set("endTime", e.target.value)}
            disabled={isPending}
          />
        </div>
      </div>
      {forEdit && editing && (
        <p className="text-xs text-muted-foreground">
          Editing <span className="font-medium text-foreground">{editing.name}</span> — changing the host moves
          it between individual and club listings.
        </p>
      )}
    </>
  )

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search
            aria-hidden
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            strokeWidth={1.5}
          />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search events…"
            aria-label="Search events"
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-2">
          {!fixedClubId && (
            <select
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value as typeof sourceFilter)}
              aria-label="Filter events by source"
              className="flex h-10 rounded-lg border border-input bg-transparent px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="all">All events</option>
              <option value="club">From clubs</option>
              <option value="individual">Individual</option>
            </select>
          )}
          {formVisible ? (
            <Button variant="outline" onClick={closeForms} className="shrink-0">
              <X className="size-4 mr-2" strokeWidth={1.5} />
              Close
            </Button>
          ) : (
            <Button onClick={openCreate} className="shrink-0">
              <Plus className="size-4 mr-2" strokeWidth={1.5} />
              New Event
            </Button>
          )}
        </div>
      </div>
      {!formVisible && (
        <p className="text-xs text-muted-foreground" aria-live="polite">
          Showing {filtered.length} of {events.length} {events.length === 1 ? "event" : "events"}, newest first
        </p>
      )}

      {feedback && (
        <div
          role={feedback.type === "error" ? "alert" : "status"}
          className={cn(
            "flex items-start justify-between gap-3 rounded-xl border px-4 py-3 text-sm",
            feedback.type === "success"
              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
              : "border-destructive/30 bg-destructive/10 text-destructive"
          )}
        >
          <p>{feedback.text}</p>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            aria-label="Dismiss message"
            className="rounded-md p-0.5 opacity-70 transition-opacity hover:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <X className="size-4" strokeWidth={1.5} />
          </button>
        </div>
      )}

      {/* Create panel */}
      {formOpen && (
        <Card className="animate-in fade-in slide-in-from-top-2 duration-200 motion-reduce:animate-none">
          <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
            <div>
              <CardTitle className="font-heading text-lg font-semibold">New event</CardTitle>
              <CardDescription>
                Host it as an individual meetup or under a club — club events also appear on the club page.
              </CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={closeForms} aria-label="Close form">
              <X className="size-4" strokeWidth={1.5} />
            </Button>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="space-y-5">
              {formFields("new-event", false)}
              <div className="flex flex-wrap gap-2">
                <Button type="submit" disabled={isPending}>
                  {isPending && <Loader2 className="size-4 animate-spin motion-reduce:animate-none mr-2" strokeWidth={1.5} />}
                  Create event
                </Button>
                <Button type="button" variant="outline" disabled={isPending} onClick={closeForms}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Edit panel */}
      {editing && (
        <Card className="animate-in fade-in slide-in-from-top-2 duration-200 motion-reduce:animate-none">
          <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
            <div>
              <CardTitle className="font-heading text-lg font-semibold">Edit event</CardTitle>
              <CardDescription>Update the details and save — changes go live immediately.</CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={closeForms} aria-label="Close edit form">
              <X className="size-4" strokeWidth={1.5} />
            </Button>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleEdit} className="space-y-5">
              {formFields("edit-event", true)}
              <div className="flex flex-wrap gap-2">
                <Button type="submit" disabled={isPending}>
                  {isPending && <Loader2 className="size-4 animate-spin motion-reduce:animate-none mr-2" strokeWidth={1.5} />}
                  Save changes
                </Button>
                <Button type="button" variant="outline" disabled={isPending} onClick={closeForms}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* List */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed px-6 py-12 text-center">
          <span className="flex size-11 items-center justify-center rounded-xl bg-primary/10">
            <CalendarDays className="size-5 text-primary" strokeWidth={1.5} />
          </span>
          <p className="font-heading text-base font-semibold text-foreground">
            {events.length === 0 ? "No events yet" : "No events match your filters"}
          </p>
          <p className="max-w-sm text-sm text-muted-foreground">
            {events.length === 0
              ? "Create the first event — individual or under a club."
              : "Try a different search or clear the source filter."}
          </p>
          {events.length === 0 && !formVisible && (
            <Button onClick={openCreate} className="mt-2">
              <Plus className="size-4 mr-2" strokeWidth={1.5} />
              New Event
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((event) => (
            <div
              key={event.id}
              className={cn(
                "flex items-center gap-3 rounded-xl border bg-card p-3 shadow-[0_2px_12px_rgba(91,95,239,0.06)]",
                editingId === event.id && "border-primary/40"
              )}
            >
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-foreground text-sm">{event.name}</p>
                <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1">
                    <CalendarDays className="size-3" strokeWidth={1.5} />
                    {event.date ? new Date(event.date).toLocaleDateString() : "No date"}
                  </span>
                  {event.place && (
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="size-3" strokeWidth={1.5} />
                      <span className="max-w-40 truncate">{event.place}</span>
                    </span>
                  )}
                  {event.clubName ? (
                    fixedClubId ? (
                      <Badge variant="secondary" className="gap-1 text-[11px]">
                        <Users className="size-3" strokeWidth={1.5} />
                        {event.clubName}
                      </Badge>
                    ) : (
                      <Link
                        href={`/manage/clubs/${event.clubId}/events`}
                        className="inline-flex items-center gap-1 rounded-full border border-secondary/25 bg-secondary/10 px-2 py-0 text-[11px] font-medium text-secondary hover:bg-secondary/[0.16] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        <Users className="size-3" strokeWidth={1.5} />
                        {event.clubName}
                      </Link>
                    )
                  ) : (
                    <Badge variant="outline" className="text-[11px]">
                      Individual
                    </Badge>
                  )}
                  <Badge variant="secondary" className="text-[11px]">
                    {event.status}
                  </Badge>
                </div>
              </div>
              <div className="flex shrink-0 items-center">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => openEdit(event)}
                  aria-label={`Edit ${event.name}`}
                >
                  <Pencil className="size-4" strokeWidth={1.5} />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={deletingId === event.id}
                  onClick={() => handleDelete(event)}
                  aria-label={`Delete ${event.name}`}
                  className="text-destructive hover:text-destructive"
                >
                  {deletingId === event.id ? (
                    <Loader2 className="size-4 animate-spin motion-reduce:animate-none" strokeWidth={1.5} />
                  ) : (
                    <Trash2 className="size-4" strokeWidth={1.5} />
                  )}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
