"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Check, FileText, Loader2, X } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { approveItem, rejectItem } from "@/app/(admin)/approve/actions"
import { capitalize, formatDate } from "@/lib/utils"
import { SkillTag } from "@/components/directory/SkillTag"
import {
  FILE_TYPE_LABELS,
  PROGRAM_TYPE_LABELS,
  SEASON_LABELS,
} from "@/lib/question-bank/constants"
import type { PendingItem, QuestionDetails, RoutineReportDetails } from "@/lib/db/queries/approval"

type ProfileSkill = {
  id: string
  name: string
  slug: string
  parentSkillId: string | null
  colorKey: string | null
}

type ProfileDetails = {
  fullName?: string
  studentId?: string | null
  batchNumber?: number
  section?: string
  avatarUrl?: string | null
  bio?: string | null
  facebookUrl?: string | null
  linkedinUrl?: string | null
  whatsappNumber?: string | null
  portfolioUrl?: string | null
  githubUrl?: string | null
  isAlumni?: boolean
  currentCompany?: string | null
  jobPosition?: string | null
  skills?: ProfileSkill[]
}

function resourceLabel(resourceType: string): string {
  if (resourceType === "routine_report") return "Routine report"
  return capitalize(resourceType)
}

function initials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0))
    .join("")
    .toUpperCase()
}

function SocialLink({ label, value }: { label: string; value: string }) {
  return (
    <span className="text-sm text-muted-foreground">
      <span className="font-medium text-foreground">{label}:</span> {value}
    </span>
  )
}

const EXAM_TYPE_LABELS: Record<string, string> = {
  previous_year: "Previous Year",
  midterm: "Midterm",
  final: "Final",
  lab: "Lab",
  viva: "Viva",
}

