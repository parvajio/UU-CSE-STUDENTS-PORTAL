"use client"

import { useState, useTransition, type FormEvent } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { generateUploadDropzone } from "@uploadthing/react"
import {
  ChevronDown,
  ChevronUp,
  FileText,
  Loader2,
  UploadCloud,
  X,
} from "lucide-react"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"
import type { OurFileRouter } from "@/lib/uploadthing"
import type {
  CourseOption,
  ExamType,
  ProgramType,
  QuestionFileDraft,
  Season,
} from "@/types/question-bank"
import {
  EXAM_TYPES,
  EXAM_TYPE_LABELS,
  SEASONS,
  type CreateQuestionInput,
} from "@/lib/question-bank/validation"
import { PROGRAM_TYPE_LABELS, SEASON_LABELS } from "@/lib/question-bank/constants"
import { CourseCombobox } from "@/components/question-bank/CourseCombobox"
import { BatchCombobox } from "@/components/question-bank/BatchCombobox"
import { createQuestion } from "@/app/(user)/upload-question/actions"

const CURRENT_YEAR = new Date().getFullYear()
const YEAR_MIN = 2000

const UploadDropzone = generateUploadDropzone<OurFileRouter>()

type ClassifiedType = "image" | "pdf" | null

function classifyFile(file: File): ClassifiedType {
  const name = file.name.toLowerCase()
  if (file.type.startsWith("image/") || /\.(png|jpe?g|webp|gif)$/.test(name)) {
    return "image"
  }
  if (file.type === "application/pdf" || /\.pdf$/.test(name)) {
    return "pdf"
  }
  return null
}

function validateFileSet(types: ClassifiedType[]): string | null {
  const images = types.filter((type) => type === "image").length
  const pdfs = types.filter((type) => type === "pdf").length

  if (images > 0 && pdfs > 0) {
    return "Attach images or a PDF — not both."
  }
  if (pdfs > 1) {
    return "A PDF paper is a single file — attach exactly one PDF."
  }
  if (types.some((type) => type === null)) {
    return "Accepted file types: PDF, PNG, JPEG and WebP images (up to 10 MB each)."
  }
  if (images > 5) {
    return "You can attach a maximum of 5 images."
  }
  return null
}

