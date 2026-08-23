import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { ChevronDown, Undo2 } from 'lucide-react'
import { clearPlanDeviation, db, todayISO, upsertDailyLog } from '@/lib/db'
import type { PlanEntry } from '@/lib/planner'
import { entryKey, itemName, useDayPlan } from '@/lib/useDayPlan'
import { APP_NAME } from '@/lib/brand'
import type { Bucket, WorkoutSize } from '@/programs/types'
import { ProgressRing } from '@/components/ProgressRing'
import { PainChips } from '@/components/PainChips'
import { PlanCard } from '@/components/PlanCard'
import { WorkoutSizeControl } from '@/components/WorkoutSizeControl'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'

const SECTIONS: { bucket: Bucket; title: string; emoji: string; hint: string }[] = [
  { bucket: 'couch', title: 'Couch', emoji: '🛋', hint: 'TV-safe, no sweat' },
  { bucket: 'quick', title: 'Quick', emoji: '⚡', hint: '2–10 min' },
  { bucket: 'workout', title: 'Workout', emoji: '🏋', hint: "today's main block" },
]

/** "Where am I right now?" — All, or one bucket at a time. */
type View = 'all' | Bucket

const VIEWS: { id: View; label: string }[] = [
  { id: 'all', label: 'All' },
  ...SECTIONS.map(s => ({ id: s.bucket as View, label: s.title })),
]

const SPORTS = [
  { id: 'basketball', label: '🏀 Basketball' },
  { id: 'pickleball', label: '🥒 Pickleball' },
] as const

function ContextPicker({ value, onChange }: { value: View; onChange: (v: View) => void }) {
  return (
    <div
      className="sticky top-0 z-20 -mx-4 border-b bg-background/95 px-4 py-2 backdrop-blur"
      role="group"
      aria-label="Where am I"
    >
      <div className="inline-flex w-full rounded-md border p-0.5">
        {VIEWS.map(v => (
          <button
            key={v.id}
            type="button"
            aria-pressed={value === v.id}
            onClick={() => onChange(v.id)}
            className={cn(
              'flex-1 rounded-sm px-2 py-1.5 text-xs font-medium transition-colors',
              value === v.id ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-accent',
            )}
          >
            {v.label}
          </button>
        ))}
      </div>
    </div>
  )
}

/** Collapsed-by-default list of items that are legal now but not due. */
function MoreOptions({
  title,
  entries,
  date,
  doneSets,
}: {
  title: string
  entries: PlanEntry[]
  date: string
  doneSets: Map<string, Set<number>>
}) {
  const [open, setOpen] = useState(false)
  if (entries.length === 0) return null

  return (
    <div className="space-y-2 pt-1">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen(o => !o)}
        className="flex w-full items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground"
      >
        <ChevronDown className={cn('size-3.5 transition-transform', open && 'rotate-180')} />
        More {title.toLowerCase()} options ({entries.length})
      </button>
      {open &&
        entries.map(entry => (
          <PlanCard
            key={entryKey(entry.programId, entry.itemId)}
            entry={entry}
            date={date}
            doneSets={doneSets.get(entryKey(entry.programId, entry.itemId)) ?? new Set()}
          />
        ))}
    </div>
  )
}

function SportDayToggle({ date, sport, on }: { date: string; sport?: string | null; on: boolean }) {
  const [open, setOpen] = useState(false)

  async function pick(next: 'basketball' | 'pickleball' | null) {
    setOpen(false)
    await upsertDailyLog(date, {
      mode: next ? 'sport' : 'rehab',
      isSportDay: Boolean(next),
      sportDay: Boolean(next),
      sport: next,
    })
  }

  const label = on ? (SPORTS.find(s => s.id === sport)?.label ?? '🏅 Sport day') : 'Sport day off'

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant={on ? 'default' : 'outline'} size="sm">
          {label}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-48 space-y-1 p-1" align="end">
        {SPORTS.map(s => (
          <Button
            key={s.id}
            variant={on && sport === s.id ? 'secondary' : 'ghost'}
            className="w-full justify-start"
            onClick={() => pick(s.id)}
          >
            {s.label}
          </Button>
        ))}
        <Button variant={on ? 'ghost' : 'secondary'} className="w-full justify-start" onClick={() => pick(null)}>
          No sport today
        </Button>
      </PopoverContent>
    </Popover>
  )
}

