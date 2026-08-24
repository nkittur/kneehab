import { describe, expect, it } from 'vitest'
import {
  buildBrowse,
  buildPlan,
  countCompletionsThisWeek,
  estimateMinutes,
  rampFactor,
  hardDaysThisWeek,
  isFrequencySatisfiable,
  isHardDayCapReached,
  isPhaseGateMet,
  isSpacingBlocked,
  hardLoadsByTissue,
  lastHardLoadByTissue,
  remainingLegalDays,
  weekOf,
  type PlannerHistory,
} from './planner'
import { PROGRAMS } from '../programs'
import type { PartialProgramRegistry, ProgramDef, ProgramState, ProtocolItem } from '../programs/types'

// 2026-08-24 is a Monday; 2026-08-23 is the Sunday before it.
const MON = '2026-08-24'
const TUE = '2026-08-25'
const WED = '2026-08-26'
const THU = '2026-08-27'
const FRI = '2026-08-28'
const SAT = '2026-08-29'
const SUN = '2026-08-30'
const SUN_BEFORE = '2026-08-23'

// Each synthetic item gets its own exerciseId by default; pass `exerciseId`
// explicitly to model two items that are genuinely the same exercise.
function item(over: Partial<ProtocolItem> & Pick<ProtocolItem, 'id'>): ProtocolItem {
  return {
    exerciseId: over.id,
    sets: 3,
    reps: 10,
    displayAmount: '10 reps',
    frequency: { perWeek: 'daily' },
    bucket: 'couch',
    ...over,
  }
}

const alpha: ProgramDef = {
  id: 'knee',
  name: 'Alpha',
  priority: 10,
  phases: [
    {
      id: 'p1',
      name: 'P1',
      exitCriteria: 'n/a',
      items: [
        item({ id: 'a-daily', frequency: { perWeek: 'daily' }, bucket: 'couch' }),
        item({ id: 'a-twice', frequency: { perWeek: 2 }, bucket: 'workout' }),
        item({ id: 'a-quick', frequency: { perWeek: 'daily' }, bucket: 'quick' }),
      ],
    },
    { id: 'p2', name: 'P2', exitCriteria: 'n/a', items: [item({ id: 'a-p2' })] },
  ],
}

const beta: ProgramDef = {
  id: 'strength',
  name: 'Beta',
  priority: 50,
  phases: [
    {
      id: 'b1',
      name: 'B1',
      exitCriteria: 'n/a',
      items: [item({ id: 'b-daily', bucket: 'couch' })],
    },
  ],
}

const registry: PartialProgramRegistry = { knee: alpha, strength: beta }

const states: ProgramState[] = [
  { programId: 'knee', phase: 'p1', startedPhaseAt: MON },
  { programId: 'strength', phase: 'b1', startedPhaseAt: MON },
]

const empty: PlannerHistory = { completions: [] }

const ids = (entries: { itemId: string }[]) => entries.map(e => e.itemId)

describe('weekOf', () => {
  it('snaps to the Monday of the containing week by default', () => {
    expect(weekOf(MON)).toBe(MON)
    expect(weekOf(WED)).toBe(MON)
    expect(weekOf('2026-08-30')).toBe(MON) // Sunday still belongs to that week
    expect(weekOf('2026-08-31')).toBe('2026-08-31') // next Monday starts a new week
  })

  it('honours a Sunday week start', () => {
    expect(weekOf(MON, 0)).toBe(SUN_BEFORE)
    expect(weekOf(SUN_BEFORE, 0)).toBe(SUN_BEFORE)
  })
})

describe('countCompletionsThisWeek', () => {
  const history: PlannerHistory = {
    completions: [
      { date: MON, programId: 'knee', itemId: 'a-twice' },
      { date: MON, programId: 'knee', itemId: 'a-twice' }, // same day → one session
      { date: TUE, programId: 'knee', itemId: 'a-twice' },
      { date: SUN_BEFORE, programId: 'knee', itemId: 'a-twice' }, // previous week
      { date: MON, programId: 'strength', itemId: 'a-twice' }, // other program
    ],
  }

  it('counts distinct days for the item in the containing week', () => {
    expect(countCompletionsThisWeek(history, 'knee', 'a-twice', WED)).toBe(2)
  })

  it('ignores other programs and other weeks', () => {
    expect(countCompletionsThisWeek(history, 'strength', 'a-twice', WED)).toBe(1)
    expect(countCompletionsThisWeek(history, 'knee', 'a-twice', SUN_BEFORE)).toBe(1)
  })
})

describe('isFrequencySatisfiable', () => {
  it('always allows daily items', () => {
    expect(isFrequencySatisfiable(item({ id: 'd' }), 7)).toBe(true)
  })

  it('stops perWeek items at their quota', () => {
    const twice = item({ id: 't', frequency: { perWeek: 2 } })
    expect(isFrequencySatisfiable(twice, 1)).toBe(true)
    expect(isFrequencySatisfiable(twice, 2)).toBe(false)
  })
})

