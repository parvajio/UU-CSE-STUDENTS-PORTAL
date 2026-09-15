import { ImageIcon } from "lucide-react"

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
      <div className="text-center py-8 text-muted-foreground text-sm">
        No gallery albums yet.
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {albums.map((album) => (
        <div key={album.id} className="space-y-4">
          <h3 className="font-heading text-lg font-semibold text-foreground">
            {album.title}
          </h3>
          {album.description && (
            <p className="text-sm text-muted-foreground">{album.description}</p>
          )}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {album.images.map((image) => (
              <div
                key={image.id}
                className="rounded-xl overflow-hidden border border-border bg-muted"
              >
                <img
                  src={image.imageUrl}
                  alt={image.caption ?? album.title}
                  className="w-full h-48 object-cover"
                />
                {image.caption && (
                  <p className="p-2 text-xs text-muted-foreground">{image.caption}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
