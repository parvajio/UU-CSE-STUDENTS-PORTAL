"use client"

import { useCallback, useEffect, useState } from "react"
import { ChevronLeft, ChevronRight, Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { QuestionFile } from "@/types/question-bank"

export function QuestionImageGallery({
  questionId,
  files,
  questionTitle,
}: {
  questionId: string
  files: QuestionFile[]
  questionTitle: string
}) {
  const images = files.filter((file) => file.fileType === "image")
  const [selected, setSelected] = useState(0)
  const active = images[selected]

  const step = useCallback(
    (direction: -1 | 1) => {
      if (images.length <= 1) return
      const next = Math.min(
        Math.max(selected + direction, 0),
        images.length - 1
      )
      setSelected(next)
    },
    [images.length, selected]
  )

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "ArrowLeft") step(-1)
      if (event.key === "ArrowRight") step(1)
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [step])

  if (!active) return null

  const individualDownloadHref = `/api/questions/${questionId}/download?kind=file&file=${active.order}`

  return (
    <div className="space-y-3">
      <div className="overflow-hidden rounded-2xl border border-border bg-surface">
        <div className="relative flex items-center justify-center bg-muted/40 p-4">
          {images.length > 1 ? (
            <Button
              variant="ghost"
              size="icon"
              className="absolute left-3 top-1/2 z-10 -translate-y-1/2 rounded-full bg-background/80 text-foreground shadow-sm backdrop-blur-sm hover:bg-background"
              onClick={() => step(-1)}
              disabled={selected === 0}
              aria-label="Previous image"
            >
              <ChevronLeft className="size-5" strokeWidth={1.75} />
            </Button>
          ) : null}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            key={active.order}
            src={active.fileUrl}
            alt={`${questionTitle} — page ${selected + 1} of ${images.length}`}
            loading="lazy"
            className="h-auto w-full rounded-lg"
          />
          {images.length > 1 ? (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-3 top-1/2 z-10 -translate-y-1/2 rounded-full bg-background/80 text-foreground shadow-sm backdrop-blur-sm hover:bg-background"
              onClick={() => step(1)}
              disabled={selected === images.length - 1}
              aria-label="Next image"
            >
              <ChevronRight className="size-5" strokeWidth={1.75} />
            </Button>
          ) : null}
        </div>

        {images.length > 1 ? (
          <div
            className="flex gap-2 overflow-x-auto p-3 border-t border-border"
            aria-label="Question paper pages"
          >
            {images.map((image, index) => (
              <button
                key={image.order}
                type="button"
                aria-current={selected === index ? "true" : undefined}
                aria-label={`Show page ${index + 1}`}
                onClick={() => setSelected(index)}
                className={cn(
                  "relative shrink-0 overflow-hidden rounded-lg border-2 transition-colors",
                  selected === index
                    ? "border-primary ring-2 ring-ring/40"
                    : "border-transparent opacity-70 hover:opacity-100"
                )}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={image.fileUrl}
                  alt=""
                  loading="lazy"
                  className="h-16 w-20 object-cover"
                />
              </button>
            ))}
          </div>
        ) : null}
      </div>

      {/* Prominent Individual Download Button */}
      <div className="flex items-center justify-between rounded-xl border border-border bg-card p-3 shadow-sm">
        <span className="text-xs font-medium text-muted-foreground">
          Viewing page <span className="font-bold text-foreground">{selected + 1}</span> of {images.length}
        </span>
        <Button asChild size="sm" variant="outline" className="gap-2">
          <a href={individualDownloadHref} target="_blank" rel="noopener noreferrer">
            <Download className="size-4 text-primary" strokeWidth={1.75} />
            Download Page {selected + 1}
          </a>
        </Button>
      </div>
    </div>
  )
}