describe('buildPlan', () => {
  it('includes daily items every day regardless of history', () => {
    const history: PlannerHistory = {
      completions: [MON, TUE].map(date => ({ date, programId: 'knee' as const, itemId: 'a-daily' })),
    }
    const plan = buildPlan(WED, registry, states, history)
    expect(ids(plan.buckets.couch)).toContain('a-daily')
  })

  it('drops a 2×/week item once the week quota is met', () => {
    const before = buildPlan(WED, registry, states, empty)
    expect(ids(before.buckets.workout)).toContain('a-twice')

    const history: PlannerHistory = {
      completions: [
        { date: MON, programId: 'knee', itemId: 'a-twice' },
        { date: TUE, programId: 'knee', itemId: 'a-twice' },
      ],
    }
    const after = buildPlan(WED, registry, states, history)
    expect(ids(after.buckets.workout)).not.toContain('a-twice')

    // …and comes back next week.
    const nextWeek = buildPlan('2026-08-31', registry, states, history)
    expect(ids(nextWeek.buckets.workout)).toContain('a-twice')
  })

  it('keeps an item completed today on today\'s plan, marked completedToday', () => {
    // Quota met by Mon + Tue where Tue is "today": Tue must still show the item.
    const history: PlannerHistory = {
      completions: [
        { date: MON, programId: 'knee', itemId: 'a-twice' },
        { date: TUE, programId: 'knee', itemId: 'a-twice' },
      ],
    }
    const today = buildPlan(TUE, registry, states, history)
    const entry = today.buckets.workout.find(e => e.itemId === 'a-twice')
    expect(entry).toBeDefined()
    expect(entry?.completedToday).toBe(true)

    // The next day the quota (2, excluding that day) is genuinely met → hidden.
    const tomorrow = buildPlan(WED, registry, states, history)
    expect(ids(tomorrow.buckets.workout)).not.toContain('a-twice')

    // Untouched items report completedToday: false.
    const fresh = buildPlan(MON, registry, states, empty)
    expect(fresh.buckets.workout.find(e => e.itemId === 'a-twice')?.completedToday).toBe(false)
  })

  it('files each item into its declared bucket', () => {
    const plan = buildPlan(MON, registry, states, empty)
    expect(ids(plan.buckets.couch)).toEqual(['a-daily', 'b-daily'])
    expect(ids(plan.buckets.quick)).toEqual(['a-quick'])
    expect(ids(plan.buckets.workout)).toEqual(['a-twice'])
  })

  it('orders entries by program priority, keeping authored order within a program', () => {
    const flipped: ProgramState[] = [...states].reverse()
    const plan = buildPlan(MON, registry, flipped, empty)
    // Beta (priority 50) is listed first in `states` but must sort after Alpha (10).
    expect(plan.buckets.couch.map(e => e.programName)).toEqual(['Alpha', 'Beta'])
    expect(ids(plan.buckets.couch)).toEqual(['a-daily', 'b-daily'])
  })

  it('only plans the current phase of a program', () => {
    const onP2: ProgramState[] = [{ programId: 'knee', phase: 'p2', startedPhaseAt: MON }]
    const plan = buildPlan(MON, registry, onP2, empty)
    expect(ids(plan.buckets.couch)).toEqual(['a-p2'])
  })

  it('skips paused programs and unknown programs/phases', () => {
    const paused: ProgramState[] = [
      { programId: 'knee', phase: 'p1', startedPhaseAt: MON, paused: true },
      { programId: 'strength', phase: 'nope', startedPhaseAt: MON },
      { programId: 'wrist', phase: 'w1', startedPhaseAt: MON },
    ]
    const plan = buildPlan(MON, registry, paused, empty)
    expect(plan.buckets.couch).toHaveLength(0)
    expect(plan.buckets.quick).toHaveLength(0)
    expect(plan.buckets.workout).toHaveLength(0)
  })

  it('runs against the real registry', () => {
    const real: ProgramState[] = [
      { programId: 'knee', phase: 'phase2', startedPhaseAt: MON },
      { programId: 'strength', phase: 'ongoing', startedPhaseAt: MON },
    ]
    const plan = buildPlan(MON, PROGRAMS, real, empty)
    expect(ids(plan.buckets.quick)).toContain('p2-band')
    expect(ids(plan.buckets.workout)).toContain('p2-step')
    expect(ids(plan.buckets.quick)).toContain('st-single-leg-balance-eyes-closed')
    expect(ids(plan.buckets.couch)).toContain('st-seated-soleus-raise')
    // knee (priority 20) sorts ahead of strength (50)
    const quickPrograms = plan.buckets.quick.map(e => e.programId)
    expect(quickPrograms[0]).toBe('knee')
    expect(quickPrograms[quickPrograms.length - 1]).toBe('strength')
  })
})

// ---------------------------------------------------------------------------
// Slice-3 rules: spacing, sport days, hard-day budget, sizes, urgency.
// A second synthetic registry, richer than `alpha`/`beta`: hard items with
// tissues and a sized workout block.
// ---------------------------------------------------------------------------

const squat = item({
  id: 'squat',
  bucket: 'workout',
  intensity: 'hard',
  tissues: ['quads', 'glutes'],
  frequency: { perWeek: 2 },
})
const heavySquat = item({
  id: 'heavy-squat',
  bucket: 'workout',
  intensity: 'hard',
  tissues: ['quads'],
  minSpacingDays: 3,
  frequency: { perWeek: 2 },
})
const calfHsr = item({
  id: 'calf-hsr',
  bucket: 'workout',
  intensity: 'hard',
  tissues: ['achilles-calf'],
  frequency: { perWeek: 2 },
})
// Upper body: hard, but R4 (day before sport) does not touch it.
const press = item({
  id: 'press',
  bucket: 'workout',
  intensity: 'hard',
  tissues: ['upper-push'],
  frequency: { perWeek: 2 },
})
// Hard with no declared tissues → spacing can never bite, the cap still can.
const shuttles = item({ id: 'shuttles', bucket: 'workout', intensity: 'hard', frequency: { perWeek: 2 } })
const zone2 = item({ id: 'zone2', bucket: 'workout' })
const sizeSM = item({ id: 'w-sm', bucket: 'workout', workoutSizes: ['S', 'M'] })
const sizeL = item({ id: 'w-l', bucket: 'workout', workoutSizes: ['L'] })
// Easy, and on tissues that hard work also loads — must ignore spacing and R4.
const kneeIso = item({ id: 'iso', bucket: 'quick', tissues: ['patellar-tendon', 'quads'] })
const gymTwice = item({ id: 'g-twice', bucket: 'couch', frequency: { perWeek: 2 } })

const gym: ProgramDef = {
  id: 'strength',
  name: 'Gym',
  priority: 40,
  phases: [
    {
      id: 'g1',
      name: 'G1',
      exitCriteria: 'n/a',
      items: [squat, heavySquat, calfHsr, press, shuttles, zone2, sizeSM, sizeL, kneeIso, gymTwice],
    },
  ],
  // Authored but never planned: the user warms up and cools down on their own.
  pregameItems: [item({ id: 'pre-warmup', bucket: 'quick' })],
  postgameItems: [item({ id: 'post-cooldown', bucket: 'couch' })],
}