function QuestionReview({
  details,
  resourceId,
}: {
  details: QuestionDetails
  resourceId: string
}) {
  const classification =
    details.courseCode || details.courseTitle
      ? `${details.courseCode ?? "—"} ${details.courseTitle ?? ""}`.trim()
      : "—"

  const seasonYear = details.season
    ? `${SEASON_LABELS[details.season]}${
        details.year ? ` ${details.year}` : ""
      }`
    : null

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h4 className="truncate font-heading text-lg font-semibold text-foreground">
          {details.title}
        </h4>
        <p className="text-sm text-muted-foreground">{classification}</p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="outline">Batch {details.batchNumber}</Badge>
        <Badge variant="outline">
          {EXAM_TYPE_LABELS[details.examType] ?? details.examType}
        </Badge>
        <span className="soft-tag soft-tag--default px-2 py-0.5 text-xs">
          {PROGRAM_TYPE_LABELS[details.programType]}
        </span>
        {seasonYear ? <Badge variant="outline">{seasonYear}</Badge> : null}
        {details.teacherName ? (
          <span className="text-sm text-muted-foreground">
            · {details.teacherName}
          </span>
        ) : null}
      </div>

      {details.tags.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {details.tags.map((tag) => (
            <span key={tag} className="soft-tag soft-tag--default">
              {tag}
            </span>
          ))}
        </div>
      ) : null}

      <div>
        <p className="mb-2 text-sm font-medium text-foreground">
          Review files
        </p>
        {details.files.length > 0 ? (
          <ul className="flex flex-col gap-2">
            {details.files.map((file) => (
              <li key={`${file.order}-${file.fileUrl}`}>
                <Button
                  asChild
                  variant="outline"
                  size="sm"
                  className="h-auto w-full justify-start"
                >
                  <Link
                    href={`/api/questions/${resourceId}/download?file=${file.order}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <FileText className="size-4 shrink-0" strokeWidth={1.5} />
                    {FILE_TYPE_LABELS[file.fileType]} · #{file.order + 1}
                  </Link>
                </Button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">
            No files attached to this question.
          </p>
        )}
      </div>
    </div>
  )
}

function RoutineReportReview({ details }: { details: RoutineReportDetails }) {
  const snapshotBits = [
    details.snapshotBatch && details.snapshotSection
      ? `Batch ${details.snapshotBatch}-${details.snapshotSection}`
      : null,
    details.snapshotDay ?? null,
    details.snapshotStartPeriod ? `Period ${details.snapshotStartPeriod}` : null,
  ].filter(Boolean)

  const applyParams = new URLSearchParams()
  if (details.slotId) applyParams.set("applySlot", details.slotId)
  if (details.suggestedClassCode) applyParams.set("code", details.suggestedClassCode)
  if (details.suggestedTeacherInitial) applyParams.set("teacher", details.suggestedTeacherInitial)
  if (details.suggestedRoom) applyParams.set("room", details.suggestedRoom)
  const applyHref =
    details.slotId && details.slotExists
      ? `/manage/routine?${applyParams.toString()}`
      : null

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h4 className="font-heading text-lg font-semibold text-foreground">
          {snapshotBits.length > 0 ? snapshotBits.join(" · ") : "Routine slot report"}
        </h4>
        <p className="mt-1 whitespace-pre-line text-sm text-foreground">
          {details.message}
        </p>
      </div>

      <div className="grid gap-2 rounded-lg border p-3 text-sm">
        <p className="font-medium text-foreground">Reported values (at report time)</p>
        <p className="text-muted-foreground">
          {details.snapshotClassCode ?? "—"}
          {details.snapshotTeacherInitial ? ` · ${details.snapshotTeacherInitial}` : ""}
          {details.snapshotRoom ? ` · Room ${details.snapshotRoom}` : ""}
        </p>
        <p className="font-medium text-foreground">Live slot now</p>
        {details.liveSlot ? (
          <p className="text-muted-foreground">
            {details.liveSlot.classCode}
            {details.liveSlot.teacherInitial ? ` · ${details.liveSlot.teacherInitial}` : ""}
            {details.liveSlot.room ? ` · Room ${details.liveSlot.room}` : ""}
            <span className="ml-1">
              (Batch {details.liveSlot.batch}-{details.liveSlot.section} · {details.liveSlot.day}
              {details.liveSlot.startPeriod ? ` · Period ${details.liveSlot.startPeriod}` : ""})
            </span>
          </p>
        ) : (
          <p className="text-sm text-amber-600 dark:text-amber-400">
            Slot no longer exists (deleted or replaced by a newer upload). Resolve based on the snapshot above.
          </p>
        )}
        {(details.suggestedClassCode || details.suggestedTeacherInitial || details.suggestedRoom) && (
          <>
            <p className="font-medium text-foreground">User suggestion</p>
            <div className="flex flex-wrap gap-2">
              {details.suggestedClassCode && <Badge variant="outline">{details.suggestedClassCode}</Badge>}
              {details.suggestedTeacherInitial && <Badge variant="outline">{details.suggestedTeacherInitial}</Badge>}
              {details.suggestedRoom && <Badge variant="outline">Room {details.suggestedRoom}</Badge>}
            </div>
          </>
        )}
      </div>

      {applyHref ? (
        <Button asChild variant="outline" size="sm" className="w-fit">
          <Link href={applyHref} target="_blank" rel="noreferrer">
            Copy suggestions into Manage Routine edit form
          </Link>
        </Button>
      ) : null}

      <p className="text-xs text-muted-foreground">
        Approving only closes this ticket — fix the slot itself in Manage Routine first (use the button above to prefill the edit form).
      </p>
    </div>
  )
}

export function ApprovalCard({ item }: { item: PendingItem }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [rejecting, setRejecting] = useState(false)
  const [reason, setReason] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const details = item.details as ProfileDetails
  const questionDetails = item.details as QuestionDetails
  const routineReportDetails = item.details as RoutineReportDetails
  const isQuestion = item.resourceType === "question"
  const isRoutineReport = item.resourceType === "routine_report"

  const socials: Array<{ label: string; value: string }> = [
    ...(details.linkedinUrl ? [{ label: "LinkedIn", value: details.linkedinUrl }] : []),
    ...(details.githubUrl ? [{ label: "GitHub", value: details.githubUrl }] : []),
    ...(details.portfolioUrl ? [{ label: "Portfolio", value: details.portfolioUrl }] : []),
    ...(details.facebookUrl ? [{ label: "Facebook", value: details.facebookUrl }] : []),
    ...(details.whatsappNumber
      ? [{ label: "WhatsApp", value: details.whatsappNumber }]
      : []),
  ]

  function runDecision(kind: "approved" | "rejected") {
    setError(null)
    startTransition(async () => {
      const result =
        kind === "approved"
          ? await approveItem({
              resourceType: item.resourceType,
              resourceId: item.resourceId,
            })
          : await rejectItem({
              resourceType: item.resourceType,
              resourceId: item.resourceId,
              reason: reason.trim() || undefined,
            })
      if (result.success) {
        setOpen(false)
        setRejecting(false)
        setReason("")
        router.refresh()
      } else {
        setError(result.error)
      }
    })
  }

  return (
    <Card>
      <CardContent className="flex items-center justify-between gap-4 p-5">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="truncate font-heading text-base font-semibold text-foreground">
              {item.submitterName}
            </h3>
            <Badge variant="outline" className="shrink-0">
              {resourceLabel(item.resourceType)}
            </Badge>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Submitted {formatDate(item.submittedAt)}
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
            Review
          </Button>

          <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {isQuestion ? (
                  <>Review question &ldquo;{item.title}&rdquo;</>
                ) : isRoutineReport ? (
                  <>Review routine report</>
                ) : (
                  <>Review {item.submitterName}&apos;s profile</>
                )}
              </DialogTitle>
              <DialogDescription>
                Submitted {formatDate(item.submittedAt)}.{" "}
                {isQuestion
                  ? "This paper is already live as under review. Approving clears the badge; rejecting removes it from the bank."
                  : isRoutineReport
                  ? "Approving closes the ticket as fixed (fix the slot in Manage Routine first); rejecting dismisses it."
                  : "Approving makes it visible in the directory immediately."}
              </DialogDescription>
            </DialogHeader>

            {isQuestion ? (
              <QuestionReview
                details={questionDetails}
                resourceId={item.resourceId}
              />
            ) : isRoutineReport ? (
              <RoutineReportReview details={routineReportDetails} />
            ) : (
              <>
                <div className="flex flex-col gap-5">
                  <div className="flex items-start gap-4">
                    <Avatar className="size-14">
                      {details.avatarUrl ? (
                        <AvatarImage
                          src={details.avatarUrl}
                          alt={details.fullName ?? ""}
                        />
                      ) : null}
                      <AvatarFallback className="text-base">
                        {initials(item.submitterName)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <h4 className="truncate font-heading text-lg font-semibold text-foreground">
                        {details.fullName ?? item.submitterName}
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        Batch {details.batchNumber ?? "—"}
                        {details.section ? ` · Section ${details.section}` : ""}
                      </p>
                      {details.studentId ? (
                        <p className="text-sm text-muted-foreground">
                          Student ID: {details.studentId}
                        </p>
                      ) : null}
                      {details.isAlumni ? (
                        <p className="text-sm text-muted-foreground">
                          {details.currentCompany ?? "Alumnus"}
                          {details.jobPosition
                            ? ` · ${details.jobPosition}`
                            : ""}
                        </p>
                      ) : null}
                    </div>
                  </div>

                  {details.bio ? (
                    <p className="whitespace-pre-line text-sm text-foreground">
                      {details.bio}
                    </p>
                  ) : null}

                  {details.skills && details.skills.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {details.skills.map((skill) => (
                        <SkillTag key={skill.id} skill={skill} />
                      ))}
                    </div>
                  ) : null}

                  {socials.length > 0 ? (
                    <div className="flex flex-col gap-1.5">
                      {socials.map((social) => (
                        <SocialLink key={social.label} {...social} />
                      ))}
                    </div>
                  ) : null}
                </div>
              </>
            )}

            {rejecting ? (
              <div className="grid gap-2">
                <Label htmlFor="reject-reason">Reason (shown to the submitter)</Label>
                <Textarea
                  id="reject-reason"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Optional reason for rejection…"
                  rows={3}
                />
              </div>
            ) : null}

            {error ? (
              <p
                role="alert"
                className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
              >
                {error}
              </p>
            ) : null}

            <DialogFooter>
              {rejecting ? (
                <>
                  <Button
                    variant="outline"
                    onClick={() => setRejecting(false)}
                    disabled={isPending}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => runDecision("rejected")}
                    disabled={isPending}
                  >
                    {isPending ? (
                      <Loader2 className="size-4 animate-spin" strokeWidth={1.5} />
                    ) : (
                      <X className="size-4" strokeWidth={1.5} />
                    )}
                    Confirm rejection
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    variant="outline"
                    onClick={() => setRejecting(true)}
                    disabled={isPending}
                  >
                    <X className="size-4" strokeWidth={1.5} />
                    Reject
                  </Button>
                  <Button
                    onClick={() => runDecision("approved")}
                    disabled={isPending}
                  >
                    {isPending ? (
                      <Loader2 className="size-4 animate-spin" strokeWidth={1.5} />
                    ) : (
                      <Check className="size-4" strokeWidth={1.5} />
                    )}
                    Approve
                  </Button>
                </>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  )
}
