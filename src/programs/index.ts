import type { Exercise, PartialProgramRegistry, PhaseDef, ProgramDef } from './types'
import { kneeExercises, kneeProgram } from './knee'
import { strengthExercises, strengthProgram } from './strength'
import { tibantExercises, tibantProgram } from './tibant'
import { wristExercises, wristProgram } from './wrist'
import { fingersExercises, fingersProgram } from './fingers'
import { cardioExercises, cardioProgram } from './cardio'

export type * from './types'
export { tibantNotes } from './tibant'
export { wristSelfAssessment } from './wrist'
export { fingersNotes, wristFingerInteractions } from './fingers'
export { sequencingRules } from './strength'
export { cardioNotes } from './cardio'

/**
 * The live program registry ('body' is metric logging only and has no program
 * module). This is a Partial of the full `ProgramRegistry` shape.
 */
export const PROGRAMS: PartialProgramRegistry = {
  tibant: tibantProgram,
  knee: kneeProgram,
  wrist: wristProgram,
  fingers: fingersProgram,
  strength: strengthProgram,
  cardio: cardioProgram,
}

/** Every exercise across every registered program, keyed by exercise id. */
export const EXERCISES: Record<string, Exercise> = {
  ...kneeExercises,
  ...strengthExercises,
  ...tibantExercises,
  ...wristExercises,
  ...fingersExercises,
  ...cardioExercises,
}

/** The phase a program starts in — used to seed programState for new programs. */
export function initialPhaseOf(program: ProgramDef): string {
  return program.phases[0].id
}

export function exercise(id: string): Exercise | undefined {
  return EXERCISES[id]
}

/** Registered programs, most important first. */
export function programList(registry: PartialProgramRegistry = PROGRAMS): ProgramDef[] {
  return Object.values(registry)
    .filter((p): p is ProgramDef => Boolean(p))
    .sort((a, b) => a.priority - b.priority)
}

export function phaseOf(program: ProgramDef, phaseId: string): PhaseDef | undefined {
  return program.phases.find(p => p.id === phaseId)
}

/** Position of a phase in the program's order; -1 when the id is unknown. */
export function phaseIndexOf(program: ProgramDef, phaseId: string | undefined): number {
  return phaseId ? program.phases.findIndex(p => p.id === phaseId) : -1
}

/**
 * Is `phaseId` still ahead of where the program is now? Phases are ordered by
 * their position in `program.phases`. A program with no state (or a state
 * pointing at a phase that no longer exists) counts as being before every
 * phase; an unknown target is never ahead of anything.
 */
export function isPhaseAhead(
  program: ProgramDef,
  currentPhaseId: string | undefined,
  phaseId: string,
): boolean {
  const target = phaseIndexOf(program, phaseId)
  return target >= 0 && phaseIndexOf(program, currentPhaseId) < target
}

/**
 * Is `phaseId` the very next phase after the one the program is in? Gate tests
 * only ever offer a one-phase step, so a program parked two phases back does
 * not get a one-tap skip out of it. A program with no state (or a state
 * pointing at a phase that no longer exists) counts as being in its first
 * phase, which is where it would be seeded.
 */
export function isNextPhase(
  program: ProgramDef,
  currentPhaseId: string | undefined,
  phaseId: string,
): boolean {
  const target = phaseIndexOf(program, phaseId)
  const current = Math.max(phaseIndexOf(program, currentPhaseId), 0)
  return target >= 0 && target === current + 1
}
