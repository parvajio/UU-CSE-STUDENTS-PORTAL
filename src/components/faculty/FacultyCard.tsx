"use client"

import { useState } from "react"
import {
  Check,
  Copy,
  ExternalLink,
  GraduationCap,
  Mail,
  Send,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import type { FacultyMember } from "@/lib/faculty"
import { cn } from "@/lib/utils"
import {
  facultyDesignationTagClass,
  facultyInitials,
  facultyIsOnLeave,
} from "./faculty-utils"

export function FacultyCopyButton({
  value,
  label,
}: {
  value: string
  label: string
}) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(value)
    } catch {
      // Clipboard API unavailable (older browsers / insecure context) — fallback.
      const textarea = document.createElement("textarea")
      textarea.value = value
      textarea.setAttribute("readonly", "")
      textarea.style.position = "absolute"
      textarea.style.left = "-9999px"
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand("copy")
      document.body.removeChild(textarea)
    }
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1600)
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      aria-label={`Copy ${label}`}
      title={copied ? "Copied!" : `Copy ${label}`}
      className="rounded-md p-1 transition-colors hover:bg-black/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background dark:hover:bg-white/10"
    >
      {copied ? (
        <Check className="size-3.5" strokeWidth={2} />
      ) : (
        <Copy className="size-3.5" strokeWidth={1.5} />
      )}
    </button>
  )
}

function isInteractive(target: EventTarget | null): boolean {
  return target instanceof HTMLElement && target.closest("a,button") !== null
}

export function FacultySquarePhoto({  faculty,
  className,
  fallbackTextClassName,
}: {
  faculty: FacultyMember
  className?: string
  fallbackTextClassName?: string
}) {
  if (!faculty.photoUrl) {
    return (
      <div
        role="img"
        aria-label={`No photo for ${faculty.name}`}
        className={cn(
          "flex items-center justify-center bg-gradient-to-br from-primary/15 to-secondary/15 font-semibold text-foreground",
          className,
          fallbackTextClassName
        )}
      >
        {facultyInitials(faculty.name)}
      </div>
    )
  }
  return (
    // Plain <img> on purpose: photos come from our dynamic proxy route
    // (per-member bytes), which next/image cannot optimize without extra
    // config + double fetching.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={faculty.photoUrl}
      alt={`Photo of ${faculty.name}`}
      loading="lazy"
      className={cn("object-cover", className)}
    />
  )
}

export function FacultyCard({
  faculty,
  onSelect,
}: {
  faculty: FacultyMember
  onSelect: (faculty: FacultyMember) => void
}) {
  const onLeave = facultyIsOnLeave(faculty.designation)

  return (
    <Card
      role="button"
      tabIndex={0}
      aria-label={`View full profile for ${faculty.name}`}
      onClick={(event) => {
        if (isInteractive(event.target)) return
        onSelect(faculty)
      }}
      onKeyDown={(event) => {
        if (isInteractive(event.target)) return
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault()
          onSelect(faculty)
        }
      }}
      className="group h-full cursor-pointer transition-all duration-200 hover:-translate-y-1 hover:border-primary/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background motion-reduce:translate-y-0 motion-reduce:transition-none"
    >
      {/* Cover */}
      <div className="relative h-28 overflow-hidden bg-gradient-to-r from-primary/25 via-primary/10 to-secondary/25">
        <div className="absolute -top-10 -right-8 size-32 rounded-full bg-secondary/20 blur-2xl" />
        {onLeave ? (
          <span className="soft-tag soft-tag--pending absolute top-2.5 right-3 px-2 py-0.5 text-xs font-medium">
            On leave
          </span>
        ) : null}
      </div>

      <CardContent className="relative px-5 pb-5 text-center">
        <div className="-mt-16 mb-3 flex justify-center">
          <FacultySquarePhoto
            faculty={faculty}
            className="size-32 rounded-full border-4 border-background shadow-lg"
            fallbackTextClassName="text-3xl"
          />
        </div>

        <h3 className="font-heading text-lg font-semibold text-foreground transition-colors group-hover:text-primary">
          {faculty.name}
        </h3>
        <p className="mt-0.5 text-[11px] text-muted-foreground">
          Dept. of CSE · Uttara University
        </p>
        <div className="mt-2 flex justify-center">
          <span
            className={cn(
              "soft-tag px-2.5 py-0.5 text-xs font-medium",
              facultyDesignationTagClass(faculty.designation)
            )}
          >
            {faculty.designation}
          </span>
        </div>

        {faculty.institute1 || faculty.institute2 ? (
          <div className="mt-3 space-y-1.5 rounded-xl border border-border/60 bg-background px-3 py-2.5 text-left">
            {faculty.institute1 ? (
              <p className="flex items-start gap-1.5 text-xs text-muted-foreground">
                <GraduationCap
                  className="mt-0.5 size-3.5 shrink-0 text-primary"
                  strokeWidth={1.5}
                />
                <span className="line-clamp-2">{faculty.institute1}</span>
              </p>
            ) : null}
            {faculty.institute2 ? (
              <p className="flex items-start gap-1.5 text-xs text-muted-foreground">
                <GraduationCap
                  className="mt-0.5 size-3.5 shrink-0 text-primary"
                  strokeWidth={1.5}
                />
                <span className="line-clamp-2">{faculty.institute2}</span>
              </p>
            ) : null}
          </div>
        ) : null}

        {faculty.email ? (
          <div className="mt-2 flex items-center gap-2 rounded-xl border border-blue-500/30 bg-blue-500/10 px-2 py-1.5 text-left text-xs text-blue-700 transition-colors hover:bg-blue-500/15 dark:text-blue-300">
            <span className="flex size-6 shrink-0 items-center justify-center rounded-lg bg-blue-500/15">
              <Mail className="size-3.5" strokeWidth={1.5} />
            </span>
            <a
              href={`mailto:${faculty.email}`}
              title={faculty.email}
              className="min-w-0 flex-1 truncate font-medium hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
            >
              {faculty.email}
            </a>
            <FacultyCopyButton value={faculty.email} label="email address" />
          </div>
        ) : null}

        <div className="mt-3 grid grid-cols-2 gap-2">
          {faculty.email ? (
            <Button asChild size="sm">
              <a href={`mailto:${faculty.email}`}>
                <Send strokeWidth={1.5} />
                Email
              </a>
            </Button>
          ) : null}
          {faculty.detailsUrl ? (
            <Button
              asChild
              size="sm"
              variant="outline"
              className={cn(!faculty.email && "col-span-2")}
            >
              <a
                href={faculty.detailsUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLink strokeWidth={1.5} />
                Profile
              </a>
            </Button>
          ) : null}
        </div>

        <p className="mt-3 text-[11px] font-medium text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100 motion-reduce:opacity-100">
          Click card for full profile
        </p>
      </CardContent>
    </Card>
  )
}
