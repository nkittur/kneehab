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
