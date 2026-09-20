"use client"

import { useState, useTransition } from "react"
import { Loader2, AlertTriangle, UploadCloud, Plus, X } from "lucide-react"
import { generateUploadDropzone } from "@uploadthing/react"
import type { OurFileRouter } from "@/lib/uploadthing"
import { splitGroupUrls, joinGroupUrls } from "@/lib/club-links"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"

const UploadDropzone = generateUploadDropzone<OurFileRouter>()

type Feedback =
  | { type: "success"; text: string }
  | { type: "error"; text: string }
  | { type: "rateLimit"; text: string }

export interface ClubFormData {
  name: string
  description: string
  departmentId: string
  logoUrl: string
  coverImgUrl: string
  msgGroupUrl: string
  pageUrl: string
  fbGroupUrl: string
  contacts: string
  mail: string
  updatedAt?: string
}

interface ClubManagementFormProps {
  initialData?: Partial<ClubFormData> & { id?: string }
  departments: { id: string; name: string; slug: string }[]
  onSubmit: (data: ClubFormData) => Promise<void>
  submitLabel?: string
}

function ImageUploadField({
  label,
  value,
  onChange,
  onError,
  disabled,
  previewShape,
}: {
  label: string
  value: string
  onChange: (url: string) => void
  onError: (message: string) => void
  disabled: boolean
  previewShape: "square" | "wide"
}) {
  if (value) {
    return (
      <div className="space-y-2">
        <Label>{label}</Label>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-lg border p-3 bg-muted/30 w-full overflow-hidden">
          <div className="flex items-center gap-3 min-w-0">
            <img
              src={value}
              alt={`${label} preview`}
              className={cn(
                "object-cover shrink-0 border",
                previewShape === "square" ? "size-16 rounded-xl" : "h-16 w-28 rounded-lg"
              )}
            />
            <p className="text-xs font-medium text-foreground truncate">
              {label} uploaded successfully
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="shrink-0 w-full sm:w-auto"
            disabled={disabled}
            onClick={() => onChange("")}
          >
            Change / Remove
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="rounded-lg border border-dashed p-4 w-full overflow-hidden">
        <UploadDropzone
          endpoint="clubImage"
          config={{ mode: "auto" }}
          content={{
            uploadIcon: <UploadCloud className="mx-auto size-10 text-muted-foreground" strokeWidth={1.5} />,
            button: ({ isUploading, uploadProgress }) =>
              isUploading ? `${Math.round(uploadProgress)}%` : `Upload ${label}`,
            allowedContent: "Image (PNG, JPG, WebP) up to 10MB",
          }}
          onClientUploadComplete={(res) => {
            if (res?.[0]?.url) onChange(res[0].url)
          }}
          onUploadError={(err) => onError(err.message)}
        />
      </div>
    </div>
  )
}

export function ClubManagementForm({
  initialData,
  departments,
  onSubmit,
  submitLabel = "Save",
}: ClubManagementFormProps) {
  const [isPending, startTransition] = useTransition()
  const [feedback, setFeedback] = useState<Feedback | null>(null)

  const [name, setName] = useState(initialData?.name ?? "")
  const [departmentId, setDepartmentId] = useState(initialData?.departmentId ?? "")
  const [description, setDescription] = useState(initialData?.description ?? "")
  const [logoUrl, setLogoUrl] = useState(initialData?.logoUrl ?? "")
  const [coverImgUrl, setCoverImgUrl] = useState(initialData?.coverImgUrl ?? "")
  // Multiple group links, stored newline-separated in the single msgGroupUrl column.
  const [groupLinks, setGroupLinks] = useState<string[]>(() =>
    splitGroupUrls(initialData?.msgGroupUrl)
  )
  const [pageUrl, setPageUrl] = useState(initialData?.pageUrl ?? "")
  const [fbGroupUrl, setFbGroupUrl] = useState(initialData?.fbGroupUrl ?? "")
  const [contacts, setContacts] = useState(initialData?.contacts ?? "")
  const [mail, setMail] = useState(initialData?.mail ?? "")

  function handleUploadError(message: string) {
    // Upload is a blocking step (spec clarification): the admin must retry
    // the upload before submitting — the URL stays empty so the form can't
    // be saved with a missing image.
    setFeedback({ type: "error", text: `Image upload failed: ${message}. Please retry the upload before saving.` })
  }

  function updateGroupLink(index: number, value: string) {
    setGroupLinks((prev) => prev.map((u, i) => (i === index ? value : u)))
  }

  function addGroupLink() {
    setGroupLinks((prev) => [...prev, ""])
  }

  function removeGroupLink(index: number) {
    setGroupLinks((prev) => (prev.length <= 1 ? [""] : prev.filter((_, i) => i !== index)))
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setFeedback(null)

    const payload: ClubFormData = {
      name: name.trim(),
      description: description.trim(),
      departmentId,
      logoUrl,
      coverImgUrl,
      msgGroupUrl: joinGroupUrls(groupLinks),
      pageUrl: pageUrl.trim(),
      fbGroupUrl: fbGroupUrl.trim(),
      contacts: contacts.trim(),
      mail: mail.trim(),
      ...(initialData?.updatedAt ? { updatedAt: initialData.updatedAt } : {}),
    }

    startTransition(async () => {
      try {
        await onSubmit(payload)
        setFeedback({ type: "success", text: "Saved successfully!" })
      } catch (err: unknown) {
        const message =
          err instanceof Error
            ? err.message
            : typeof err === "object" && err !== null && "error" in err
              ? (err as { error: string }).error
              : "An error occurred"

        if (message.includes("Rate limit")) {
          setFeedback({ type: "rateLimit", text: message })
        } else {
          setFeedback({ type: "error", text: message })
        }
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {feedback && (
        <div
          role="alert"
          className={cn(
            "rounded-lg border px-4 py-3 text-sm",
            feedback.type === "success"
              ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
              : feedback.type === "rateLimit"
                ? "border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300"
                : "border-destructive/40 bg-destructive/10 text-destructive"
          )}
        >
          {feedback.type === "rateLimit" && (
            <span className="flex items-center gap-2">
              <AlertTriangle className="size-4" strokeWidth={1.5} />
            </span>
          )}
          {feedback.text}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="club-name">Name *</Label>
          <Input
            id="club-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            disabled={isPending}
            placeholder="e.g. ML Club, UUCPC, Debate Club"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="club-department">Department *</Label>
          <select
            id="club-department"
            value={departmentId}
            onChange={(e) => setDepartmentId(e.target.value)}
            required
            disabled={isPending}
            className="flex h-10 w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm"
          >
            <option value="">Select department</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="club-description">Description</Label>
        <Textarea
          id="club-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
          disabled={isPending}
          placeholder="What the club does. URLs in the text become clickable links."
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <ImageUploadField
          label="Logo"
          value={logoUrl}
          onChange={setLogoUrl}
          onError={handleUploadError}
          disabled={isPending}
          previewShape="square"
        />
        <ImageUploadField
          label="Cover image"
          value={coverImgUrl}
          onChange={setCoverImgUrl}
          onError={handleUploadError}
          disabled={isPending}
          previewShape="wide"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <Label id="club-group-links-label">Messenger / WhatsApp group URLs</Label>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={addGroupLink}
              disabled={isPending}
              aria-label="Add another group link"
              title="Add another group link"
              className="h-7 px-2 text-xs text-primary hover:text-primary"
            >
              <Plus className="size-4" strokeWidth={1.5} />
              Add
            </Button>
          </div>
          <div className="space-y-2" role="group" aria-labelledby="club-group-links-label">
            {groupLinks.map((url, i) => (
              <div key={i} className="flex items-center gap-2">
                <Input
                  id={i === 0 ? "club-msg-group" : `club-msg-group-${i + 1}`}
                  type="url"
                  value={url}
                  onChange={(e) => updateGroupLink(i, e.target.value)}
                  placeholder={
                    i === 0
                      ? "https://m.me/… or https://chat.whatsapp.com/…"
                      : `Group link ${i + 1} — https://…`
                  }
                  disabled={isPending}
                  aria-label={i === 0 ? "Messenger or WhatsApp group URL" : `Group link ${i + 1}`}
                  className="flex-1"
                />
                {groupLinks.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeGroupLink(i)}
                    disabled={isPending}
                    aria-label={`Remove group link ${i + 1}`}
                    className="h-10 w-10 shrink-0 p-0 text-muted-foreground hover:text-destructive"
                  >
                    <X className="size-4" strokeWidth={1.5} />
                  </Button>
                )}
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">
            Add one input per group — use the plus button for multiple Messenger / WhatsApp / Telegram groups.
          </p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="club-page">Page URL</Label>
          <Input
            id="club-page"
            type="url"
            value={pageUrl}
            onChange={(e) => setPageUrl(e.target.value)}
            placeholder="https://facebook.com/…"
            disabled={isPending}
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="club-fb-group">Facebook group URL</Label>
          <Input
            id="club-fb-group"
            type="url"
            value={fbGroupUrl}
            onChange={(e) => setFbGroupUrl(e.target.value)}
            placeholder="https://facebook.com/groups/…"
            disabled={isPending}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="club-mail">Email</Label>
          <Input
            id="club-mail"
            type="email"
            value={mail}
            onChange={(e) => setMail(e.target.value)}
            placeholder="club@example.com"
            disabled={isPending}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="club-contacts">Contacts</Label>
        <Textarea
          id="club-contacts"
          value={contacts}
          onChange={(e) => setContacts(e.target.value)}
          rows={2}
          disabled={isPending}
          placeholder="Phone numbers or contact persons, one per line"
        />
      </div>

      <Button type="submit" disabled={isPending}>
        {isPending ? (
          <Loader2 className="size-4 animate-spin motion-reduce:animate-none mr-2" strokeWidth={1.5} />
        ) : null}
        {submitLabel}
      </Button>
    </form>
  )
}