const tib: ProgramDef = {
  id: 'tibant',
  name: 'Tib',
  priority: 5,
  phases: [{ id: 't1', name: 'T1', exitCriteria: 'n/a', items: [item({ id: 't-daily', bucket: 'couch' })] }],
}

const reg2: PartialProgramRegistry = { strength: gym, tibant: tib }
const states2: ProgramState[] = [
  { programId: 'strength', phase: 'g1', startedPhaseAt: MON },
  { programId: 'tibant', phase: 't1', startedPhaseAt: MON },
]

const did = (date: string, itemId: string, programId: 'strength' | 'tibant' = 'strength') => ({
  date,
  programId: programId as ProgramState['programId'],
  itemId,
})

describe('same-tissue spacing (R7)', () => {
  it('blocks a hard item inside its spacing window and frees it after', () => {
    const yesterday: PlannerHistory = { completions: [did(TUE, 'squat')] }
    expect(ids(buildPlan(WED, reg2, states2, yesterday).buckets.workout)).not.toContain('squat')

    const twoDaysAgo: PlannerHistory = { completions: [did(MON, 'squat')] }
    expect(ids(buildPlan(WED, reg2, states2, twoDaysAgo).buckets.workout)).toContain('squat')
  })

  it('blocks across items that share a tissue', () => {
    // squat (quads, glutes) yesterday blocks heavy-squat (quads) today…
    const history: PlannerHistory = { completions: [did(TUE, 'squat')] }
    const plan = buildPlan(WED, reg2, states2, history)
    expect(ids(plan.buckets.workout)).not.toContain('heavy-squat')
    // …but leaves unrelated tissues alone.
    expect(ids(plan.buckets.workout)).toContain('calf-hsr')
    expect(ids(plan.buckets.workout)).toContain('press')
  })

  it('uses the larger of the two items\' minSpacingDays', () => {
    // heavy-squat asks for 3 days; two days later squat is still blocked by it.
    const history: PlannerHistory = { completions: [did(MON, 'heavy-squat')] }
    expect(ids(buildPlan(WED, reg2, states2, history).buckets.workout)).not.toContain('squat')
    expect(ids(buildPlan(THU, reg2, states2, history).buckets.workout)).toContain('squat')
  })

  it('treats sport days as hard load on quads / calf / patellar tendon', () => {
    const history: PlannerHistory = { completions: [], sportDates: [TUE] }
    const plan = buildPlan(WED, reg2, states2, history)
    expect(ids(plan.buckets.workout)).not.toContain('squat')
    expect(ids(plan.buckets.workout)).not.toContain('calf-hsr')
    expect(ids(plan.buckets.workout)).toContain('press') // upper body is untouched
  })

  it('never blocks easy items, tissue-less items, or work done today', () => {
    const history: PlannerHistory = { completions: [did(TUE, 'squat'), did(WED, 'heavy-squat')] }
    const plan = buildPlan(WED, reg2, states2, history)
    expect(ids(plan.buckets.quick)).toContain('iso') // easy, same tissues
    expect(ids(plan.buckets.workout)).toContain('shuttles') // hard, no tissues
    // Completed today: kept on the plan, ticked, despite yesterday's squat.
    expect(plan.buckets.workout.find(e => e.itemId === 'heavy-squat')?.completedToday).toBe(true)
  })

  it('exposes the tissue history it reasons from', () => {
    const history: PlannerHistory = { completions: [did(MON, 'heavy-squat'), did(TUE, 'calf-hsr')], sportDates: [WED] }
    const byTissue = hardLoadsByTissue(history, reg2)
    expect(byTissue.quads?.map(l => l.date)).toEqual([WED, MON]) // newest first, sport included
    expect(lastHardLoadByTissue(history, reg2).quads).toMatchObject({ date: WED, source: 'sport' })
    expect(lastHardLoadByTissue(history, reg2)['achilles-calf']).toMatchObject({ date: WED })
    expect(lastHardLoadByTissue(history, reg2)['upper-push']).toBeUndefined()
    expect(isSpacingBlocked(squat, byTissue, THU)).toBe(true)
    expect(isSpacingBlocked(squat, byTissue, FRI)).toBe(false)
    expect(isSpacingBlocked(kneeIso, byTissue, THU)).toBe(false)
  })
})

describe('sport-day handling', () => {
  it('never plans warm-up or cool-down blocks, even on a sport day', () => {
    const plan = buildPlan(WED, reg2, states2, empty, {}, { sportToday: true })
    const planned = [...plan.buckets.couch, ...plan.buckets.quick, ...plan.buckets.workout]
    expect(ids(planned)).not.toContain('pre-warmup')
    expect(ids(planned)).not.toContain('post-cooldown')
    expect(ids(plan.buckets.quick)).toEqual(['iso'])
  })

  it('suppresses hard workout items but leaves couch and quick alone', () => {
    const plan = buildPlan(WED, reg2, states2, empty, {}, { sportToday: true })
    for (const hard of ['squat', 'heavy-squat', 'calf-hsr', 'press', 'shuttles']) {
      expect(ids(plan.buckets.workout)).not.toContain(hard)
    }
    expect(ids(plan.buckets.workout)).toEqual(['zone2', 'w-sm'])
    expect(ids(plan.buckets.couch)).toEqual(['t-daily', 'g-twice'])
  })

  it('reads the sport day from history when the context is silent', () => {
    const history: PlannerHistory = { completions: [], sportDates: [WED] }
    expect(ids(buildPlan(WED, reg2, states2, history).buckets.workout)).not.toContain('press')

    // …and leaves an ordinary day's hard work alone.
    expect(ids(buildPlan(THU, reg2, states2, history).buckets.workout)).toContain('press')
  })
})

