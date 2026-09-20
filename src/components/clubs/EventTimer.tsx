"use client"

import { useCallback, useEffect, useState } from "react"
import { Check } from "lucide-react"
import { cn } from "@/lib/utils"

interface EventTimerProps {
  endTime?: string | null
  startTime?: string | null
  className?: string
}

interface CountdownParts {
  days: string
  hours: string
  minutes: string
  seconds: string
  /** "upcoming" counts down to start, "live" counts down to end. */
  phase: "upcoming" | "live"
  label: string
}

function getTarget(now: number, endTime?: string | null, startTime?: string | null): { at: number; phase: "upcoming" | "live" } | null {
  const end = endTime ? new Date(endTime).getTime() : NaN
  const start = startTime ? new Date(startTime).getTime() : NaN

  // Upcoming: start is in the future → count down to start.
  if (!Number.isNaN(start) && start > now) return { at: start, phase: "upcoming" }
  // Ongoing: end is in the future → count down to end.
  if (!Number.isNaN(end) && end > now) return { at: end, phase: "live" }
  // Completed (both passed, invalid, or neither provided).
  return null
}

function pad(n: number): string {
  return String(n).padStart(2, "0")
}

function computeParts(endTime?: string | null, startTime?: string | null): CountdownParts | null {
  // Always derived from Date.now() at call time so each tick is
  // independent — no accumulated setInterval drift (T051).
  const now = Date.now()
  const target = getTarget(now, endTime, startTime)
  if (target === null) return null
  const totalSeconds = Math.max(0, Math.floor((target.at - now) / 1000))
  const days = Math.floor(totalSeconds / 86400)
  const hours = Math.floor((totalSeconds % 86400) / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  return {
    days: String(days).padStart(2, "0"),
    hours: pad(hours),
    minutes: pad(minutes),
    seconds: pad(seconds),
    phase: target.phase,
    label:
      days > 0
        ? `${days}d ${hours}h ${minutes}m ${seconds}s`
        : hours > 0
          ? `${hours}h ${minutes}m ${seconds}s`
          : minutes > 0
            ? `${minutes}m ${seconds}s`
            : `${seconds}s`,
  }
}

function usePrefersReducedMotion(): boolean {
  // Initialize to `false` so server and initial client render match.
  // The real preference is synced in an effect after mount to avoid
  // hydration mismatch when the OS setting is "reduce".
  const [reduced, setReduced] = useState<boolean>(false)

  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") return
    const query = window.matchMedia("(prefers-reduced-motion: reduce)")
    setReduced(query.matches)
    const onChange = (event: MediaQueryListEvent) => setReduced(event.matches)
    query.addEventListener("change", onChange)
    return () => query.removeEventListener("change", onChange)
  }, [])

  return reduced
}

function TimeCell({ value, unit }: { value: string; unit: string }) {
  return (
    <span className="flex min-w-11 flex-col items-center rounded-lg border border-primary/20 bg-primary/[0.07] px-1.5 py-1 dark:border-primary/25 dark:bg-primary/10">
      <span className="font-heading text-sm font-bold leading-none tabular-nums text-primary">
        {value}
      </span>
      <span className="mt-0.5 text-[9px] font-medium uppercase tracking-wider text-muted-foreground">
        {unit}
      </span>
    </span>
  )
}

