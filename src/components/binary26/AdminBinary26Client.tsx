"use client"

import { useState } from "react"
import { upsertBinary26GalleryItem, deleteBinary26GalleryItem, updateBinary26EventSettings } from "@/lib/binary26/actions"
import { Calendar, Clock, MapPin, Plus, Trash2, Edit2, Save, Image as ImageIcon, Sparkles, CheckCircle2, AlertCircle, Loader2 } from "lucide-react"
import { generateUploadDropzone } from "@uploadthing/react"
import type { OurFileRouter } from "@/lib/uploadthing"

const UploadDropzone = generateUploadDropzone<OurFileRouter>()

interface GalleryItem {
  id: string
  title: string
  imageUrl: string
  year: string
  description: string | null
  displayOrder: number
}

interface EventSettings {
  eventTime: string
  title: string
  location: string
}

interface AdminBinary26ClientProps {
  initialSettings: EventSettings
  initialGallery: GalleryItem[]
}

export function AdminBinary26Client({ initialSettings, initialGallery }: AdminBinary26ClientProps) {
  const [settings, setSettings] = useState(initialSettings)
  const [gallery, setGallery] = useState<GalleryItem[]>(initialGallery)
  const [loadingSettings, setLoadingSettings] = useState(false)
  const [settingsMsg, setSettingsMsg] = useState<{ text: string; type: "success" | "error" } | null>(null)

  // Gallery item form state
  const [editingId, setEditingId] = useState<string | null>(null)
  const [galleryForm, setGalleryForm] = useState({
    title: "",
    imageUrl: "",
    year: "2025",
    description: "",
    displayOrder: 0,
  })
  const [savingGallery, setSavingGallery] = useState(false)
  const [galleryMsg, setGalleryMsg] = useState<{ text: string; type: "success" | "error" } | null>(null)

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoadingSettings(true)
    setSettingsMsg(null)

    try {
      const res = await updateBinary26EventSettings(settings)
      if (res.success) {
        setSettingsMsg({ text: "Event settings successfully updated!", type: "success" })
      } else if (!res.success) {
        setSettingsMsg({ text: res.error || "Failed to update settings.", type: "error" })
      }
    } catch (err) {
      console.error(err)
      setSettingsMsg({ text: "An error occurred.", type: "error" })
    } finally {
      setLoadingSettings(false)
    }
  }

  const handleSaveGallery = async (e: React.FormEvent) => {
    e.preventDefault()
    setSavingGallery(true)
    setGalleryMsg(null)

    try {
      const res = await upsertBinary26GalleryItem({
        id: editingId || undefined,
        ...galleryForm,
      })
      if (res.success) {
        setGalleryMsg({ text: editingId ? "Gallery item updated!" : "Gallery item added!", type: "success" })
        setEditingId(null)
        setGalleryForm({ title: "", imageUrl: "", year: "2025", description: "", displayOrder: 0 })
        // Reload page or re-fetch (simulated by full reload or router refresh)
        window.location.reload()
      } else if (!res.success) {
        setGalleryMsg({ text: res.error || "Failed to save gallery item.", type: "error" })
      }
    } catch (err) {
      console.error(err)
      setGalleryMsg({ text: "An error occurred.", type: "error" })
    } finally {
      setSavingGallery(false)
    }
  }

  const handleDeleteGallery = async (id: string) => {
    if (!confirm("Are you sure you want to delete this gallery item?")) return
    try {
      const res = await deleteBinary26GalleryItem(id)
      if (res.success) {
        setGallery(prev => prev.filter(item => item.id !== id))
      }
    } catch (err) {
      console.error(err)
    }
  }

  const handleEditGallery = (item: GalleryItem) => {
    setEditingId(item.id)
    setGalleryForm({
      title: item.title,
      imageUrl: item.imageUrl,
      year: item.year,
      description: item.description || "",
      displayOrder: item.displayOrder,
    })
  }

  return (
    <div className="space-y-12">
      
      {/* Event Settings & Timer Manager */}
      <div className="bg-surface border border-border rounded-2xl p-6 md:p-8 shadow-sm space-y-6">
        <div className="space-y-1">
          <h3 className="text-xl font-heading font-bold text-foreground flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary" />
            <span>Event Timer & Banner Configuration</span>
          </h3>
          <p className="text-sm text-muted-foreground">
            Update the countdown timer target date, event title, and location shown on the home banner and event page.
          </p>
        </div>

        {settingsMsg && (
          <div className={`p-3 rounded-xl text-xs font-medium flex items-center gap-2 ${
            settingsMsg.type === 'success' ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20' : 'bg-destructive/10 text-destructive border border-destructive/20'
          }`}>
            {settingsMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
            <span>{settingsMsg.text}</span>
          </div>
        )}

        <form onSubmit={handleSaveSettings} className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Event Title</label>
            <input
              type="text"
              required
              value={settings.title}
              onChange={(e) => setSettings({ ...settings, title: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl bg-background border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Event Date & Time (ISO)</label>
            <input
              type="datetime-local"
              required
              value={settings.eventTime ? new Date(settings.eventTime).toISOString().slice(0, 16) : ""}
              onChange={(e) => setSettings({ ...settings, eventTime: new Date(e.target.value).toISOString() })}
              className="w-full px-4 py-2.5 rounded-xl bg-background border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Location</label>
            <input
              type="text"
              required
              value={settings.location}
              onChange={(e) => setSettings({ ...settings, location: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl bg-background border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>

          <div className="md:col-span-3 flex justify-end">
            <button
              type="submit"
              disabled={loadingSettings}
              className="px-6 py-2.5 rounded-xl bg-primary text-primary-foreground font-medium hover:bg-primary-hover transition-all text-sm flex items-center gap-2 disabled:opacity-50"
            >
              {loadingSettings ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              <span>Save Event Settings</span>
            </button>
          </div>
        </form>
      </div>

      {/* Previous Binary Clicks Gallery Manager (5+ items) */}
      <div className="bg-surface border border-border rounded-2xl p-6 md:p-8 shadow-sm space-y-6">
        <div className="space-y-1">
          <h3 className="text-xl font-heading font-bold text-foreground flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-primary" />
            <span>Previous Binary Clicks Gallery Manager ({gallery.length} Items)</span>
          </h3>
          <p className="text-sm text-muted-foreground">
            Submit 5 or more previous binary clicks (photos, titles, years) to showcase in the interactive carousel/gallery.
          </p>
        </div>

        {galleryMsg && (
          <div className={`p-3 rounded-xl text-xs font-medium flex items-center gap-2 ${
            galleryMsg.type === 'success' ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20' : 'bg-destructive/10 text-destructive border border-destructive/20'
          }`}>
            {galleryMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
            <span>{galleryMsg.text}</span>
          </div>
        )}

        <form onSubmit={handleSaveGallery} className="bg-muted/30 border border-border rounded-xl p-6 space-y-4">
          <h4 className="font-heading font-semibold text-sm text-foreground">
            {editingId ? "Edit Gallery Item" : "Add New Gallery Item"}
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Title</label>
              <input
                type="text"
                required
                placeholder="e.g. Winter Meet 2025"
                value={galleryForm.title}
                onChange={(e) => setGalleryForm({ ...galleryForm, title: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-background border border-border text-foreground text-sm"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Image URL</label>
              <input
                type="url"
                required
                placeholder="https://images.unsplash.com/... or upload below"
                value={galleryForm.imageUrl}
                onChange={(e) => setGalleryForm({ ...galleryForm, imageUrl: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-background border border-border text-foreground text-sm"
              />
            </div>

            <div className="md:col-span-4 space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Upload Gallery Image (Uploadthing)</label>
              <UploadDropzone
                endpoint="binary26Image"
                onClientUploadComplete={(res) => {
                  if (res && res[0]) {
                    setGalleryForm({ ...galleryForm, imageUrl: res[0].url })
                    setGalleryMsg({ text: "Image uploaded successfully via Uploadthing!", type: "success" })
                  }
                }}
                onUploadError={(error: Error) => {
                  setGalleryMsg({ text: `Upload error: ${error.message}`, type: "error" })
                }}
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Year</label>
              <input
                type="text"
                required
                placeholder="2025"
                value={galleryForm.year}
                onChange={(e) => setGalleryForm({ ...galleryForm, year: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-background border border-border text-foreground text-sm"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Display Order</label>
              <input
                type="number"
                value={galleryForm.displayOrder}
                onChange={(e) => setGalleryForm({ ...galleryForm, displayOrder: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 rounded-lg bg-background border border-border text-foreground text-sm"
              />
            </div>

            <div className="md:col-span-4 space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Description (Optional)</label>
              <input
                type="text"
                placeholder="Brief summary of the event..."
                value={galleryForm.description}
                onChange={(e) => setGalleryForm({ ...galleryForm, description: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-background border border-border text-foreground text-sm"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            {editingId && (
              <button
                type="button"
                onClick={() => {
                  setEditingId(null)
                  setGalleryForm({ title: "", imageUrl: "", year: "2025", description: "", displayOrder: 0 })
                }}
                className="px-4 py-2 rounded-lg bg-surface border border-border text-foreground text-xs font-medium"
              >
                Cancel
              </button>
            )}
            <button
              type="submit"
              disabled={savingGallery}
              className="px-5 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary-hover flex items-center gap-1.5"
            >
              {savingGallery ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
              <span>{editingId ? "Update Item" : "Add Gallery Item"}</span>
            </button>
          </div>
        </form>

        {/* Existing Gallery List */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {gallery.map((item) => (
            <div key={item.id} className="bg-surface border border-border rounded-xl overflow-hidden shadow-sm flex flex-col">
              <div className="aspect-video w-full bg-muted relative">
                <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover" />
                <span className="absolute top-2 right-2 px-2 py-0.5 rounded-md bg-black/70 text-white text-[10px] font-semibold">
                  Year {item.year}
                </span>
              </div>
              <div className="p-4 flex-1 flex flex-col justify-between space-y-2">
                <div>
                  <h5 className="font-heading font-bold text-foreground text-sm truncate">{item.title}</h5>
                  {item.description && <p className="text-xs text-muted-foreground line-clamp-1">{item.description}</p>}
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-border/60">
                  <span className="text-[10px] text-muted-foreground">Order: {item.displayOrder}</span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleEditGallery(item)}
                      className="p-1.5 rounded-lg bg-surface border border-border text-foreground hover:bg-accent"
                      title="Edit"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteGallery(item.id)}
                      className="p-1.5 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  )
}
