/**
 * Faculty Directory data layer.
 *
 * Source: Uttara University department employee API (Dept. of CSE, deptCode=8).
 * The upstream payload is ~9MB (85 records with inline base64 photos), so:
 * - The raw payload is fetched server-side only and cached hourly.
 * - `getFacultyList()` returns lightweight records (no image blobs) — the
 *   photo is served per-member via `/api/faculty/photo/[empId]`, keeping the
 *   page payload small and letting browsers lazy-load + cache images.
 */

export type FacultyMember = {
  empId: string
  name: string
  designation: string
  education: string | null
  institute1: string | null
  institute2: string | null
  email: string | null
  officeExt: string | null
  /** Per-member image URL served by our photo proxy route. Null when no photo. */
  photoUrl: string | null
  /** Link to the member's official university profile page. Null if absent. */
  detailsUrl: string | null
}

type UpstreamEmployee = {
  EmpID?: string | number | null
  EncryptedID?: string | null
  EmpName?: string | null
  Designation?: string | null
  Education?: string | null
  Institute1?: string | null
  Institute2?: string | null
  email?: string | null
  office_ext?: string | number | null
  EmpIMG?: string | null
  detail_url?: string | null
}

const UPSTREAM_URL =
  "https://www.uttara.ac.bd/api/upload.php?action=departmentEmpList&deptCode=8"

/** Detail URLs arrive as `<a href="...">Details</a>` — extract the href. */
export function parseDetailsUrl(html: string | null | undefined): string | null {
  if (!html) return null
  const match = /href="([^"]+)"/.exec(html)
  const url = match?.[1]?.trim()
  if (!url || !/^https?:\/\//.test(url)) return null
  return url
}

function clean(value: string | number | null | undefined): string | null {
  if (value === null || value === undefined) return null
  const trimmed = String(value).trim()
  return trimmed.length > 0 ? trimmed : null
}

function toPublicMember(emp: UpstreamEmployee): FacultyMember {
  const empId = clean(emp.EmpID) ?? ""
  return {
    empId,
    name: clean(emp.EmpName) ?? "Unknown",
    designation: clean(emp.Designation) ?? "Faculty",
    education: clean(emp.Education),
    institute1: clean(emp.Institute1),
    institute2: clean(emp.Institute2),
    email: clean(emp.email),
    officeExt: clean(emp.office_ext),
    photoUrl: emp.EmpIMG ? `/api/faculty/photo/${encodeURIComponent(empId)}` : null,
    detailsUrl: parseDetailsUrl(emp.detail_url),
  }
}

async function downloadFaculty(): Promise<UpstreamEmployee[]> {
  const res = await fetch(UPSTREAM_URL, {
    // Bypass the Next data cache: the ~13MB upstream payload exceeds its
    // 2MB entry limit, so caching is handled in-memory below instead.
    cache: "no-store",
    signal: AbortSignal.timeout(20000),
  })
  if (!res.ok) {
    throw new Error(`Faculty API responded with ${res.status}`)
  }
  const json = (await res.json()) as { data?: UpstreamEmployee[] }
  if (!Array.isArray(json?.data)) {
    throw new Error("Faculty API returned an unexpected shape")
  }
  return json.data
}

// In-memory cache (1h TTL) with in-flight dedup: a single /faculty page view
// fans out to ~85 photo-proxy requests, which must share ONE upstream
// download instead of triggering ~85 concurrent 13MB fetches.
// Note: per-instance memory (like the rate-limit store) — each server
// instance holds its own copy. Fine for MVP scale.
const CACHE_TTL_MS = 60 * 60 * 1000
let listCache: { at: number; data: UpstreamEmployee[] } | null = null
let inflight: Promise<UpstreamEmployee[]> | null = null

async function fetchRawFaculty(): Promise<UpstreamEmployee[]> {
  const now = Date.now()
  if (listCache && now - listCache.at < CACHE_TTL_MS) {
    return listCache.data
  }
  if (!inflight) {
    inflight = downloadFaculty().then((data) => {
      listCache = { at: Date.now(), data }
      return data
    })
  }
  try {
    return await inflight
  } catch (error) {
    // Serve stale data rather than failing when the upstream is flaky.
    if (listCache) {
      console.warn("[faculty] Upstream refresh failed, serving stale cache")
      return listCache.data
    }
    throw error
  } finally {
    inflight = null
  }
}

/**
 * Lightweight faculty list safe to pass to client components (no image blobs).
 * Returns an empty array when the upstream API is unreachable — callers render
 * an error empty-state in that case.
 */
export async function getFacultyList(): Promise<FacultyMember[]> {
  try {
    const raw = await fetchRawFaculty()
    return raw
      .filter((emp) => clean(emp.EmpID) && clean(emp.EmpName))
      .map(toPublicMember)
  } catch (error) {
    console.error("[faculty] Failed to fetch faculty list:", error)
    return []
  }
}

/** Raw data-URL photo for one member (used by the photo proxy route). */
export async function getFacultyPhotoDataUrl(
  empId: string
): Promise<string | null> {
  try {
    const raw = await fetchRawFaculty()
    const match = raw.find((emp) => String(emp.EmpID ?? "").trim() === empId)
    const img = match?.EmpIMG?.trim()
    return img && img.startsWith("data:") ? img : null
  } catch (error) {
    console.error(`[faculty] Failed to fetch photo for ${empId}:`, error)
    return null
  }
}

/** Decode a `data:...;base64,...` URL into bytes + mime type. */
export function decodeDataUrl(dataUrl: string): { bytes: Buffer; mime: string } | null {
  const comma = dataUrl.indexOf(",")
  if (comma === -1) return null
  const base64 = dataUrl.slice(comma + 1)
  if (!base64) return null
  let bytes: Buffer
  try {
    bytes = Buffer.from(base64, "base64")
  } catch {
    return null
  }
  if (bytes.length < 4) return null
  // Sniff magic numbers — upstream labels everything image/jpg even for PNGs.
  const isPng =
    bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47
  const isJpeg = bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff
  const mime = isPng ? "image/png" : isJpeg ? "image/jpeg" : "image/jpeg"
  return { bytes, mime }
}
