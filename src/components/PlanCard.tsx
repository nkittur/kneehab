import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Check, MoreHorizontal, Repeat, SkipForward } from 'lucide-react'
import { toast } from 'sonner'
import { clearPlanDeviation, toggleSet, upsertPlanDeviation } from '@/lib/db'
import { findProtocolItem, itemName, type ResolvedEntry } from '@/lib/useDayPlan'
import type { ProtocolItem } from '@/programs/types'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'

export function PlanCard({
  entry,
  date,
  doneSets,
}: {
  entry: ResolvedEntry
  date: string
  doneSets: Set<number>
}) {
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const [swapOpen, setSwapOpen] = useState(false)
  const pressTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const item = entry.item
  const baseItemId = entry.baseItemId ?? entry.itemId
  const baseItem = findProtocolItem(entry.programId, baseItemId)
  const allDone = doneSets.size >= item.sets
  const done = entry.completedToday || allDone

  const alternateIds = baseItem?.alternates ?? []
  const alternates = alternateIds
    .map(id => findProtocolItem(entry.programId, id))
    .filter((i): i is ProtocolItem => Boolean(i))
  const swapped = Boolean(entry.baseItemId)

  function startPress() {
    pressTimer.current = setTimeout(() => setMenuOpen(true), 550)
  }
  function endPress() {
    if (pressTimer.current) clearTimeout(pressTimer.current)
  }

  async function skip() {
    setMenuOpen(false)
    await upsertPlanDeviation({
      date,
      programId: entry.programId,
      itemId: baseItemId,
      bucket: entry.bucket,
      sets: item.sets,
      targetPerSet: item.reps ?? item.durationSeconds,
      status: 'skipped',
    })
    toast('Skipped for today')
  }

  async function swapTo(targetId: string) {
    setSwapOpen(false)
    if (targetId === baseItemId) {
      await clearPlanDeviation(date, entry.programId, baseItemId)
      toast('Back to the original')
      return
    }
    const target = findProtocolItem(entry.programId, targetId)
    await upsertPlanDeviation({
      date,
      programId: entry.programId,
      itemId: baseItemId,
      bucket: entry.bucket,
      sets: target?.sets ?? item.sets,
      targetPerSet: target?.reps ?? target?.durationSeconds,
      status: 'pending',
      swappedToItemId: targetId,
    })
    toast('Swapped for today')
  }

  return (
    <Card
      className={cn(
        'gap-0 py-0 transition',
        entry.urgent && !done && 'border-l-4 border-l-amber-500',
        done && 'opacity-55',
      )}
    >
      <CardContent className="space-y-2.5 p-3">
        <div className="flex items-start gap-2">
          <button
            type="button"
            className="min-w-0 flex-1 text-left"
            onClick={() => navigate(`/exercise/${entry.programId}/${entry.itemId}`)}
            onPointerDown={startPress}
            onPointerUp={endPress}
            onPointerLeave={endPress}
          >
            <div className="flex flex-wrap items-center gap-1.5">
              {/* No program chip here: Today files every card under an area heading. */}
              <span className={cn('font-medium', done && 'line-through')}>{itemName(item)}</span>
              {entry.extra && (
                <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] leading-4 text-muted-foreground">
                  extra
                </span>
              )}
              {entry.urgent && !done && (
                <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] leading-4 font-medium text-amber-700 dark:text-amber-300">
                  urgent
                </span>
              )}
              {swapped && (
                <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] leading-4 text-muted-foreground">
                  swapped
                </span>
              )}
            </div>
            <div className="mt-0.5 text-xs text-muted-foreground">
              {item.sets} × {item.displayAmount}
              {item.load ? ` · ${item.load}` : ''}
            </div>
          </button>

          <Popover open={menuOpen} onOpenChange={setMenuOpen}>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon-sm" aria-label={`Options for ${itemName(item)}`}>
                <MoreHorizontal />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-44 p-1" align="end">
              <Button
                variant="ghost"
                className="w-full justify-start gap-2"
                disabled={alternates.length === 0 && !swapped}
                onClick={() => {
                  setMenuOpen(false)
                  setSwapOpen(true)
                }}
              >
                <Repeat /> Swap
              </Button>
              <Button variant="ghost" className="w-full justify-start gap-2" onClick={skip}>
                <SkipForward /> Skip today
              </Button>
            </PopoverContent>
          </Popover>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {Array.from({ length: item.sets }, (_, i) => i + 1).map(n => {
            const isDone = doneSets.has(n)
            return (
              <button
                key={n}
                type="button"
                aria-label={`Set ${n}${isDone ? ' done' : ''}`}
                aria-pressed={isDone}
                onClick={() => toggleSet(date, entry.itemId, n, entry.programId)}
                className={cn(
                  'flex size-9 items-center justify-center rounded-full border text-xs font-medium transition-colors',
                  isDone
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-accent',
                )}
              >
                {isDone ? <Check className="size-4" /> : n}
              </button>
            )
          })}
        </div>
      </CardContent>

      <Dialog open={swapOpen} onOpenChange={setSwapOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Swap {itemName(item)}</DialogTitle>
            <DialogDescription>Alternates from the same program, for today only.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            {swapped && baseItem && (
              <Button variant="outline" className="h-auto w-full justify-start py-2" onClick={() => swapTo(baseItemId)}>
                <span className="text-left">
                  <span className="block font-medium">{itemName(baseItem)}</span>
                  <span className="block text-xs text-muted-foreground">Back to the original</span>
                </span>
              </Button>
            )}
            {alternates.map(alt => (
              <Button
                key={alt.id}
                variant={alt.id === entry.itemId ? 'default' : 'outline'}
                className="h-auto w-full justify-start py-2"
                onClick={() => swapTo(alt.id)}
              >
                <span className="text-left">
                  <span className="block font-medium">{itemName(alt)}</span>
                  <span className="block text-xs opacity-70">
                    {alt.sets} × {alt.displayAmount}
                  </span>
                </span>
              </Button>
            ))}
            {alternates.length === 0 && (
              <div className="text-sm text-muted-foreground">No alternates authored for this item.</div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
