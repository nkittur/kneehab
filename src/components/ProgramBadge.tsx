import { cn } from '@/lib/utils'
import { programColor } from '@/lib/programColors'
import type { ProgramId } from '@/programs/types'

/** Small coloured chip identifying which program an item belongs to. */
export function ProgramBadge({
  programId,
  name,
  className,
}: {
  programId: ProgramId
  name: string
  className?: string
}) {
  return (
    <span
      className={cn(
        'shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium leading-4',
        programColor(programId).chip,
        className,
      )}
    >
      {name}
    </span>
  )
}
