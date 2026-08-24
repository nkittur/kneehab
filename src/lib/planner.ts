import type {
  Bucket,
  PartialProgramRegistry,
  ProgramId,
  ProgramState,
  ProtocolItem,
  Tissue,
  WorkoutSize,
} from '../programs/types'

/**
 * The daily plan engine. Pure and unit-tested — no Dexie, no React, no clock:
 * every decision is a function of the arguments, and `date` is always passed in.
 *
 * The sequencing rules come from `docs/research/durability-cardio.md` §2
 * (R1–R27); the subset that the type system can express is implemented here.
 */

export type PlanEntry = {
  programId: ProgramId
  programName: string
  /** Program priority, copied through so the UI can group without a lookup. */
  priority: number
  itemId: string
  item: ProtocolItem
  bucket: Bucket
  /** True when the item was already completed today — shown ticked, not hidden. */
  completedToday: boolean
  /** True when the entry comes from `buildBrowse`: legal to do now, but not due. */
  extra?: boolean
  /** True when the item's remaining weekly quota needs every legal day that is left. */
  urgent: boolean
}

export type DayPlan = {
  date: string // YYYY-MM-DD
  buckets: Record<Bucket, PlanEntry[]>
  /** Estimated minutes of work planned in each bucket (see `estimateMinutes`). */
  minutes: Record<Bucket, number>
}

/** One recorded completion of a protocol item. */
export type CompletionRecord = {
  date: string // YYYY-MM-DD
  programId: ProgramId
  itemId: string
}

export type PlannerHistory = {
  completions: CompletionRecord[]
  /** YYYY-MM-DD days sport was actually played (or is firmly planned). */
  sportDates?: string[]
}

export type PlannerSettings = {
  /** 0 = Sunday … 6 = Saturday. Defaults to Monday. */
  weekStartsOn?: number
  equipment?: string[]
  defaultWorkoutSize?: WorkoutSize
  /** Weekdays (0 = Sunday) the user usually plays sport. */
  sportDaysHint?: number[]
  /** Minutes the user has for couch work on a normal day. */
  couchBudgetMinutes?: number
  /** Minutes for the standing odds and ends. */
  quickBudgetMinutes?: number
  /** Minutes for the day's workout / cardio block. */
  workoutBudgetMinutes?: number
  /** Ramp the budgets down for the first three weeks. Defaults to on. */
  rampEnabled?: boolean
}

/** What the caller knows about *this* day that history cannot tell us. */
export type DayContext = {
  /** Sport is being played today. Falls back to `history.sportDates`. */
  sportToday?: boolean
  /** Sport tomorrow. Falls back to sportDates / `settings.sportDaysHint`. */
  sportTomorrow?: boolean
  /** The user's pick for today; defaults to `settings.defaultWorkoutSize ?? 'M'`. */
  workoutSize?: WorkoutSize
}

const DEFAULT_WEEK_STARTS_ON = 1 // Monday

/** Recovery gap assumed for a hard item that does not declare one (R7: 48h). */
export const DEFAULT_HARD_SPACING_DAYS = 2

/** R2 — hard days are capped at 4 per week. */
export const HARD_DAYS_PER_WEEK = 4

/** R4 — tissues that make a hard item illegal the day before sport. */
export const LOWER_BODY_TISSUES: readonly Tissue[] = [
  'quads',
  'hamstrings',
  'glutes',
  'achilles-calf',
  'patellar-tendon',
  'tibant-tendon',
]

/** R1 — what a sport session loads hard, for spacing purposes. */
export const SPORT_TISSUES: readonly Tissue[] = ['quads', 'achilles-calf', 'patellar-tendon']

const DEFAULT_WORKOUT_SIZE: WorkoutSize = 'M'

