"use client"

import { useState, useTransition } from "react"
import { Loader2, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"

type Feedback =
  | { type: "success"; text: string }
  | { type: "error"; text: string }
  | { type: "rateLimit"; text: string }

interface ClubManagementFormProps {
  initialData?: {
    id?: string
    name?: string
    description?: string
    departmentId?: string
    logoUrl?: string
    coverImgUrl?: string
    updatedAt?: string
  }
  departments: { id: string; name: string; slug: string }[]
  onSubmit: (data: FormData) => Promise<void>
  submitLabel?: string
}

export function ClubManagementForm({
  initialData,
  departments,
  onSubmit,
  submitLabel = "Save",
}: ClubManagementFormProps) {
  const [isPending, startTransition] = useTransition()
  const [feedback, setFeedback] = useState<Feedback | null>(null)
  const [logoUrl, setLogoUrl] = useState(initialData?.logoUrl ?? "")
  const [coverImgUrl, setCoverImgUrl] = useState(initialData?.coverImgUrl ?? "")

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setFeedback(null)

    const formData = new FormData(e.currentTarget)
    if (logoUrl) formData.set("logoUrl", logoUrl)
    if (coverImgUrl) formData.set("coverImgUrl", coverImgUrl)

    startTransition(async () => {
      try {
        await onSubmit(formData)
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
            <div className="flex items-center gap-2">
              <AlertTriangle className="size-4" />
            </div>
          )}
          {feedback.text}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="name">Club Name *</Label>
          <Input
            id="name"
            name="name"
            defaultValue={initialData?.name}
            required
            disabled={isPending}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="departmentId">Department *</Label>
          <select
            id="departmentId"
            name="departmentId"
            defaultValue={initialData?.departmentId}
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
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          name="description"
          defaultValue={initialData?.description}
          rows={4}
          disabled={isPending}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="logoUrl">Logo URL</Label>
          <Input
            id="logoUrl"
            name="logoUrl"
            value={logoUrl}
            onChange={(e) => setLogoUrl(e.target.value)}
            placeholder="https://uploadthing.com/..."
            disabled={isPending}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="coverImgUrl">Cover Image URL</Label>
          <Input
            id="coverImgUrl"
            name="coverImgUrl"
            value={coverImgUrl}
            onChange={(e) => setCoverImgUrl(e.target.value)}
            placeholder="https://uploadthing.com/..."
            disabled={isPending}
          />
        </div>
      </div>

      <input type="hidden" name="updatedAt" defaultValue={initialData?.updatedAt} />

      <Button type="submit" disabled={isPending}>
        {isPending ? (
          <Loader2 className="size-4 animate-spin mr-2" strokeWidth={1.5} />
        ) : null}
        {submitLabel}
      </Button>
    </form>
  )
}