describe('cross-program phase gate', () => {
  const gated = item({
    id: 'gated',
    bucket: 'couch',
    requiresPhase: { programId: 'wrist', phaseId: 'phase3' },
  })
  const gatedReg: PartialProgramRegistry = {
    strength: {
      id: 'strength',
      name: 'Gated',
      priority: 50,
      phases: [{ id: 'g1', name: 'G1', exitCriteria: 'n/a', items: [gated] }],
    },
    wrist: {
      id: 'wrist',
      name: 'Wrist',
      priority: 30,
      phases: (['phase1', 'phase2', 'phase3'] as const).map(id => ({
        id,
        name: id,
        exitCriteria: 'n/a',
        items: [item({ id: `w-${id}` })],
      })),
    },
  }
  const gatedOwner: ProgramState = { programId: 'strength', phase: 'g1', startedPhaseAt: MON }

  it('fails open when the gating program has no state at all', () => {
    const plan = buildPlan(MON, gatedReg, [gatedOwner], empty)
    expect(ids(plan.buckets.couch)).toContain('gated')
  })

  it('fails open for a paused gating program, and for a phase id that does not resolve', () => {
    const paused: ProgramState[] = [gatedOwner, { programId: 'wrist', phase: 'phase1', startedPhaseAt: MON, paused: true }]
    expect(ids(buildPlan(MON, gatedReg, paused, empty).buckets.couch)).toContain('gated')

    const unknownPhase = item({ ...gated, requiresPhase: { programId: 'wrist', phaseId: 'nope' } })
    expect(isPhaseGateMet(unknownPhase, [{ programId: 'wrist', phase: 'phase1', startedPhaseAt: MON }], gatedReg)).toBe(
      true,
    )
  })

  it('withholds the item until the gating program reaches the phase', () => {
    const at = (phase: string): ProgramState[] => [gatedOwner, { programId: 'wrist', phase, startedPhaseAt: MON }]
    expect(ids(buildPlan(MON, gatedReg, at('phase1'), empty).buckets.couch)).not.toContain('gated')
    expect(ids(buildPlan(MON, gatedReg, at('phase3'), empty).buckets.couch)).toContain('gated')
  })
})

describe('day before sport (R4)', () => {
  it('drops hard lower-body work, keeping hard upper body and easy work', () => {
    const plan = buildPlan(WED, reg2, states2, empty, {}, { sportTomorrow: true })
    expect(ids(plan.buckets.workout)).not.toContain('squat')
    expect(ids(plan.buckets.workout)).not.toContain('heavy-squat')
    expect(ids(plan.buckets.workout)).not.toContain('calf-hsr')
    expect(ids(plan.buckets.workout)).toContain('press')
    expect(ids(plan.buckets.workout)).toContain('shuttles') // hard, but no lower-body tissues
    expect(ids(plan.buckets.workout)).toContain('zone2')
    expect(ids(plan.buckets.quick)).toContain('iso')
  })

  it('derives tomorrow from settings.sportDaysHint', () => {
    const hint = { sportDaysHint: [4] } // Thursday
    expect(ids(buildPlan(WED, reg2, states2, empty, hint).buckets.workout)).not.toContain('squat')
    expect(ids(buildPlan(THU, reg2, states2, empty, hint).buckets.workout)).toContain('squat')
  })

  it('derives tomorrow from a planned sport date', () => {
    const history: PlannerHistory = { completions: [], sportDates: [THU] }
    expect(ids(buildPlan(WED, reg2, states2, history).buckets.workout)).not.toContain('squat')
  })

  it('lets the context override the hint in both directions', () => {
    const hint = { sportDaysHint: [4] }
    const overridden = buildPlan(WED, reg2, states2, empty, hint, { sportTomorrow: false })
    expect(ids(overridden.buckets.workout)).toContain('squat')

    const forced = buildPlan(THU, reg2, states2, empty, hint, { sportTomorrow: true })
    expect(ids(forced.buckets.workout)).not.toContain('squat')
  })
})

describe('weekly hard-day budget (R2)', () => {
  // 'press' is hard and shares no tissue with 'shuttles', so these histories
  // exercise the cap without tripping the spacing rule.
  const fourHardDays: PlannerHistory = {
    completions: [MON, TUE, WED, THU].map(d => did(d, 'press')),
  }

  it('counts hard completion days and sport days, ignoring easy work', () => {
    expect(hardDaysThisWeek(fourHardDays, reg2, FRI)).toEqual([MON, TUE, WED, THU])
    const mixed: PlannerHistory = { completions: [did(MON, 'press'), did(TUE, 'zone2')], sportDates: [WED] }
    expect(hardDaysThisWeek(mixed, reg2, FRI)).toEqual([MON, WED])
    // Last week's hard days don't count against this week.
    expect(hardDaysThisWeek({ completions: [did(SUN_BEFORE, 'press')] }, reg2, FRI)).toEqual([])
  })

  it('excludes hard items once the week holds four hard days', () => {
    expect(isHardDayCapReached(fourHardDays, reg2, FRI)).toBe(true)
    const plan = buildPlan(FRI, reg2, states2, fourHardDays)
    expect(ids(plan.buckets.workout)).not.toContain('shuttles')
    expect(ids(plan.buckets.workout)).not.toContain('squat')
    expect(ids(plan.buckets.workout)).toContain('zone2') // easy work is unaffected
    expect(ids(plan.buckets.couch)).toContain('g-twice')
  })

  it('allows a fifth hard item on a day that is already hard', () => {
    const alsoToday: PlannerHistory = { completions: [...fourHardDays.completions, did(FRI, 'press')] }
    expect(isHardDayCapReached(alsoToday, reg2, FRI)).toBe(false)
    expect(ids(buildPlan(FRI, reg2, states2, alsoToday).buckets.workout)).toContain('shuttles')

    // Same when today's hard load is sport rather than a logged item.
    expect(isHardDayCapReached(fourHardDays, reg2, FRI, {}, { sportToday: true })).toBe(false)
  })

  it('leaves three hard days well alone', () => {
    const threeHardDays: PlannerHistory = { completions: [MON, TUE, WED].map(d => did(d, 'press')) }
    expect(isHardDayCapReached(threeHardDays, reg2, FRI)).toBe(false)
    expect(ids(buildPlan(FRI, reg2, states2, threeHardDays).buckets.workout)).toContain('shuttles')
  })

  it('counts sport days towards the cap', () => {
    const history: PlannerHistory = { completions: [did(MON, 'press')], sportDates: [TUE, WED, THU] }
    expect(isHardDayCapReached(history, reg2, FRI)).toBe(true)
    expect(ids(buildPlan(FRI, reg2, states2, history).buckets.workout)).not.toContain('shuttles')
  })
})

