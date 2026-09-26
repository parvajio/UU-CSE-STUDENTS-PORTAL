"use client"

import { ExternalLink, GraduationCap, Mail, Send } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog"
import type { FacultyMember } from "@/lib/faculty"
import { cn } from "@/lib/utils"
import { FacultyCopyButton, FacultySquarePhoto } from "./FacultyCard"
import {
  facultyDesignationTagClass,
  facultyIsOnLeave,
} from "./faculty-utils"

export function FacultyDetailModal({
  faculty,
  onClose,
}: {
  faculty: FacultyMember | null
  onClose: () => void
}) {
  return (
    <Dialog
      open={faculty !== null}
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
    >
      {faculty ? (
        <DialogContent className="max-h-[90vh] gap-0 overflow-hidden p-0 sm:max-w-3xl">
          <div className="grid max-h-[90vh] overflow-hidden sm:grid-cols-[300px_minmax(0,1fr)]">
            {/* Photo: full-width banner on mobile, full-height pane on desktop.
                Blurred twin fills the pane edge-to-edge; the real photo sits
                on top with object-contain so its full width is always visible. */}
            <div className="relative h-64 w-full shrink-0 overflow-hidden sm:h-auto sm:min-h-[480px] sm:self-stretch">
              {faculty.photoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={faculty.photoUrl}
                  alt=""
                  aria-hidden="true"
                  loading="lazy"
                  className="absolute inset-0 h-full w-full scale-110 object-cover blur-2xl brightness-90 saturate-150"
                />
              ) : null}
              <FacultySquarePhoto
                faculty={faculty}
                className="absolute inset-0 h-full w-full object-contain"
                fallbackTextClassName="text-6xl"
              />
            </div>

            {/* Info: scrolls independently so the photo stays full-height */}
            <div className="max-h-[calc(90vh-16rem)] min-w-0 overflow-y-auto px-6 py-6 sm:max-h-[90vh] sm:py-8 sm:pr-10">
              <DialogTitle className="font-heading text-xl font-semibold text-foreground sm:text-2xl">
                {faculty.name}
              </DialogTitle>
              <DialogDescription className="mt-1 text-xs">
                Dept. of CSE · Uttara University
              </DialogDescription>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span
                  className={cn(
                    "soft-tag px-3 py-1 text-xs font-medium",
                    facultyDesignationTagClass(faculty.designation)
                  )}
                >
                  {faculty.designation}
                </span>
                {facultyIsOnLeave(faculty.designation) ? (
                  <span className="soft-tag soft-tag--pending px-2 py-0.5 text-xs font-medium">
                    On leave
                  </span>
                ) : null}
              </div>

              {faculty.institute1 || faculty.institute2 ? (
                <div className="mt-4 space-y-2 rounded-xl border border-border/60 bg-surface px-4 py-3 text-left">
                  {faculty.institute1 ? (
                    <p className="flex items-start gap-2 text-sm text-muted-foreground">
                      <GraduationCap
                        className="mt-0.5 size-4 shrink-0 text-primary"
                        strokeWidth={1.5}
                      />
                      <span>{faculty.institute1}</span>
                    </p>
                  ) : null}
                  {faculty.institute2 ? (
                    <p className="flex items-start gap-2 text-sm text-muted-foreground">
                      <GraduationCap
                        className="mt-0.5 size-4 shrink-0 text-primary"
                        strokeWidth={1.5}
                      />
                      <span>{faculty.institute2}</span>
                    </p>
                  ) : null}
                </div>
              ) : null}

              {faculty.email ? (
                <div className="mt-3 flex items-center gap-2.5 rounded-xl border border-blue-500/30 bg-blue-500/10 px-3 py-2.5 text-left text-sm text-blue-700 transition-colors hover:bg-blue-500/15 dark:text-blue-300">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-blue-500/15">
                    <Mail className="size-4" strokeWidth={1.5} />
                  </span>
                  <a
                    href={`mailto:${faculty.email}`}
                    title={faculty.email}
                    className="min-w-0 flex-1 truncate font-medium hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
                  >
                    {faculty.email}
                  </a>
                  <FacultyCopyButton
                    value={faculty.email}
                    label="email address"
                  />
                </div>
              ) : null}

              <div className="mt-4 grid gap-2">
                {faculty.email ? (
                  <Button asChild>
                    <a href={`mailto:${faculty.email}`}>
                      <Send className="size-4" strokeWidth={1.5} />
                      Send email
                    </a>
                  </Button>
                ) : null}
                {faculty.detailsUrl ? (
                  <Button asChild variant="outline">
                    <a
                      href={faculty.detailsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <ExternalLink className="size-4" strokeWidth={1.5} />
                      University profile
                    </a>
                  </Button>
                ) : null}
              </div>
            </div>
          </div>
        </DialogContent>
      ) : null}
    </Dialog>
  )
}
