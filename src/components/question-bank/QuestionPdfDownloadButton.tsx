"use client"

import { Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { QuestionFile } from "@/types/question-bank"

export function QuestionPdfDownloadButton({
  questionId,
  file: _file,
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
  const downloadHref = `/api/questions/${questionId}/download?kind=file`

  return (
    <Button asChild size={size} variant={variant} className={className}>
      <a href={downloadHref} target="_blank" rel="noopener noreferrer">
        <Download className="mr-1.5 size-4" strokeWidth={1.5} />
        {label}
      </a>
    </Button>
  )
}
