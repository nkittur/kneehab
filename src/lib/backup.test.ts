// @vitest-environment node
import 'fake-indexeddb/auto'
import { beforeEach, describe, expect, it } from 'vitest'
import { db, latestGateResults } from './db'
import { BACKUP_VERSION, exportBackup, exportJSON, importJSON } from './backup'

/** Round-trip the v3 export, and check that the older v2 and v1 exports still import. */

async function clearAll() {
  await Promise.all([
    db.dailyLogs.clear(),
    db.setCompletions.clear(),
    db.settings.clear(),
    db.programState.clear(),
    db.planItems.clear(),
    db.checkIns.clear(),
    db.bodyMetrics.clear(),
    db.gateTests.clear(),
  ])
}

async function seed() {
  await db.settings.put({ key: 'singleton', programStartDate: '2026-08-01', defaultWorkoutSize: 'L' })
  await db.dailyLogs.put({
    date: '2026-08-20',
    isSportDay: true,
    sportDay: true,
    sport: 'basketball',
    painScores: { knee: 2, tibant: 5 },
    workoutSize: 'S',
    updatedAt: 1,
  })
  await db.setCompletions.add({
    date: '2026-08-20',
    protocolId: 'ta-iso-hold',
    setNumber: 1,
    completedAt: 2,
    programId: 'tibant',
  })
  await db.programState.put({ programId: 'tibant', phase: 'phaseB', startedPhaseAt: '2026-08-10' })
  await db.planItems.add({
    date: '2026-08-20',
    programId: 'knee',
    itemId: 'p1-clam',
    bucket: 'couch',
    sets: 3,
    status: 'skipped',
    updatedAt: 3,
  })
  await db.checkIns.add({ date: '2026-08-20', programId: 'knee', answers: { pain_daily: 2 }, proposedAction: 'hold' })
  await db.bodyMetrics.put({ date: '2026-08-20', weightKg: 80.5 })
  await db.gateTests.bulkAdd([
    { testId: 'b-heel-walk-45s', date: '2026-08-18', passed: false },
    { testId: 'b-heel-walk-45s', date: '2026-08-20', passed: true, note: 'easy' },
  ])
}

beforeEach(async () => {
  await db.open()
  await clearAll()
})

describe('backup', () => {
  it('round-trips every v3 table', async () => {
    await seed()
    const json = await exportJSON()
    expect(JSON.parse(json).version).toBe(BACKUP_VERSION)

    await clearAll()
    await importJSON(json)

    const after = await exportBackup()
    expect(after.dailyLogs).toHaveLength(1)
    expect(after.setCompletions).toHaveLength(1)
    expect(after.programState).toEqual([
      { programId: 'tibant', phase: 'phaseB', startedPhaseAt: '2026-08-10' },
    ])
    expect(after.planItems).toHaveLength(1)
    expect(after.checkIns).toHaveLength(1)
    expect(after.bodyMetrics).toEqual([{ date: '2026-08-20', weightKg: 80.5 }])
    expect(after.gateTests).toHaveLength(2)

    const log = await db.dailyLogs.get('2026-08-20')
    expect(log?.painScores).toEqual({ knee: 2, tibant: 5 })
    expect(log?.workoutSize).toBe('S')

    // The latest attempt wins, and the note survives the round trip.
    const latest = await latestGateResults()
    expect(latest.get('b-heel-walk-45s')).toMatchObject({
      date: '2026-08-20',
      passed: true,
      note: 'easy',
    })
  })

  it('accepts a durable-v2 export, which carries no gate tests', async () => {
    await seed()
    const v2 = { ...(await exportBackup()), version: 'durable-v2' } as Record<string, unknown>
    delete v2.gateTests

    await clearAll()
    await importJSON(JSON.stringify(v2))

    const after = await exportBackup()
    expect(after.bodyMetrics).toEqual([{ date: '2026-08-20', weightKg: 80.5 }])
    expect(after.gateTests).toEqual([])
  })

  it('accepts a legacy kneehab v1 export', async () => {
    await importJSON(
      JSON.stringify({
        version: 1,
        exportedAt: '2026-01-01T00:00:00.000Z',
        dailyLogs: [{ date: '2026-01-01', isSportDay: false, pain: 4, pops: 1, updatedAt: 1 }],
        setCompletions: [{ id: 7, date: '2026-01-01', protocolId: 'p1-clam', setNumber: 1, completedAt: 1 }],
        settings: [{ key: 'singleton', programStartDate: '2026-01-01' }],
      }),
    )
    expect(await db.dailyLogs.count()).toBe(1)
    expect(await db.setCompletions.count()).toBe(1)
    expect((await db.settings.get('singleton'))?.programStartDate).toBe('2026-01-01')
  })

  it('rejects an unknown version', async () => {
    await expect(importJSON(JSON.stringify({ version: 'nope' }))).rejects.toThrow('Unsupported backup version')
  })
})
