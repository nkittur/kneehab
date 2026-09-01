import Dexie, { type EntityTable } from 'dexie'
import type { Bucket, ProgramId, ProgramState, WorkoutSize } from '../programs/types'
import { rehabPhaseFor } from './phase'

export type DayMode = 'rehab' | 'sport' | 'durability'

/** Pain per body area, keyed by the program that owns that area. */
export type PainScores = Partial<Record<ProgramId, number>>

export type DailyLog = {
  date: string // YYYY-MM-DD (local)
  isSportDay: boolean
  mode?: DayMode // undefined on legacy logs → derived from isSportDay
  sport?: 'basketball' | 'pickleball' | null
  pops?: number | null
  pain?: number | null // 0–10 — legacy, knee only; superseded by painScores
  /** v2: per-area pain, e.g. { knee: 3, tibant: 5 }. */
  painScores?: PainScores
  /** v2: mirrors isSportDay; kept separate so the legacy field can retire later. */
  sportDay?: boolean
  /** v2: the workout variant picked for this day (planner `context.workoutSize`). */
  workoutSize?: WorkoutSize
  notes?: string
  updatedAt: number
}

/** Effective mode for a log, back-compatible with logs written before `mode` existed. */
export function modeOf(log?: Pick<DailyLog, 'mode' | 'isSportDay'>): DayMode {
  return log?.mode ?? (log?.isSportDay ? 'sport' : 'rehab')
}

export type SetCompletion = {
  id?: number
  date: string
  protocolId: string
  setNumber: number
  completedAt: number
  /** v2: which program the item belongs to. v1 rows migrate to 'knee'. */
  programId?: ProgramId
}

export type PlanItemStatus = 'pending' | 'done' | 'skipped'

export type PlanItem = {
  id?: number
  date: string
  programId: ProgramId
  itemId: string
  bucket: Bucket
  sets: number
  /** Reps or seconds per set, whichever the item measures. */
  targetPerSet?: number
  status: PlanItemStatus
  swappedToItemId?: string
  updatedAt: number
}

export type CheckIn = {
  id?: number
  date: string
  programId: ProgramId
  /** Answer per CheckInQuestion.id — number for pain0to10, boolean for yesNo. */
  answers: Record<string, number | boolean>
  proposedAction?: 'advance' | 'hold' | 'regress'
}

export type BodyMetric = {
  date: string
  weightKg?: number
  restingHR?: number
}

/**
 * One attempt at a gate test (see `src/programs/tibantTests.ts`). Rows are
 * append-only — retesting adds a row, and the latest date wins.
 */
export type GateTestResult = {
  id?: number
  testId: string
  date: string
  passed: boolean
  note?: string
}

export type Settings = {
  key: 'singleton'
  programStartDate: string // YYYY-MM-DD
  darkMode?: boolean
  /** v2: equipment the user owns; matched against Exercise.equipment. */
  equipment?: string[]
  defaultWorkoutSize?: WorkoutSize
  /** v2: weekdays (0=Sun) the user usually plays sport. */
  sportDaysHint?: number[]
  /**
   * Minutes available per bucket on a normal day. Absent = the planner's
   * defaults (30 / 10 / 30); no migration needed, the fields are additive.
   */
  couchBudgetMinutes?: number
  quickBudgetMinutes?: number
  workoutBudgetMinutes?: number
  /** Ramp the budgets down over the first three weeks. Absent = on. */
  rampEnabled?: boolean
}

export type { ProgramState }

export const db = new Dexie('kneehab') as Dexie & {
  dailyLogs: EntityTable<DailyLog, 'date'>
  setCompletions: EntityTable<SetCompletion, 'id'>
  settings: EntityTable<Settings, 'key'>
  programState: EntityTable<ProgramState, 'programId'>
  planItems: EntityTable<PlanItem, 'id'>
  checkIns: EntityTable<CheckIn, 'id'>
  bodyMetrics: EntityTable<BodyMetric, 'date'>
  gateTests: EntityTable<GateTestResult, 'id'>
}

db.version(1).stores({
  dailyLogs: 'date, isSportDay',
  setCompletions: '++id, date, protocolId, [date+protocolId+setNumber]',
  settings: 'key',
})

