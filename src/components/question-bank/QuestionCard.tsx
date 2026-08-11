"use client";

import Link from "next/link";
import { Download, ExternalLink, Eye, FileText, GraduationCap, UserRound } from "lucide-react";
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
    <Card className="group relative flex h-full flex-col overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-lg">
      {/* Colorful top accent bar */}
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary via-indigo-500 to-violet-500 opacity-80 group-hover:opacity-100 transition-opacity" />

      <CardContent
        className={cn(
          "flex flex-1 flex-col gap-3 p-5 pt-6",
          variant === "list" &&
            "sm:flex-row sm:items-start sm:justify-between sm:gap-6",
        )}
      >
        <div className="flex min-w-0 flex-1 flex-col gap-3">
          {/* Top row: Course Code badge & Date */}
          <div className="flex items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-primary/10 px-2.5 py-1 text-xs font-bold text-primary dark:bg-primary/20">
              <FileText className="size-3.5" strokeWidth={1.75} />
              {question.courseCode}
            </span>
            <span className="text-xs font-medium text-muted-foreground">
              {formatDate(question.createdAt)}
            </span>
          </div>

          {/* Title & Course */}
          <Link
            href={`/question-bank/${question.id}`}
            className="-mx-1 rounded-md px-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            <h3 className="font-heading text-base font-semibold text-foreground transition-colors group-hover:text-primary line-clamp-2">
              {question.title}
            </h3>
            <p className="mt-1 text-sm font-medium text-muted-foreground truncate">
              {question.courseTitle}
            </p>
          </Link>

          {/* Batch & Exam Type */}
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <span className="font-semibold text-foreground bg-muted px-2 py-0.5 rounded">
              Batch {question.batchNumber}
            </span>
            <span>·</span>
            <span className="font-medium text-primary/90">
              {EXAM_TYPE_LABELS[question.examType]}
            </span>
          </div>

          {/* Program Type & Season badges */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="inline-flex items-center rounded-md bg-indigo-500/10 px-2 py-0.5 text-xs font-medium text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300">
              {PROGRAM_TYPE_LABELS[question.programType]}
            </span>
            {seasonYear ? (
              <span className="inline-flex items-center rounded-md bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300">
                {seasonYear}
              </span>
            ) : null}
          </div>

          {/* Teacher & Submitter info */}
          <div className="space-y-1 pt-2 text-xs text-muted-foreground border-t border-border/60">
            {question.teacherName ? (
              <div className="flex items-center gap-1.5 truncate">
                <GraduationCap className="size-3.5 shrink-0 text-indigo-500" strokeWidth={1.75} />
                <span className="truncate">
                  Teacher: <span className="font-medium text-foreground">{question.teacherName}</span>
                </span>
              </div>
            ) : null}
            {question.submitterName ? (
              <div className="flex items-center gap-1.5 truncate">
                <UserRound className="size-3.5 shrink-0 text-violet-500" strokeWidth={1.75} />
                <span className="truncate">
                  Shared by: <span className="font-medium text-foreground">{question.submitterName}</span>
                </span>
              </div>
            ) : null}
          </div>

          {/* Metrics row: Likes, Views, Downloads */}
          <div className="mt-auto flex items-center justify-between border-t border-border pt-3 text-sm text-muted-foreground">
            <QuestionLikeButton
              questionId={question.id}
              liked={!isGuest && question.isLikedByViewer}
              count={question.likeCount}
              authenticated={!isGuest}
            />
            <div className="flex items-center gap-3 font-medium">
              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                <Eye className="size-3.5 text-blue-500" strokeWidth={1.75} />
                {question.viewCount}
              </span>
              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                <Download className="size-3.5 text-emerald-500" strokeWidth={1.75} />
                {question.downloadCount}
              </span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 pt-1">
            <Button asChild variant="outline" size="sm" className="flex-1 hover:border-primary">
              <Link href={`/question-bank/${question.id}`}>
                Preview
                <ExternalLink className="size-3.5 ml-1" strokeWidth={1.75} />
              </Link>
            </Button>
            {isGuest ? (
              <Button asChild variant="default" size="sm" className="flex-1 bg-gradient-to-r from-primary to-indigo-600 text-white hover:opacity-90">
                <Link href={downloadHref} target="_blank" rel="noreferrer">
                  <Download className="size-3.5 mr-1" strokeWidth={1.75} />
                  Download
                </Link>
              </Button>
            ) : isPdf ? (
              <QuestionPdfDownloadButton
                questionId={question.id}
                file={primaryFile}
                size="sm"
                variant="default"
                label="Download"
                className="flex-1 bg-gradient-to-r from-primary to-indigo-600 text-white hover:opacity-90"
              />
            ) : (
              <Button
                variant="default"
                size="sm"
                onClick={handleZipDownload}
                className="flex-1 bg-gradient-to-r from-primary to-indigo-600 text-white hover:opacity-90"
              >
                <Download className="size-3.5 mr-1" strokeWidth={1.75} />
                Download
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