function isoOf(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function utcMs(dateISO: string): number {
  const [y, m, d] = dateISO.split('-').map(Number)
  return Date.UTC(y, m - 1, d)
}

/** Whole days from `from` to `to`; negative when `to` is earlier. */
export function daysBetween(from: string, to: string): number {
  return Math.round((utcMs(to) - utcMs(from)) / 86_400_000)
}

/** `dateISO` shifted by `n` days, as YYYY-MM-DD. */
export function addDays(dateISO: string, n: number): string {
  const d = new Date(dateISO + 'T00:00:00')
  d.setDate(d.getDate() + n)
  return isoOf(d)
}

/** 0 = Sunday … 6 = Saturday. */
export function dayOfWeek(dateISO: string): number {
  return new Date(dateISO + 'T00:00:00').getDay()
}

/** First day of the week containing `dateISO`, as YYYY-MM-DD. */
export function weekOf(dateISO: string, weekStartsOn = DEFAULT_WEEK_STARTS_ON): string {
  const d = new Date(dateISO + 'T00:00:00')
  const offset = (d.getDay() - weekStartsOn + 7) % 7
  d.setDate(d.getDate() - offset)
  return isoOf(d)
}

/** Last day of the week containing `dateISO`. */
export function weekEndOf(dateISO: string, weekStartsOn = DEFAULT_WEEK_STARTS_ON): string {
  return addDays(weekOf(dateISO, weekStartsOn), 6)
}

/**
 * How many distinct days this week the item was completed. Multiple set
 * completions on the same day count once — frequency is measured in sessions.
 * Pass `excludeDate` to leave a day (normally "today") out of the count, so an
 * item finished today still shows on today's plan instead of vanishing.
 */
export function countCompletionsThisWeek(
  history: PlannerHistory,
  programId: ProgramId,
  itemId: string,
  dateISO: string,
  weekStartsOn = DEFAULT_WEEK_STARTS_ON,
  excludeDate?: string,
): number {
  const week = weekOf(dateISO, weekStartsOn)
  const days = new Set<string>()
  for (const c of history.completions) {
    if (c.programId !== programId || c.itemId !== itemId) continue
    if (c.date === excludeDate) continue
    if (weekOf(c.date, weekStartsOn) !== week) continue
    days.add(c.date)
  }
  return days.size
}

/** Is this item's weekly frequency still unsatisfied? */
export function isFrequencySatisfiable(item: ProtocolItem, doneThisWeek: number): boolean {
  if (item.frequency.perWeek === 'daily') return true
  return doneThisWeek < item.frequency.perWeek
}

/** Items default to 'easy' (see ProtocolItem.intensity). */
export function isHard(item: ProtocolItem): boolean {
  return item.intensity === 'hard'
}

function spacingOf(item: ProtocolItem): number {
  return item.minSpacingDays ?? DEFAULT_HARD_SPACING_DAYS
}

function overlaps(a: readonly Tissue[] | undefined, b: readonly Tissue[] | undefined): boolean {
  if (!a?.length || !b?.length) return false
  return a.some(t => b.includes(t))
}

/** Every protocol item in the registry — phase items plus pre/postgame blocks. */
export type ItemIndex = Map<string, ProtocolItem>

const indexKey = (programId: ProgramId, itemId: string) => `${programId}:${itemId}`

export function indexItems(registry: PartialProgramRegistry): ItemIndex {
  const index: ItemIndex = new Map()
  for (const program of Object.values(registry)) {
    if (!program) continue
    const all = [
      ...program.phases.flatMap(p => p.items),
      ...(program.pregameItems ?? []),
      ...(program.postgameItems ?? []),
    ]
    for (const item of all) index.set(indexKey(program.id, item.id), item)
  }
  return index
}

/** A past hard session, as far as tissue recovery is concerned. */
export type HardLoad = {
  date: string
  tissues: readonly Tissue[]
  minSpacingDays: number
  source: 'item' | 'sport'
}

/**
 * Hard loads grouped by tissue, newest first. Completions of unknown items and
 * of easy items are ignored; sport days count as hard load on SPORT_TISSUES.
 */
export function hardLoadsByTissue(
  history: PlannerHistory,
  registry: PartialProgramRegistry | ItemIndex,
): Partial<Record<Tissue, HardLoad[]>> {
  const index = registry instanceof Map ? registry : indexItems(registry)
  const loads: HardLoad[] = []

  for (const c of history.completions) {
    const item = index.get(indexKey(c.programId, c.itemId))
    if (!item || !isHard(item) || !item.tissues?.length) continue
    loads.push({ date: c.date, tissues: item.tissues, minSpacingDays: spacingOf(item), source: 'item' })
  }
  for (const date of history.sportDates ?? []) {
    loads.push({ date, tissues: SPORT_TISSUES, minSpacingDays: DEFAULT_HARD_SPACING_DAYS, source: 'sport' })
  }

  loads.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0))
  const byTissue: Partial<Record<Tissue, HardLoad[]>> = {}
  for (const load of loads) {
    for (const tissue of load.tissues) (byTissue[tissue] ??= []).push(load)
  }
  return byTissue
}

