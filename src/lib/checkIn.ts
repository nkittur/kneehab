import type { CheckIn } from './db'
import type { PhaseDef } from '@/programs/types'

/** Pain answers at or below this, and every yes/no answered yes, meet the gates. */
export const PAIN_GATE = 3

/**
 * Does this set of check-in answers meet the phase's advancement gates? The app
 * only ever *proposes* advancement on the back of this — never auto-advances.
 */
export function gatesMet(phase: PhaseDef, answers: CheckIn['answers']): boolean {
  const questions = phase.checkInQuestions ?? []
  if (questions.length === 0) return false
  return questions.every(q =>
    q.type === 'pain0to10'
      ? typeof answers[q.id] === 'number' && (answers[q.id] as number) <= PAIN_GATE
      : answers[q.id] === true,
  )
}
