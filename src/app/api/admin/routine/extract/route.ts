import { auth } from "@/lib/auth/auth"

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }
  if (session.user.role !== "admin" && session.user.role !== "moderator") {
    return Response.json({ error: "Forbidden: Admin or Moderator access required" }, { status: 403 })
  }

  try {
    const formData = await req.formData()
    const file = formData.get("file") as File | null

    if (!file) {
      return Response.json({ error: "No PDF file provided" }, { status: 400 })
    }

    const extractorUrl =
      process.env.ROUTINE_EXTRACTOR_URL || "https://pdf-routine-extractor.onrender.com"
    const extractorApiKey =
      process.env.ROUTINE_EXTRACTOR_API_KEY || "efb6ba21cf79b38efaccfb0f54aa4b7c859e4c1ef9c5daa8439167541df32bbc"

    const forward = new FormData()
    forward.append("file", file)

    // Ensure forward endpoint URL is clean
    const endpoint = extractorUrl.endsWith("/")
      ? `${extractorUrl}extract`
      : `${extractorUrl}/extract`

    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        "x-api-key": extractorApiKey,
        Authorization: `Bearer ${extractorApiKey}`,
      },
      body: forward,
    })

    if (!res.ok) {
      const errText = await res.text().catch(() => "Extraction failed")
      return Response.json(
        { error: `Routine extraction failed: ${res.statusText}`, details: errText },
        { status: 502 }
      )
    }

    const data = await res.json()
    // Support formats where output is array or object with sections
    const sections = Array.isArray(data)
      ? data
      : data.sections || data.routine || []

    return Response.json({ sections })
  } catch (error: unknown) {
    console.error("Error in routine extract route:", error)
    return Response.json(
      { error: error instanceof Error ? error.message : "Failed to process routine PDF" },
      { status: 500 }
    )
  }
}