/** The most recent hard load on each tissue — handy for "last quad day" UI. */
export function lastHardLoadByTissue(
  history: PlannerHistory,
  registry: PartialProgramRegistry | ItemIndex,
): Partial<Record<Tissue, HardLoad>> {
  const byTissue = hardLoadsByTissue(history, registry)
  const last: Partial<Record<Tissue, HardLoad>> = {}
  for (const [tissue, loads] of Object.entries(byTissue) as [Tissue, HardLoad[]][]) {
    if (loads.length) last[tissue] = loads[0]
  }
  return last
}

/**
 * R7 — same-tissue recovery spacing. A hard item is blocked when any hard load
 * on a tissue it shares happened less than `max(both minSpacingDays)` days ago.
 * Easy items, and items that declare no tissues, are never blocked. Loads dated
 * today (or later) do not block: finishing an item must not hide it.
 */
export function isSpacingBlocked(
  item: ProtocolItem,
  byTissue: Partial<Record<Tissue, HardLoad[]>>,
  dateISO: string,
): boolean {
  if (!isHard(item) || !item.tissues?.length) return false
  for (const tissue of item.tissues) {
    for (const load of byTissue[tissue] ?? []) {
      const gap = daysBetween(load.date, dateISO)
      if (gap <= 0) continue
      const required = Math.max(spacingOf(item), load.minSpacingDays)
      if (gap < required) return true
    }
  }
  return false
}

/** Days this week carrying hard load: a hard completion, or a sport day. */
export function hardDaysThisWeek(
  history: PlannerHistory,
  registry: PartialProgramRegistry | ItemIndex,
  dateISO: string,
  weekStartsOn = DEFAULT_WEEK_STARTS_ON,
): string[] {
  const index = registry instanceof Map ? registry : indexItems(registry)
  const week = weekOf(dateISO, weekStartsOn)
  const days = new Set<string>()
  for (const c of history.completions) {
    if (weekOf(c.date, weekStartsOn) !== week) continue
    const item = index.get(indexKey(c.programId, c.itemId))
    if (item && isHard(item)) days.add(c.date)
  }
  for (const date of history.sportDates ?? []) {
    if (weekOf(date, weekStartsOn) === week) days.add(date)
  }
  return [...days].sort()
}

/**
 * R2 — would planning hard work today push the week past HARD_DAYS_PER_WEEK
 * hard days? A day that is *already* hard (sport today, or a hard item logged
 * today) costs nothing extra, so only a fresh hard day can hit the cap.
 */
export function isHardDayCapReached(
  history: PlannerHistory,
  registry: PartialProgramRegistry | ItemIndex,
  dateISO: string,
  settings: PlannerSettings = {},
  context: DayContext = {},
): boolean {
  const weekStartsOn = settings.weekStartsOn ?? DEFAULT_WEEK_STARTS_ON
  const days = hardDaysThisWeek(history, registry, dateISO, weekStartsOn)
  const todayIsHard = days.includes(dateISO) || context.sportToday === true
  if (todayIsHard) return false
  return days.filter(d => d !== dateISO).length >= HARD_DAYS_PER_WEEK
}

/** Sport on this day, from recorded/planned dates or the weekday hint. */
export function isPlannedSportDay(
  dateISO: string,
  history: PlannerHistory,
  settings: PlannerSettings = {},
): boolean {
  if (history.sportDates?.includes(dateISO)) return true
  return settings.sportDaysHint?.includes(dayOfWeek(dateISO)) ?? false
}

