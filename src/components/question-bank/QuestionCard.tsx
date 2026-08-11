"use client";

import Link from "next/link";
import { Download, ExternalLink, Eye, FileText } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EXAM_TYPE_LABELS } from "@/lib/question-bank/validation";
import {
  PROGRAM_TYPE_LABELS,
  SEASON_LABELS,
} from "@/lib/question-bank/constants";
import { cn, formatDate } from "@/lib/utils";
import { downloadImagesAsZip } from "@/lib/question-bank/zip";
import { QuestionLikeButton } from "./QuestionLikeButton";
import { QuestionPdfDownloadButton } from "./QuestionPdfDownloadButton";
import type {
  GuestQuestionCard,
  QuestionCard as QuestionCardData,
} from "@/types/question-bank";

export function QuestionCard({
  question,
  variant = "grid",
}: {
  question: GuestQuestionCard | QuestionCardData;
  variant?: "grid" | "list";
}) {
  const isGuest = !("files" in question);
  const primaryFile = !isGuest ? (question.files[0] ?? null) : null;
  const isPdf = primaryFile?.fileType === "pdf";
  const downloadHref = `/api/questions/${question.id}/download${
    isPdf ? "?kind=file" : ""
  }`;
  const seasonYear = question.season
    ? `${SEASON_LABELS[question.season]}${
        question.year ? ` ${question.year}` : ""
      }`
    : null;

  function handleZipDownload() {
    if (!("files" in question)) return;
    void downloadImagesAsZip({
      id: question.id,
      title: question.title,
      files: question.files,
    });
  }

  return (
    <Card className="flex h-full flex-col">
      <CardContent
        className={cn(
          "flex flex-1 flex-col gap-2 p-5",
          variant === "list" &&
            "sm:flex-row sm:items-start sm:justify-between sm:gap-6",
        )}
      >
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <h1 className="flex min-w-0 items-center gap-2.5 font-heading text-2xl font-semibold text-foreground mb-2">
            <FileText
              className="size-6 shrink-0 text-primary"
              strokeWidth={1.5}
            />
          </h1>
          <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
            <span className="truncate font-medium">{question.courseCode}</span>
            <span className="shrink-0">{formatDate(question.createdAt)}</span>
          </div>

          <Link
            href={`/question-bank/${question.id}`}
            className="-mx-1 rounded-md px-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            <h3 className="truncate font-heading text-base font-semibold text-foreground transition-colors hover:text-primary">
              {question.title}
            </h3>
            <p className="mt-0.5 truncate text-sm font-medium text-foreground">
              {question.courseTitle}
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Batch {question.batchNumber} ·{" "}
              {EXAM_TYPE_LABELS[question.examType]}
            </p>
          </Link>

          <div className="flex flex-wrap items-center gap-2">
            <span className="soft-tag soft-tag--default px-2 py-0.5 text-xs">
              {PROGRAM_TYPE_LABELS[question.programType]}
            </span>
            {seasonYear ? (
              <span className="text-xs text-muted-foreground">
                {seasonYear}
              </span>
            ) : null}
          </div>

          {question.teacherName ? (
            <p className="text-xs text-muted-foreground">
              {question.teacherName}
            </p>
          ) : null}

          <div className="mt-auto flex flex-wrap items-center justify-between gap-2 pt-3">
            <div className="flex w-full items-center justify-end gap-2">
              <QuestionLikeButton
                questionId={question.id}
                liked={!isGuest && question.isLikedByViewer}
                count={question.likeCount}
                authenticated={!isGuest}
              />
              <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                <Eye className="size-4" strokeWidth={1.5} />
                {question.viewCount}
              </span>
              <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                <Download className="size-4" strokeWidth={1.5} />
                {question.downloadCount}
              </span>
            </div>
          </div>

          <div className="mt-auto flex flex-wrap items-center justify-between gap-2 pt-3">
            <div className="flex w-full items-center gap-2">
              <Button asChild variant="outline" size="sm" className="flex-1">
                <Link href={`/question-bank/${question.id}`}>
                  Preview
                  <ExternalLink className="size-3.5" strokeWidth={1.5} />
                </Link>
              </Button>
              {isGuest ? (
                <Button asChild variant="outline" size="sm" className="flex-1">
                  <Link href={downloadHref} target="_blank" rel="noreferrer">
                    <Download className="size-3.5" strokeWidth={1.5} />
                    Download
                  </Link>
                </Button>
              ) : isPdf ? (
                <QuestionPdfDownloadButton
                  questionId={question.id}
                  file={primaryFile}
                  size="sm"
                  variant="outline"
                  label="Download"
                  className="flex-1"
                />
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleZipDownload}
                  className="flex-1"
                >
                  <Download className="size-3.5" strokeWidth={1.5} />
                  Download
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
