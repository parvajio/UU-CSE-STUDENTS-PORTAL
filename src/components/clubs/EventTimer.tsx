"use client"

import { useCallback, useEffect, useState } from "react"
import { cn } from "@/lib/utils"

interface EventTimerProps {
  endTime?: string | null
  startTime?: string | null
  className?: string
}

function getTarget(now: number, endTime?: string | null, startTime?: string | null): number | null {
  const end = endTime ? new Date(endTime).getTime() : NaN
  const start = startTime ? new Date(startTime).getTime() : NaN

  // Upcoming: start is in the future → count down to start.
  if (!Number.isNaN(start) && start > now) return start
  // Ongoing: end is in the future → count down to end.
  if (!Number.isNaN(end) && end > now) return end
  // Completed (both passed, invalid, or neither provided).
  return null
}

function formatDuration(ms: number): string {
  if (ms <= 0) return "completed"
  const totalSeconds = Math.floor(ms / 1000)
  const days = Math.floor(totalSeconds / 86400)
  const hours = Math.floor((totalSeconds % 86400) / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  if (days > 0) return `${days}d ${hours}h ${minutes}m ${seconds}s`
  if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`
  if (minutes > 0) return `${minutes}m ${seconds}s`
  return `${seconds}s`
}

function computeLabel(endTime?: string | null, startTime?: string | null): string {
  // Always derived from Date.now() at call time so each tick is
  // independent — no accumulated setInterval drift (T051).
  const target = getTarget(Date.now(), endTime, startTime)
  if (target === null) return "completed"
  return formatDuration(target - Date.now())
}

function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState<boolean>(
    () =>
      typeof window !== "undefined" &&
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
  )

  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") return
    const query = window.matchMedia("(prefers-reduced-motion: reduce)")
    const onChange = (event: MediaQueryListEvent) => setReduced(event.matches)
    query.addEventListener("change", onChange)
    return () => query.removeEventListener("change", onChange)
  }, [])

  return reduced
}

export function EventTimer({ endTime, startTime, className }: EventTimerProps) {
  const reducedMotion = usePrefersReducedMotion()
  const calculateTimeLeft = useCallback(
    () => computeLabel(endTime, startTime),
    [endTime, startTime]
  )
  const [timeLeft, setTimeLeft] = useState<string>(() => calculateTimeLeft())

  // Sync state during render when inputs change (covers prop changes and
  // reduced-motion toggles without a cascading effect).
  const [synced, setSynced] = useState(() => ({ endTime, startTime, reducedMotion }))
  if (
    synced.endTime !== endTime ||
    synced.startTime !== startTime ||
    synced.reducedMotion !== reducedMotion
  ) {
    setSynced({ endTime, startTime, reducedMotion })
    setTimeLeft(calculateTimeLeft())
  }

  useEffect(() => {
    // Reduced motion: keep the single static snapshot — no per-second
    // ticking and no animations (T052, SC-009).
    if (reducedMotion) return
    const interval = setInterval(() => {
      setTimeLeft(calculateTimeLeft())
    }, 1000)
    return () => clearInterval(interval)
  }, [calculateTimeLeft, reducedMotion])

  // Tab-switch resync: browsers throttle setInterval in background tabs,
  // so recalculate from Date.now() immediately when the tab becomes
  // visible again instead of trusting the throttled ticks (T051).
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) setTimeLeft(calculateTimeLeft())
    }
    document.addEventListener("visibilitychange", handleVisibilityChange)
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange)
  }, [calculateTimeLeft])

  const completed = timeLeft === "completed"

  return (
    <span
      role="timer"
      data-testid="event-timer"
      data-completed={completed ? "true" : "false"}
      data-motion={reducedMotion ? "reduced" : "full"}
      aria-live="off"
      aria-label={completed ? "Event completed" : `Time remaining: ${timeLeft}`}
      title={completed ? "Event completed" : `Time remaining: ${timeLeft}`}
      className={cn(
        "font-heading font-semibold tabular-nums",
        completed ? "text-destructive" : "text-primary",
        // No transitions/animations under reduced motion (T052).
        reducedMotion && "motion-reduce:animate-none motion-reduce:transition-none",
        className
      )}
    >
      {timeLeft}
    </span>
  )
}