describe('workout size filter', () => {
  it('defaults to M', () => {
    const plan = buildPlan(WED, reg2, states2, empty)
    expect(ids(plan.buckets.workout)).toContain('w-sm')
    expect(ids(plan.buckets.workout)).not.toContain('w-l')
  })

  it('honours the context pick', () => {
    const long = buildPlan(WED, reg2, states2, empty, {}, { workoutSize: 'L' })
    expect(ids(long.buckets.workout)).toContain('w-l')
    expect(ids(long.buckets.workout)).not.toContain('w-sm')

    const short = buildPlan(WED, reg2, states2, empty, {}, { workoutSize: 'S' })
    expect(ids(short.buckets.workout)).toContain('w-sm')
    expect(ids(short.buckets.workout)).not.toContain('w-l')
  })

  it('falls back to settings.defaultWorkoutSize, which the context overrides', () => {
    const fromSettings = buildPlan(WED, reg2, states2, empty, { defaultWorkoutSize: 'L' })
    expect(ids(fromSettings.buckets.workout)).toContain('w-l')

    const overridden = buildPlan(WED, reg2, states2, empty, { defaultWorkoutSize: 'L' }, { workoutSize: 'S' })
    expect(ids(overridden.buckets.workout)).not.toContain('w-l')
  })

  it('passes items that declare no sizes, at every size', () => {
    for (const workoutSize of ['S', 'M', 'L'] as const) {
      expect(ids(buildPlan(WED, reg2, states2, empty, {}, { workoutSize }).buckets.workout)).toContain('zone2')
    }
  })
})

// Priority vs urgency: one high-priority program with nothing urgent, one
// low-priority program whose middle item goes urgent on Saturday.
const prioReg: PartialProgramRegistry = {
  tibant: {
    id: 'tibant',
    name: 'High',
    priority: 5,
    phases: [{ id: 'h1', name: 'H1', exitCriteria: 'n/a', items: [item({ id: 'high-daily' })] }],
  },
  strength: {
    id: 'strength',
    name: 'Low',
    priority: 50,
    phases: [
      {
        id: 's1',
        name: 'S1',
        exitCriteria: 'n/a',
        items: [
          item({ id: 'low-daily' }),
          item({ id: 'low-urgent', frequency: { perWeek: 2 } }),
          item({ id: 'low-daily-2' }),
        ],
      },
    ],
  },
}
const prioStates: ProgramState[] = [
  { programId: 'tibant', phase: 'h1', startedPhaseAt: MON },
  { programId: 'strength', phase: 's1', startedPhaseAt: MON },
]

describe('rebalancing urgency', () => {
  it('counts the legal days left in the week, minus a tomorrow R4 would block', () => {
    expect(remainingLegalDays(gymTwice, SAT, empty)).toBe(2) // Sat + Sun
    expect(remainingLegalDays(gymTwice, SUN, empty)).toBe(1)
    // Sport on Sunday makes Saturday illegal for hard lower-body work.
    expect(remainingLegalDays(squat, FRI, empty, { sportDaysHint: [0] })).toBe(2)
    expect(remainingLegalDays(squat, FRI, empty)).toBe(3)
    expect(remainingLegalDays(press, FRI, empty, { sportDaysHint: [0] })).toBe(3) // upper body: never R4-blocked
  })

  it('marks a perWeek item urgent when its quota needs every day left', () => {
    const sat = buildPlan(SAT, reg2, states2, empty)
    expect(sat.buckets.couch.find(e => e.itemId === 'g-twice')?.urgent).toBe(true)

    const fri = buildPlan(FRI, reg2, states2, empty)
    expect(fri.buckets.couch.find(e => e.itemId === 'g-twice')?.urgent).toBe(false)

    // One session already banked → quota 1, two days left → calm again.
    const half: PlannerHistory = { completions: [did(MON, 'g-twice')] }
    expect(buildPlan(SAT, reg2, states2, half).buckets.couch.find(e => e.itemId === 'g-twice')?.urgent).toBe(false)
  })

  it('never marks daily items urgent, nor items already finished today', () => {
    const sun = buildPlan(SUN, reg2, states2, empty)
    expect(sun.buckets.couch.find(e => e.itemId === 't-daily')?.urgent).toBe(false)

    const done: PlannerHistory = { completions: [did(SAT, 'g-twice'), did(SUN, 'g-twice')] }
    const entry = buildPlan(SUN, reg2, states2, done).buckets.couch.find(e => e.itemId === 'g-twice')
    expect(entry?.completedToday).toBe(true)
    expect(entry?.urgent).toBe(false)
  })

  it('turns urgent earlier when R4 will eat tomorrow', () => {
    const hint = { sportDaysHint: [0] } // Sunday sport → Saturday is illegal for squats
    expect(buildPlan(FRI, reg2, states2, empty, hint).buckets.workout.find(e => e.itemId === 'squat')?.urgent).toBe(
      true,
    )
    expect(buildPlan(FRI, reg2, states2, empty).buckets.workout.find(e => e.itemId === 'squat')?.urgent).toBe(false)
  })

  it('sorts by program priority first, urgency only within a program', () => {
    const plan = buildPlan(SAT, reg2, states2, empty)
    // g-twice is urgent, but it belongs to Gym (priority 40) and Tib (5) leads
    // regardless: the acute program owns the top of the list.
    expect(ids(plan.buckets.couch)).toEqual(['t-daily', 'g-twice'])
    expect(plan.buckets.couch.map(e => e.urgent)).toEqual([false, true])

    // Same order with nothing urgent — priority is the only lever between programs.
    expect(ids(buildPlan(WED, reg2, states2, empty).buckets.couch)).toEqual(['t-daily', 'g-twice'])
  })

  it('keeps a low-priority urgent item behind a higher-priority program, ahead of its own siblings', () => {
    const plan = buildPlan(SAT, prioReg, prioStates, empty)
    const entry = plan.buckets.couch.find(e => e.itemId === 'low-urgent')
    expect(entry?.urgent).toBe(true)
    // High (priority 5) leads even though nothing of its own is urgent; inside
    // Low (50) the urgent item jumps its own authored-order siblings.
    expect(ids(plan.buckets.couch)).toEqual(['high-daily', 'low-urgent', 'low-daily', 'low-daily-2'])
  })

  it('still refuses to place an urgent item on an illegal day', () => {
    // Saturday: squat has 2 sessions owed and 2 days left → urgent…
    const urgent = buildPlan(SAT, reg2, states2, empty)
    expect(urgent.buckets.workout.find(e => e.itemId === 'squat')?.urgent).toBe(true)

    // …but sport tomorrow (R4) still wins, and a spacing debt would too.
    const blocked = buildPlan(SAT, reg2, states2, empty, {}, { sportTomorrow: true })
    expect(ids(blocked.buckets.workout)).not.toContain('squat')

    const spaced = buildPlan(SAT, reg2, states2, { completions: [did(FRI, 'squat')] })
    expect(ids(spaced.buckets.workout)).not.toContain('squat')
  })
})

