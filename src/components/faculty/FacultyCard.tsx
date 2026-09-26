"use client"

import { useState } from "react"
import {
  Check,
  Copy,
  ExternalLink,
  GraduationCap,
  Mail,
} from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent } from "@/components/ui/card"
import type { FacultyMember } from "@/lib/faculty"
import { cn } from "@/lib/utils"

function initials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0))
    .join("")
    .toUpperCase()
}

/** Rank-based pill color; senior ranks get hues, lecturers stay neutral. */
function designationTagClass(designation: string): string {
  const lower = designation.toLowerCase()
  if (lower.includes("associate professor")) return "soft-tag--web"
  if (lower.includes("assistant professor")) return "soft-tag--research"
  if (lower.includes("senior lecturer")) return "soft-tag--cp"
  if (lower.includes("professor")) return "soft-tag--ml"
  return "soft-tag--default"
}

function isOnLeave(designation: string): boolean {
  return designation.toLowerCase().includes("study leave")
}

function CopyButton({ value, label }: { value: string; label: string }) {
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

export function FacultyCard({ faculty }: { faculty: FacultyMember }) {
  const onLeave = isOnLeave(faculty.designation)

  return (
    <Card className="h-full transition-all duration-200 hover:-translate-y-1 hover:border-primary/30 motion-reduce:translate-y-0 motion-reduce:transition-none">
      {/* Profile banner */}
      <div className="relative h-24 overflow-hidden bg-gradient-to-r from-primary/25 via-primary/10 to-secondary/25">
        <div className="absolute -top-10 -right-8 size-32 rounded-full bg-secondary/20 blur-2xl" />
        {onLeave ? (
          <span className="soft-tag soft-tag--pending absolute top-2.5 right-3 px-2 py-0.5 text-xs font-medium">
            On leave
          </span>
        ) : null}
      </div>

      <CardContent className="relative px-6 pb-5 text-center">
        <div className="-mt-16 mb-2 flex justify-center">
          <Avatar className="size-32 border-4 border-background shadow-xl ring-1 ring-border/60">
            {faculty.photoUrl ? (
              <AvatarImage
                src={faculty.photoUrl}
                alt={`Photo of ${faculty.name}`}
                loading="lazy"
              />
            ) : null}
            <AvatarFallback className="bg-gradient-to-br from-primary/15 to-secondary/15 text-3xl font-semibold">
              {initials(faculty.name)}
            </AvatarFallback>
          </Avatar>
        </div>

        <h3 className="font-heading text-lg font-semibold text-foreground">
          {faculty.name}
        </h3>
        <div className="mt-1.5 flex justify-center">
          <span
            className={cn(
              "soft-tag px-2.5 py-0.5 text-xs font-medium",
              designationTagClass(faculty.designation)
            )}
          >
            {faculty.designation}
          </span>
        </div>

        {faculty.institute1 || faculty.institute2 ? (
          <div className="mx-auto mt-3 max-w-xs space-y-1">
            {faculty.institute1 ? (
              <p className="flex items-start justify-center gap-1.5 text-xs text-muted-foreground">
                <GraduationCap
                  className="mt-0.5 size-3 shrink-0"
                  strokeWidth={1.5}
                />
                <span className="line-clamp-2">{faculty.institute1}</span>
              </p>
            ) : null}
            {faculty.institute2 ? (
              <p className="flex items-start justify-center gap-1.5 text-xs text-muted-foreground">
                <GraduationCap
                  className="mt-0.5 size-3 shrink-0"
                  strokeWidth={1.5}
                />
                <span className="line-clamp-2">{faculty.institute2}</span>
              </p>
            ) : null}
          </div>
        ) : null}

        <div className="mt-3 space-y-1.5 border-t border-border/40 pt-3 text-left">
          {faculty.email ? (
            <div className="flex items-center gap-2 rounded-xl border border-blue-500/30 bg-blue-500/10 px-2 py-1.5 text-xs text-blue-700 transition-colors hover:bg-blue-500/15 dark:text-blue-300">
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
              <CopyButton value={faculty.email} label="email address" />
            </div>
          ) : null}

          {faculty.detailsUrl ? (
            <a
              href={faculty.detailsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-2 py-1.5 text-xs font-medium text-emerald-700 transition-colors hover:bg-emerald-500/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 dark:text-emerald-300"
            >
              <span className="flex size-6 shrink-0 items-center justify-center rounded-lg bg-emerald-500/15">
                <ExternalLink className="size-3.5" strokeWidth={1.5} />
              </span>
              <span className="min-w-0 flex-1 truncate">
                University profile
              </span>
            </a>
          ) : null}
        </div>
      </CardContent>
    </Card>
  )
}