export function EventTimer({ endTime, startTime, className }: EventTimerProps) {
  const reducedMotion = usePrefersReducedMotion()
  const calculateParts = useCallback(
    () => computeParts(endTime, startTime),
    [endTime, startTime]
  )
  // `parts` starts as `undefined` (not yet computed) so the server and the
  // initial client render produce identical deterministic placeholder HTML.
  // The real countdown is computed in an effect after mount — never during
  // render — so `Date.now()` skew between SSR and hydration can't mismatch.
  // `null` means completed, `undefined` means loading.
  const [parts, setParts] = useState<CountdownParts | null | undefined>(undefined)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    setParts(calculateParts())
  }, [calculateParts])

  useEffect(() => {
    if (!mounted || reducedMotion) return
    // Reduced motion: keep the single static snapshot — no per-second
    // ticking and no animations (T052, SC-009).
    const interval = setInterval(() => {
      setParts(calculateParts())
    }, 1000)
    return () => clearInterval(interval)
  }, [calculateParts, reducedMotion, mounted])

  // Tab-switch resync: browsers throttle setInterval in background tabs,
  // so recalculate from Date.now() immediately when the tab becomes
  // visible again instead of trusting the throttled ticks (T051).
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) setParts(calculateParts())
    }
    document.addEventListener("visibilitychange", handleVisibilityChange)
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange)
  }, [calculateParts])

  if (!mounted || parts === undefined) {
    return (
      <span
        role="timer"
        data-testid="event-timer"
        data-completed="false"
        data-state="loading"
        data-motion="full"
        aria-live="off"
        aria-label="Loading time remaining"
        title="Loading time remaining"
        className={cn(
          "font-heading inline-flex items-center gap-1.5 font-semibold tabular-nums",
          className
        )}
      >
        <TimeCell value="--" unit="days" />
        <span aria-hidden className="font-bold text-muted-foreground/60">:</span>
        <TimeCell value="--" unit="hrs" />
        <span aria-hidden className="font-bold text-muted-foreground/60">:</span>
        <TimeCell value="--" unit="min" />
        <span aria-hidden className="font-bold text-muted-foreground/60">:</span>
        <TimeCell value="--" unit="sec" />
      </span>
    )
  }

  if (parts === null) {
    return (
      <span
        role="timer"
        data-testid="event-timer"
        data-completed="true"
        data-motion={reducedMotion ? "reduced" : "full"}
        aria-live="off"
        aria-label="Event completed"
        title="Event completed"
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full border border-border bg-muted px-3 py-1 font-heading text-xs font-semibold text-muted-foreground",
          // No transitions/animations under reduced motion (T052).
          reducedMotion && "motion-reduce:animate-none motion-reduce:transition-none",
          className
        )}
      >
        <Check className="size-3.5" strokeWidth={1.5} aria-hidden />
        completed
      </span>
    )
  }

  const live = parts.phase === "live"

  return (
    <span
      role="timer"
      data-testid="event-timer"
      data-completed="false"
      data-state={parts.phase}
      data-motion={reducedMotion ? "reduced" : "full"}
      aria-live="off"
      aria-label={`Time remaining: ${parts.label}`}
      title={`Time remaining: ${parts.label}`}
      className={cn(
        "font-heading inline-flex items-center gap-1.5 font-semibold tabular-nums",
        // No transitions/animations under reduced motion (T052).
        reducedMotion && "motion-reduce:animate-none motion-reduce:transition-none",
        className
      )}
    >
      <span
        aria-hidden
        className={cn(
          "relative flex size-2 shrink-0",
          reducedMotion && "motion-reduce:animate-none"
        )}
      >
        {!reducedMotion && (
          <span
            className={cn(
              "absolute inline-flex h-full w-full animate-ping rounded-full opacity-60 motion-reduce:animate-none",
              live ? "bg-emerald-500" : "bg-primary"
            )}
          />
        )}
        <span
          className={cn(
            "relative inline-flex size-2 rounded-full",
            live ? "bg-emerald-500" : "bg-primary"
          )}
        />
      </span>
      <TimeCell value={parts.days} unit="days" />
      <span aria-hidden className="font-bold text-muted-foreground/60">:</span>
      <TimeCell value={parts.hours} unit="hrs" />
      <span aria-hidden className="font-bold text-muted-foreground/60">:</span>
      <TimeCell value={parts.minutes} unit="min" />
      <span aria-hidden className="font-bold text-muted-foreground/60">:</span>
      <TimeCell value={parts.seconds} unit="sec" />
    </span>
  )
}
