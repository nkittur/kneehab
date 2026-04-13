export type Phase = 'phase1' | 'phase2' | 'pregame' | 'postgame'

export type Exercise = {
  id: string
  name: string
  targetMuscle?: string
  cue: string
  instructions?: string
  images: string[]
}

export type ProtocolItem = {
  id: string
  phase: Phase
  exerciseId: string
  sets: number
  reps?: number
  durationSeconds?: number
  displayAmount: string
  notes?: string
}

export const EXERCISES: Record<string, Exercise> = {
  clamshells: {
    id: 'clamshells',
    name: 'Clamshells',
    targetMuscle: 'Glute Medius',
    cue: "Isolate Glute Medius. Don't roll pelvis back.",
    instructions: 'Lie on your side, knees bent ~45°, stacked. Keep feet together and lift the top knee by rotating at the hip. Do not let the pelvis roll backward.',
    images: ['clamshells.gif'],
  },
  slr_out: {
    id: 'slr_out',
    name: 'Straight Leg Raises (Outward Turn)',
    targetMuscle: 'VMO',
    cue: 'Rotate leg 30° outward. Target VMO.',
    instructions: 'Lie on your back with the opposite knee bent. Rotate the working leg ~30° outward, lock the knee, and lift ~12" off the floor. Lower slowly.',
    images: ['slr-out.gif'],
  },
  hip_flexor_stretch: {
    id: 'hip_flexor_stretch',
    name: 'Kneeling Hip Flexor Stretch',
    cue: 'Push hips forward, chest tall.',
    instructions: 'Kneel on one knee with the other foot forward. Tuck the pelvis under and press hips forward. Keep chest tall.',
    images: ['hip-flexor-stretch.gif'],
  },
  itb_foam_roll: {
    id: 'itb_foam_roll',
    name: 'IT Band Foam Rolling',
    cue: 'Avoid rolling directly over the joint.',
    instructions: 'Lie on your side on a foam roller along the outer thigh between hip and knee. Roll slowly. Do not roll over the knee joint itself.',
    images: ['itb-foam.gif'],
  },
  banded_lat_walks: {
    id: 'banded_lat_walks',
    name: 'Banded Lateral Walks',
    cue: 'Do not let knees cave inward.',
    instructions: 'Loop a mini-band above knees or at ankles. Quarter-squat stance. Step sideways keeping tension on the band. Knees out.',
    images: ['banded-lateral-walks.gif'],
  },
  step_downs: {
    id: 'step_downs',
    name: 'Controlled Step-Downs',
    cue: 'Watch knee in mirror. NO valgus (caving).',
    instructions: 'Stand on a step. Slowly lower the non-working heel toward the floor, then return. Keep working knee tracking over the middle toes.',
    images: ['step-downs.gif'],
  },
  wall_sits_ball: {
    id: 'wall_sits_ball',
    name: 'Wall Sits with Ball',
    cue: 'Squeeze ball to fire VMO.',
    instructions: 'Back against wall, knees ~90°. Place a small ball between knees and squeeze continuously throughout the hold.',
    images: ['wall-sit-ball.gif'],
  },
  skater_stops: {
    id: 'skater_stops',
    name: 'Skater Stops',
    cue: 'Freeze on landing. Knee over shoelaces.',
    instructions: 'Bound laterally from one leg to the other, freezing on landing for 1–2 seconds. Knee tracks over middle toes; no caving.',
    images: ['skater-stops.gif'],
  },
  ice: {
    id: 'ice',
    name: 'Ice Therapy',
    cue: 'Apply if throbbing or heat is felt.',
    instructions: 'Ice the knee for 15 minutes after sport if you feel throbbing or heat.',
    images: ['ice.gif'],
  },
}

export const PROTOCOL: ProtocolItem[] = [
  // Phase 1
  { id: 'p1-clam', phase: 'phase1', exerciseId: 'clamshells', sets: 3, reps: 15, displayAmount: '15 per side' },
  { id: 'p1-slr', phase: 'phase1', exerciseId: 'slr_out', sets: 3, reps: 12, displayAmount: '12 reps' },
  { id: 'p1-hip', phase: 'phase1', exerciseId: 'hip_flexor_stretch', sets: 3, durationSeconds: 30, displayAmount: '30s hold' },
  { id: 'p1-itb', phase: 'phase1', exerciseId: 'itb_foam_roll', sets: 1, durationSeconds: 150, displayAmount: '2–3 min' },
  // Phase 2
  { id: 'p2-band', phase: 'phase2', exerciseId: 'banded_lat_walks', sets: 3, reps: 15, displayAmount: '15 steps per side' },
  { id: 'p2-step', phase: 'phase2', exerciseId: 'step_downs', sets: 3, reps: 10, displayAmount: '10 slow reps' },
  { id: 'p2-wall', phase: 'phase2', exerciseId: 'wall_sits_ball', sets: 3, durationSeconds: 40, displayAmount: '30–45s hold' },
  { id: 'p2-skat', phase: 'phase2', exerciseId: 'skater_stops', sets: 3, reps: 8, displayAmount: '8 per side' },
  // Pre-game
  { id: 'pg-clam', phase: 'pregame', exerciseId: 'clamshells', sets: 1, reps: 15, displayAmount: '15 per side', notes: 'Wake up the brakes.' },
  { id: 'pg-band', phase: 'pregame', exerciseId: 'banded_lat_walks', sets: 1, reps: 15, displayAmount: '15 steps per side', notes: 'Prime the hips for pivots.' },
  // Post-game
  { id: 'post-ice', phase: 'postgame', exerciseId: 'ice', sets: 1, durationSeconds: 900, displayAmount: '15 min', notes: 'Apply if throbbing or heat is felt.' },
]

export function protocolFor(phase: Phase): ProtocolItem[] {
  return PROTOCOL.filter(p => p.phase === phase)
}

export function exercise(id: string): Exercise {
  return EXERCISES[id]
}
