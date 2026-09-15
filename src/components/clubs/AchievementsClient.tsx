"use client"

import { useState, useTransition } from "react"
import { Loader2, Plus, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"

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

export function AchievementsClient({
  clubId,
  initialAchievements,
}: AchievementsClientProps) {
  const [isPending, startTransition] = useTransition()
  const [feedback, setFeedback] = useState<Feedback | null>(null)
  const [achievements, setAchievements] = useState<Achievement[]>(initialAchievements)
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")

  async function handleCreateAchievement(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setFeedback(null)
    startTransition(async () => {
      try {
        const formData = new FormData(e.currentTarget)
        const res = await fetch(`/api/club-achievements`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ clubId, title, description }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || "Failed to create achievement")
        setFeedback({ type: "success", text: "Achievement created!" })
        setTitle("")
        setDescription("")
        window.location.reload()
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Failed"
        setFeedback({ type: "error", text: msg })
      }
    })
  }

  async function handleDeleteAchievement(achievementId: string) {
    startTransition(async () => {
      try {
        const res = await fetch(`/api/club-achievements`, {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: achievementId }),
        })
        if (!res.ok) throw new Error("Failed to delete achievement")
        setAchievements((prev) => prev.filter((a) => a.id !== achievementId))
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
          <CardTitle>Create Achievement</CardTitle>
          <CardDescription>Add a new achievement.</CardDescription>
        </CardHeader>
        <form onSubmit={handleCreateAchievement}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="achievement-title">Title</Label>
              <Input id="achievement-title" name="title" value={title} onChange={(e) => setTitle(e.target.value)} required disabled={isPending} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="achievement-desc">Description</Label>
              <Textarea id="achievement-desc" name="description" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} disabled={isPending} />
            </div>
            {feedback && (
              <p className={cn("text-sm", feedback.type === "success" ? "text-emerald-600" : "text-destructive")}>
                {feedback.text}
              </p>
            )}
            <Button type="submit" disabled={isPending}>
              {isPending ? <Loader2 className="size-4 animate-spin mr-2" /> : <Plus className="size-4 mr-2" />}
              Create Achievement
            </Button>
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
              <div key={achievement.id} className="p-4 rounded-xl bg-surface border border-border">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-heading font-semibold text-foreground">{achievement.title}</h3>
                    {achievement.description && (
                      <p className="text-sm text-muted-foreground mt-1">{achievement.description}</p>
                    )}
                    {achievement.date && (
                      <p className="text-xs text-muted-foreground mt-1">{new Date(achievement.date).toLocaleDateString()}</p>
                    )}
                    {achievement.imageUrl && (
                      <img src={achievement.imageUrl} alt={achievement.title} className="w-full h-32 object-cover rounded-lg mt-2" />
                    )}
                    {achievement.linkUrl && (
                      <a href={achievement.linkUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-primary hover:underline mt-2">
                        View Details
                      </a>
                    )}
                  </div>
                  <form action={() => handleDeleteAchievement(achievement.id)}>
                    <Button type="submit" variant="ghost" size="sm" disabled={isPending}>
                      <Trash2 className="size-4" />
                    </Button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
