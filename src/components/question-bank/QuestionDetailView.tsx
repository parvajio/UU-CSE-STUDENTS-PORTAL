import Link from "next/link"
import {
  CalendarDays,
  ChevronRight,
  Download,
  Eye,
  FileText,
  Heart,
  LockKeyhole,
  UserRound,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { EXAM_TYPE_LABELS } from "@/lib/question-bank/validation"
import {
  PROGRAM_TYPE_LABELS,
  SEASON_LABELS,
} from "@/lib/question-bank/constants"
import { safeCallbackUrl } from "@/lib/auth/safe-callback-url"
import { formatDate } from "@/lib/utils"
import { QuestionDownloadButton } from "./QuestionDownloadButton"
import { QuestionImageGallery } from "./QuestionImageGallery"
import { QuestionLikeButton } from "./QuestionLikeButton"
import { QuestionPdfDownloadButton } from "./QuestionPdfDownloadButton"
import type {
  GuestQuestionDetail,
  QuestionDetail,
  QuestionFile,
} from "@/types/question-bank"

// Guests never receive a `files` array in the query payload (T016/T017), so
// its presence is the discriminator between the guest and authed surfaces.
function hasFiles(
  question: GuestQuestionDetail | QuestionDetail
): question is QuestionDetail {
  return "files" in question
}

export function QuestionDetailView({
  question,
  viewerRole,
}: {
  question: GuestQuestionDetail | QuestionDetail
  viewerRole: "guest" | "user" | "moderator" | "admin"
}) {
  const files: QuestionFile[] = hasFiles(question) ? question.files : []
  const isPdf = files.length === 1 && files[0].fileType === "pdf"
  const downloadRoute = `/api/questions/${question.id}/download`
  const loginHref = `/login?callbackUrl=${encodeURIComponent(
    safeCallbackUrl(`/question-bank/${question.id}`)
  )}`

  const seasonYear = question.season
    ? `${SEASON_LABELS[question.season]}${
        question.year ? ` ${question.year}` : ""
      }`
    : null

  return (
    <div>
      <nav aria-label="Breadcrumb" className="mb-6">
        <ol className="flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
          <li>
            <Link
              href="/"
              className="transition-colors hover:text-foreground"
            >
              Home
            </Link>
          </li>
          <li aria-hidden="true">
            <ChevronRight className="size-3.5" strokeWidth={1.5} />
          </li>
          <li>
            <Link
              href="/question-bank"
              className="transition-colors hover:text-foreground"
            >
              Question Bank
            </Link>
          </li>
          <li aria-hidden="true">
            <ChevronRight className="size-3.5" strokeWidth={1.5} />
          </li>
          <li aria-current="page" className="max-w-[14rem] truncate font-medium text-foreground">
            {question.title}
          </li>
        </ol>
      </nav>

      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <h1 className="inline-flex min-w-0 items-center gap-2.5 font-heading text-2xl font-semibold text-foreground">
          <FileText
            className="size-6 shrink-0 text-primary"
            strokeWidth={1.5}
          />
          <span className="min-w-0">{question.title}</span>
        </h1>
        <span className="soft-tag soft-tag--default px-2 py-0.5 text-xs">
          {PROGRAM_TYPE_LABELS[question.programType]}
        </span>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0">
          {!hasFiles(question) ? (
            <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-border bg-muted/40 px-6 py-20 text-center">
              <div className="rounded-full bg-muted p-3">
                <LockKeyhole
                  className="size-6 text-muted-foreground"
                  strokeWidth={1.5}
                />
              </div>
              <p className="max-w-sm text-sm text-muted-foreground">
                Log in to preview and download this question paper.
              </p>
              <Button asChild>
                <Link href={loginHref}>Log in to download/preview</Link>
              </Button>
            </div>
          ) : files.length === 0 ? (
            <p className="inline-flex items-center gap-1.5 rounded-2xl border border-border bg-surface p-6 text-sm text-muted-foreground">
              <FileText className="size-4" strokeWidth={1.5} />
              No files are attached to this paper yet.
            </p>
          ) : isPdf ? (
            <div className="overflow-hidden rounded-2xl border border-border bg-surface">
              <iframe
                title="Question paper"
                className="h-[80vh] w-full"
                src={files[0].fileUrl}
              />
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border p-3">
                <p className="text-xs text-muted-foreground">
                  Viewer not loading? Use the button to grab the PDF directly.
                </p>
                <QuestionPdfDownloadButton
                  questionId={question.id}
                  file={files[0]}
                />
              </div>
            </div>
          ) : (
            <QuestionImageGallery
              files={files}
              questionTitle={question.title}
            />
          )}
        </div>

        <Card className="h-fit rounded-2xl">
          <CardContent className="grid gap-4 p-5">
            <dl className="grid gap-3 text-sm">
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Course
                </dt>
                <dd className="mt-0.5 font-medium text-foreground">
                  {question.courseCode} · {question.courseTitle}
                </dd>
                <dd className="text-xs text-muted-foreground">
                  {question.creditHours} credit hours
                </dd>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Batch
                  </dt>
                  <dd className="mt-0.5 font-medium text-foreground">
                    {question.batchNumber}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Exam
                  </dt>
                  <dd className="mt-0.5 font-medium text-foreground">
                    {EXAM_TYPE_LABELS[question.examType]}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Program
                  </dt>
                  <dd className="mt-0.5 font-medium text-foreground">
                    {PROGRAM_TYPE_LABELS[question.programType]}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Season
                  </dt>
                  <dd className="mt-0.5 font-medium text-foreground">
                    {seasonYear ?? "—"}
                  </dd>
                </div>
              </div>
              {question.teacherName ? (
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Teacher
                  </dt>
                  <dd className="mt-0.5 font-medium text-foreground">
                    {question.teacherName}
                  </dd>
                </div>
              ) : null}
              {question.submitterName ? (
                <div>
                  <dt className="flex items-center gap-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    <UserRound className="size-3" strokeWidth={1.5} />
                    Shared by
                  </dt>
                  <dd className="mt-0.5 font-medium text-foreground">
                    {question.submitterName}
                  </dd>
                </div>
              ) : null}
              <div>
                <dt className="flex items-center gap-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  <CalendarDays className="size-3" strokeWidth={1.5} />
                  Added
                </dt>
                <dd className="mt-0.5 font-medium text-foreground">
                  {formatDate(question.createdAt, {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </dd>
              </div>
            </dl>

            {question.tags.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {question.tags.map((tag) => (
                  <span
                    key={tag}
                    className="soft-tag soft-tag--default px-2 py-0.5 text-xs"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            ) : null}

            <Separator />

            <div className="flex items-center gap-4">
              {hasFiles(question) ? (
                <QuestionLikeButton
                  questionId={question.id}
                  liked={question.isLikedByViewer}
                  count={question.likeCount}
                  authenticated
                />
              ) : (
                <span
                  className="inline-flex items-center gap-1.5 text-sm text-muted-foreground"
                  aria-label={`${question.likeCount} likes`}
                >
                  <Heart className="size-4" strokeWidth={1.5} />
                  {question.likeCount}
                </span>
              )}
              <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                <Eye className="size-4" strokeWidth={1.5} />
                {question.viewCount}
              </span>
              <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                <Download className="size-4" strokeWidth={1.5} />
                {question.downloadCount}
              </span>
            </div>

            {hasFiles(question) ? (
              isPdf ? (
                <QuestionPdfDownloadButton
                  questionId={question.id}
                  file={files[0]}
                />
              ) : (
                <>
                  <QuestionDownloadButton
                    questionId={question.id}
                    title={question.title}
                    files={files}
                  />
                  <div className="border-t border-border pt-3">
                    <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Individual pages
                    </p>
                    <div className="flex flex-wrap gap-x-4 gap-y-1.5">
                      {files.map((file, index) =>
                        file.fileType === "image" ? (
                          <a
                            key={file.order}
                            href={`${downloadRoute}?kind=file&file=${file.order}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-sm font-medium text-primary underline-offset-2 hover:underline"
                          >
                            Page {index + 1}
                          </a>
                        ) : null
                      )}
                    </div>
                  </div>
                </>
              )
            ) : null}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