// ---------------------------------------------------------------------------
// buildBrowse — "what else could I legitimately do right now?"
// ---------------------------------------------------------------------------

describe('buildBrowse', () => {
  const browse = (
    date: string,
    bucket: 'couch' | 'quick' | 'workout',
    history: PlannerHistory = empty,
    context = {},
    reg: PartialProgramRegistry = reg2,
    st: ProgramState[] = states2,
  ) => buildBrowse(date, reg, st, history, {}, context, bucket)

  it('never repeats an item that is already due today', () => {
    const due = ids(buildPlan(WED, reg2, states2, empty).buckets.workout)
    const extras = ids(browse(WED, 'workout'))
    for (const id of due) expect(extras).not.toContain(id)
    // Only the size-filtered item is left over on a clean Wednesday.
    expect(extras).toEqual(['w-l'])
  })

  it('offers items whose weekly frequency is already satisfied', () => {
    const history: PlannerHistory = { completions: [did(MON, 'g-twice'), did(TUE, 'g-twice')] }
    expect(ids(buildPlan(WED, reg2, states2, history).buckets.couch)).not.toContain('g-twice')
    expect(ids(browse(WED, 'couch', history))).toContain('g-twice')
  })

  it('only returns items of the requested bucket', () => {
    const history: PlannerHistory = { completions: [did(MON, 'g-twice'), did(TUE, 'g-twice')] }
    for (const entry of browse(WED, 'couch', history)) expect(entry.bucket).toBe('couch')
    expect(ids(browse(WED, 'couch', history))).not.toContain('w-l')
  })

  it('marks entries extra, never urgent, and sorts by program priority', () => {
    const extras = browse(WED, 'workout')
    expect(extras.every(e => e.extra === true)).toBe(true)
    expect(extras.every(e => e.urgent === false)).toBe(true)
    expect([...extras].map(e => e.priority)).toEqual([...extras].map(e => e.priority).sort((a, b) => a - b))
  })

  it('withholds a hard item still inside its spacing window (R7)', () => {
    // Quota met *and* squatted on Tuesday: frequency alone would offer it back,
    // but the tissue is not recovered.
    const history: PlannerHistory = { completions: [did(MON, 'squat'), did(TUE, 'squat')] }
    const extras = ids(browse(WED, 'workout', history))
    expect(extras).not.toContain('squat')
    expect(extras).not.toContain('heavy-squat') // shares quads
    expect(extras).toContain('w-l') // unrelated, still on offer
  })

  it('withholds hard lower-body work the day before sport (R4)', () => {
    const extras = ids(browse(WED, 'workout', empty, { sportTomorrow: true }))
    for (const id of ['squat', 'heavy-squat', 'calf-hsr']) expect(extras).not.toContain(id)
  })

  it('withholds hard workout items on a sport day (R5)', () => {
    const extras = ids(browse(WED, 'workout', empty, { sportToday: true }))
    for (const id of ['squat', 'heavy-squat', 'calf-hsr', 'press', 'shuttles']) {
      expect(extras).not.toContain(id)
    }
    expect(extras).toContain('w-l') // easy, merely size-filtered
  })

  it('withholds hard items once the weekly hard-day cap is reached (R2)', () => {
    const fourHardDays: PlannerHistory = { completions: [MON, TUE, WED, THU].map(d => did(d, 'press')) }
    const extras = ids(browse(FRI, 'workout', fourHardDays))
    expect(extras).not.toContain('shuttles')
    expect(extras).toContain('w-l')
  })

  it('withholds items the cross-program phase gate has not released', () => {
    const gatedReg: PartialProgramRegistry = {
      strength: {
        id: 'strength',
        name: 'Gated',
        priority: 50,
        phases: [
          {
            id: 'g1',
            name: 'G1',
            exitCriteria: 'n/a',
            items: [
              item({ id: 'gated', bucket: 'couch', requiresPhase: { programId: 'wrist', phaseId: 'phase3' } }),
              item({ id: 'open', bucket: 'couch', frequency: { perWeek: 1 } }),
            ],
          },
        ],
      },
      wrist: {
        id: 'wrist',
        name: 'Wrist',
        priority: 30,
        phases: (['phase1', 'phase3'] as const).map(id => ({
          id,
          name: id,
          exitCriteria: 'n/a',
          items: [item({ id: `w-${id}` })],
        })),
      },
    }
    const st: ProgramState[] = [
      { programId: 'strength', phase: 'g1', startedPhaseAt: MON },
      { programId: 'wrist', phase: 'phase1', startedPhaseAt: MON },
    ]
    const history: PlannerHistory = { completions: [{ date: MON, programId: 'strength', itemId: 'open' }] }
    const extras = ids(browse(TUE, 'couch', history, {}, gatedReg, st))
    expect(extras).not.toContain('gated')
    expect(extras).toContain('open') // 1×/week quota met on Monday → browsable
  })

  it('skips paused and unknown programs, like the plan does', () => {
    const paused: ProgramState[] = [
      { programId: 'strength', phase: 'g1', startedPhaseAt: MON, paused: true },
      { programId: 'tibant', phase: 'nope', startedPhaseAt: MON },
    ]
    expect(browse(WED, 'workout', empty, {}, reg2, paused)).toEqual([])
  })
})

