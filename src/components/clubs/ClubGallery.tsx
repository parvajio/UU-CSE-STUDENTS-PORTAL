import React from "react"
import { linkifyText } from "@/lib/linkify"

interface GalleryImage {
  id: string
  imageUrl: string
  caption?: string | null
  displayOrder: number
}

interface Album {
  id: string
  title: string
  description?: string | null
  images: GalleryImage[]
}

export function ClubGallery({ albums }: { albums: Album[] }) {
  if (albums.length === 0) {
    return (
      <div className="rounded-xl border border-dashed px-4 py-8 text-center text-muted-foreground text-sm">
        No gallery albums yet.
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {albums.map((album) => (
        <div key={album.id} className="space-y-3">
          <div>
            <h3 className="font-heading text-base font-semibold text-foreground">
              {album.title}
            </h3>
            {album.description && (
              <p className="mt-0.5 text-sm text-muted-foreground">
                {linkifyText(album.description).map((node, i) => (
                  <React.Fragment key={i}>{node}</React.Fragment>
                ))}
              </p>
            )}
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {album.images.map((image) => (
              <figure
                key={image.id}
                className="group overflow-hidden rounded-xl border border-border bg-card shadow-[var(--card-shadow)]"
              >
                <div className="overflow-hidden">
                  <img
                    src={image.imageUrl}
                    alt={image.caption ?? album.title}
                    loading="lazy"
                    className="w-full h-48 object-cover transition-transform duration-200 group-hover:scale-[1.03] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
                  />
                </div>
                {image.caption && (
                  <figcaption className="px-3 py-2 text-xs text-muted-foreground">
                    {linkifyText(image.caption).map((node, i) => (
                      <React.Fragment key={i}>{node}</React.Fragment>
                    ))}
                  </figcaption>
                )}
              </figure>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
