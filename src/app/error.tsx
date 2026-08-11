"use client"

import { useEffect } from "react"
import Link from "next/link"
import { AlertTriangle, Home, RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("Application error:", error)
  }, [error])

  return (
    <html lang="en">
      <body>
        <main className="flex min-h-screen flex-col items-center justify-center px-4 py-16 text-center bg-background text-foreground">
          <div className="rounded-full bg-destructive/10 p-4 text-destructive mb-4">
            <AlertTriangle className="size-8" strokeWidth={1.5} />
          </div>
          <h1 className="font-heading text-2xl font-semibold sm:text-3xl">
            Something went wrong!
          </h1>
          <p className="mt-2 max-w-md text-sm text-muted-foreground">
            An unexpected error occurred on the server. Please try again or return home.
          </p>
          {error.digest ? (
            <p className="mt-2 font-mono text-xs text-muted-foreground">
              Error Digest: {error.digest}
            </p>
          ) : null}
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
      </body>
    </html>
  )
}
