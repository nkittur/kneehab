import { todayISO } from '@/lib/db'
import { entryKey, useDayPlan } from '@/lib/useDayPlan'
import { APP_NAME } from '@/lib/brand'
import type { Bucket } from '@/programs/types'
import { ExerciseLibrary } from '@/components/ExerciseLibrary'
import { SuggestedToday } from '@/components/SuggestedToday'

const BUCKETS: Bucket[] = ['couch', 'quick', 'workout']

/**
 * Home. The library of everything comes first; the day's suggestion is a strip
 * on top of it, folded away unless the user asks for it.
 */
export function ExercisesPage() {
  const date = todayISO()
  const { ready, plan, browse, settings, states } = useDayPlan(date)
  if (!ready || !plan || !browse || !settings) return null

  // Which library rows wear a "today" badge.
  const todayKeys = new Set(
    BUCKETS.flatMap(bucket =>
      plan.buckets[bucket].map(entry => entryKey(entry.programId, entry.itemId)),
    ),
  )

  return (
    <div className="mx-auto max-w-md space-y-5 px-4 pb-28 pt-6">
      <header>
        <div className="text-xs uppercase tracking-wide text-muted-foreground">{APP_NAME}</div>
        <h1 className="text-2xl font-semibold">Exercises</h1>
      </header>

      <SuggestedToday date={date} plan={plan} browse={browse} settings={settings} />

      <ExerciseLibrary states={states} todayKeys={todayKeys} />
    </div>
  )
}
