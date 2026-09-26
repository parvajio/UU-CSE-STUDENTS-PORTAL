import { decodeDataUrl, getFacultyPhotoDataUrl } from "@/lib/faculty"

export const revalidate = 86400

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ empId: string }> }
) {
  const { empId } = await params
  if (!empId) {
    return new Response("Missing employee id", { status: 400 })
  }

  const dataUrl = await getFacultyPhotoDataUrl(empId)
  if (!dataUrl) {
    return new Response("Photo not found", { status: 404 })
  }

  const decoded = decodeDataUrl(dataUrl)
  if (!decoded) {
    return new Response("Invalid photo data", { status: 502 })
  }

  const body = new Uint8Array(decoded.bytes)
  return new Response(body, {
    status: 200,
    headers: {
      "Content-Type": decoded.mime,
      "Cache-Control": "public, max-age=86400, stale-while-revalidate=86400",
    },
  })
}