/**
 * Cross-program phase gate. An item carrying `requiresPhase` is only planned
 * once the named program has reached (or passed) that phase — the way an
 * impact-loading cardio item waits on the acute tibialis rehab.
 *
 * The gate **fails open**: an unregistered program, a program with no state, a
 * paused program, or a phase id that does not resolve all count as met. The
 * gate exists to protect a rehab that is actually running; a missing program
 * must never brick the cardio block.
 */
export function isPhaseGateMet(
  item: ProtocolItem,
  states: ProgramState[],
  registry: PartialProgramRegistry,
): boolean {
  const gate = item.requiresPhase
  if (!gate) return true

  const state = states.find(s => s.programId === gate.programId)
  if (!state || state.paused) return true

  const program = registry[gate.programId]
  if (!program) return true

  const requiredIndex = program.phases.findIndex(p => p.id === gate.phaseId)
  const currentIndex = program.phases.findIndex(p => p.id === state.phase)
  if (requiredIndex < 0 || currentIndex < 0) return true

  return currentIndex >= requiredIndex
}

/** R4 — is this item illegal on a day whose *next* day is a sport day? */
export function isDayBeforeSportBlocked(item: ProtocolItem): boolean {
  return isHard(item) && overlaps(item.tissues, LOWER_BODY_TISSUES)
}

/**
 * Days left this week on which the item could legally be done, today included.
 * Tomorrow drops out when R4 bars the item there (i.e. sport the day after).
 * Nothing is ever *forced* onto an illegal day — this only feeds urgency.
 */
export function remainingLegalDays(
  item: ProtocolItem,
  dateISO: string,
  history: PlannerHistory,
  settings: PlannerSettings = {},
): number {
  const weekStartsOn = settings.weekStartsOn ?? DEFAULT_WEEK_STARTS_ON
  const weekEnd = weekEndOf(dateISO, weekStartsOn)
  let days = daysBetween(dateISO, weekEnd) + 1
  if (days <= 0) return 0
  const tomorrow = addDays(dateISO, 1)
  if (
    daysBetween(tomorrow, weekEnd) >= 0 &&
    isDayBeforeSportBlocked(item) &&
    isPlannedSportDay(addDays(dateISO, 2), history, settings)
  ) {
    days -= 1
  }
  return days
}

/**
 * Rebalancing signal: a perWeek item whose outstanding quota needs every legal
 * day that is left. Daily items are never urgent (they have no backlog).
 */
export function isUrgent(
  item: ProtocolItem,
  remainingQuota: number,
  dateISO: string,
  history: PlannerHistory,
  settings: PlannerSettings = {},
): boolean {
  if (item.frequency.perWeek === 'daily') return false
  if (remainingQuota <= 0) return false
  return remainingQuota >= remainingLegalDays(item, dateISO, history, settings)
}

// ── Time budget ───────────────────────────────────────────────────────
//
// The day has a shape: roughly half an hour on the couch, ten standing
// minutes, half an hour for a workout. Everything below turns that into a
// filter, so the plan is what actually fits rather than everything that is
// legal (day one, unbudgeted, offered ~200 sets).

/** Seconds a rep takes, averaged over tempo work and quick reps alike. */
const SECONDS_PER_REP = 4
/** Reps assumed for an item that measures neither reps nor seconds. */
const DEFAULT_REPS = 10
/** Rest between sets of the same item. */
const REST_SECONDS = 30
/** Finding the band, getting into position, putting it away. */
const SETUP_SECONDS = 20
/** A set this long *is* the session (cardio block, court time). */
export const LONG_SET_SECONDS = 300
/** Setup for one of those — kit on, out of the door. */
const LONG_SESSION_SETUP_SECONDS = 60

/**
 * How long an item takes, in minutes. Deliberately crude: a rep costs 4s, a
 * timed set costs its seconds, sets are separated by 30s of rest, and the item
 * as a whole carries 20s of setup. Long sets (≥ `LONG_SET_SECONDS` — a 40 min
 * Zone 2 ride, an hour on court) are counted as their own duration plus one
 * minute of setup: nobody rests between two halves of a bike session.
 *
 * Rounded up to the nearest half minute. It is an estimate for budgeting, not
 * a stopwatch; the point is that 5×45s isometrics and 3×8 squats stop looking
 * like the same amount of day.
 */
