"use client"

import { useState } from "react"
import { Download, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { recordDownload } from "@/lib/question-bank/actions"
import { downloadFile } from "@/lib/question-bank/zip"
import type { QuestionFile } from "@/types/question-bank"

export function QuestionPdfDownloadButton({
  questionId,
  file,
  size = "default",
  variant = "default",
  label = "Download PDF",
  className,
}: {
  questionId: string
  file: QuestionFile
  size?: "default" | "sm"
  variant?: "default" | "outline"
  label?: string
  className?: string
}) {
  const [pending, setPending] = useState(false)

  async function handleDownload() {
    if (pending) return
    setPending(true)
    try {
      await recordDownload(questionId)
      await downloadFile(file.fileUrl, "question-paper.pdf")
    } catch {
      // recordDownload already counted the click; a failed fetch just
      // means the file never reaches the browser.
    } finally {
      setPending(false)
    }
  }

  return (
    <Button
      onClick={handleDownload}
      disabled={pending}
      size={size}
      variant={variant}
      className={className}
    >
      {pending ? (
        <Loader2 className="mr-1.5 size-4 animate-spin" strokeWidth={1.5} />
      ) : (
        <Download className="mr-1.5 size-4" strokeWidth={1.5} />
      )}
      {pending ? "Preparing…" : label}
    </Button>
  )
}
