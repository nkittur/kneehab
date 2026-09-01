import { describe, expect, it } from 'vitest'
import { ADVANCEMENTS, advancementReady, GATE_GROUPS, GATE_TESTS, gateTestsInGroup, isGroupPassed } from './tibantTests'
import { isPhaseAhead, phaseIndexOf, PROGRAMS } from './index'
import { tibantProgram } from './tibant'

/** The shape `latestGateResults()` hands the UI, minus the Dexie fields. */
function results(entries: Record<string, boolean>): Map<string, { passed: boolean }> {
  return new Map(Object.entries(entries).map(([id, passed]) => [id, { passed }]))
}

const allPassed = (group: Parameters<typeof gateTestsInGroup>[0]) =>
  results(Object.fromEntries(gateTestsInGroup(group).map(t => [t.id, true])))

describe('gate groups', () => {
  it('has no duplicate test ids', () => {
    const ids = GATE_TESTS.map(t => t.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('advances tibant to phases that exist: B-exit+C-entry → C, C-exit+RTP → D', () => {
    expect(ADVANCEMENTS.map(a => [a.toPhaseId, a.requires])).toEqual([
      ['phaseC', ['B-exit', 'C-entry']],
      ['phaseD', ['C-exit', 'RTP']],
    ])
    for (const adv of ADVANCEMENTS) {
      const program = PROGRAMS[adv.programId]
      expect(program && phaseIndexOf(program, adv.toPhaseId)).toBeGreaterThanOrEqual(0)
      for (const group of adv.requires) expect(GATE_GROUPS.some(g => g.id === group)).toBe(true)
    }
  })

  it('is not ready on B-exit alone — the phase C entry jog is required too', () => {
    expect(advancementReady(ADVANCEMENTS[0], allPassed('B-exit'))).toBe(false)
  })

  it('is ready once B-exit and C-entry are both fully passed', () => {
    const both = new Map([...allPassed('B-exit'), ...allPassed('C-entry')])
    expect(advancementReady(ADVANCEMENTS[0], both)).toBe(true)
  })

  it('is not ready for phase D without the full RTP checklist', () => {
    expect(advancementReady(ADVANCEMENTS[1], allPassed('C-exit'))).toBe(false)
    const both = new Map([...allPassed('C-exit'), ...allPassed('RTP')])
    expect(advancementReady(ADVANCEMENTS[1], both)).toBe(true)
  })
})

describe('isGroupPassed', () => {
  it('is true only when every test in the group has a passing latest result', () => {
    expect(isGroupPassed('B-exit', allPassed('B-exit'))).toBe(true)
  })

  it('is false with no results at all', () => {
    expect(isGroupPassed('B-exit', results({}))).toBe(false)
  })

  it('is false when one test is missing', () => {
    const partial = allPassed('B-exit')
    partial.delete('b-stairs')
    expect(isGroupPassed('B-exit', partial)).toBe(false)
  })

  it('is false when a retest failed — the latest result is what counts', () => {
    const failed = allPassed('B-exit')
    failed.set('b-stairs', { passed: false })
    expect(isGroupPassed('B-exit', failed)).toBe(false)
  })

  it('ignores results from other groups', () => {
    expect(isGroupPassed('C-exit', allPassed('B-exit'))).toBe(false)
  })
})

describe('phase ordering', () => {
  it('indexes phases by their position, and answers -1 for unknown ids', () => {
    expect(phaseIndexOf(tibantProgram, 'phaseA')).toBe(0)
    expect(phaseIndexOf(tibantProgram, 'phaseC')).toBe(2)
    expect(phaseIndexOf(tibantProgram, 'nope')).toBe(-1)
    expect(phaseIndexOf(tibantProgram, undefined)).toBe(-1)
  })

  it('sees a later phase as ahead, and the current or an earlier one as not', () => {
    expect(isPhaseAhead(tibantProgram, 'phaseB', 'phaseC')).toBe(true)
    expect(isPhaseAhead(tibantProgram, 'phaseC', 'phaseC')).toBe(false)
    expect(isPhaseAhead(tibantProgram, 'phaseD', 'phaseC')).toBe(false)
  })

  it('treats a program with no state as being before every phase', () => {
    expect(isPhaseAhead(tibantProgram, undefined, 'phaseC')).toBe(true)
  })

  it('never calls an unknown phase ahead', () => {
    expect(isPhaseAhead(tibantProgram, 'phaseA', 'nope')).toBe(false)
  })
})