export function estimateMinutes(item: ProtocolItem): number {
  const sets = Math.max(1, item.sets)
  const perSet = item.durationSeconds ?? (item.reps ?? DEFAULT_REPS) * SECONDS_PER_REP
  const seconds =
    item.durationSeconds !== undefined && item.durationSeconds >= LONG_SET_SECONDS
      ? sets * item.durationSeconds + LONG_SESSION_SETUP_SECONDS
      : sets * perSet + REST_SECONDS * (sets - 1) + SETUP_SECONDS
  return Math.ceil((seconds / 60) * 2) / 2
}

/** Estimated minutes for a list of entries. */
export function bucketMinutes(entries: readonly PlanEntry[]): number {
  return entries.reduce((total, entry) => total + estimateMinutes(entry.item), 0)
}

/**
 * Default minutes per bucket — the user's real daily windows. Applied by the
 * app layer (`useDayPlan`); the pure engine trims only when a budget is passed.
 */
export const DEFAULT_BUDGET_MINUTES: Record<Bucket, number> = { couch: 30, quick: 10, workout: 30 }

/** Which setting overrides each bucket's default budget. */
const BUDGET_SETTING = {
  couch: 'couchBudgetMinutes',
  quick: 'quickBudgetMinutes',
  workout: 'workoutBudgetMinutes',
} as const satisfies Record<Bucket, keyof PlannerSettings>

/**
 * Programs whose items are never trimmed by the time budget. The acute shin
 * rehab is the reason the app exists; it comes off the top of the day.
 */
export const ALWAYS_PLANNED_PROGRAMS: readonly ProgramId[] = ['tibant']

/** Ramp thresholds: days since the first completion → share of the budget. */
const RAMP_STEPS: readonly { days: number; factor: number }[] = [
  { days: 21, factor: 1 },
  { days: 14, factor: 0.9 },
  { days: 7, factor: 0.75 },
  { days: 0, factor: 0.6 },
]

/** A layoff this long restarts the ramp from the beginning. */
export const RAMP_RESTART_GAP_DAYS = 14

/**
 * How much of the daily budget is available on `date`, as a fraction.
 *
 * Weeks one, two and three run at 0.6 / 0.75 / 0.9 of the budget and week four
 * onwards at full. Day zero is the user's **first ever completion** (no
 * history at all also reads as day zero — a new user starts light). Coming
 * back from a layoff of `RAMP_RESTART_GAP_DAYS` or more restarts the ramp.
 *
 * `states` is consulted only to ignore paused programs: history from a program
 * the user has parked should not hold the ramp open for the rest.
 */
export function rampFactor(
  dateISO: string,
  history: PlannerHistory,
  states: ProgramState[] = [],
): number {
  const paused = new Set(states.filter(s => s.paused).map(s => s.programId))
  const dates = history.completions
    .filter(c => !paused.has(c.programId) && c.date <= dateISO)
    .map(c => c.date)
    .sort()
  if (!dates.length) return 0.6

  if (daysBetween(dates[dates.length - 1], dateISO) >= RAMP_RESTART_GAP_DAYS) return 0.6

  const days = daysBetween(dates[0], dateISO)
  return RAMP_STEPS.find(step => days >= step.days)?.factor ?? 0.6
}

/**
 * Fill one bucket up to `budgetMinutes`, in the order given (already
 * priority → urgency). Items are kept whole: the first item that does not fit
 * ends the bucket, and everything after it is returned as `trimmed`.
 *
 * Two things never count as trimmable — items from `ALWAYS_PLANNED_PROGRAMS`
 * and work already completed today — and their minutes are charged to the
 * budget first, so what is left is what the day can genuinely still take. The
 * first entry is always kept: a bucket with legal work in it is never empty
 * just because the single item is long.
 */
function fillBucket(
  entries: PlanEntry[],
  budgetMinutes: number,
): { kept: PlanEntry[]; trimmed: PlanEntry[] } {
  const exempt = (entry: PlanEntry) =>
    entry.completedToday || ALWAYS_PLANNED_PROGRAMS.includes(entry.programId)

  let used = entries.filter(exempt).reduce((total, e) => total + estimateMinutes(e.item), 0)
  const kept: PlanEntry[] = []
  const trimmed: PlanEntry[] = []

  for (const entry of entries) {
    if (exempt(entry)) {
      kept.push(entry)
      continue
    }
    const minutes = estimateMinutes(entry.item)
    if (kept.length === 0 || used + minutes <= budgetMinutes) {
      kept.push(entry)
      used += minutes
    } else {
      trimmed.push(entry)
    }
  }
  return { kept, trimmed }
}

