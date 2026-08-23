import { cn } from '@/lib/utils'
import type { WorkoutSize } from '@/programs/types'

const SIZES: WorkoutSize[] = ['S', 'M', 'L']
const TITLES: Record<WorkoutSize, string> = {
  S: 'Short (~15–20 min)',
  M: 'Medium (~30–45 min)',
  L: 'Long (~60 min)',
}

/** Segmented S/M/L control for the workout bucket. */
export function WorkoutSizeControl({
  value,
  onChange,
  className,
}: {
  value: WorkoutSize
  onChange: (size: WorkoutSize) => void
  className?: string
}) {
  return (
    <div className={cn('inline-flex rounded-md border p-0.5', className)} role="group" aria-label="Workout size">
      {SIZES.map(s => (
        <button
          key={s}
          type="button"
          title={TITLES[s]}
          aria-pressed={value === s}
          onClick={() => onChange(s)}
          className={cn(
            'h-7 w-8 rounded-sm text-xs font-medium transition-colors',
            value === s ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-accent',
          )}
        >
          {s}
        </button>
      ))}
    </div>
  )
}