export function UploadForm({
  catalog,
  currentBatch,
}: {
  catalog: CourseOption[]
  currentBatch: number
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [formError, setFormError] = useState<string | null>(null)

  const [courseId, setCourseId] = useState<string | undefined>(undefined)
  const [batchNumber, setBatchNumber] = useState<number>(currentBatch)
  const [programType, setProgramType] = useState<ProgramType>("regular")
  const [season, setSeason] = useState<Season | "">("")
  const [year, setYear] = useState("")
  const [teacherName, setTeacherName] = useState("")
  const [examType, setExamType] = useState<ExamType | "">("")
  const [title, setTitle] = useState("")
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState("")

  const [files, setFiles] = useState<QuestionFileDraft[]>([])
  const [filesVersion, setFilesVersion] = useState(0)
  const [isUploading, setIsUploading] = useState(false)
  const [fileError, setFileError] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)

  function normalize(list: QuestionFileDraft[]): QuestionFileDraft[] {
    return list.map((file, index) => ({ ...file, order: index }))
  }

  function removeFile(index: number) {
    setFiles((prev) => normalize(prev.filter((_, i) => i !== index)))
    setFilesVersion((version) => version + 1)
    setFileError(null)
  }

  function moveFile(index: number, direction: -1 | 1) {
    setFiles((prev) => {
      const target = index + direction
      if (target < 0 || target >= prev.length) return prev
      const next = [...prev]
      ;[next[index], next[target]] = [next[target], next[index]]
      return normalize(next)
    })
    setFileError(null)
  }

  function resetFiles() {
    setFiles([])
    setFilesVersion((version) => version + 1)
    setFileError(null)
  }

  function classifyUploaded(res: { name: string; type: string }): "image" | "pdf" {
    if (
      res.type.startsWith("image/") ||
      /\.(png|jpe?g|webp|gif)$/i.test(res.name)
    ) {
      return "image"
    }
    return "pdf"
  }

  function handleBeforeUpload(pending: File[]): File[] {
    const nextTypes: ClassifiedType[] = pending.map(classifyFile)
    const existing: ClassifiedType[] = files.map((file) => file.fileType)
    const error = validateFileSet([...existing, ...nextTypes])
    if (error) {
      setFileError(error)
      return []
    }
    setFileError(null)
    return pending
  }

  function handleUploadComplete(res: { ufsUrl: string; name: string; type: string }[]) {
    const uploaded: QuestionFileDraft[] = res.map((item, index) => ({
      fileUrl: item.ufsUrl,
      fileType: classifyUploaded(item),
      order: index,
    }))
    setFiles((prev) => normalize([...prev, ...uploaded]))
    setFilesVersion((version) => version + 1)
    setIsUploading(false)
    setFileError(null)
  }

  function addTag() {
    const value = tagInput.trim()
    if (!value) return
    if (tags.length >= 10) {
      setFormError("You can add at most 10 tags.")
      return
    }
    const exists = tags.some(
      (tag) => tag.toLowerCase() === value.toLowerCase()
    )
    if (!exists) setTags((prev) => [...prev, value])
    setTagInput("")
  }

  function handleTagKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter" || event.key === ",") {
      event.preventDefault()
      addTag()
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFormError(null)

    if (!title.trim()) {
      setFormError("Please enter a title for the question paper.")
      return
    }
    if (!courseId) {
      setFormError("Please choose a subject/course from the list.")
      return
    }
    if (!examType) {
      setFormError("Please choose an exam type.")
      return
    }
    if (!season) {
      setFormError("Please choose a season.")
      return
    }
    const yearValue = Number(year)
    if (
      !year.trim() ||
      !Number.isInteger(yearValue) ||
      yearValue < YEAR_MIN ||
      yearValue > CURRENT_YEAR
    ) {
      setFormError(`Please enter a valid year (${YEAR_MIN}–${CURRENT_YEAR}).`)
      return
    }
    if (files.length === 0) {
      setFormError("Please upload the paper file(s) first.")
      return
    }
    const setError = validateFileSet(files.map((file) => file.fileType))
    if (setError) {
      setFormError(setError)
      return
    }

    const payload: CreateQuestionInput = {
      title: title.trim(),
      courseId,
      batchNumber,
      programType,
      season,
      year: yearValue,
      teacherName: teacherName.trim() || null,
      examType,
      files,
      tags,
    }

    startTransition(async () => {
      const result = await createQuestion(payload)
      if (result.success) {
        setSubmitted(true)
        router.refresh()
      } else {
        setFormError(result.error)
      }
    })
  }

  if (submitted) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Submitted for review</CardTitle>
          <CardDescription>
            Your question paper is in the moderation queue. It will be visible
            to other students once a moderator approves it.
          </CardDescription>
        </CardHeader>
        <CardFooter>
          <Button asChild>
            <Link href="/my-submissions">View my submissions</Link>
          </Button>
        </CardFooter>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upload a question paper</CardTitle>
        <CardDescription>
          Add a past paper or question for your batch. It will be reviewed
          before it becomes visible to everyone.
        </CardDescription>
      </CardHeader>

      <form onSubmit={handleSubmit} noValidate>
        <CardContent className="grid gap-5 sm:grid-cols-2">
          <div className="grid gap-2 sm:col-span-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Database Management System Sessional Final"
              required
            />
          </div>

          <div className="grid gap-2 sm:col-span-2">
            <Label htmlFor="course">Subject/course</Label>
            <CourseCombobox
              id="course"
              courses={catalog}
              value={courseId}
              onValueChange={setCourseId}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="batch">Batch</Label>
            <BatchCombobox
              id="batch"
              max={currentBatch}
              value={batchNumber}
              onValueChange={(value) => setBatchNumber(value ?? currentBatch)}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="examType">Exam type</Label>
            <Select
              value={examType || ""}
              onValueChange={(value) => setExamType(value as ExamType)}
            >
              <SelectTrigger id="examType" aria-label="Exam type">
                <SelectValue placeholder="Select an exam type" />
              </SelectTrigger>
              <SelectContent>
                {EXAM_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {EXAM_TYPE_LABELS[type]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2 sm:col-span-2">
            <Label>Program</Label>
            <div className="flex flex-wrap gap-2">
              {Object.entries(PROGRAM_TYPE_LABELS).map(([key, label]) => (
                <Button
                  key={key}
                  type="button"
                  variant="outline"
                  aria-pressed={programType === key}
                  onClick={() => setProgramType(key as ProgramType)}
                  className={cn(
                    "justify-start",
                    programType === key &&
                      "border-primary bg-primary/10 text-primary"
                  )}
                >
                  {label}
                </Button>
              ))}
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="season">Season</Label>
            <Select
              value={season || ""}
              onValueChange={(value) => setSeason(value as Season)}
            >
              <SelectTrigger id="season" aria-label="Season">
                <SelectValue placeholder="Select a season" />
              </SelectTrigger>
              <SelectContent>
                {SEASONS.map((seasonKey) => (
                  <SelectItem key={seasonKey} value={seasonKey}>
                    {SEASON_LABELS[seasonKey]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="year">Year</Label>
            <Input
              id="year"
              type="number"
              min={YEAR_MIN}
              max={CURRENT_YEAR}
              value={year}
              onChange={(e) => setYear(e.target.value)}
              placeholder="e.g. 2025"
              aria-label="Year the paper is from"
            />
          </div>

          <div className="grid gap-2 sm:col-span-2">
            <Label htmlFor="teacherName">Teacher name (optional)</Label>
            <Input
              id="teacherName"
              value={teacherName}
              onChange={(e) => setTeacherName(e.target.value)}
              placeholder="e.g. Dr. A. Rahman"
            />
          </div>

          <div className="grid gap-2 sm:col-span-2">
            <Label htmlFor="tags">Tags</Label>
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  aria-label={`Remove tag ${tag}`}
                  onClick={() => setTags((prev) => prev.filter((t) => t !== tag))}
                  className="soft-tag soft-tag--default cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                >
                  {tag}
                  <X className="size-3" strokeWidth={1.5} />
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                id="tags"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleTagKeyDown}
                placeholder="Type a tag and press Enter"
              />
              <Button
                type="button"
                variant="outline"
                onClick={addTag}
                disabled={!tagInput.trim()}
              >
                Add
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Up to 10 tags. Separate keywords so others can find this paper.
            </p>
          </div>

          <div className="grid gap-2 sm:col-span-2">
            <Label>Question paper file(s)</Label>
            <UploadDropzone
              key={`question-files-${filesVersion}`}
              endpoint="questionFile"
              config={{ mode: "auto" }}
              className="rounded-xl border border-dashed border-border bg-muted/40 p-4 transition-colors hover:bg-muted/60"
              appearance={{
                container: ({ isDragActive }) =>
                  isDragActive ? "border-primary bg-primary/5" : "",
                uploadIcon: "mx-auto block h-12 w-12 text-muted-foreground",
                label:
                  "mt-4 w-fit cursor-pointer text-sm font-semibold leading-6 text-foreground hover:text-primary",
                allowedContent: "m-0 text-xs leading-5 text-muted-foreground",
                button:
                  "w-auto! px-5 focus-visible:ring-primary bg-primary text-primary-foreground hover:bg-primary/90 data-[state=ready]:bg-primary data-[state=ready]:text-primary-foreground data-[state=readying]:opacity-70",
              }}
              content={{
                uploadIcon: <UploadCloud className="h-12 w-12" strokeWidth={1.5} />,
                label: "Choose files or drag and drop",
                button: ({ isUploading, uploadProgress }) =>
                  isUploading ? `${Math.round(uploadProgress)}%` : "Choose files",
                allowedContent: "PDF or up to 5 images, 10 MB each",
              }}
              onBeforeUploadBegin={handleBeforeUpload}
              onUploadBegin={() => {
                setIsUploading(true)
                setFileError(null)
              }}
              onClientUploadComplete={handleUploadComplete}
              onUploadError={(error) => {
                setFileError(error.message)
                setIsUploading(false)
              }}
            />
            <p className="text-xs text-muted-foreground">
              Attach 1–5 images of the paper, or exactly one PDF — never a mix.
              Images can be reordered with the arrows.
            </p>

            {files.length > 0 ? (
              <ul className="mt-1 grid grid-cols-2 gap-3 sm:grid-cols-3">
                {files.map((file, index) => (
                  <li
                    key={`${file.fileUrl}-${index}`}
                    className="rounded-lg border border-border bg-muted/40 p-2"
                  >
                    {file.fileType === "image" ? (
                      <div className="relative aspect-square w-full overflow-hidden rounded-md border border-border bg-background">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={file.fileUrl}
                          alt={`Uploaded question image ${index + 1}`}
                          className="h-full w-full object-cover"
                          loading="lazy"
                        />
                      </div>
                    ) : (
                      <div className="flex min-h-20 w-full items-center justify-center gap-2 rounded-md border border-border bg-background px-2 text-center">
                        <FileText
                          className="size-5 shrink-0 text-muted-foreground"
                          strokeWidth={1.5}
                        />
                        <span className="text-xs font-medium text-foreground">
                          PDF file
                        </span>
                      </div>
                    )}

                    <div className="mt-2 flex items-center justify-end gap-1">
                      <button
                        type="button"
                        aria-label={`Move image ${index + 1} up`}
                        disabled={index === 0 || file.fileType !== "image"}
                        onClick={() => moveFile(index, -1)}
                        className="rounded p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-40 disabled:hover:bg-transparent"
                      >
                        <ChevronUp className="size-4" strokeWidth={1.5} />
                      </button>
                      <button
                        type="button"
                        aria-label={`Move image ${index + 1} down`}
                        disabled={
                          index === files.length - 1 || file.fileType !== "image"
                        }
                        onClick={() => moveFile(index, 1)}
                        className="rounded p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-40 disabled:hover:bg-transparent"
                      >
                        <ChevronDown className="size-4" strokeWidth={1.5} />
                      </button>
                      <button
                        type="button"
                        aria-label="Remove file"
                        onClick={() => removeFile(index)}
                        className="rounded p-1 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        <X className="size-4" strokeWidth={1.5} />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            ) : null}

            {files.length > 0 ? (
              <div className="flex justify-end">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={resetFiles}
                  className="text-muted-foreground"
                >
                  Clear files
                </Button>
              </div>
            ) : null}

            {fileError ? (
              <p
                role="alert"
                className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
              >
                {fileError}
              </p>
            ) : null}
          </div>

          {formError ? (
            <p
              role="alert"
              className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive sm:col-span-2"
            >
              {formError}
            </p>
          ) : null}
        </CardContent>

        <CardFooter>
          <Button type="submit" disabled={isPending || isUploading}>
            {isPending ? (
              <Loader2 className="size-4 animate-spin" strokeWidth={1.5} />
            ) : null}
            {isPending ? "Submitting…" : "Submit for review"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}