export function Today() {
  const date = todayISO()
  const log = useLiveQuery(() => db.dailyLogs.get(date), [date])
  const { ready, plan, browse, settings } = useDayPlan(date)
  // Where the user is right now. Deliberately component state only: the pick is
  // a passing fact about the next ten minutes, not something to persist.
  const [view, setView] = useState<View>('all')

  if (!ready || !plan || !browse || !settings) return null

  const sportOn = log?.sportDay ?? log?.isSportDay ?? false
  const size: WorkoutSize = log?.workoutSize ?? settings.defaultWorkoutSize ?? 'M'
  const pct = plan.plannedSets ? (plan.completedSets / plan.plannedSets) * 100 : 0
  const heading = new Date(date + 'T00:00:00').toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })
  // In All, empty sections are hidden. Picking a context always shows that one
  // section, so its "more options" list stays reachable on a quiet day.
  const visible =
    view === 'all'
      ? SECTIONS.filter(s => plan.buckets[s.bucket].length > 0 || plan.skipped[s.bucket].length > 0)
      : SECTIONS.filter(s => s.bucket === view)
  const nothingPlanned = plan.plannedSets === 0
  const allDone = !nothingPlanned && plan.completedSets >= plan.plannedSets

  return (
    <div className="mx-auto max-w-md space-y-5 px-4 pb-28 pt-6">
      <header className="flex items-start justify-between gap-3">
        <div>
          <div className="text-xs uppercase tracking-wide text-muted-foreground">{APP_NAME}</div>
          <h1 className="text-2xl font-semibold">{heading}</h1>
        </div>
        <SportDayToggle date={date} sport={log?.sport} on={sportOn} />
      </header>

      <ContextPicker value={view} onChange={setView} />

      <div className="flex items-center gap-4">
        <ProgressRing value={pct} size={96} label={`${plan.completedSets}/${plan.plannedSets} sets`} />
        <div className="flex-1 space-y-2">
          <div className="text-sm font-medium">
            {allDone ? 'Done for today 🎉' : nothingPlanned ? 'Nothing scheduled' : 'Sets planned today'}
          </div>
          <p className="text-xs text-muted-foreground">
            {allDone
              ? 'Everything on the plan is ticked. Rest is training too.'
              : nothingPlanned
                ? 'Every program is paused or resting today.'
                : 'Skipped items are left out of the total.'}
          </p>
        </div>
      </div>

      <Card>
        <CardContent className="p-3">
          <PainChips date={date} log={log} />
        </CardContent>
      </Card>

      {visible.map(section => {
        const entries = plan.buckets[section.bucket]
        const skipped = plan.skipped[section.bucket]
        return (
          <section key={section.bucket} className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-baseline gap-2">
                <span className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
                  {section.emoji} {section.title}
                </span>
                <span className="text-xs text-muted-foreground">{section.hint}</span>
              </div>
              {section.bucket === 'workout' && (
                <WorkoutSizeControl value={size} onChange={s => upsertDailyLog(date, { workoutSize: s })} />
              )}
            </div>

            {entries.map(entry => (
              <PlanCard
                key={entryKey(entry.programId, entry.baseItemId ?? entry.itemId)}
                entry={entry}
                date={date}
                doneSets={plan.doneSets.get(entryKey(entry.programId, entry.itemId)) ?? new Set()}
              />
            ))}

            {view !== 'all' && entries.length === 0 && (
              <p className="text-sm text-muted-foreground">
                Nothing due here right now — browse the options below if you want more.
              </p>
            )}

            {skipped.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-0.5">
                {skipped.map(entry => (
                  <button
                    key={entryKey(entry.programId, entry.itemId)}
                    type="button"
                    onClick={() => clearPlanDeviation(date, entry.programId, entry.itemId)}
                    className={cn(
                      'inline-flex items-center gap-1 rounded-full border border-dashed px-2.5 py-1',
                      'text-[11px] text-muted-foreground hover:bg-accent',
                    )}
                  >
                    <Undo2 className="size-3" />
                    {itemName(entry.item)} · skipped
                  </button>
                ))}
              </div>
            )}

            {view !== 'all' && (
              <MoreOptions
                title={section.title}
                entries={browse[section.bucket]}
                date={date}
                doneSets={plan.doneSets}
              />
            )}
          </section>
        )
      })}

      {visible.length === 0 && (
        <Card>
          <CardContent className="p-6 text-center text-sm text-muted-foreground">
            No items scheduled today. Check the Programs tab — a program may be paused.
          </CardContent>
        </Card>
      )}
    </div>
  )
}
