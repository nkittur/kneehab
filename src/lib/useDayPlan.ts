import { useLiveQuery } from 'dexie-react-hooks'
import {
  bucketMinutes,
  buildBrowse,
  buildPlan,
  DEFAULT_BUDGET_MINUTES,
  type DayContext,
  type DayPlan,
  type PlanEntry,
  type PlannerHistory,
  type PlannerSettings,
} from './planner'
import { db, getSettings, type PlanItem, type SetCompletion, type Settings } from './db'
import { EXERCISES, PROGRAMS } from '@/programs'
import type { Bucket, ProgramDef, ProgramId, ProgramState, ProtocolItem } from '@/programs/types'

/** Every protocol item a program owns — phase items plus pre/postgame blocks. */
export function programItems(program: ProgramDef): ProtocolItem[] {
  return [
    ...program.phases.flatMap(p => p.items),
    ...(program.pregameItems ?? []),
    ...(program.postgameItems ?? []),
  ]
}

/** Resolve one protocol item by (program, item) id — used by swaps and the detail screen. */
export function findProtocolItem(programId: string, itemId: string): ProtocolItem | undefined {
  const program = PROGRAMS[programId as ProgramId]
  if (!program) return undefined
  return programItems(program).find(i => i.id === itemId)
}

/**
 * A plan entry after deviations. `baseItemId` is the item the planner
 * generated, kept so a swapped card still writes its deviation row against the
 * original id (and can be swapped back).
 */
export type ResolvedEntry = PlanEntry & { baseItemId?: string }

/** The plan as the user sees it: generated, then bent by today's deviations. */
export type ResolvedPlan = {
  date: string
  buckets: Record<Bucket, ResolvedEntry[]>
  /** Entries the user skipped today, per bucket — rendered as undo chips. */
  skipped: Record<Bucket, ResolvedEntry[]>
  /** Set completions for today, keyed `programId:itemId` → set numbers done. */
  doneSets: Map<string, Set<number>>
  plannedSets: number
  completedSets: number
  /** Estimated minutes per bucket, recounted after skips and swaps. */
  minutes: Record<Bucket, number>
}

export const entryKey = (programId: string, itemId: string) => `${programId}:${itemId}`

const emptyBuckets = (): Record<Bucket, ResolvedEntry[]> => ({ couch: [], quick: [], workout: [] })

/**
 * Apply the user's persisted deviations to a generated plan. Skips hide an
 * entry (and drop out of the progress denominator); swaps substitute an
 * alternate item from the same program.
 */
export function applyDeviations(
  plan: DayPlan,
  deviations: PlanItem[],
  completions: SetCompletion[],
): ResolvedPlan {
  const byKey = new Map(deviations.map(d => [entryKey(d.programId, d.itemId), d]))

  const doneSets = new Map<string, Set<number>>()
  for (const c of completions) {
    const key = entryKey(c.programId ?? 'knee', c.protocolId)
    if (!doneSets.has(key)) doneSets.set(key, new Set())
    doneSets.get(key)!.add(c.setNumber)
  }

  const buckets = emptyBuckets()
  const skipped = emptyBuckets()

  for (const bucket of Object.keys(plan.buckets) as Bucket[]) {
    for (const entry of plan.buckets[bucket]) {
      const dev = byKey.get(entryKey(entry.programId, entry.itemId))
      if (dev?.status === 'skipped') {
        skipped[bucket].push(entry)
        continue
      }
      if (dev?.swappedToItemId) {
        const alt = findProtocolItem(entry.programId, dev.swappedToItemId)
        if (alt) {
          buckets[bucket].push({
            ...entry,
            itemId: alt.id,
            item: alt,
            baseItemId: entry.itemId,
            completedToday: (doneSets.get(entryKey(entry.programId, alt.id))?.size ?? 0) > 0,
          })
          continue
        }
      }
      buckets[bucket].push(entry)
    }
  }

  let plannedSets = 0
  let completedSets = 0
  const minutes: Record<Bucket, number> = { couch: 0, quick: 0, workout: 0 }
  for (const bucket of Object.keys(buckets) as Bucket[]) {
    // Recomputed rather than taken from plan.minutes: a skip or a swap changes
    // what the bucket actually costs.
    minutes[bucket] = bucketMinutes(buckets[bucket])
    for (const entry of buckets[bucket]) {
      plannedSets += entry.item.sets
      const done = doneSets.get(entryKey(entry.programId, entry.itemId))
      if (done) completedSets += [...done].filter(n => n >= 1 && n <= entry.item.sets).length
    }
  }

  return { date: plan.date, buckets, skipped, doneSets, plannedSets, completedSets, minutes }
}

