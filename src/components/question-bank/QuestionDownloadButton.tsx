"use client"

import { useState } from "react"
import { Download, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { downloadImagesAsZip } from "@/lib/question-bank/zip"
import type { QuestionFile } from "@/types/question-bank"

export function QuestionDownloadButton({
  questionId,
  title,
  files,
}: {
  questionId: string
  title: string
  files: QuestionFile[]
}) {
  const [pending, setPending] = useState(false)

  async function handleDownload() {
    if (pending) return
    setPending(true)
    try {
      await downloadImagesAsZip({ id: questionId, title, files })
    } catch {
      // downloadImagesAsZip already records the click before bundling;
      // a fetch failure just means the ZIP never reaches the browser.
    } finally {
      setPending(false)
    }
  }

  return (
    <Button onClick={handleDownload} disabled={pending}>
      {pending ? (
        <Loader2 className="mr-1.5 size-4 animate-spin" strokeWidth={1.5} />
      ) : (
        <Download className="mr-1.5 size-4" strokeWidth={1.5} />
      )}
      {pending ? "Preparing zip…" : "Download paper"}
    </Button>
  )
}
