"use client"

import { useState, useTransition, type FormEvent } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { generateUploadDropzone } from "@uploadthing/react"
import { Loader2, UploadCloud, X } from "lucide-react"
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
import type { CatalogEntry, ExamType } from "@/types/question-bank"
import { EXAM_TYPES, type CreateQuestionInput } from "@/lib/question-bank/validation"
import { createQuestion } from "@/app/(user)/upload-question/actions"

const OTHER_COURSE = "__other__"

const EXAM_TYPE_LABELS: Record<ExamType, string> = {
  previous_year: "Previous year",
  midterm: "Midterm",
  final: "Final",
  lab: "Lab",
  viva: "Viva/Seminar",
}

const UploadDropzone = generateUploadDropzone<OurFileRouter>()

export function UploadForm({
  catalog,
  currentBatch,
}: {
  catalog: CatalogEntry[]
  currentBatch: number
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [formError, setFormError] = useState<string | null>(null)

  const [subjectId, setSubjectId] = useState(catalog[0]?.id ?? "")
  const [courseChoice, setCourseChoice] = useState("")
  const isOther = courseChoice === OTHER_COURSE
  const [customSubject, setCustomSubject] = useState("")
  const [customCourse, setCustomCourse] = useState("")
  const [title, setTitle] = useState("")
  const [batchNumber, setBatchNumber] = useState(currentBatch)
  const [program, setProgram] = useState<"regular" | "diploma">("regular")
  const [evening, setEvening] = useState(false)
  const [examType, setExamType] = useState<ExamType | "">("")
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState("")

  const [fileUrl, setFileUrl] = useState("")
  const [isUploading, setIsUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)

  const activeSubject = catalog.find((subject) => subject.id === subjectId)
  const batchOptions = Array.from({ length: currentBatch }, (_, i) => i + 1)

  function selectSubject(nextSubjectId: string) {
    setSubjectId(nextSubjectId)
    setCourseChoice("")
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
    if (!examType) {
      setFormError("Please choose an exam type.")
      return
    }
    if (isOther) {
      if (!customSubject.trim() || !customCourse.trim()) {
        setFormError("Please fill in both the custom subject and course.")
        return
      }
    } else if (!courseChoice) {
      setFormError("Please choose a course, or pick Other to add a custom one.")
      return
    }
    if (!fileUrl) {
      setFormError("Please upload the question paper file first.")
      return
    }

    const payload: CreateQuestionInput = {
      title: title.trim(),
      courseId: isOther ? null : courseChoice,
      customSubject: isOther ? customSubject.trim() : null,
      customCourse: isOther ? customCourse.trim() : null,
      batchNumber,
      program,
      evening,
      examType,
      fileUrl,
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

          <div className="grid gap-2">
            <Label>Subject</Label>
            <Select value={subjectId} onValueChange={selectSubject}>
              <SelectTrigger aria-label="Subject">
                <SelectValue placeholder="Select a subject" />
              </SelectTrigger>
              <SelectContent>
                {catalog.map((subject) => (
                  <SelectItem key={subject.id} value={subject.id}>
                    {subject.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label>Course</Label>
            <Select
              value={courseChoice}
              onValueChange={setCourseChoice}
            >
              <SelectTrigger aria-label="Course">
                <SelectValue placeholder="Select a course" />
              </SelectTrigger>
              <SelectContent>
                {activeSubject?.courses.map((course) => (
                  <SelectItem key={course.id} value={course.id}>
                    {course.title} ({course.code})
                  </SelectItem>
                ))}
                <SelectItem value={OTHER_COURSE}>
                  Other (custom subject/course)
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {isOther ? (
            <>
              <div className="grid gap-2">
                <Label htmlFor="customSubject">Custom subject</Label>
                <Input
                  id="customSubject"
                  value={customSubject}
                  onChange={(e) => setCustomSubject(e.target.value)}
                  placeholder="e.g. Emerging Technologies"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="customCourse">Custom course</Label>
                <Input
                  id="customCourse"
                  value={customCourse}
                  onChange={(e) => setCustomCourse(e.target.value)}
                  placeholder="e.g. Cloud Computing Lab"
                  required
                />
              </div>
            </>
          ) : null}

          <div className="grid gap-2 sm:col-span-2">
            <Label>Upload file</Label>
            <UploadDropzone
              endpoint="questionFile"
              className="rounded-xl border-dashed border-border bg-muted/40 transition-colors hover:bg-muted/60"
              appearance={{
                container: ({ isDragActive }) =>
                  isDragActive ? "border-primary bg-primary/5" : "",
                uploadIcon: "mx-auto block h-12 w-12 text-muted-foreground",
                label:
                  "mt-4 w-fit cursor-pointer text-sm font-semibold leading-6 text-foreground hover:text-primary",
                allowedContent: "m-0 text-xs leading-5 text-muted-foreground",
                button:
                  "focus-visible:ring-primary bg-primary text-primary-foreground hover:bg-primary/90 data-[state=ready]:bg-primary data-[state=ready]:text-primary-foreground data-[state=readying]:opacity-70",
              }}
              content={{
                uploadIcon: <UploadCloud className="h-12 w-12" strokeWidth={1.5} />,
                label: "Choose a file or drag and drop",
                button: ({ isUploading, uploadProgress }) =>
                  isUploading ? `${Math.round(uploadProgress)}%` : "Choose a file",
                allowedContent: "PDF or image, up to 10 MB",
              }}
              onUploadBegin={() => {
                setIsUploading(true)
                setUploadError(null)
              }}
              onClientUploadComplete={(res) => {
                setFileUrl(res[0]?.ufsUrl ?? "")
                setIsUploading(false)
              }}
              onUploadError={(error) => {
                setUploadError(error.message)
                setIsUploading(false)
              }}
            />
            <p className="text-xs text-muted-foreground">
              PDF or image, up to 10 MB.
            </p>
            {uploadError ? (
              <p
                role="alert"
                className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
              >
                {uploadError}
              </p>
            ) : null}
            {fileUrl ? (
              <p
                role="status"
                className="rounded-md border border-border bg-muted px-3 py-2 text-sm text-foreground"
              >
                File uploaded — ready to submit.
              </p>
            ) : null}
          </div>

          <div className="grid gap-2">
            <Label>Batch</Label>
            <Select
              value={String(batchNumber)}
              onValueChange={(value) => setBatchNumber(Number(value))}
            >
              <SelectTrigger aria-label="Batch">
                <SelectValue placeholder="Select a batch" />
              </SelectTrigger>
              <SelectContent className="max-h-72">
                {batchOptions.map((batch) => (
                  <SelectItem key={batch} value={String(batch)}>
                    {batch}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label>Exam type</Label>
            <Select
              value={examType || ""}
              onValueChange={(value) => setExamType(value as ExamType)}
            >
              <SelectTrigger aria-label="Exam type">
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
              <Button
                type="button"
                variant="outline"
                aria-pressed={program === "regular"}
                onClick={() => setProgram("regular")}
                className={cn(
                  "justify-start",
                  program === "regular" &&
                    "border-primary bg-primary/10 text-primary"
                )}
              >
                Regular
              </Button>
              <Button
                type="button"
                variant="outline"
                aria-pressed={program === "diploma"}
                onClick={() => setProgram("diploma")}
                className={cn(
                  "justify-start",
                  program === "diploma" &&
                    "border-primary bg-primary/10 text-primary"
                )}
              >
                Diploma
              </Button>
              <Button
                type="button"
                variant="outline"
                aria-pressed={evening}
                onClick={() => setEvening((v) => !v)}
                className={cn(
                  "justify-start",
                  evening && "border-primary bg-primary/10 text-primary"
                )}
              >
                Evening shift
              </Button>
            </div>
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
          <Button
            type="submit"
            disabled={isPending || isUploading || !fileUrl}
          >
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