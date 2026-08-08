import { createUploadthing } from "uploadthing/next"
import { UploadThingError } from "uploadthing/server"
import type { FileRouter } from "uploadthing/server"
import type { FileSize } from "@uploadthing/shared"
import { auth } from "@/lib/auth/auth"

const f = createUploadthing()

// v7 SDK types maxFileSize as powers-of-2 ("8MB"/"16MB"), but its runtime
// validator accepts any `NMB` — the spec requires a 10MB cap (FR-002).
const TEN_MB = "10MB" as FileSize

export const ourFileRouter = {
  questionFile: f({
    pdf: { maxFileSize: TEN_MB, maxFileCount: 1 },
    image: { maxFileSize: TEN_MB, maxFileCount: 1 },
  })
    .middleware(async () => {
      const session = await auth()
      if (!session?.user?.id) {
        throw new UploadThingError({
          code: "FORBIDDEN",
          message: "You must be logged in to upload a question paper.",
        })
      }
      return { uploadedBy: session.user.id }
    })
    .onUploadComplete(async () => {
      // No DB write here — the fileUrl is persisted by the createQuestion Server Action.
    }),
} satisfies FileRouter

export type OurFileRouter = typeof ourFileRouter
