"use client"

import { useState, useTransition, type FormEvent } from "react"
import { Loader2, Save } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { updateCurrentBatch } from "@/app/(admin)/manage/settings/actions"

type Feedback =
  | { type: "success"; text: string }
  | { type: "error"; text: string }

export function SiteSettingsForm({ initialBatch }: { initialBatch: number }) {
  const [batch, setBatch] = useState(String(initialBatch))
  const [feedback, setFeedback] = useState<Feedback | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFeedback(null)

    const parsed = Number.parseInt(batch, 10)
    if (!Number.isInteger(parsed) || parsed < 1) {
      setFeedback({
        type: "error",
        text: "Batch must be a positive whole number.",
      })
      return
    }

    startTransition(async () => {
      const result = await updateCurrentBatch(parsed)
      if (result.success) {
        setBatch(String(result.currentBatch))
        setFeedback({
          type: "success",
          text: `Current batch updated to ${result.currentBatch}. New profile submissions can now select up to batch ${result.currentBatch}.`,
        })
      } else {
        setFeedback({ type: "error", text: result.error })
      }
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-heading">Current batch</CardTitle>
        <CardDescription>
          A new batch starts roughly every 4 months. Bump this value when it
          does so the profile form&apos;s batch dropdown extends to the new
          number. Existing profiles keep their original batch.
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor="current-batch">Current batch on file</Label>
            <div
              id="current-batch"
              className="flex h-9 items-center rounded-md border px-3 text-sm text-foreground"
            >
              {initialBatch}
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="new-batch">New batch</Label>
            <Input
              id="new-batch"
              type="number"
              min="1"
              step="1"
              inputMode="numeric"
              value={batch}
              onChange={(e) => setBatch(e.target.value)}
              disabled={isPending}
            />
          </div>
        </CardContent>

        {feedback ? (
          <CardContent className="pt-0">
            <p
              role={feedback.type === "error" ? "alert" : "status"}
              className={
                feedback.type === "error"
                  ? "rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
                  : "rounded-md border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-700 dark:text-emerald-300"
              }
            >
              {feedback.text}
            </p>
          </CardContent>
        ) : null}

        <CardFooter>
          <Button type="submit" disabled={isPending}>
            {isPending ? (
              <Loader2 className="size-4 animate-spin" strokeWidth={1.5} />
            ) : (
              <Save className="size-4" strokeWidth={1.5} />
            )}
            Update batch
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}
