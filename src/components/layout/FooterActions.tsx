"use client"

import { useCallback, useState } from "react"
import { ArrowUp, Check, Copy } from "lucide-react"

export function CopyEmailButton({ email }: { email: string }) {
  const [copied, setCopied] = useState(false)

  const copy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(email)
    } catch {
      // Clipboard API can be unavailable (non-secure context, permissions).
      // Fall back to a temporary textarea + execCommand.
      const el = document.createElement("textarea")
      el.value = email
      el.setAttribute("readonly", "")
      el.style.position = "absolute"
      el.style.left = "-9999px"
      document.body.appendChild(el)
      el.select()
      document.execCommand("copy")
      document.body.removeChild(el)
    }
    setCopied(true)
    window.setTimeout(() => setCopied(false), 2000)
  }, [email])

  return (
    <button
      type="button"
      onClick={copy}
      aria-label={copied ? "Email address copied" : "Copy email address"}
      title={copied ? "Copied!" : "Copy email address"}
      className="flex size-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <span aria-live="polite" className="flex items-center justify-center">
        {copied ? (
          <Check className="size-4 text-status-approved" strokeWidth={1.5} />
        ) : (
          <Copy className="size-4" strokeWidth={1.5} />
        )}
      </span>
    </button>
  )
}

export function BackToTopButton() {
  const scrollTop = useCallback(() => {
    window.scrollTo({ top: 0, behavior: "smooth" })
  }, [])

  return (
    <button
      type="button"
      onClick={scrollTop}
      className="group inline-flex items-center gap-1.5 rounded-xl border border-border px-3 py-2 text-xs font-medium text-muted-foreground transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      Back to top
      <ArrowUp
        className="size-3.5 transition-transform group-hover:-translate-y-0.5"
        strokeWidth={1.5}
      />
    </button>
  )
}