export type DayPlanQuery = {
  ready: boolean
  plan?: ResolvedPlan
  /**
   * Per bucket, the items that are legal right now but not due — the "more
   * options" list behind the Today screen's context picker. Items the user
   * skipped today are left out; everything else comes from `buildBrowse`.
   */
  browse?: Record<Bucket, PlanEntry[]>
  settings?: Settings
  states: ProgramState[]
}

const BUCKETS: Bucket[] = ['couch', 'quick', 'workout']

/**
 * The live Today plan. Every input is a Dexie live query, so ticking a set,
 * flipping the sport toggle or writing a deviation re-plans immediately. The
 * generated plan itself is never persisted.
 */
export function useDayPlan(date: string): DayPlanQuery {
  const settings = useLiveQuery(() => getSettings(), [])
  const states = useLiveQuery(() => db.programState.toArray(), [])
  const logs = useLiveQuery(() => db.dailyLogs.toArray(), [])
  const completions = useLiveQuery(() => db.setCompletions.toArray(), [])
  const deviations = useLiveQuery(() => db.planItems.where('date').equals(date).toArray(), [date])

  if (!settings || !states || !logs || !completions || !deviations) {
    return { ready: false, settings, states: states ?? [] }
  }

  const log = logs.find(l => l.date === date)
  const history: PlannerHistory = {
    completions: completions.map(c => ({
      date: c.date,
      programId: c.programId ?? 'knee',
      itemId: c.protocolId,
    })),
    sportDates: logs.filter(l => l.sportDay ?? l.isSportDay).map(l => l.date),
  }

  const plannerSettings: PlannerSettings = {
    equipment: settings.equipment,
    defaultWorkoutSize: settings.defaultWorkoutSize,
    sportDaysHint: settings.sportDaysHint,
    // Budgets are opt-in in the pure engine; the app always supplies them.
    couchBudgetMinutes: settings.couchBudgetMinutes ?? DEFAULT_BUDGET_MINUTES.couch,
    quickBudgetMinutes: settings.quickBudgetMinutes ?? DEFAULT_BUDGET_MINUTES.quick,
    workoutBudgetMinutes: settings.workoutBudgetMinutes ?? DEFAULT_BUDGET_MINUTES.workout,
    rampEnabled: settings.rampEnabled,
  }
  const context: DayContext = {
    sportToday: log?.sportDay ?? log?.isSportDay ?? false,
    workoutSize: log?.workoutSize ?? settings.defaultWorkoutSize,
  }

  const plan = buildPlan(date, PROGRAMS, states, history, plannerSettings, context)

  const skippedKeys = new Set(
    deviations.filter(d => d.status === 'skipped').map(d => entryKey(d.programId, d.itemId)),
  )
  const browse = Object.fromEntries(
    BUCKETS.map(bucket => [
      bucket,
      buildBrowse(date, PROGRAMS, states, history, plannerSettings, context, bucket).filter(
        e => !skippedKeys.has(entryKey(e.programId, e.itemId)),
      ),
    ]),
  ) as Record<Bucket, PlanEntry[]>

  const todaysCompletions = completions.filter(c => c.date === date)
  return {
    ready: true,
    plan: applyDeviations(plan, deviations, todaysCompletions),
    browse,
    settings,
    states,
  }
}

/** Display name for a protocol item (falls back to the raw exercise id). */
export function itemName(item: ProtocolItem): string {
  return EXERCISES[item.exerciseId]?.name ?? item.exerciseId
}
