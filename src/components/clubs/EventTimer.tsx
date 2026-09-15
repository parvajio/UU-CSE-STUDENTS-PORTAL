"use client"

import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"

export function EventTimer({
  endTime,
  startTime,
}: {
  endTime?: string | null
  startTime?: string | null
}) {
  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft())

  function calculateTimeLeft(): string {
    const now = new Date()
    const end = endTime ? new Date(endTime) : null
    const start = startTime ? new Date(startTime) : null

    if (end && end <= now) return "completed"
    if (start && start > now) {
      const diff = start.getTime() - now.getTime()
      return formatDuration(diff)
    }
    if (end) {
      const diff = end.getTime() - now.getTime()
      return formatDuration(diff)
    }
    return "completed"
  }

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft(calculateTimeLeft())
    }, 1000)
    return () => clearInterval(interval)
  }, [endTime, startTime])

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        setTimeLeft(calculateTimeLeft())
      }
    }
    document.addEventListener("visibilitychange", handleVisibilityChange)
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange)
  }, [endTime, startTime])

  const prefersReducedMotion =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches

  return (
    <span
      className={cn(
        "font-heading font-semibold",
        timeLeft === "completed"
          ? "text-destructive"
          : "text-primary",
        prefersReducedMotion ? "" : ""
      )}
    >
      {timeLeft}
    </span>
  )
}

function formatDuration(ms: number): string {
  if (ms <= 0) return "completed"
  const seconds = Math.floor(ms / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (days > 0) return `${days}d ${hours % 24}h`
  if (hours > 0) return `${hours}h ${minutes % 60}m`
  if (minutes > 0) return `${minutes}m ${seconds % 60}s`
  return `${seconds}s`
}
