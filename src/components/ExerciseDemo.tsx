import { Play } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function ExerciseDemo({ name }: { name: string }) {
  const q = encodeURIComponent(`${name} physical therapy form`)
  const href = `https://www.youtube.com/results?search_query=${q}`
  return (
    <a href={href} target="_blank" rel="noreferrer" className="block">
      <Button type="button" variant="outline" className="w-full h-14 gap-2">
        <Play className="h-5 w-5" />
        Watch demo on YouTube
      </Button>
    </a>
  )
}
