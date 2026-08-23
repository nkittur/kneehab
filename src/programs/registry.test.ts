import { describe, expect, it } from 'vitest'
import { EXERCISES, PROGRAMS, programList } from './index'
import { kneeExercises } from './knee'
import { strengthExercises } from './strength'
import { tibantExercises } from './tibant'
import { wristExercises } from './wrist'
import { fingersExercises } from './fingers'
import { cardioExercises } from './cardio'
import type { ProgramDef, ProtocolItem } from './types'

const MODULES: Record<string, Record<string, unknown>> = {
  knee: kneeExercises,
  strength: strengthExercises,
  tibant: tibantExercises,
  wrist: wristExercises,
  fingers: fingersExercises,
  cardio: cardioExercises,
}

function allItems(p: ProgramDef): ProtocolItem[] {
  return [
    ...p.phases.flatMap(ph => ph.items),
    ...(p.pregameItems ?? []),
    ...(p.postgameItems ?? []),
  ]
}

describe('program registry integrity', () => {
  it('has no exercise-id collisions across modules (the EXERCISES spread would silently overwrite)', () => {
    const seen = new Map<string, string>()
    for (const [mod, exercises] of Object.entries(MODULES)) {
      for (const id of Object.keys(exercises)) {
        expect(seen.has(id), `exercise '${id}' defined in both ${seen.get(id)} and ${mod}`).toBe(false)
        seen.set(id, mod)
      }
    }
    expect(Object.keys(EXERCISES).length).toBe(seen.size)
  })

  it('every protocol item references a real exercise and unique item ids within its program', () => {
    for (const program of programList()) {
      const ids = new Set<string>()
      for (const item of allItems(program)) {
        expect(EXERCISES[item.exerciseId], `${program.id}/${item.id} → missing exercise '${item.exerciseId}'`).toBeDefined()
        expect(ids.has(item.id), `duplicate item id '${item.id}' in ${program.id}`).toBe(false)
        ids.add(item.id)
      }
    }
  })

  it('every alternates reference resolves within its program', () => {
    for (const program of programList()) {
      const ids = new Set(allItems(program).map(i => i.id))
      for (const item of allItems(program)) {
        for (const alt of item.alternates ?? []) {
          expect(ids.has(alt), `${program.id}/${item.id} → dangling alternate '${alt}'`).toBe(true)
          expect(alt, `${program.id}/${item.id} lists itself as an alternate`).not.toBe(item.id)
        }
      }
    }
  })

  it('every requiresPhase reference resolves to a registered program and one of its phases', () => {
    for (const program of programList()) {
      for (const item of allItems(program)) {
        const gate = item.requiresPhase
        if (!gate) continue
        const target = PROGRAMS[gate.programId]
        expect(target, `${program.id}/${item.id} → requiresPhase names unregistered program '${gate.programId}'`).toBeDefined()
        expect(
          target?.phases.some(p => p.id === gate.phaseId),
          `${program.id}/${item.id} → '${gate.programId}' has no phase '${gate.phaseId}'`,
        ).toBe(true)
      }
    }
  })

  it('program priorities are distinct and ordered per the architecture doc', () => {
    const priorities = programList().map(p => [p.id, p.priority] as const)
    const values = priorities.map(([, n]) => n)
    expect(new Set(values).size, `duplicate priorities: ${JSON.stringify(priorities)}`).toBe(values.length)
    expect(programList().map(p => p.id)).toEqual(['tibant', 'knee', 'wrist', 'fingers', 'strength', 'cardio'])
  })

  it('workout items declare sizes; non-workout items do not', () => {
    for (const program of programList()) {
      for (const item of allItems(program)) {
        if (item.bucket === 'workout') {
          expect(item.workoutSizes?.length, `${program.id}/${item.id} workout item missing workoutSizes`).toBeTruthy()
        } else {
          expect(item.workoutSizes, `${program.id}/${item.id} non-workout item has workoutSizes`).toBeUndefined()
        }
      }
    }
  })

  it('every phase has exit criteria and at least one item', () => {
    for (const program of programList()) {
      for (const phase of program.phases) {
        expect(phase.items.length, `${program.id}/${phase.id} has no items`).toBeGreaterThan(0)
        expect(phase.exitCriteria.trim(), `${program.id}/${phase.id} missing exitCriteria`).toBeTruthy()
      }
    }
  })
})
