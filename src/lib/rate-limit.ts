type RateLimitEntry = {
  count: number
  resetAt: number
}

const store = new Map<string, RateLimitEntry>()

export type RateLimitResult =
  | { allowed: true }
  | { allowed: false; retryAfter: number }

export function checkRateLimit(
  key: string,
  maxCount: number,
  windowMs: number
): RateLimitResult {
  const now = Date.now()

  for (const [storedKey, entry] of store) {
    if (entry.resetAt <= now) store.delete(storedKey)
  }

  const entry = store.get(key)
  if (!entry || entry.resetAt <= now) {
    store.set(key, { count: 1, resetAt: now + windowMs })
    return { allowed: true }
  }

  if (entry.count >= maxCount) {
    return { allowed: false, retryAfter: Math.ceil((entry.resetAt - now) / 1000) }
  }

  entry.count += 1
  return { allowed: true }
}
