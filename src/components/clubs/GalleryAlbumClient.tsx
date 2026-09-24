"use client"

import { useRef, useState, useTransition } from "react"
import { Loader2, Plus, Trash2, Pencil, X, Check, UploadCloud, Images, ImagePlus } from "lucide-react"
import { generateUploadDropzone } from "@uploadthing/react"
import type { OurFileRouter } from "@/lib/uploadthing"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

const UploadDropzone = generateUploadDropzone<OurFileRouter>()

interface GalleryImage {
  id: string
  imageUrl: string
  caption: string | null
  displayOrder: number
}

interface GalleryAlbum {
  id: string
  clubId: string
  title: string
  description: string | null
  displayOrder: number
  createdAt: string
  updatedAt: string
  images: GalleryImage[]
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

  // Images uploaded in the create form before the album exists
  const [pendingUrls, setPendingUrls] = useState<string[]>([])
  const [pendingUploading, setPendingUploading] = useState(false)

  // Selected album for photo management
  const [selectedAlbumId, setSelectedAlbumId] = useState<string | null>(null)
  const detailRef = useRef<HTMLDivElement>(null)

  // Album edit state (inside the detail panel)
  const [editingAlbum, setEditingAlbum] = useState(false)
  const [editTitle, setEditTitle] = useState("")
  const [editDescription, setEditDescription] = useState("")

  // Per-image caption edit state: imageId -> draft caption
  const [editingCaptionId, setEditingCaptionId] = useState<string | null>(null)
  const [captionDraft, setCaptionDraft] = useState("")
  const [savingImages, setSavingImages] = useState(false)

  const selectedAlbum = albums.find((a) => a.id === selectedAlbumId) ?? null

  async function refreshAlbums() {
    const refreshed = await fetch(`/api/clubs/${clubId}/gallery`).then((r) => r.json())
    const rows = (refreshed.albums || []).map((a: GalleryAlbum & { clubGalleryImages?: GalleryImage[] }) => ({
      ...a,
      images: a.images ?? a.clubGalleryImages ?? [],
    }))
    setAlbums(rows)
    return rows as GalleryAlbum[]
  }

  function scrollToDetail() {
    requestAnimationFrame(() => {
      detailRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
    })
  }

  function openAlbumDetail(album: GalleryAlbum, editMode = false) {
    setSelectedAlbumId(album.id)
    setEditingAlbum(editMode)
    setEditTitle(album.title)
    setEditDescription(album.description ?? "")
    setFeedback(null)
    scrollToDetail()
  }

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
        const album = await res.json()
        if (!res.ok) throw new Error(album.error || "Failed to create album")

