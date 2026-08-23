import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { Undo2 } from 'lucide-react'
import { clearPlanDeviation, db, todayISO, upsertDailyLog } from '@/lib/db'
import { entryKey, itemName, useDayPlan, type ResolvedEntry } from '@/lib/useDayPlan'
import { APP_NAME } from '@/lib/brand'
import { areaLabel, programColor } from '@/lib/programColors'
import type { Bucket, ProgramId, WorkoutSize } from '@/programs/types'
import { ProgressRing } from '@/components/ProgressRing'
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

/** Cards for one area (program) inside a location, already in the order to do them. */
type AreaGroup = { programId: ProgramId; label: string; entries: ResolvedEntry[] }

/** Everything ticked off for today — same rule the card itself uses to dim. */
function isFinished(entry: ResolvedEntry, doneSets: Map<string, Set<number>>): boolean {
  const done = doneSets.get(entryKey(entry.programId, entry.itemId))
  return entry.completedToday || (done?.size ?? 0) >= entry.item.sets
}

/**
 * Order inside an area: what to do next first (urgent ahead of the rest),
 * then work already finished today, then extras that were never due.
 */
function rankOf(entry: ResolvedEntry, doneSets: Map<string, Set<number>>): number {
  if (entry.extra) return 3
  if (isFinished(entry, doneSets)) return 2
  return entry.urgent ? 0 : 1
}

/**
 * Split a location's cards by what they help. Groups follow program priority
 * (the acute rehab leads); inside a group, authored order breaks rank ties.
 */
function groupByArea(entries: ResolvedEntry[], doneSets: Map<string, Set<number>>): AreaGroup[] {
  const byProgram = new Map<ProgramId, { priority: number; name: string; entries: ResolvedEntry[] }>()
  for (const entry of entries) {
    const group =
      byProgram.get(entry.programId) ?? { priority: entry.priority, name: entry.programName, entries: [] }
    group.entries.push(entry)
    byProgram.set(entry.programId, group)
  }

  return [...byProgram]
    .sort((a, b) => a[1].priority - b[1].priority)
    .map(([programId, group]) => ({
      programId,
      label: areaLabel(programId, group.name),
      entries: group.entries
        .map((entry, i) => ({ entry, i, rank: rankOf(entry, doneSets) }))
        .sort((a, b) => a.rank - b.rank || a.i - b.i)
        .map(x => x.entry),
    }))
}

/** Small coloured label naming what this handful of cards helps. */
function AreaHeader({ programId, label }: { programId: ProgramId; label: string }) {
  return (
    <div className="flex items-center gap-2 pt-1">
      <span
        className={cn(
          'rounded-full px-2 py-0.5 text-[11px] font-medium leading-4',
          programColor(programId).chip,
        )}
      >
        {label}
      </span>
      <span className="h-px flex-1 bg-border" />
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
  // section, so everything doable there stays reachable on a quiet day.
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

      {visible.map(section => {
        const entries = plan.buckets[section.bucket]
        const skipped = plan.skipped[section.bucket]
        // A location view shows everything you could do there, extras included
        // and filed under their area. All is the day's plan, so extras stay out.
        const planned = new Set(entries.map(e => entryKey(e.programId, e.itemId)))
        const extras =
          view === 'all'
            ? []
            : browse[section.bucket].filter(e => !planned.has(entryKey(e.programId, e.itemId)))
        const groups = groupByArea([...entries, ...extras], plan.doneSets)
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

            {groups.map(group => (
              <div key={group.programId} className="space-y-2">
                <AreaHeader programId={group.programId} label={group.label} />
                {group.entries.map(entry => (
                  <PlanCard
                    key={entryKey(entry.programId, entry.baseItemId ?? entry.itemId)}
                    entry={entry}
                    date={date}
                    doneSets={plan.doneSets.get(entryKey(entry.programId, entry.itemId)) ?? new Set()}
                  />
                ))}
              </div>
            ))}

            {view !== 'all' && groups.length === 0 && (
              <p className="text-sm text-muted-foreground">Nothing you can do here right now.</p>
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
