import React from "react"

/**
 * Shared URL auto-detection for club text rendering (T062, SC-006).
 *
 * Detects `http://`, `https://`, and bare `www.` URLs in plain text and
 * renders them as safe external anchors (`target="_blank"` +
 * `rel="noopener noreferrer"`). Trailing punctuation (`.`, `,`, `;`, `:`,
 * `!`, `?`, `)`, `]`, quotes) is stripped from the link target but kept as
 * surrounding text.
 */

const URL_PATTERN = /((?:https?:\/\/|www\.)[^\s<>"'`)\]]+)/gi

export function normalizeUrl(url: string): string {
  return /^https?:\/\//i.test(url) ? url : `https://${url}`
}

function splitTrailingPunctuation(token: string): { url: string; trail: string } {
  const match = token.match(/^(.*?)[.,;:!?)\]}'"'`]+$/)
  if (match && /[a-z0-9/=_-]/i.test(match[1])) {
    return { url: match[1], trail: token.slice(match[1].length) }
  }
  return { url: token, trail: "" }
}

export function linkifyText(text: string): React.ReactNode[] {
  const nodes: React.ReactNode[] = []
  let lastIndex = 0
  let key = 0

  // Fresh regex instance per call — URL_PATTERN is global and stateful.
  const pattern = new RegExp(URL_PATTERN.source, URL_PATTERN.flags)
  let match: RegExpExecArray | null

  while ((match = pattern.exec(text)) !== null) {
    const raw = match[0]
    const start = match.index
    if (start > lastIndex) {
      nodes.push(text.slice(lastIndex, start))
    }
    const { url, trail } = splitTrailingPunctuation(raw)
    const href = normalizeUrl(url)
    nodes.push(
      <a
        key={`link-${key++}`}
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="text-primary hover:underline focus-visible:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 rounded-sm"
      >
        {url}
      </a>
    )
    if (trail) nodes.push(trail)
    lastIndex = start + raw.length
  }

  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex))
  }
  return nodes
}