// ---------------------------------------------------------------------------
// Real-registry traces. These are the regressions that matter: they run the
// actual authored content through the planner rather than a fixture.
// ---------------------------------------------------------------------------

/** Everything freshly started: the state a new user is in on day one. */
const freshStates: ProgramState[] = [
  { programId: 'tibant', phase: 'phaseA', startedPhaseAt: MON },
  { programId: 'knee', phase: 'phase1', startedPhaseAt: MON },
  { programId: 'wrist', phase: 'phase1', startedPhaseAt: MON },
  { programId: 'fingers', phase: 'base', startedPhaseAt: MON },
  { programId: 'strength', phase: 'ongoing', startedPhaseAt: MON },
  { programId: 'cardio', phase: 'ongoing', startedPhaseAt: MON },
]

const allEntries = (plan: ReturnType<typeof buildPlan>) => [
  ...plan.buckets.couch,
  ...plan.buckets.quick,
  ...plan.buckets.workout,
]

const INTERVAL_ITEMS = ['ca-peloton-4x4', 'ca-elliptical-30-30', 'ca-bike-10x1']

describe('real registry — sport day', () => {
  const plan = buildPlan(MON, PROGRAMS, freshStates, empty, {}, { sportToday: true })

  it('never plans the same exercise twice, in any bucket', () => {
    const seen = new Map<string, string>()
    for (const entry of allEntries(plan)) {
      const key = entry.item.exerciseId
      expect(
        seen.has(key),
        `exercise '${key}' planned twice: ${seen.get(key)} and ${entry.programId}/${entry.itemId}`,
      ).toBe(false)
      seen.set(key, `${entry.programId}/${entry.itemId}`)
    }
  })

  it('plans no warm-up or cool-down work', () => {
    const authored = new Set(
      Object.values(PROGRAMS).flatMap(p => [...(p.pregameItems ?? []), ...(p.postgameItems ?? [])].map(i => i.id)),
    )
    expect(authored.size).toBeGreaterThan(0) // the content is still there…
    for (const entry of allEntries(plan)) expect(authored.has(entry.itemId)).toBe(false) // …and never planned
  })
})

describe('real registry — acute tibialis gates the cardio block', () => {
  it('withholds impact and interval cardio in tibant Phase A, keeping the elliptical', () => {
    for (const workoutSize of ['S', 'M', 'L'] as const) {
      const plan = buildPlan(MON, PROGRAMS, freshStates, empty, {}, { workoutSize })
      const planned = ids(plan.buckets.workout)
      expect(planned).not.toContain('ca-incline-walk-zone2')
      expect(planned).not.toContain('ca-court-conditioning-shuttles')
      for (const interval of INTERVAL_ITEMS) expect(planned).not.toContain(interval)
      expect(planned).toContain('ca-elliptical-zone2')
    }
  })

  it('releases the incline walk at Phase C, still holding the court shuttles', () => {
    const atPhaseC = freshStates.map(s => (s.programId === 'tibant' ? { ...s, phase: 'phaseC' } : s))
    const planned = ids(buildPlan(MON, PROGRAMS, atPhaseC, empty).buckets.workout)
    expect(planned).toContain('ca-incline-walk-zone2')
    expect(planned).not.toContain('ca-court-conditioning-shuttles')
  })
})

describe('real registry — every-other-day loading', () => {
  it('hides a wrist Phase-2 curl the day after it was done, and offers it the day after that', () => {
    const wristOnly: ProgramState[] = [{ programId: 'wrist', phase: 'phase2', startedPhaseAt: MON }]
    const history: PlannerHistory = { completions: [{ date: MON, programId: 'wrist', itemId: 'w2-ext-curl' }] }

    expect(ids(buildPlan(MON, PROGRAMS, wristOnly, empty).buckets.couch)).toContain('w2-ext-curl')
    expect(ids(buildPlan(TUE, PROGRAMS, wristOnly, history).buckets.couch)).not.toContain('w2-ext-curl')
    expect(ids(buildPlan(WED, PROGRAMS, wristOnly, history).buckets.couch)).toContain('w2-ext-curl')
  })
})