db.version(2)
  .stores({
    dailyLogs: 'date, isSportDay',
    setCompletions: '++id, date, protocolId, programId, [date+protocolId+setNumber]',
    settings: 'key',
    programState: 'programId',
    planItems: '++id, date, programId, [date+bucket], [date+programId+itemId]',
    checkIns: '++id, date, programId, [programId+date]',
    bodyMetrics: 'date',
  })
  .upgrade(async tx => {
    // v1 dailyLogs.pain was knee-only → per-area painScores. `pops` stays put.
    await tx
      .table('dailyLogs')
      .toCollection()
      .modify((log: DailyLog) => {
        if (log.painScores === undefined) {
          log.painScores = log.pain == null ? {} : { knee: log.pain }
        }
        if (log.sportDay === undefined) log.sportDay = log.isSportDay
      })

    // Every v1 completion belonged to the knee protocol.
    await tx
      .table('setCompletions')
      .toCollection()
      .modify((c: SetCompletion) => {
        if (!c.programId) c.programId = 'knee'
      })

    // settings.programStartDate becomes the knee program's state.
    const settings = (await tx.table('settings').get('singleton')) as Settings | undefined
    if (settings?.programStartDate) {
      const existing = await tx.table('programState').get('knee')
      if (!existing) {
        await tx.table('programState').put(kneeStateFrom(settings.programStartDate, todayISO()))
      }
    }
  })

// v3 adds gate-test results. Dexie carries the unchanged v2 tables forward.
db.version(3).stores({
  gateTests: '++id, testId, date, [testId+date]',
})

export function todayISO(d = new Date()): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function addDaysISO(dateISO: string, days: number): string {
  const d = new Date(dateISO + 'T00:00:00')
  d.setDate(d.getDate() + days)
  return todayISO(d)
}

/** Knee program state derived from the legacy programStartDate. Phase 2 begins on day 14. */
function kneeStateFrom(startISO: string, nowISO: string): ProgramState {
  const phase = rehabPhaseFor(startISO, nowISO)
  return {
    programId: 'knee',
    phase,
    startedPhaseAt: phase === 'phase2' ? addDaysISO(startISO, 14) : startISO,
  }
}

export async function ensureSettings(): Promise<Settings> {
  const existing = (await db.settings.get('singleton')) ?? undefined
  const s: Settings = existing ?? { key: 'singleton', programStartDate: todayISO() }
  if (!existing) await db.settings.put(s)
  // Fresh installs (and v1 users whose upgrade guard skipped) still need a knee state.
  if (s.programStartDate && !(await db.programState.get('knee'))) {
    await db.programState.put(kneeStateFrom(s.programStartDate, todayISO()))
  }
  return s
}

export function getSettings(): Promise<Settings | undefined> {
  return db.settings.get('singleton')
}

export async function upsertDailyLog(date: string, patch: Partial<DailyLog>) {
  const existing = await db.dailyLogs.get(date)
  const next: DailyLog = {
    date,
    isSportDay: false,
    ...existing,
    ...patch,
    updatedAt: Date.now(),
  }
  // Keep the v2 fields in sync while legacy writers still patch `pain`/`isSportDay`.
  if (patch.pain !== undefined && patch.painScores === undefined) {
    const scores: PainScores = { ...next.painScores }
    if (patch.pain == null) delete scores.knee
    else scores.knee = patch.pain
    next.painScores = scores
  }
  if (patch.isSportDay !== undefined && patch.sportDay === undefined) {
    next.sportDay = patch.isSportDay
  }
  await db.dailyLogs.put(next)
  return next
}

export async function toggleSet(
  date: string,
  protocolId: string,
  setNumber: number,
  programId?: ProgramId,
): Promise<boolean> {
  // Legacy callers don't pass programId; durability items ('du-*') belong to strength.
  programId ??= protocolId.startsWith('du-') ? 'strength' : 'knee'
  const existing = await db.setCompletions
    .where('[date+protocolId+setNumber]')
    .equals([date, protocolId, setNumber])
    .first()
  if (existing) {
    await db.setCompletions.delete(existing.id!)
    return false
  }
  await db.setCompletions.add({ date, protocolId, setNumber, completedAt: Date.now(), programId })
  return true
}

