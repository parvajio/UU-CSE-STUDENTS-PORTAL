export function safeCallbackUrl(url: string | null | undefined): string {
  if (
    !url ||
    !url.startsWith("/") ||
    url.startsWith("//") ||
    url.startsWith("/\\") ||
    url.includes("://")
  ) {
    return "/"
  }
  return url
}
