"use client"

import { useRef, useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Heart } from "lucide-react"
import { Button } from "@/components/ui/button"
import { safeCallbackUrl } from "@/lib/auth/safe-callback-url"
import { cn } from "@/lib/utils"

export function QuestionLikeButton({
  questionId,
  liked: initialLiked,
  count: initialCount,
  authenticated,
}: {
  questionId: string
  liked: boolean
  count: number
  authenticated: boolean
}) {
  const pathname = usePathname()
  const router = useRouter()
  const [liked, setLiked] = useState(initialLiked)
  const [count, setCount] = useState(initialCount)

  // Optimistic UI source of truth + serialized sync so the server always
  // settles on the user's final intent — no click is ever dropped.
  const syncedLiked = useRef(initialLiked)
  const syncedCount = useRef(initialCount)
  const inFlight = useRef(false)
  const desired = useRef<boolean | null>(null)

  const callbackUrl = encodeURIComponent(safeCallbackUrl(pathname))

  if (!authenticated) {
    return (
      <Button
        asChild
        variant="ghost"
        size="sm"
        className="group h-auto rounded-none p-0 text-muted-foreground hover:bg-transparent hover:text-muted-foreground"
      >
        <Link
          href={`/login?callbackUrl=${callbackUrl}`}
          aria-label="Log in to like this question"
        >
          <Heart
            className="size-4 transition-all duration-200 group-hover:scale-110 group-hover:text-primary"
            strokeWidth={1.5}
          />
          <span>{count}</span>
        </Link>
      </Button>
    )
  }

  function toggle() {
    const next = !liked
    // Instant, always — even while a sync is still in flight.
    setLiked(next)
    setCount((current) => current + (next ? 1 : -1))
    if (inFlight.current) {
      desired.current = next
      return
    }
    void send(next)
  }

  async function send(target: boolean) {
    inFlight.current = true
    try {
      const response = await fetch(`/api/questions/${questionId}/like`, {
        method: "POST",
        headers: { Accept: "application/json" },
      })
      if (!response.ok) {
        if (response.status === 401) {
          router.push(`/login?callbackUrl=${callbackUrl}`)
        }
        throw new Error("Like request failed.")
      }
      const data = (await response.json()) as { liked: boolean; count: number }
      syncedLiked.current = data.liked
      syncedCount.current = data.count
      // Only write the server truth back when no newer click is queued,
      // otherwise the heart would flicker to the stale value.
      if (desired.current === null) {
        setLiked(data.liked)
        setCount(data.count)
      }
    } catch {
      setLiked(syncedLiked.current)
      setCount(syncedCount.current)
    } finally {
      inFlight.current = false
      const pending = desired.current
      desired.current = null
      if (pending !== null && pending !== syncedLiked.current) {
        void send(pending)
      }
    }
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      className="group h-auto rounded-none p-0 hover:bg-transparent hover:text-inherit"
      onClick={toggle}
      aria-pressed={liked}
      aria-label={liked ? "Unlike this question" : "Like this question"}
    >
      <Heart
        className={cn(
          "size-4 transition-all duration-200 group-hover:scale-110 group-hover:text-primary active:scale-90",
          liked && "scale-110 fill-current text-primary"
        )}
        strokeWidth={1.5}
      />
      <span>{count}</span>
    </Button>
  )
}
