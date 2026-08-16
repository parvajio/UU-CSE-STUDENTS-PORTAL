"use client"

import { useState } from "react"
import Image from "next/image"
import { Sparkles, Calendar, ChevronLeft, ChevronRight, Image as ImageIcon } from "lucide-react"

interface GalleryItem {
  id: string
  title: string
  imageUrl: string
  year: string
  description: string | null
}

interface Binary26GalleryProps {
  items: GalleryItem[]
}

export function Binary26Gallery({ items }: Binary26GalleryProps) {
  const [currentIndex, setCurrentIndex] = useState(0)

  if (!items || items.length === 0) {
    return (
      <div className="bg-surface border border-border rounded-2xl p-12 text-center space-y-3">
        <div className="w-12 h-12 rounded-full bg-primary/10 text-primary mx-auto flex items-center justify-center">
          <ImageIcon className="w-6 h-6" />
        </div>
        <h4 className="text-lg font-heading font-semibold text-foreground">Previous Binary Clicks</h4>
        <p className="text-sm text-muted-foreground">Admin has not added previous binary clicks yet.</p>
      </div>
    )
  }

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev === 0 ? items.length - 1 : prev - 1))
  }

  const handleNext = () => {
    setCurrentIndex((prev) => (prev === items.length - 1 ? 0 : prev + 1))
  }

  const current = items[currentIndex]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Memories</span>
          </div>
          <h3 className="text-2xl font-heading font-bold text-foreground">
            Previous Binary Clicks Gallery
          </h3>
          <p className="text-sm text-muted-foreground">
            Relive the greatest moments from past Binary events.
          </p>
        </div>

        {items.length > 1 && (
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrev}
              className="p-2.5 rounded-xl bg-surface border border-border hover:bg-accent hover:text-accent-foreground transition-all text-foreground"
              aria-label="Previous image"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={handleNext}
              className="p-2.5 rounded-xl bg-surface border border-border hover:bg-accent hover:text-accent-foreground transition-all text-foreground"
              aria-label="Next image"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>

      {/* Main Carousel Card */}
      <div className="relative overflow-hidden rounded-2xl bg-surface border border-border shadow-lg group">
        <div className="relative aspect-video w-full bg-muted overflow-hidden">
          <img
            src={current.imageUrl}
            alt={current.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
          
          <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8 text-white space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/30 backdrop-blur-md text-primary-foreground text-xs font-semibold border border-primary/40">
              <Calendar className="w-3.5 h-3.5" />
              <span>Binary {current.year}</span>
            </div>
            <h4 className="text-xl md:text-2xl font-heading font-bold">{current.title}</h4>
            {current.description && (
              <p className="text-sm text-gray-200 line-clamp-2 max-w-2xl">{current.description}</p>
            )}
          </div>
        </div>
      </div>

      {/* Thumbnail Bar */}
      {items.length > 1 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
          {items.map((item, idx) => (
            <button
              key={item.id}
              onClick={() => setCurrentIndex(idx)}
              className={`relative aspect-video rounded-xl overflow-hidden border-2 transition-all ${
                currentIndex === idx ? "border-primary ring-2 ring-primary/30 scale-105" : "border-border opacity-70 hover:opacity-100"
              }`}
            >
              <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover" />
              <div className="absolute bottom-0 inset-x-0 bg-black/60 p-1 text-[10px] text-white text-center truncate font-medium">
                {item.title}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
