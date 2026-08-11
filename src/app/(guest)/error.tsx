"use client"

import { useEffect } from "react"
import Link from "next/link"
import { AlertTriangle, Home, RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function GuestError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("Guest route error:", error)
  }, [error])

  return (
    <main className="mx-auto flex min-h-[50vh] w-full max-w-3xl flex-col items-center justify-center px-4 py-16 text-center">
      <div className="rounded-full bg-destructive/10 p-4 text-destructive mb-4">
        <AlertTriangle className="size-8" strokeWidth={1.5} />
      </div>
      <h1 className="font-heading text-2xl font-semibold text-foreground sm:text-3xl">
        Failed to load content
      </h1>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">
        We encountered an issue loading this page. Please check your connection or try again.
      </p>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <Button onClick={() => reset()} variant="default">
          <RotateCcw className="mr-2 size-4" strokeWidth={1.5} />
          Try again
        </Button>
        <Button asChild variant="outline">
          <Link href="/">
            <Home className="mr-2 size-4" strokeWidth={1.5} />
            Back to Home
          </Link>
        </Button>
      </div>
    </main>
  )
}
