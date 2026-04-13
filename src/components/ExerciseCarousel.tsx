import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

export function ExerciseCarousel({ images, name }: { images: string[]; name: string }) {
  const [i, setI] = useState(0)
  const base = import.meta.env.BASE_URL
  if (images.length === 0) {
    return <div className="aspect-video bg-muted rounded-lg flex items-center justify-center text-muted-foreground">No image</div>
  }
  return (
    <div className="relative rounded-lg overflow-hidden bg-muted">
      <img
        src={`${base}exercises/${images[i]}`}
        alt={name}
        className="w-full aspect-video object-contain"
        onError={(e) => ((e.currentTarget as HTMLImageElement).style.opacity = '0.2')}
      />
      {images.length > 1 && (
        <>
          <button
            onClick={() => setI((i - 1 + images.length) % images.length)}
            className="absolute left-2 top-1/2 -translate-y-1/2 bg-background/80 rounded-full p-2"
            aria-label="Previous"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={() => setI((i + 1) % images.length)}
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-background/80 rounded-full p-2"
            aria-label="Next"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
            {images.map((_, idx) => (
              <span key={idx} className={`h-1.5 w-1.5 rounded-full ${idx === i ? 'bg-foreground' : 'bg-foreground/30'}`} />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
