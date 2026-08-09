import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { EXAM_TYPE_LABELS } from "@/lib/question-bank/validation"
import type {
  GuestQuestionCard,
  QuestionCard as QuestionCardData,
} from "@/types/question-bank"
import { cn } from "@/lib/utils"

export function QuestionCard({
  question,
  variant = "grid",
}: {
  question: GuestQuestionCard | QuestionCardData
  variant?: "grid" | "list"
}) {
  const courseLine = question.customCourse
    ? question.customCourse
    : question.courseCode && question.courseTitle
      ? question.courseTitle
      : null

  return (
    <Link
      href={`/question-bank/${question.id}`}
      className={cn(
        "block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        variant === "list" && "w-full"
      )}
    >
      <Card className="h-full transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_4px_16px_rgba(0,0,0,0.06)]">
        <CardContent
          className={cn(
            "p-5",
            variant === "list" &&
              "sm:flex sm:items-start sm:justify-between sm:gap-6"
          )}
        >
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-3">
              <h3 className="truncate font-heading text-base font-semibold text-foreground">
                {question.title}
              </h3>
              <div className="flex shrink-0 gap-1.5">
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
            </div>
            <p className="mt-1 truncate text-sm font-medium text-foreground">
              {courseLine ?? "Other subject"}
              {question.subjectName ? ` · ${question.subjectName}` : ""}
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Batch {question.batchNumber} ·{" "}
              {EXAM_TYPE_LABELS[question.examType]}
            </p>
            {question.tags.length > 0 ? (
              <div className="mt-3 flex flex-wrap gap-1.5">
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
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}