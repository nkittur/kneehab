// @vitest-environment node
import 'fake-indexeddb/auto'
import Dexie from 'dexie'
import { beforeAll, describe, expect, it } from 'vitest'

/**
 * Migration test for the Dexie v1 → v2 upgrade. Runs against fake-indexeddb:
 * a v1 database is written first, then `src/lib/db.ts` is imported (which
 * declares v2 and triggers the upgrade on open).
 */

type V1Row = Record<string, unknown>

let db: typeof import('./db')

beforeAll(async () => {
  // Seed a v1 database under the same name the app uses.
  const legacy = new Dexie('kneehab')
  legacy.version(1).stores({
    dailyLogs: 'date, isSportDay',
    setCompletions: '++id, date, protocolId, [date+protocolId+setNumber]',
    settings: 'key',
  })
  await legacy.open()
  await legacy.table('settings').put({ key: 'singleton', programStartDate: '2026-08-03' })
  await legacy.table('dailyLogs').bulkPut([
    { date: '2026-08-10', isSportDay: true, pain: 4, pops: 2, updatedAt: 1 },
    { date: '2026-08-11', isSportDay: false, pain: null, updatedAt: 2 },
  ] as V1Row[])
  await legacy.table('setCompletions').bulkAdd([
    { date: '2026-08-10', protocolId: 'p1-clam', setNumber: 1, completedAt: 3 },
  ] as V1Row[])
  legacy.close()

  db = await import('./db')
  await db.db.open()
})

describe('v1 → v2 migration', () => {
  it('moves dailyLogs.pain into painScores.knee and keeps pops', async () => {
    const logged = await db.db.dailyLogs.get('2026-08-10')
    expect(logged?.painScores).toEqual({ knee: 4 })
    expect(logged?.pops).toBe(2)
    expect(logged?.sportDay).toBe(true)

    const noPain = await db.db.dailyLogs.get('2026-08-11')
    expect(noPain?.painScores).toEqual({})
    expect(noPain?.sportDay).toBe(false)
  })

  it('stamps legacy set completions with programId knee', async () => {
    const rows = await db.db.setCompletions.toArray()
    expect(rows).toHaveLength(1)
    expect(rows[0].programId).toBe('knee')
  })

  it('seeds knee programState from settings.programStartDate', async () => {
    const state = await db.getProgramState('knee')
    // Start date is >2 weeks ago, so the week-number rule lands on phase 2 —
    // and phase 2 began on day 14, not on the program start date.
    expect(state?.phase).toBe('phase2')
    expect(state?.startedPhaseAt).toBe('2026-08-17')
  })

  it('keeps the legacy helpers working on the upgraded schema', async () => {
    const added = await db.toggleSet('2026-08-12', 'p2-band', 1)
    expect(added).toBe(true)
    const removed = await db.toggleSet('2026-08-12', 'p2-band', 1)
    expect(removed).toBe(false)

    const log = await db.upsertDailyLog('2026-08-12', { painScores: { knee: 2 } })
    expect(log.painScores).toEqual({ knee: 2 })
    expect(db.modeOf(log)).toBe('rehab')
  })

  it('stamps programId on new completions from legacy callers', async () => {
    await db.toggleSet('2026-08-13', 'p2-step', 1)
    await db.toggleSet('2026-08-13', 'du-04', 1)
    const rows = await db.db.setCompletions.where('date').equals('2026-08-13').toArray()
    const byItem = Object.fromEntries(rows.map(r => [r.protocolId, r.programId]))
    expect(byItem).toEqual({ 'p2-step': 'knee', 'du-04': 'strength' })
    await db.toggleSet('2026-08-13', 'p2-step', 1) // clean up (delete path)
    await db.toggleSet('2026-08-13', 'du-04', 1)
  })

  it('mirrors legacy pain/isSportDay patches into painScores/sportDay', async () => {
    const log = await db.upsertDailyLog('2026-08-14', { pain: 6, isSportDay: true })
    expect(log.painScores).toEqual({ knee: 6 })
    expect(log.sportDay).toBe(true)

    const zeroed = await db.upsertDailyLog('2026-08-14', { pain: 0 })
    expect(zeroed.painScores).toEqual({ knee: 0 })

    const cleared = await db.upsertDailyLog('2026-08-14', { pain: null })
    expect(cleared.painScores).toEqual({})
  })

  it('ensureSettings seeds knee programState when missing (fresh-install path)', async () => {
    await db.db.programState.delete('knee')
    await db.ensureSettings()
    const state = await db.getProgramState('knee')
    expect(state?.phase).toBe('phase2')
    expect(state?.startedPhaseAt).toBe('2026-08-17')
  })

  it('exposes the new v2 tables', async () => {
    await db.upsertBodyMetric('2026-08-12', { weightKg: 80.5 })
    expect((await db.db.bodyMetrics.get('2026-08-12'))?.weightKg).toBe(80.5)

    const id = await db.addCheckIn({
      date: '2026-08-12',
      programId: 'knee',
      answers: { pain_daily: 2, valgus_free: true },
    })
    expect(typeof id).toBe('number')

    await db.db.planItems.add({
      date: '2026-08-12',
      programId: 'knee',
      itemId: 'p2-band',
      bucket: 'quick',
      sets: 3,
      status: 'pending',
      updatedAt: Date.now(),
    })
    const items = await db.planItemsFor('2026-08-12')
    expect(items).toHaveLength(1)
    await db.setPlanItemStatus(items[0].id!, 'done')
    expect((await db.planItemsFor('2026-08-12'))[0].status).toBe('done')
  })

  it('setProgramPhase upserts and restamps', async () => {
    const next = await db.setProgramPhase('strength', 'dura_heavy', '2026-08-12')
    expect(next).toEqual({
      programId: 'strength',
      phase: 'dura_heavy',
      startedPhaseAt: '2026-08-12',
    })
    expect((await db.getProgramStates()).map(s => s.programId).sort()).toEqual(['knee', 'strength'])
  })
})
