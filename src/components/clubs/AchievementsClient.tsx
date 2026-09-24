"use client"

import { useState, useTransition } from "react"
import { Loader2, Plus, Trash2, Pencil, X, Check, UploadCloud } from "lucide-react"
import { generateUploadDropzone } from "@uploadthing/react"
import type { OurFileRouter } from "@/lib/uploadthing"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"

const UploadDropzone = generateUploadDropzone<OurFileRouter>()

interface Achievement {
  id: string
  clubId: string
  title: string
  description: string | null
  date: string | null
  imageUrl: string | null
  linkUrl: string | null
  createdAt: string
  updatedAt: string
}

interface AchievementsClientProps {
  clubId: string
  initialAchievements: Achievement[]
}

type Feedback = { type: "success"; text: string } | { type: "error"; text: string }

const emptyForm = { title: "", description: "", date: "", imageUrl: "", linkUrl: "" }

export function AchievementsClient({
  clubId,
  initialAchievements,
}: AchievementsClientProps) {
  const [isPending, startTransition] = useTransition()
  const [feedback, setFeedback] = useState<Feedback | null>(null)
  const [achievements, setAchievements] = useState<Achievement[]>(initialAchievements)
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState<string | null>(null)

  function set(field: keyof typeof emptyForm, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  function startEdit(a: Achievement) {
    setEditingId(a.id)
    setForm({
      title: a.title,
      description: a.description ?? "",
      date: a.date ? new Date(a.date).toISOString().slice(0, 10) : "",
      imageUrl: a.imageUrl ?? "",
      linkUrl: a.linkUrl ?? "",
    })
    setFeedback(null)
  }

  function cancelEdit() {
    setEditingId(null)
    setForm(emptyForm)
  }

  function payload() {
    return {
      clubId,
      title: form.title.trim(),
      description: form.description.trim() ? form.description.trim() : null,
      date: form.date ? new Date(form.date).toISOString() : null,
      imageUrl: form.imageUrl.trim() ? form.imageUrl.trim() : null,
      linkUrl: form.linkUrl.trim() ? form.linkUrl.trim() : null,
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setFeedback(null)
    if (!form.title.trim()) {
      setFeedback({ type: "error", text: "Title is required." })
      return
    }
    startTransition(async () => {
      try {
        if (editingId) {
          const res = await fetch(`/api/club-achievements`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: editingId, ...payload() }),
          })
          const data = await res.json()
          if (!res.ok) throw new Error(data.error || "Failed to update achievement")
          setAchievements((prev) => prev.map((a) => (a.id === editingId ? data : a)))
          setFeedback({ type: "success", text: "Achievement updated!" })
        } else {
          const res = await fetch(`/api/club-achievements`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload()),
          })
          const data = await res.json()
          if (!res.ok) throw new Error(data.error || "Failed to create achievement")
          setAchievements((prev) => [data, ...prev])
          setFeedback({ type: "success", text: "Achievement created!" })
        }
        cancelEdit()
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Failed"
        setFeedback({ type: "error", text: msg })
      }
    })
  }

  async function handleDeleteAchievement(achievementId: string) {
    if (!window.confirm("Delete this achievement? This cannot be undone.")) return
    startTransition(async () => {
      try {
        const res = await fetch(`/api/club-achievements`, {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: achievementId }),
        })
        if (!res.ok) throw new Error("Failed to delete achievement")
        setAchievements((prev) => prev.filter((a) => a.id !== achievementId))
        if (editingId === achievementId) cancelEdit()
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Failed"
        setFeedback({ type: "error", text: msg })
      }
    })
  }

  const isEditing = editingId !== null

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{isEditing ? "Edit Achievement" : "Create Achievement"}</CardTitle>
          <CardDescription>
            {isEditing
              ? "Update the title, date, photo, link and description."
              : "Add a new achievement with an optional date, photo and link."}
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="achievement-title">Title</Label>
                <Input
                  id="achievement-title"
                  name="title"
                  value={form.title}
                  onChange={(e) => set("title", e.target.value)}
                  required
                  disabled={isPending}
                  placeholder="e.g. National Hackathon Winner"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="achievement-date">Date</Label>
                <Input
                  id="achievement-date"
                  name="date"
                  type="date"
                  value={form.date}
                  onChange={(e) => set("date", e.target.value)}
                  disabled={isPending}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="achievement-desc">Description</Label>
              <Textarea
                id="achievement-desc"
                name="description"
                value={form.description}
                onChange={(e) => set("description", e.target.value)}
                rows={3}
                disabled={isPending}
                placeholder="What was achieved?"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="achievement-link">Link URL</Label>
              <Input
                id="achievement-link"
                name="linkUrl"
                type="url"
                value={form.linkUrl}
                onChange={(e) => set("linkUrl", e.target.value)}
                disabled={isPending}
                placeholder="https://… (certificate, news, results page)"
              />
            </div>
            <div className="space-y-2">
              <Label>Achievement photo</Label>
              {form.imageUrl ? (
                <div className="flex items-center justify-between gap-3 rounded-lg border p-3 bg-muted/30">
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={form.imageUrl}
                      alt="Achievement preview"
                      className="h-16 w-24 rounded-lg object-cover shrink-0 border"
                    />
                    <p className="text-xs font-medium text-foreground truncate">
                      Photo uploaded successfully
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="shrink-0"
                    disabled={isPending}
                    onClick={() => set("imageUrl", "")}
                  >
                    Change / Remove
                  </Button>
                </div>
              ) : (
                <div className="rounded-lg border border-dashed p-4">
                  <UploadDropzone
                    endpoint="achievementImage"
                    config={{ mode: "auto" }}
                    content={{
                      uploadIcon: <UploadCloud className="mx-auto size-8 text-muted-foreground" strokeWidth={1.5} />,
                      button: ({ isUploading, uploadProgress }) =>
                        isUploading ? `${Math.round(uploadProgress)}%` : "Upload photo",
                      allowedContent: "Image (PNG, JPG, WebP) up to 10MB",
                    }}
                    onClientUploadComplete={(res) => {
                      if (res?.[0]?.url) set("imageUrl", res[0].url)
                    }}
                    onUploadError={(err) =>
                      setFeedback({ type: "error", text: `Photo upload failed: ${err.message}` })
                    }
                  />
                </div>
              )}
            </div>
            {feedback && (
              <p className={cn("text-sm", feedback.type === "success" ? "text-emerald-600" : "text-destructive")}>
                {feedback.text}
              </p>
            )}
            <div className="flex flex-wrap gap-2">
              <Button type="submit" disabled={isPending}>
                {isPending ? (
                  <Loader2 className="size-4 animate-spin motion-reduce:animate-none mr-2" />
                ) : isEditing ? (
                  <Check className="size-4 mr-2" />
                ) : (
                  <Plus className="size-4 mr-2" />
                )}
                {isEditing ? "Save Changes" : "Create Achievement"}
              </Button>
              {isEditing && (
                <Button type="button" variant="outline" onClick={cancelEdit} disabled={isPending}>
                  <X className="size-4 mr-2" />
                  Cancel
                </Button>
              )}
            </div>
          </CardContent>
        </form>
      </Card>

      <div className="space-y-4">
        <h2 className="font-heading text-xl font-semibold text-foreground">
          Achievements ({achievements.length})
        </h2>
        {achievements.length === 0 ? (
          <p className="text-muted-foreground text-sm">No achievements yet.</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {achievements.map((achievement) => (
              <div key={achievement.id} className="overflow-hidden rounded-xl bg-surface border border-border">
                {achievement.imageUrl && (
                  <img
                    src={achievement.imageUrl}
                    alt={achievement.title}
                    loading="lazy"
                    className="w-full h-36 object-cover"
                  />
                )}
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <h3 className="font-heading font-semibold text-foreground">{achievement.title}</h3>
                      {achievement.description && (
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-3">{achievement.description}</p>
                      )}
                      {achievement.date && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(achievement.date).toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </p>
                      )}
                      {achievement.linkUrl && (
                        <a
                          href={achievement.linkUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-primary hover:underline mt-2"
                        >
                          View Details
                        </a>
                      )}
                    </div>
                    <div className="flex shrink-0 gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => startEdit(achievement)}
                        disabled={isPending}
                        aria-label={`Edit ${achievement.title}`}
                      >
                        <Pencil className="size-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteAchievement(achievement.id)}
                        disabled={isPending}
                        aria-label={`Delete ${achievement.title}`}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
