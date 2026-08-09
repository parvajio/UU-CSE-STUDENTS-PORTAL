import Link from "next/link"
import { CalendarDays, Download, LockKeyhole, UserRound } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { EXAM_TYPE_LABELS } from "@/lib/question-bank/validation"
import type {
  GuestQuestionDetail,
  QuestionDetail,
} from "@/types/question-bank"

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}

export function QuestionDetailView({
  question,
  viewerRole,
}: {
  question: GuestQuestionDetail | QuestionDetail
  viewerRole: "guest" | "user" | "moderator" | "admin"
}) {
  const isGuest = viewerRole === "guest"
  const downloadHref = `/api/questions/${question.id}/download`
  const loginHref = `/login?callbackUrl=${encodeURIComponent(
    `/question-bank/${question.id}`
  )}`

  const classification = question.customCourse
    ? {
        line: question.customCourse,
        sub: question.customSubject ?? "Other subject",
      }
    : {
        line: [question.courseCode, question.courseTitle]
          .filter(Boolean)
          .join(" · "),
        sub: question.subjectName ?? null,
      }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-heading text-2xl font-semibold">
          {question.title}
        </CardTitle>
        <div className="flex flex-wrap gap-1.5 pt-2">
          {question.program === "diploma" ? (
            <span className="soft-tag soft-tag--default px-2 py-0.5 text-xs">
              Diploma
            </span>
          ) : null}
          {question.evening ? (
            <span className="soft-tag soft-tag--default px-2 py-0.5 text-xs">
              Evening
            </span>
          ) : null}
        </div>
      </CardHeader>

      <CardContent className="grid gap-4">
        <dl className="grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Course
            </dt>
            <dd className="mt-0.5 font-medium text-foreground">
              {classification.line || "Other"}
            </dd>
            {classification.sub ? (
              <dd className="text-xs text-muted-foreground">
                {classification.sub}
              </dd>
            ) : null}
          </div>
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
              Exam type
            </dt>
            <dd className="mt-0.5 font-medium text-foreground">
              {EXAM_TYPE_LABELS[question.examType]}
            </dd>
          </div>
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

        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <CalendarDays className="size-3.5" strokeWidth={1.5} />
          Added {formatDate(question.createdAt)}
        </p>
      </CardContent>

      <CardFooter className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-muted-foreground">
          {isGuest
            ? "Log in to download this paper."
            : "Approved papers are available to download."}
        </p>
        {isGuest ? (
          <Button asChild>
            <Link href={loginHref}>
              <LockKeyhole className="mr-1.5 size-4" strokeWidth={1.5} />
              Log in to download
            </Link>
          </Button>
        ) : (
          <Button asChild>
            <a href={downloadHref}>
              <Download className="mr-1.5 size-4" strokeWidth={1.5} />
              Download paper
            </a>
          </Button>
        )}
      </CardFooter>
    </Card>
  )
}