        // Persist any images uploaded in the create form
        if (pendingUrls.length > 0) {
          for (let i = 0; i < pendingUrls.length; i++) {
            const r = await fetch("/api/gallery-images", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ albumId: album.id, imageUrl: pendingUrls[i], displayOrder: i }),
            })
            const data = await r.json()
            if (!r.ok) throw new Error(data.error || "Album created, but failed to save images")
          }
        }

        setFeedback({
          type: "success",
          text:
            pendingUrls.length > 0
              ? `Album created with ${pendingUrls.length} photo${pendingUrls.length > 1 ? "s" : ""}!`
              : "Album created! Select it below to upload images.",
        })
        setTitle("")
        setDescription("")
        setPendingUrls([])
        const rows = await refreshAlbums()
        const created = rows.find((a) => a.id === album.id)
        if (created) openAlbumDetail(created)
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Failed"
        setFeedback({ type: "error", text: msg })
      }
    })
  }

  async function handleUpdateAlbum() {
    if (!selectedAlbum) return
    setFeedback(null)
    startTransition(async () => {
      try {
        const res = await fetch(`/api/clubs/${clubId}/gallery`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ albumId: selectedAlbum.id, title: editTitle, description: editDescription }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || "Failed to update album")
        setEditingAlbum(false)
        setFeedback({ type: "success", text: "Album updated!" })
        await refreshAlbums()
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Failed"
        setFeedback({ type: "error", text: msg })
      }
    })
  }

  async function handleDeleteAlbum(albumId: string) {
    if (!window.confirm("Delete this album and all its images? This cannot be undone.")) return
    startTransition(async () => {
      try {
        const res = await fetch(`/api/clubs/${clubId}/gallery`, {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ albumId }),
        })
        if (!res.ok) throw new Error("Failed to delete album")
        setAlbums((prev) => prev.filter((a) => a.id !== albumId))
        if (selectedAlbumId === albumId) {
          setSelectedAlbumId(null)
          setEditingAlbum(false)
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Failed"
        setFeedback({ type: "error", text: msg })
      }
    })
  }

  async function persistUploadedUrls(albumId: string, urls: string[]) {
    if (urls.length === 0) return
    setSavingImages(true)
    setFeedback(null)
    try {
      const existing = albums.find((a) => a.id === albumId)?.images.length ?? 0
      for (let i = 0; i < urls.length; i++) {
        const r = await fetch("/api/gallery-images", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ albumId, imageUrl: urls[i], displayOrder: existing + i }),
        })
        const data = await r.json()
        if (!r.ok) throw new Error(data.error || "Failed to save image")
      }
      setFeedback({ type: "success", text: `${urls.length} image${urls.length > 1 ? "s" : ""} uploaded!` })
      await refreshAlbums()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to save images"
      setFeedback({ type: "error", text: msg })
    } finally {
      setSavingImages(false)
    }
  }

  async function handleSaveCaption(imageId: string) {
    startTransition(async () => {
      try {
        const res = await fetch("/api/gallery-images", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: imageId, caption: captionDraft }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || "Failed to update caption")
        setAlbums((prev) =>
          prev.map((a) => ({
            ...a,
            images: a.images.map((img) =>
              img.id === imageId ? { ...img, caption: captionDraft.trim() ? captionDraft.trim() : null } : img
            ),
          }))
        )
        setEditingCaptionId(null)
        setCaptionDraft("")
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Failed"
        setFeedback({ type: "error", text: msg })
      }
    })
  }

  async function handleDeleteImage(imageId: string, albumId: string) {
    if (!window.confirm("Remove this image from the album?")) return
    startTransition(async () => {
      try {
        const res = await fetch("/api/gallery-images", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: imageId }),
        })
        if (!res.ok) throw new Error("Failed to delete image")
        setAlbums((prev) =>
          prev.map((a) =>
            a.id === albumId ? { ...a, images: a.images.filter((img) => img.id !== imageId) } : a
          )
        )
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Failed"
        setFeedback({ type: "error", text: msg })
      }
    })
  }

  return (
    <div className="space-y-6">
      {/* Create album — with image upload */}
      <Card>
        <CardHeader>
          <CardTitle>Create Album</CardTitle>
          <CardDescription>Add a new gallery album. You can upload photos right here — they’ll be attached when you create the album.</CardDescription>
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
                placeholder="e.g. Winter Meet 2025"
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
                placeholder="What is this album about?"
              />
            </div>

            <div className="space-y-2">
              <Label>Photos (optional — up to 5 at once)</Label>
              {pendingUrls.length > 0 && (
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                  {pendingUrls.map((url) => (
                    <div key={url} className="relative overflow-hidden rounded-lg border border-border">
                      <img src={url} alt="Pending upload" className="w-full h-20 object-cover" />
                      <button
                        type="button"
                        onClick={() => setPendingUrls((prev) => prev.filter((u) => u !== url))}
                        disabled={isPending}
                        aria-label="Remove pending photo"
                        className="absolute top-1 right-1 p-1 rounded-md bg-black/70 text-white hover:bg-destructive transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        <X className="size-3.5" strokeWidth={1.5} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <div className="rounded-lg border border-dashed p-4">
                <UploadDropzone
                  endpoint="clubGalleryImage"
                  config={{ mode: "auto" }}
                  content={{
                    uploadIcon: <UploadCloud className="mx-auto size-8 text-muted-foreground" strokeWidth={1.5} />,
                    button: ({ isUploading, uploadProgress }) =>
                      isUploading ? `${Math.round(uploadProgress)}%` : pendingUrls.length > 0 ? "Upload more" : "Upload photos",
                    allowedContent: "Images (PNG, JPG, WebP) up to 10MB each — up to 5 at once",
                  }}
                  onUploadBegin={() => setPendingUploading(true)}
                  onClientUploadComplete={(res) => {
                    setPendingUploading(false)
                    if (res?.length) setPendingUrls((prev) => [...prev, ...res.map((f) => f.url)])
                  }}
                  onUploadError={(err) => {
                    setPendingUploading(false)
                    setFeedback({ type: "error", text: `Upload failed: ${err.message}` })
                  }}
                />
              </div>
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
            <Button type="submit" disabled={isPending || pendingUploading}>
              {isPending ? (
                <Loader2 className="size-4 animate-spin motion-reduce:animate-none mr-2" />
              ) : (
                <Plus className="size-4 mr-2" />
              )}
              Create Album{pendingUrls.length > 0 ? ` with ${pendingUrls.length} photo${pendingUrls.length > 1 ? "s" : ""}` : ""}
            </Button>
          </CardContent>
        </form>
      </Card>

      {/* Album list — small cards with edit/delete */}
      <div className="space-y-4">
        <h2 className="font-heading text-xl font-semibold text-foreground">
          Albums ({albums.length})
        </h2>
        {albums.length === 0 ? (
          <p className="text-muted-foreground text-sm">No albums yet.</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {albums.map((album) => {
              const cover = album.images[0]?.imageUrl ?? null
              const isSelected = album.id === selectedAlbumId
              return (
                <div
                  key={album.id}
                  className={cn(
                    "overflow-hidden rounded-xl bg-surface border transition-colors",
                    isSelected ? "border-primary/50" : "border-border"
                  )}
                >
                  <button
                    type="button"
                    onClick={() => openAlbumDetail(album)}
                    aria-label={`Manage photos in ${album.title}`}
                    className="block w-full text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
                  >
                    <div className="relative h-28 w-full bg-muted/40">
                      {cover ? (
                        <img src={cover} alt="" loading="lazy" className="w-full h-full object-cover" />
                      ) : (
                        <div className="flex h-full items-center justify-center">
                          <Images className="size-8 text-muted-foreground/60" strokeWidth={1.5} />
                        </div>
                      )}
                      <span className="absolute bottom-2 left-2">
                        <Badge variant="secondary">
                          {album.images.length} photo{album.images.length === 1 ? "" : "s"}
                        </Badge>
                      </span>
                    </div>
                    <div className="px-3 pt-2.5">
                      <h3 className="font-heading font-semibold text-foreground text-sm truncate">
                        {album.title}
                      </h3>
                      {album.description ? (
                        <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{album.description}</p>
                      ) : (
                        <p className="text-xs text-muted-foreground/60 italic mt-0.5">No description</p>
                      )}
                    </div>
                  </button>
                  <div className="flex items-center justify-end gap-1 px-2 pb-2 pt-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => openAlbumDetail(album)}
                      disabled={isPending}
                      aria-label={`Manage photos in ${album.title}`}
                      title="Manage photos"
                    >
                      <ImagePlus className="size-4" strokeWidth={1.5} />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => openAlbumDetail(album, true)}
                      disabled={isPending}
                      aria-label={`Edit album ${album.title}`}
                      title="Edit album"
                    >
                      <Pencil className="size-4" strokeWidth={1.5} />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteAlbum(album.id)}
                      disabled={isPending}
                      aria-label={`Delete album ${album.title}`}
                      title="Delete album"
                      className="hover:text-destructive"
                    >
                      <Trash2 className="size-4" strokeWidth={1.5} />
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Selected album detail — photos management */}
      {selectedAlbum && (
        <div ref={detailRef} className="scroll-mt-24">
          <Card className="border-primary/30">
            <CardHeader>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  {editingAlbum ? (
                    <div className="space-y-3">
                      <div className="space-y-2">
                        <Label htmlFor={`edit-album-title-${selectedAlbum.id}`}>Album title</Label>
                        <Input
                          id={`edit-album-title-${selectedAlbum.id}`}
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          disabled={isPending}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`edit-album-desc-${selectedAlbum.id}`}>Album description</Label>
                        <Textarea
                          id={`edit-album-desc-${selectedAlbum.id}`}
                          value={editDescription}
                          onChange={(e) => setEditDescription(e.target.value)}
                          rows={2}
                          disabled={isPending}
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button type="button" size="sm" onClick={handleUpdateAlbum} disabled={isPending}>
                          <Check className="size-4 mr-1" />
                          Save
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => setEditingAlbum(false)}
                          disabled={isPending}
                        >
                          <X className="size-4 mr-1" />
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <CardTitle className="text-lg">{selectedAlbum.title}</CardTitle>
                      {selectedAlbum.description && (
                        <CardDescription className="mt-1">{selectedAlbum.description}</CardDescription>
                      )}
                      <Badge variant="secondary" className="mt-2">
                        <Images className="size-3 mr-1" strokeWidth={1.5} />
                        {selectedAlbum.images.length} photo{selectedAlbum.images.length === 1 ? "" : "s"}
                      </Badge>
                    </>
                  )}
                </div>
                <div className="flex shrink-0 gap-1">
                  {!editingAlbum && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setEditingAlbum(true)
                        setEditTitle(selectedAlbum.title)
                        setEditDescription(selectedAlbum.description ?? "")
                      }}
                      disabled={isPending}
                      aria-label={`Edit album ${selectedAlbum.title}`}
                    >
                      <Pencil className="size-4" strokeWidth={1.5} />
                    </Button>
                  )}
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedAlbumId(null)
                      setEditingAlbum(false)
                    }}
                    disabled={isPending}
                    aria-label="Close album details"
                  >
                    <X className="size-4" strokeWidth={1.5} />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {selectedAlbum.images.length > 0 ? (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {selectedAlbum.images.map((img) => (
                    <figure
                      key={img.id}
                      className="group overflow-hidden rounded-xl border border-border bg-card"
                    >
                      <div className="relative overflow-hidden">
                        <img
                          src={img.imageUrl}
                          alt={img.caption ?? selectedAlbum.title}
                          loading="lazy"
                          className="w-full h-40 object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => handleDeleteImage(img.id, selectedAlbum.id)}
                          disabled={isPending}
                          aria-label="Remove image"
                          className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/70 text-white hover:bg-destructive transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        >
                          <Trash2 className="size-3.5" strokeWidth={1.5} />
                        </button>
                      </div>
                      <figcaption className="px-3 py-2">
                        {editingCaptionId === img.id ? (
                          <div className="flex items-center gap-1.5">
                            <Input
                              value={captionDraft}
                              onChange={(e) => setCaptionDraft(e.target.value)}
                              placeholder="Add a caption…"
                              className="h-8 text-xs"
                              disabled={isPending}
                              aria-label="Image caption"
                            />
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              className="h-8 w-8 p-0 shrink-0"
                              onClick={() => handleSaveCaption(img.id)}
                              disabled={isPending}
                              aria-label="Save caption"
                            >
                              <Check className="size-4" />
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              className="h-8 w-8 p-0 shrink-0"
                              onClick={() => {
                                setEditingCaptionId(null)
                                setCaptionDraft("")
                              }}
                              disabled={isPending}
                              aria-label="Cancel caption edit"
                            >
                              <X className="size-4" />
                            </Button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              setEditingCaptionId(img.id)
                              setCaptionDraft(img.caption ?? "")
                            }}
                            className="w-full text-left text-xs text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
                            title="Click to edit caption"
                          >
                            {img.caption || <span className="italic">Add a caption…</span>}
                          </button>
                        )}
                      </figcaption>
                    </figure>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground italic">
                  No photos yet — upload up to 5 at a time below.
                </p>
              )}

              <div className="rounded-lg border border-dashed p-4">
                <UploadDropzone
                  endpoint="clubGalleryImage"
                  config={{ mode: "auto" }}
                  content={{
                    uploadIcon: <UploadCloud className="mx-auto size-8 text-muted-foreground" strokeWidth={1.5} />,
                    button: ({ isUploading, uploadProgress }) =>
                      isUploading
                        ? `${Math.round(uploadProgress)}%`
                        : savingImages
                          ? "Saving…"
                          : `Upload images to ${selectedAlbum.title}`,
                    allowedContent: "Images (PNG, JPG, WebP) up to 10MB each — up to 5 at once",
                  }}
                  onClientUploadComplete={(res) =>
                    persistUploadedUrls(
                      selectedAlbum.id,
                      res.map((f) => f.url)
                    )
                  }
                  onUploadError={(err) =>
                    setFeedback({ type: "error", text: `Upload failed: ${err.message}` })
                  }
                />
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
