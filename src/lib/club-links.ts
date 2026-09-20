/**
 * Helpers for club group links.
 *
 * `clubs.msg_group_url` is a single TEXT column, so multiple group URLs are
 * stored newline-separated in that column (backward compatible: a single URL
 * is stored as-is). These helpers convert between the stored string and the
 * dynamic input list used by the manage form.
 */

export function splitGroupUrls(value: string | null | undefined): string[] {
  if (!value) return [""]
  const parts = value
    .split(/[\n,]+/)
    .map((s) => s.trim())
    .filter(Boolean)
  return parts.length > 0 ? parts : [""]
}

export function joinGroupUrls(urls: Array<string | null | undefined>): string {
  return urls
    .map((u) => (u ?? "").trim())
    .filter(Boolean)
    .join("\n")
}

/** Normalize a POST/PUT payload value that may be a string or an array. */
export function normalizeGroupUrlInput(
  value: unknown
): string | null {
  if (Array.isArray(value)) return joinGroupUrls(value as string[]) || ""
  if (typeof value === "string") return value.trim()
  return null
}