describe('time budget and ramp', () => {
  // couch items: 3 sets × 10 reps ≈ 3.5 min each (see estimateMinutes)
  const shin: ProgramDef = {
    id: 'tibant',
    name: 'Shin',
    priority: 5,
    phases: [
      { id: 'p', name: 'P', exitCriteria: 'n/a', items: [item({ id: 't-iso', bucket: 'couch' })] },
    ],
  }
  const gym: ProgramDef = {
    id: 'strength',
    name: 'Gym',
    priority: 50,
    phases: [
      {
        id: 'p',
        name: 'P',
        exitCriteria: 'n/a',
        items: [
          item({ id: 's-a', bucket: 'couch' }),
          item({ id: 's-b', bucket: 'couch' }),
          item({ id: 's-c', bucket: 'couch' }),
        ],
      },
    ],
  }
  const reg: PartialProgramRegistry = { tibant: shin, strength: gym }
  const both: ProgramState[] = [
    { programId: 'tibant', phase: 'p', startedPhaseAt: MON },
    { programId: 'strength', phase: 'p', startedPhaseAt: MON },
  ]
  const gymOnly: ProgramState[] = [both[1]]
  const noRamp = { rampEnabled: false }

  describe('estimateMinutes', () => {
    it('estimates rep items, duration items and long cardio sessions', () => {
      // 3×(10 reps × 4s) + 2×30s rest + 20s setup = 200s → 3.5 min
      expect(estimateMinutes(item({ id: 'r', sets: 3, reps: 10 }))).toBe(3.5)
      // 3×45s + 2×30s + 20s = 215s → 4 min
      expect(estimateMinutes(item({ id: 'd', sets: 3, reps: undefined, durationSeconds: 45 }))).toBe(4)
      // one 30-min block + 60s setup, no rest padding
      expect(estimateMinutes(item({ id: 'c', sets: 1, reps: undefined, durationSeconds: 1800 }))).toBe(31)
    })
  })

  describe('bucket budgets', () => {
    it('is opt-in: no configured budget leaves the bucket whole', () => {
      const plan = buildPlan(MON, reg, gymOnly, empty, noRamp)
      expect(ids(plan.buckets.couch)).toEqual(['s-a', 's-b', 's-c'])
    })

    it('fills in order and trims from the bottom, whole items only', () => {
      const plan = buildPlan(MON, reg, gymOnly, empty, { ...noRamp, couchBudgetMinutes: 8 })
      expect(ids(plan.buckets.couch)).toEqual(['s-a', 's-b']) // 7 min fits, 10.5 does not
      expect(plan.minutes.couch).toBe(7)
    })

    it('always keeps the first item even when it alone busts the budget', () => {
      const plan = buildPlan(MON, reg, gymOnly, empty, { ...noRamp, couchBudgetMinutes: 1 })
      expect(ids(plan.buckets.couch)).toEqual(['s-a'])
    })

    it('never trims tibant work, and charges it to the budget first', () => {
      const plan = buildPlan(MON, reg, both, empty, { ...noRamp, couchBudgetMinutes: 8 })
      // tibant's 3.5 min come off the top; only one gym item still fits.
      expect(ids(plan.buckets.couch)).toEqual(['t-iso', 's-a'])
    })

    it('keeps an item completed today even when over budget', () => {
      const history: PlannerHistory = {
        completions: [
          { date: MON, programId: 'strength', itemId: 's-b' },
          { date: MON, programId: 'strength', itemId: 's-c' },
        ],
      }
      const plan = buildPlan(MON, reg, gymOnly, history, { ...noRamp, couchBudgetMinutes: 1 })
      const kept = ids(plan.buckets.couch)
      expect(kept).toContain('s-b')
      expect(kept).toContain('s-c')
    })

    it('hands budget-trimmed items to buildBrowse as extras', () => {
      const settings = { ...noRamp, couchBudgetMinutes: 8 }
      const extras = buildBrowse(MON, reg, gymOnly, empty, settings, {}, 'couch')
      expect(ids(extras)).toEqual(['s-c'])
      expect(extras[0].extra).toBe(true)
    })
  })

  describe('rampFactor', () => {
    const day = (n: number) => {
      const d = new Date(MON + 'T00:00:00')
      d.setDate(d.getDate() + n)
      return d.toISOString().slice(0, 10)
    }
    // A user who trains steadily: first completion on MON, latest one yesterday.
    const active = (probeDay: number): PlannerHistory => ({
      completions: [
        { date: MON, programId: 'strength', itemId: 's-a' },
        { date: day(Math.max(0, probeDay - 1)), programId: 'strength', itemId: 's-a' },
      ],
    })

    it('starts at 0.6 with no history at all', () => {
      expect(rampFactor(MON, empty)).toBe(0.6)
    })

    it('steps 0.6 → 0.75 → 0.9 → 1.0 at days 7, 14 and 21 while training continues', () => {
      for (const [n, factor] of [
        [0, 0.6],
        [6, 0.6],
        [7, 0.75],
        [13, 0.75],
        [14, 0.9],
        [20, 0.9],
        [21, 1],
      ] as const) {
        expect(rampFactor(day(n), active(n)), `day ${n}`).toBe(factor)
      }
    })

    it('restarts at 0.6 after a 14-day layoff', () => {
      expect(rampFactor(day(21), active(21))).toBe(1)
      // program just as old, but the latest completion is ≥14 days back
      expect(rampFactor(day(35), active(21))).toBe(0.6)
    })

    it('scales the budget: week-one 0.6 × 10 min keeps one 3.5-min item', () => {
      const plan = buildPlan(MON, reg, gymOnly, empty, { couchBudgetMinutes: 10 })
      expect(ids(plan.buckets.couch)).toEqual(['s-a']) // 2 items = 7 min > 6
      const off = buildPlan(MON, reg, gymOnly, empty, { couchBudgetMinutes: 10, rampEnabled: false })
      expect(ids(off.buckets.couch)).toEqual(['s-a', 's-b'])
    })
  })

  it('real registry: default budgets shrink the fresh-install day dramatically', () => {
    const fresh: ProgramState[] = [
      { programId: 'tibant', phase: 'phaseA', startedPhaseAt: MON },
      { programId: 'knee', phase: 'phase1', startedPhaseAt: MON },
      { programId: 'wrist', phase: 'phase1', startedPhaseAt: MON },
      { programId: 'fingers', phase: 'base', startedPhaseAt: MON },
      { programId: 'strength', phase: 'ongoing', startedPhaseAt: MON },
      { programId: 'cardio', phase: 'ongoing', startedPhaseAt: MON },
    ]
    const unbudgeted = buildPlan(MON, PROGRAMS, fresh, empty)
    const budgeted = buildPlan(MON, PROGRAMS, fresh, empty, {
      couchBudgetMinutes: 30,
      quickBudgetMinutes: 10,
      workoutBudgetMinutes: 30,
    })
    const sets = (p: ReturnType<typeof buildPlan>) =>
      Object.values(p.buckets)
        .flat()
        .reduce((n, e) => n + e.item.sets, 0)
    expect(sets(budgeted)).toBeLessThan(sets(unbudgeted) / 2)
    // Couch stays within the ramped window plus the untrimmable tibant work.
    expect(budgeted.minutes.couch).toBeLessThanOrEqual(
      18 + buildPlan(MON, PROGRAMS, [fresh[0]], empty).minutes.couch + 4,
    )
  })
})
