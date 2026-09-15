import { createUploadthing } from "uploadthing/next"
import { UploadThingError } from "uploadthing/server"
import type { FileRouter } from "uploadthing/server"
import type { FileSize } from "@uploadthing/shared"
import { auth } from "@/lib/auth/auth"
import { db } from "@/lib/db"
import { clubGalleryImages } from "@/lib/db/schema/club-gallery-images"
import { clubAchievements } from "@/lib/db/schema/club-achievements"
import { eq } from "drizzle-orm"

const f = createUploadthing()

// v7 SDK types maxFileSize as powers-of-2 ("8MB"/"16MB"), but its runtime
// validator accepts any `NMB` — the spec requires a 10MB cap (FR-002).
const TEN_MB = "10MB" as FileSize

export const ourFileRouter = {
  questionFile: f({
    image: { maxFileSize: TEN_MB, maxFileCount: 5 },
    pdf: { maxFileSize: TEN_MB, maxFileCount: 1 },
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

  portfolioImage: f({
    image: { maxFileSize: TEN_MB, maxFileCount: 1 },
  })
    .middleware(async () => {
      const session = await auth()
      if (!session?.user?.id) {
        throw new UploadThingError({
          code: "FORBIDDEN",
          message: "You must be logged in to upload a portfolio image.",
        })
      }
      return { uploadedBy: session.user.id }
    })
    .onUploadComplete(async () => {
      // No DB write here — persisted by portfolio server actions.
    }),

  binary26Image: f({
    image: { maxFileSize: TEN_MB, maxFileCount: 1 },
  })
    .middleware(async () => {
      const session = await auth()
      if (!session?.user?.id || session.user.role !== "admin") {
        throw new UploadThingError({
          code: "FORBIDDEN",
          message: "Only admins can upload binary 26 gallery images.",
        })
      }
      return { uploadedBy: session.user.id }
    })
    .onUploadComplete(async () => {
      // No DB write here — persisted by admin server action.
    }),

  clubImage: f({
    image: { maxFileSize: TEN_MB, maxFileCount: 1 },
  })
    .middleware(async () => {
      const session = await auth()
      if (!session?.user?.id || session.user.role !== "admin") {
        throw new UploadThingError({
          code: "FORBIDDEN",
          message: "Only admins can upload club images.",
        })
      }
      return { uploadedBy: session.user.id }
    })
    .onUploadComplete(async () => {
      // No DB write here — persisted by club server actions.
    }),

  clubGalleryImage: f({
    image: { maxFileSize: TEN_MB, maxFileCount: 5 },
  })
    .middleware(async () => {
      const session = await auth()
      if (!session?.user?.id || session.user.role !== "admin") {
        throw new UploadThingError({
          code: "FORBIDDEN",
          message: "Only admins can upload gallery images.",
        })
      }
      return { uploadedBy: session.user.id }
    })
    .onUploadComplete(async (metadata) => {
      const meta = metadata as { albumId?: string; caption?: string; displayOrder?: number; imageUrl?: string }
      if (meta.albumId && meta.imageUrl) {
        try {
          await db.insert(clubGalleryImages).values({
            albumId: meta.albumId,
            imageUrl: meta.imageUrl,
            caption: meta.caption ?? null,
            displayOrder: meta.displayOrder ?? 0,
            createdAt: new Date().toISOString(),
          })
        } catch {
          // Silently fail — persisted by server action if needed
        }
      }
    }),

  achievementImage: f({
    image: { maxFileSize: TEN_MB, maxFileCount: 1 },
  })
    .middleware(async () => {
      const session = await auth()
      if (!session?.user?.id || session.user.role !== "admin") {
        throw new UploadThingError({
          code: "FORBIDDEN",
          message: "Only admins can upload achievement images.",
        })
      }
      return { uploadedBy: session.user.id }
    })
    .onUploadComplete(async () => {
      // No DB write here — persisted by achievement server actions.
    }),
} satisfies FileRouter

export type OurFileRouter = typeof ourFileRouter
