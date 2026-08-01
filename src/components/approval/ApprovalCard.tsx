"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Check, Loader2, X } from "lucide-react"
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
import type { PendingItem } from "@/lib/db/queries/approval"

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

export function ApprovalCard({ item }: { item: PendingItem }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [rejecting, setRejecting] = useState(false)
  const [reason, setReason] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const details = item.details as ProfileDetails

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
              {capitalize(item.resourceType)}
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
              <DialogTitle>Review {item.submitterName}&apos;s profile</DialogTitle>
              <DialogDescription>
                Submitted {formatDate(item.submittedAt)}. Approving makes it visible
                in the directory immediately.
              </DialogDescription>
            </DialogHeader>

            <div className="flex flex-col gap-5">
              <div className="flex items-start gap-4">
                <Avatar className="size-14">
                  {details.avatarUrl ? (
                    <AvatarImage src={details.avatarUrl} alt={details.fullName ?? ""} />
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
                      {details.jobPosition ? ` · ${details.jobPosition}` : ""}
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
