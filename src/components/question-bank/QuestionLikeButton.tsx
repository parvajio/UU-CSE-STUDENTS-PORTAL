"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Heart, Loader2 } from "lucide-react"
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
  const [pending, setPending] = useState(false)

  const callbackUrl = encodeURIComponent(safeCallbackUrl(pathname))

  if (!authenticated) {
    return (
      <Button
        asChild
        variant="ghost"
        size="sm"
        className="gap-1.5 text-muted-foreground"
      >
        <Link
          href={`/login?callbackUrl=${callbackUrl}`}
          aria-label="Log in to like this question"
        >
          <Heart className="size-4" strokeWidth={1.5} />
          <span>{count}</span>
        </Link>
      </Button>
    )
  }

  async function toggle() {
    if (pending) return
    setPending(true)
    const previous = { liked, count }
    const nextLiked = !liked
    setLiked(nextLiked)
    setCount((current) => current + (nextLiked ? 1 : -1))

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
      setLiked(data.liked)
      setCount(data.count)
    } catch {
      setLiked(previous.liked)
      setCount(previous.count)
    } finally {
      setPending(false)
    }
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      className="gap-1.5"
      onClick={toggle}
      disabled={pending}
      aria-pressed={liked}
      aria-label={liked ? "Unlike this question" : "Like this question"}
    >
      {pending ? (
        <Loader2 className="size-4 animate-spin" strokeWidth={1.5} />
      ) : (
        <Heart
          className={cn(
            "size-4 transition-colors",
            liked && "fill-current text-primary"
          )}
          strokeWidth={1.5}
        />
      )}
      <span>{count}</span>
    </Button>
  )
}