/**
 * Build the plan for one day.
 *
 * ## Contract
 *
 * `buildPlan(date, registry, states, history, settings?, context?) → DayPlan`
 *
 * Every active (non-paused, registered) program contributes the items of its
 * current phase. Each surviving item becomes a `PlanEntry` filed into its
 * declared bucket (`couch` | `quick` | `workout`).
 *
 * Rules are applied in this order:
 *
 * 1. **Phase items** — paused programs, unknown programs and unknown phases are
 *    skipped entirely.
 * 2. **Cross-program phase gate** — an item declaring `requiresPhase` is
 *    dropped unless the named program has reached (or passed) that phase. The
 *    gate fails open (see `isPhaseGateMet`) and, unlike everything below, it is
 *    absolute: not even a completion today brings a gated item back.
 * 3. **Frequency** — an item is due while its distinct completion days *this
 *    week, excluding today* are below `frequency.perWeek` ('daily' is always
 *    due). An item completed today stays on today's plan with
 *    `completedToday: true`, and from here on is exempt from every exclusion
 *    below: work already done is never hidden mid-day.
 * 4. **Workout size** — a `workout` item that declares `workoutSizes` survives
 *    only if the effective size (`context.workoutSize ?? settings.defaultWorkoutSize ?? 'M'`)
 *    is one of them. Items without `workoutSizes` always pass.
 * 5. **Sport today** (`context.sportToday`, else `history.sportDates` contains
 *    `date`) — hard items in the `workout` bucket are suppressed; `couch` and
 *    `quick` are untouched. The app never plans warm-ups or cool-downs: the
 *    user handles those, so nothing is injected around a sport session.
 * 6. **Day before sport (R4)** — when `context.sportTomorrow`, else when
 *    `history.sportDates`/`settings.sportDaysHint` say tomorrow is a sport day:
 *    hard items loading LOWER_BODY_TISSUES are excluded.
 * 7. **Same-tissue spacing (R7)** — a hard item is excluded when any hard load
 *    (hard completion of *any* item, or a sport date) sharing one of its
 *    tissues falls within `max(item.minSpacingDays, otherItem.minSpacingDays)`
 *    days before `date` (default 2). Easy items ignore spacing.
 * 8. **Hard-day cap (R2)** — if the week already holds `HARD_DAYS_PER_WEEK` (4)
 *    hard days and today is not one of them, all hard items are excluded.
 * 9. **Urgency + sort** — a perWeek item whose remaining quota is ≥ its
 *    remaining legal days this week gets `urgent: true`. Within each bucket:
 *    ascending program priority, then urgent before non-urgent *within* a
 *    program, and stable (authored order) inside a tier. Priority outranks
 *    urgency: the acute program leads the list even on a day full of urgent
 *    3×/week items from lower-priority programs.
 * 10. **Time budget** — last, once the order is settled, each bucket with a
 *    configured `settings.<bucket>BudgetMinutes` is filled up to that many
 *    minutes scaled by `rampFactor` (unless `settings.rampEnabled === false`).
 *    Budgets are opt-in at this layer: an unset budget leaves the bucket
 *    whole, and the app supplies `DEFAULT_BUDGET_MINUTES` in `useDayPlan`. See
 *    `fillBucket`: whole items in order, tibant work and anything already
 *    completed today exempt and charged first, the first item always kept.
 *    `plan.minutes` reports what each bucket came to.
 *
 * Items the budget cuts are not lost. They break no safety rule, so
 * `buildBrowse` — which offers everything legal that today's plan does not
 * already hold — picks them up as extras, exactly like an item whose weekly
 * frequency is already satisfied. Trimming moves work from "today's plan" to
 * "here if you want it", nothing more.
 *
 * The planner never *forces* an item onto a day the rules bar — urgency only
 * reorders and flags. It also never plans warm-ups or cool-downs; a program's
 * `pregameItems` / `postgameItems` are ignored by the plan (see `buildBrowse`
 * for the "what else could I do right now" list).
 */
