"use client";

import Link from "next/link";
import {
  BookOpen,
  CalendarDays,
  Download,
  ExternalLink,
  Eye,
  GraduationCap,
  School,
  UserRound,
  Users,
} from "lucide-react";
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

function MetaCell({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Users;
  label: string;
  value: string;
}) {
  return (
    <div className="flex min-w-0 items-center gap-2.5">
      <span className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-border/60 bg-background text-muted-foreground">
        <Icon className="size-4" strokeWidth={1.5} />
      </span>
      <span className="min-w-0">
        <span className="block text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </span>
        <span className="block truncate text-[13px] font-semibold text-foreground">
          {value}
        </span>
      </span>
    </div>
  );
}

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
    : question.year
      ? `${question.year}`
      : null;

  function handleZipDownload() {
    if (!("files" in question)) return;
    void downloadImagesAsZip({
      id: question.id,
      title: question.title,
      files: question.files,
    });
  }

  const isList = variant === "list";

  return (
    <Card className="group relative flex h-full flex-col overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-lg motion-reduce:transition-none motion-reduce:hover:translate-y-0">
      {/* Card signature: gradient top accent bar (per design-direction §6) */}
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary via-indigo-500 to-violet-500 opacity-80 transition-opacity group-hover:opacity-100" />

      <CardContent
        className={cn(
          "flex flex-1 flex-col gap-4 p-5 pt-6",
          isList && "sm:flex-row sm:gap-6",
        )}
      >
        <div className="flex min-w-0 flex-1 flex-col gap-4">
          {/* Eyebrow: exam type (hero tag) + upload date */}
          <div className="flex items-center justify-between gap-2">
            <span className="inline-flex items-center rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-[13px] font-semibold text-primary dark:bg-primary/20">
              {EXAM_TYPE_LABELS[question.examType]}
            </span>
            <span className="shrink-0 text-xs text-muted-foreground">
              {formatDate(question.createdAt)}
            </span>
          </div>

          {/* Identity: course name first, code second */}
          <Link
            href={`/question-bank/${question.id}`}
            className="-mx-1 rounded-md px-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-primary">
              <BookOpen className="size-3.5 shrink-0" strokeWidth={1.5} />
              <span className="truncate">{question.courseCode}</span>
            </p>
            <h3 className="mt-1 line-clamp-2 font-heading text-lg font-semibold leading-snug text-foreground transition-colors group-hover:text-primary">
              {question.courseTitle}
            </h3>
            {question.title ? (
              <p className="mt-0.5 truncate text-[13px] text-muted-foreground">
                {question.title}
              </p>
            ) : null}
          </Link>

          {/* At-a-glance facts: one grid, not scattered rows */}
          <dl className="grid grid-cols-2 gap-3 rounded-xl border border-border/70 bg-muted/40 p-3">
            <MetaCell
              icon={Users}
              label="Batch"
              value={`${question.batchNumber}`}
            />
            {seasonYear ? (
              <MetaCell icon={CalendarDays} label="Term" value={seasonYear} />
            ) : null}
            <MetaCell
              icon={School}
              label="Program"
              value={PROGRAM_TYPE_LABELS[question.programType]}
            />
            {question.teacherName ? (
              <MetaCell
                icon={GraduationCap}
                label="Teacher"
                value={question.teacherName}
              />
            ) : null}
          </dl>

          {question.submitterName ? (
            <p className="flex items-center gap-1.5 truncate text-xs text-muted-foreground">
              <UserRound
                className="size-3.5 shrink-0"
                strokeWidth={1.5}
              />
              <span className="truncate">
                Shared by{" "}
                <span className="font-medium text-foreground">
                  {question.submitterName}
                </span>
              </span>
            </p>
          ) : null}
        </div>

        {/* Engagement + actions */}
        <div
          className={cn(
            "flex flex-col gap-3",
            isList
              ? "mt-auto border-t border-border pt-4 sm:mt-0 sm:w-60 sm:shrink-0 sm:justify-center sm:border-l sm:border-t-0 sm:pl-6 sm:pt-0"
              : "mt-auto border-t border-border pt-4",
          )}
        >
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <QuestionLikeButton
              questionId={question.id}
              liked={!isGuest && question.isLikedByViewer}
              count={question.likeCount}
              authenticated={!isGuest}
            />
            <div className="flex items-center gap-3 font-medium tabular-nums">
              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                <Eye className="size-3.5" strokeWidth={1.5} />
                {question.viewCount}
              </span>
              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                <Download className="size-3.5" strokeWidth={1.5} />
                {question.downloadCount}
              </span>
            </div>
          </div>

          <div className={cn("flex gap-2", isList && "sm:flex-col")}>
            <Button
              asChild
              variant="outline"
              size="sm"
              className="flex-1 hover:border-primary"
            >
              <Link href={`/question-bank/${question.id}`}>
                Preview
                <ExternalLink
                  className="ml-1 size-3.5"
                  strokeWidth={1.5}
                />
              </Link>
            </Button>
            {isGuest ? (
              <Button asChild variant="default" size="sm" className="flex-1">
                <Link href={downloadHref} target="_blank" rel="noreferrer">
                  <Download className="mr-1 size-3.5" strokeWidth={1.5} />
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
                className="flex-1"
              />
            ) : (
              <Button
                variant="default"
                size="sm"
                onClick={handleZipDownload}
                className="flex-1"
              >
                <Download className="mr-1 size-3.5" strokeWidth={1.5} />
                Download
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
