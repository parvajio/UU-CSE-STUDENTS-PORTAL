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

interface GalleryAlbum {
  id: string
  clubId: string
  title: string
  description: string | null
  displayOrder: number
  createdAt: string
  updatedAt: string
}

interface GalleryAlbumClientProps {
  clubId: string
  initialAlbums: GalleryAlbum[]
}

type Feedback = { type: "success"; text: string } | { type: "error"; text: string }

export function GalleryAlbumClient({
  clubId,
  initialAlbums,
}: GalleryAlbumClientProps) {
  const [isPending, startTransition] = useTransition()
  const [feedback, setFeedback] = useState<Feedback | null>(null)
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [albums, setAlbums] = useState<GalleryAlbum[]>(initialAlbums)

  async function handleCreateAlbum(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setFeedback(null)
    startTransition(async () => {
      try {
        const res = await fetch(`/api/clubs/${clubId}/gallery`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ clubId, title, description }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || "Failed to create album")
        setFeedback({ type: "success", text: "Album created!" })
        setTitle("")
        setDescription("")
        const refreshed = await fetch(`/api/clubs/${clubId}/gallery`).then((r) => r.json())
        setAlbums(refreshed.albums || [])
        window.location.reload()
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Failed"
        setFeedback({ type: "error", text: msg })
      }
    })
  }

  async function handleDeleteAlbum(albumId: string) {
    startTransition(async () => {
      try {
        const res = await fetch(`/api/clubs/${clubId}/gallery`, {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ albumId }),
        })
        if (!res.ok) throw new Error("Failed to delete album")
        setAlbums((prev) => prev.filter((a) => a.id !== albumId))
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
          <CardTitle>Create Album</CardTitle>
          <CardDescription>Add a new gallery album.</CardDescription>
        </CardHeader>
        <form onSubmit={handleCreateAlbum}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="album-title">Title</Label>
              <Input
                id="album-title"
                name="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                disabled={isPending}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="album-desc">Description</Label>
              <Textarea
                id="album-desc"
                name="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                disabled={isPending}
              />
            </div>
            {feedback && (
              <p
                className={cn(
                  "text-sm",
                  feedback.type === "success" ? "text-emerald-600" : "text-destructive"
                )}
              >
                {feedback.text}
              </p>
            )}
            <Button type="submit" disabled={isPending}>
              {isPending ? (
                <Loader2 className="size-4 animate-spin motion-reduce:animate-none mr-2" />
              ) : (
                <Plus className="size-4 mr-2" />
              )}
              Create Album
            </Button>
          </CardContent>
        </form>
      </Card>

      <div className="space-y-4">
        <h2 className="font-heading text-xl font-semibold text-foreground">
          Albums ({albums.length})
        </h2>
        {albums.length === 0 ? (
          <p className="text-muted-foreground text-sm">No albums yet.</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {albums.map((album) => (
              <div key={album.id} className="p-4 rounded-xl bg-surface border border-border">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-heading font-semibold text-foreground">
                      {album.title}
                    </h3>
                    {album.description && (
                      <p className="text-sm text-muted-foreground">{album.description}</p>
                    )}
                    <Badge variant="secondary" className="mt-1">
                      {album.displayOrder}
                    </Badge>
                  </div>
                  <form action={() => handleDeleteAlbum(album.id)}>
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
