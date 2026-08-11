import JSZip from "jszip"
import type { QuestionFile } from "@/types/question-bank"
import { recordDownload } from "@/lib/question-bank/actions"

function sanitizeFileName(name: string): string {
  return (
    name
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")
      .slice(0, 60) || "question-paper"
  )
}

function extensionFor(fileUrl: string, fallback: string): string {
  const match = /\.([a-zA-Z0-9]+)(?:\?|#|$)/.exec(fileUrl)
  return match ? `.${match[1].toLowerCase()}` : fallback
}

function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement("a")
  anchor.href = url
  anchor.download = filename
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  URL.revokeObjectURL(url)
}

async function fetchBlob(fileUrl: string): Promise<Blob> {
  const response = await fetch(fileUrl)
  if (!response.ok) {
    throw new Error(`Failed to fetch file (${response.status}).`)
  }
  return response.blob()
}

export async function downloadImagesAsZip(question: {
  id: string
  title: string
  files: QuestionFile[]
}): Promise<void> {
  await recordDownload(question.id)

  const images = question.files.filter((file) => file.fileType === "image")
  if (images.length === 0) return

  const zip = new JSZip()
  const folder = zip.folder(sanitizeFileName(question.title))
  if (!folder) return

  const blobs = await Promise.all(
    images.map(async (file) => ({
      file,
      blob: await fetchBlob(file.fileUrl),
    }))
  )

  blobs.forEach(({ file, blob }, index) => {
    folder.file(
      `page-${index + 1}${extensionFor(file.fileUrl, ".png")}`,
      blob
    )
  })

  const archive = await zip.generateAsync({ type: "blob" })
  triggerDownload(archive, `${sanitizeFileName(question.title)}.zip`)
}

export async function downloadFile(
  fileUrl: string,
  filename?: string
): Promise<void> {
  const blob = await fetchBlob(fileUrl)
  triggerDownload(
    blob,
    filename ?? fileUrl.split("/").pop() ?? "download"
  )
}