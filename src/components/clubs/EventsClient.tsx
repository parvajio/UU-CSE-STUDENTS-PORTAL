"use client"

import { useState, useTransition } from "react"
import { Loader2, Plus, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface Event {
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
}

interface EventsClientProps {
  clubId: string
  initialEvents: Event[]
}

type Feedback = { type: "success"; text: string } | { type: "error"; text: string }

export function EventsClient({
  clubId,
  initialEvents,
}: EventsClientProps) {
  const [isPending, startTransition] = useTransition()
  const [feedback, setFeedback] = useState<Feedback | null>(null)
  const [events, setEvents] = useState<Event[]>(initialEvents)
  const [name, setName] = useState("")
  const [place, setPlace] = useState("")
  const [description, setDescription] = useState("")
  const [date, setDate] = useState("")
  const [startTime, setStartTime] = useState("")
  const [endTime, setEndTime] = useState("")

  async function handleCreateEvent(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setFeedback(null)
    startTransition(async () => {
      try {
        const formData = new FormData(e.currentTarget)
        const res = await fetch(`/api/events`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ clubId, name, place, description, date, startTime, endTime }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || "Failed to create event")
        setFeedback({ type: "success", text: "Event created!" })
        setName("")
        setPlace("")
        setDescription("")
        setDate("")
        setStartTime("")
        setEndTime("")
        window.location.reload()
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Failed"
        setFeedback({ type: "error", text: msg })
      }
    })
  }

  async function handleDeleteEvent(eventId: string) {
    startTransition(async () => {
      try {
        const res = await fetch(`/api/events`, {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: eventId }),
        })
        if (!res.ok) throw new Error("Failed to delete event")
        setEvents((prev) => prev.filter((e) => e.id !== eventId))
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Failed"
        setFeedback({ type: "error", text: msg })
      }
    })
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Create Event</CardTitle>
          <CardDescription>Add a new event for this club.</CardDescription>
        </CardHeader>
        <form onSubmit={handleCreateEvent}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="event-name">Name</Label>
              <Input id="event-name" name="name" value={name} onChange={(e) => setName(e.target.value)} required disabled={isPending} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="event-place">Place</Label>
              <Input id="event-place" name="place" value={place} onChange={(e) => setPlace(e.target.value)} disabled={isPending} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="event-desc">Description</Label>
              <Textarea id="event-desc" name="description" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} disabled={isPending} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="event-date">Date</Label>
                <Input id="event-date" name="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} required disabled={isPending} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="event-start">Start Time</Label>
                <Input id="event-start" name="startTime" type="datetime-local" value={startTime} onChange={(e) => setStartTime(e.target.value)} disabled={isPending} />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="event-end">End Time</Label>
                <Input id="event-end" name="endTime" type="datetime-local" value={endTime} onChange={(e) => setEndTime(e.target.value)} disabled={isPending} />
              </div>
            </div>
            {feedback && (
              <p className={cn("text-sm", feedback.type === "success" ? "text-emerald-600" : "text-destructive")}>
                {feedback.text}
              </p>
            )}
            <Button type="submit" disabled={isPending}>
              {isPending ? <Loader2 className="size-4 animate-spin motion-reduce:animate-none mr-2" /> : <Plus className="size-4 mr-2" />}
              Create Event
            </Button>
          </CardContent>
        </form>
      </Card>

      <div className="space-y-4">
        <h2 className="font-heading text-xl font-semibold text-foreground">
          Events ({events.length})
        </h2>
        {events.length === 0 ? (
          <p className="text-muted-foreground text-sm">No events yet.</p>
        ) : (
          <div className="space-y-3">
            {events.map((event) => (
              <div key={event.id} className="flex items-center justify-between p-4 rounded-xl bg-surface border border-border">
                <div className="flex-1">
                  <h3 className="font-heading font-semibold text-foreground">{event.name}</h3>
                  <p className="text-sm text-muted-foreground">{new Date(event.date).toLocaleDateString()}</p>
                  {event.startTime && (
                    <p className="text-xs text-muted-foreground">
                      {new Date(event.startTime).toLocaleTimeString()} - {event.endTime ? new Date(event.endTime).toLocaleTimeString() : ""}
                    </p>
                  )}
                </div>
                <form action={() => handleDeleteEvent(event.id)}>
                  <Button type="submit" variant="ghost" size="sm" disabled={isPending}>
                    <Trash2 className="size-4" />
                  </Button>
                </form>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