export function buildPlan(
  date: string,
  registry: PartialProgramRegistry,
  states: ProgramState[],
  history: PlannerHistory,
  settings: PlannerSettings = {},
  context: DayContext = {},
): DayPlan {
  const weekStartsOn = settings.weekStartsOn ?? DEFAULT_WEEK_STARTS_ON
  const index = indexItems(registry)
  const size = context.workoutSize ?? settings.defaultWorkoutSize ?? DEFAULT_WORKOUT_SIZE
  const sportToday = context.sportToday ?? (history.sportDates?.includes(date) ?? false)
  const sportTomorrow = context.sportTomorrow ?? isPlannedSportDay(addDays(date, 1), history, settings)
  const byTissue = hardLoadsByTissue(history, index)
  const hardCapReached = isHardDayCapReached(history, index, date, settings, context)

  const entries: PlanEntry[] = []

  const push = (
    program: { id: ProgramId; name: string; priority: number },
    item: ProtocolItem,
    over: Partial<PlanEntry> = {},
  ) => {
    entries.push({
      programId: program.id,
      programName: program.name,
      priority: program.priority,
      itemId: item.id,
      item,
      bucket: item.bucket,
      completedToday: history.completions.some(
        c => c.programId === program.id && c.itemId === item.id && c.date === date,
      ),
      urgent: false,
      ...over,
    })
  }

  for (const state of states) {
    if (state.paused) continue
    const program = registry[state.programId]
    if (!program) continue
    const phase = program.phases.find(p => p.id === state.phase)
    if (!phase) continue

    for (const item of phase.items) {
      // 2 — cross-program phase gate, ahead of everything: a gated item is not
      // merely postponed, it does not belong on the plan at all yet.
      if (!isPhaseGateMet(item, states, registry)) continue
      // Days before today decide whether the item is still due; a completion
      // today keeps it visible (ticked) rather than dropping it mid-screen.
      const doneBefore = countCompletionsThisWeek(history, program.id, item.id, date, weekStartsOn, date)
      if (!isFrequencySatisfiable(item, doneBefore)) continue
      const completedToday = history.completions.some(
        c => c.programId === program.id && c.itemId === item.id && c.date === date,
      )

      if (!completedToday) {
        // 4 — workout size.
        if (item.bucket === 'workout' && item.workoutSizes && !item.workoutSizes.includes(size)) continue
        // 5 — sport today suppresses the hard part of the workout block.
        if (sportToday && item.bucket === 'workout' && isHard(item)) continue
        // 6 — R4, nothing heavy on lower body the day before sport.
        if (sportTomorrow && isDayBeforeSportBlocked(item)) continue
        // 7 — R7, same-tissue recovery.
        if (isSpacingBlocked(item, byTissue, date)) continue
        // 8 — R2, weekly hard-day budget.
        if (hardCapReached && isHard(item)) continue
      }

      // 9 — rebalancing urgency. Quota counts today, so a finished item is calm.
      const doneAll = countCompletionsThisWeek(history, program.id, item.id, date, weekStartsOn)
      const quota = item.frequency.perWeek === 'daily' ? 0 : item.frequency.perWeek - doneAll
      push(program, item, { urgent: isUrgent(item, quota, date, history, settings) })
    }

    // TODO(slice 5): equipment filter against settings.equipment, falling back
    // to item.alternates when the authored item needs kit the user lacks.
  }

  // Stable sort keeps each program's authored item order inside a tier.
  // Priorities are distinct per program, so the urgency comparison only ever
  // fires between two items of the *same* program.
  entries.sort((a, b) => a.priority - b.priority || Number(b.urgent) - Number(a.urgent))

  const buckets: Record<Bucket, PlanEntry[]> = { couch: [], quick: [], workout: [] }
  for (const entry of entries) buckets[entry.bucket].push(entry)

  // 10 — time budget, applied to the settled order so the day is filled from
  // the top: what gets cut is always the least important work in the bucket.
  // Opt-in at this layer: a bucket with no configured budget is left whole —
  // the app supplies DEFAULT_BUDGET_MINUTES via useDayPlan, so callers that
  // never mention time (tests, scripts) see the untrimmed plan.
  const ramp = settings.rampEnabled === false ? 1 : rampFactor(date, history, states)
  const minutes: Record<Bucket, number> = { couch: 0, quick: 0, workout: 0 }
  for (const bucket of Object.keys(buckets) as Bucket[]) {
    const configured = settings[BUDGET_SETTING[bucket]]
    if (configured !== undefined) {
      buckets[bucket] = fillBucket(buckets[bucket], configured * ramp).kept
    }
    minutes[bucket] = bucketMinutes(buckets[bucket])
  }

  return { date, buckets, minutes }
}