// ── v2 helpers ────────────────────────────────────────────────────────

/** Seed missing program states (first phase, today) — content stays out of db.ts. */
export async function ensureProgramStates(
  defaults: { programId: ProgramId; phase: string }[],
): Promise<void> {
  for (const d of defaults) {
    if (!(await db.programState.get(d.programId))) {
      await db.programState.put({ programId: d.programId, phase: d.phase, startedPhaseAt: todayISO() })
    }
  }
}

export function getProgramState(programId: ProgramId): Promise<ProgramState | undefined> {
  return db.programState.get(programId)
}

export function getProgramStates(): Promise<ProgramState[]> {
  return db.programState.toArray()
}

/** Move a program to a phase, stamping when the phase was entered. */
export async function setProgramPhase(
  programId: ProgramId,
  phase: string,
  startedPhaseAt = todayISO(),
): Promise<ProgramState> {
  const existing = await db.programState.get(programId)
  const next: ProgramState = { ...existing, programId, phase, startedPhaseAt }
  await db.programState.put(next)
  return next
}

export async function upsertBodyMetric(date: string, patch: Partial<BodyMetric>): Promise<BodyMetric> {
  const existing = await db.bodyMetrics.get(date)
  const next: BodyMetric = { ...existing, ...patch, date }
  await db.bodyMetrics.put(next)
  return next
}

export async function addCheckIn(entry: Omit<CheckIn, 'id'>): Promise<number> {
  return (await db.checkIns.add(entry)) as number
}

/** Record a gate-test attempt. Append-only — retesting adds another row. */
export async function recordGateTest(
  testId: string,
  passed: boolean,
  opts: { date?: string; note?: string } = {},
): Promise<number> {
  const { date = todayISO(), note } = opts
  return (await db.gateTests.add({ testId, date, passed, ...(note ? { note } : {}) })) as number
}

/** The most recent attempt per test id — what the Tests screen shows. */
export async function latestGateResults(): Promise<Map<string, GateTestResult>> {
  const rows = await db.gateTests.toArray()
  const latest = new Map<string, GateTestResult>()
  for (const row of rows) {
    const prev = latest.get(row.testId)
    // Rows are appended, so a later id breaks a same-day tie.
    if (!prev || row.date > prev.date || (row.date === prev.date && (row.id ?? 0) > (prev.id ?? 0))) {
      latest.set(row.testId, row)
    }
  }
  return latest
}

export function planItemsFor(date: string): Promise<PlanItem[]> {
  return db.planItems.where('date').equals(date).toArray()
}

export async function setPlanItemStatus(id: number, status: PlanItemStatus): Promise<void> {
  await db.planItems.update(id, { status, updatedAt: Date.now() })
}

/** Pause or resume a program; paused programs contribute nothing to the plan. */
export async function setProgramPaused(programId: ProgramId, paused: boolean): Promise<ProgramState> {
  const existing = await db.programState.get(programId)
  const next: ProgramState = {
    programId,
    phase: existing?.phase ?? '',
    startedPhaseAt: existing?.startedPhaseAt ?? todayISO(),
    ...existing,
    paused,
  }
  await db.programState.put(next)
  return next
}

/**
 * Plan *deviations*. Generated plans are never persisted — only the user's
 * departures from them: a 'skipped' row hides an item for the day, a
 * `swappedToItemId` row substitutes an alternate. One row per (date, program,
 * item); writing again replaces it.
 */
export async function upsertPlanDeviation(
  row: Omit<PlanItem, 'id' | 'updatedAt'>,
): Promise<number> {
  const existing = await db.planItems
    .where('[date+programId+itemId]')
    .equals([row.date, row.programId, row.itemId])
    .first()
  const next: PlanItem = { ...existing, ...row, updatedAt: Date.now() }
  return (await db.planItems.put(next)) as number
}

/** Drop a deviation row — "un-skip" / "un-swap". */
export async function clearPlanDeviation(
  date: string,
  programId: ProgramId,
  itemId: string,
): Promise<void> {
  const existing = await db.planItems
    .where('[date+programId+itemId]')
    .equals([date, programId, itemId])
    .first()
  if (existing?.id !== undefined) await db.planItems.delete(existing.id)
}
