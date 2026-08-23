import { useState } from 'react'
import { Minus, Plus } from 'lucide-react'
import { upsertDailyLog, type DailyLog, type PainScores } from '@/lib/db'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Slider } from '@/components/ui/slider'
import { cn } from '@/lib/utils'
import { programColor } from '@/lib/programColors'
import type { ProgramId } from '@/programs/types'

const AREAS: { id: ProgramId; label: string }[] = [
  { id: 'knee', label: 'Knee' },
  { id: 'tibant', label: 'Shin' },
  { id: 'wrist', label: 'Wrist' },
]

function PainChip({ date, log, area }: { date: string; log?: DailyLog; area: { id: ProgramId; label: string } }) {
  const [open, setOpen] = useState(false)
  const score = log?.painScores?.[area.id]

  async function write(next: number | undefined) {
    const scores: PainScores = { ...log?.painScores }
    if (next === undefined) delete scores[area.id]
    else scores[area.id] = next
    // Knee keeps mirroring the legacy `pain` field so old charts stay honest.
    await upsertDailyLog(date, area.id === 'knee' ? { painScores: scores, pain: next ?? null } : { painScores: scores })
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            'flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
            score === undefined ? 'text-muted-foreground' : programColor(area.id).chip,
          )}
        >
          {area.label}
          <span className="tabular-nums">{score === undefined ? '–' : `${score}/10`}</span>
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-64 space-y-3" align="start">
        <div className="flex items-center justify-between">
          <div className="text-sm font-medium">{area.label} pain</div>
          <div className="text-2xl font-semibold tabular-nums">{score ?? 0}</div>
        </div>
        <Slider min={0} max={10} step={1} value={[score ?? 0]} onValueChange={([v]) => write(v)} />
        <div className="flex justify-between">
          <Button variant="ghost" size="sm" onClick={() => write(undefined)}>
            Clear
          </Button>
          <Button size="sm" onClick={() => setOpen(false)}>
            Done
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}

/** Quick symptom row: per-area pain chips plus the knee pop counter. */
export function PainChips({ date, log }: { date: string; log?: DailyLog }) {
  const pops = log?.pops ?? 0
  return (
    <div className="flex flex-wrap items-center gap-2">
      {AREAS.map(a => (
        <PainChip key={a.id} date={date} log={log} area={a} />
      ))}
      <div className="ml-auto flex items-center gap-1">
        <Button
          variant="outline"
          size="icon-sm"
          disabled={pops <= 0}
          aria-label="Remove a pop"
          onClick={() => upsertDailyLog(date, { pops: Math.max(0, pops - 1) })}
        >
          <Minus />
        </Button>
        <Button size="sm" className="gap-1" onClick={() => upsertDailyLog(date, { pops: pops + 1 })}>
          <Plus /> pop
        </Button>
        <span className="w-5 text-right text-sm tabular-nums text-muted-foreground">{pops}</span>
      </div>
    </div>
  )
}