/**
 * "What else could I legitimately do right now?" — the browse list behind the
 * Today screen's context picker.
 *
 * `buildBrowse(date, registry, states, history, settings, context, bucket) → PlanEntry[]`
 *
 * Returns the items of active programs' current phases that live in `bucket`
 * and are **not** on today's plan, but that only missed it for a reason of
 * bookkeeping rather than safety: their weekly frequency is already satisfied
 * (rule 3), the day's workout size does not include them (rule 4), or the
 * day's time budget ran out before reaching them (rule 10). No extra handling
 * is needed for that last case: a trimmed item simply is not on the plan, and
 * anything legal that is not on the plan is an extra.
 *
 * Every safety rule still applies exactly as `buildPlan` applies it — the phase
 * gate (2), the sport-today hard suppression (5), the day-before-sport rule (6),
 * same-tissue spacing (7) and the hard-day cap (8). An item the rules bar is
 * never offered as an extra.
 *
 * Entries carry `extra: true` and `urgent: false`; ticking their sets works
 * exactly like any other entry (`toggleSet` with the programId), so extra work
 * is logged and feeds history like everything else. The result is sorted by
 * program priority, authored order preserved inside a program.
 */
export function buildBrowse(
  date: string,
  registry: PartialProgramRegistry,
  states: ProgramState[],
  history: PlannerHistory,
  settings: PlannerSettings = {},
  context: DayContext = {},
  bucket: Bucket = 'couch',
): PlanEntry[] {
  const index = indexItems(registry)
  const sportToday = context.sportToday ?? (history.sportDates?.includes(date) ?? false)
  const sportTomorrow = context.sportTomorrow ?? isPlannedSportDay(addDays(date, 1), history, settings)
  const byTissue = hardLoadsByTissue(history, index)
  const hardCapReached = isHardDayCapReached(history, index, date, settings, context)

  // Anything already due today is not an "extra" — the plan is the source of
  // truth for that, so the two lists can never disagree.
  const plan = buildPlan(date, registry, states, history, settings, context)
  const planned = new Set(
    (Object.keys(plan.buckets) as Bucket[]).flatMap(b =>
      plan.buckets[b].map(e => `${e.programId}:${e.itemId}`),
    ),
  )

  const entries: PlanEntry[] = []

  for (const state of states) {
    if (state.paused) continue
    const program = registry[state.programId]
    if (!program) continue
    const phase = program.phases.find(p => p.id === state.phase)
    if (!phase) continue

    for (const item of phase.items) {
      if (item.bucket !== bucket) continue
      if (planned.has(`${program.id}:${item.id}`)) continue
      // Safety rules, in the same order buildPlan applies them.
      if (!isPhaseGateMet(item, states, registry)) continue
      if (sportToday && item.bucket === 'workout' && isHard(item)) continue
      if (sportTomorrow && isDayBeforeSportBlocked(item)) continue
      if (isSpacingBlocked(item, byTissue, date)) continue
      if (hardCapReached && isHard(item)) continue

      entries.push({
        programId: program.id,
        programName: program.name,
        priority: program.priority,
        itemId: item.id,
        item,
        bucket: item.bucket,
        completedToday: history.completions.some(
          c => c.programId === program.id && c.itemId === item.id && c.date === date,
        ),
        extra: true,
        urgent: false,
      })
    }
  }

  entries.sort((a, b) => a.priority - b.priority)
  return entries
}
