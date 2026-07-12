export type Phase =
  | 'phase1'
  | 'phase2'
  | 'pregame'
  | 'postgame'
  // Durability — full injury-proofing program, grouped by the guide's schedule
  | 'dura_heavy' // heavy strength: calf/Achilles + knees & hips — 2×/week
  | 'dura_small' // small-joint strength: ankle band, wrists, grip — 2–3×/week
  | 'dura_daily' // balance, reactive landing & tendon glides — daily

export type Exercise = {
  id: string
  name: string
  targetMuscle?: string
  cue: string
  instructions?: string
  images: string[]
  demoUrl?: string // direct video demo; falls back to a YouTube search when absent
  whyItMatters?: string
  progression?: string
}

export type ProtocolItem = {
  id: string
  phase: Phase
  exerciseId: string
  sets: number
  reps?: number
  durationSeconds?: number
  displayAmount: string
  tempo?: string
  load?: string
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

  // ── Durability program: Ankles & lower leg ──────────────────────────
  d_ankle4way: {
    id: 'd_ankle4way',
    name: '4-Way Banded Ankle',
    targetMuscle: 'Peroneals',
    cue: 'Slow all four ways. Give eversion the most work.',
    instructions:
      'Move the foot all four ways — out, in, up, down — slow against the band. Give the outward (eversion) direction the most attention; that’s your anti-roll insurance.',
    whyItMatters:
      'The muscles on the outside of the shin (peroneals) actively stop the ankle rolling inward. Strong ones raise the threshold before a sprain can happen.',
    progression: 'Thicker band, then do it while balancing on that foot.',
    images: [],
    demoUrl: 'https://www.youtube.com/watch?v=bSgoNvcZGG4',
  },
  d_sl_balance: {
    id: 'd_sl_balance',
    name: 'Single-Leg Balance',
    targetMuscle: 'Proprioception',
    cue: 'Stand on one foot, then close your eyes.',
    instructions:
      'Stand on one foot, steady — then close your eyes. That’s where the real training is. Keep a slight arch and the ankle neutral; let it work to stay centered.',
    whyItMatters:
      'A sprain wipes out the ankle’s position sense. Balance drills rebuild the reflex that fires the stabilizers before the joint rolls — the most evidence-backed way to stop re-spraining.',
    progression: 'Eyes closed → couch cushion / wobble pad → add a ball toss or head turns.',
    images: [],
    demoUrl: 'https://www.youtube.com/watch?v=tuA9yGQZOII',
  },
  d_hop_stick: {
    id: 'd_hop_stick',
    name: 'Hop & Stick',
    targetMuscle: 'Reactive landing',
    cue: 'Land soft and quiet, then freeze 2–3s.',
    instructions:
      'Small hop forward onto one leg; land soft and quiet and freeze for 2–3 seconds — knee soft, foot flat, no wobble. Then reset and go again.',
    whyItMatters:
      'Games don’t roll ankles in slow motion. This teaches the joint to absorb impact and stabilize instantly — the exact moment real sprains happen on cuts and landings.',
    progression: 'Hop farther, then side-to-side, then onto slightly uneven ground.',
    images: [],
    demoUrl: 'https://www.youtube.com/watch?v=wGJVnRiwIQ4',
  },
  d_calf_straight: {
    id: 'd_calf_straight',
    name: 'Straight-Knee Calf Raise',
    targetMuscle: 'Gastroc · Achilles',
    cue: 'Rise onto the big toe; lower below level, no bounce.',
    instructions:
      'Rise all the way onto the big toe; lower under control below level. No bounce at the bottom.',
    whyItMatters:
      'Builds push-off power and raw Achilles capacity — the tendon that ruptures is the one you never loaded.',
    progression: 'Add weight once you clear 8 clean reps two sessions running.',
    images: [],
    demoUrl: 'https://www.youtube.com/watch?v=HvvqTpTongY',
  },
  d_calf_bent: {
    id: 'd_calf_bent',
    name: 'Bent-Knee Calf Raise',
    targetMuscle: 'Soleus',
    cue: 'Knee bent ~90° so the soleus does the work.',
    instructions:
      'Keep the knee bent ~90° so the soleus does the work, not the big calf muscle.',
    whyItMatters:
      'The soleus absorbs most of your running and landing load — the piece straight-knee raises quietly skip.',
    progression: 'Load it up; this muscle tolerates a lot. Slow the lower before adding reps.',
    images: [],
    demoUrl: 'https://www.youtube.com/watch?v=Lv9rklLUp2k',
  },
  d_heel_drop: {
    id: 'd_heel_drop',
    name: 'Eccentric Heel Drop (Alfredson)',
    targetMuscle: 'Achilles · remodeling',
    cue: 'Up on two, lower slow on one, heel below the step.',
    instructions:
      'Rise on two feet, then lower slowly on one — let the heel sink below the step for full range.',
    whyItMatters:
      'The specific movement shown to remodel Achilles tissue. Do it always; lean on it if the tendon ever grumbles.',
    progression: 'Add a loaded pack. Keep the lower slow and full-depth. Do straight- and bent-knee versions.',
    images: [],
    demoUrl: 'https://www.youtube.com/watch?v=fHHbn_Odk4E',
  },

  // ── Durability program: Knees & hips ────────────────────────────────
  d_step_down_ecc: {
    id: 'd_step_down_ecc',
    name: 'Eccentric Step-Down',
    targetMuscle: 'Patellar tendon',
    cue: 'Standing knee over toes — don’t let it cave. Tap softly.',
    instructions:
      'Keep the standing knee stacked over the toes — don’t let it cave inward. Tap the floor softly.',
    whyItMatters:
      'Loads the patellar tendon and trains the knee to absorb landing force in the exact position it usually gives out.',
    progression: 'Raise the box height first, then add dumbbells.',
    images: [],
    demoUrl: 'https://www.youtube.com/watch?v=aZq-KMOjNSQ',
  },
  d_bulgarian: {
    id: 'd_bulgarian',
    name: 'Bulgarian Split Squat',
    targetMuscle: 'Quad · glute',
    cue: 'Front knee over the foot; drive through the front heel.',
    instructions:
      'Front knee tracks over the front foot; drive most of the weight through the front heel.',
    whyItMatters:
      'Single-leg strength and hip control are the foundation of changing direction hard without blowing a knee.',
    progression: 'Add weight, then add a 1-second pause at the bottom.',
    images: [],
    demoUrl: 'https://www.youtube.com/watch?v=VPhhE6bBzZE',
  },
  d_nordic: {
    id: 'd_nordic',
    name: 'Nordic Hamstring Lower',
    targetMuscle: 'Hamstring · eccentric',
    cue: 'Straight line knees-to-shoulders; resist the fall.',
    instructions:
      'Hold a straight line from knees to shoulders — resist the fall, catch yourself with your hands.',
    whyItMatters:
      'The single best-evidenced move for preventing hamstring strains — your body’s deceleration cable.',
    progression: 'It’s hard. Start with partial range or a band’s help, then lower further over weeks.',
    images: [],
    demoUrl: 'https://www.youtube.com/watch?v=_e9vFU9-tkc',
  },
  d_sl_rdl: {
    id: 'd_sl_rdl',
    name: 'Single-Leg RDL',
    targetMuscle: 'Hamstring · balance',
    cue: 'Hinge at the hip, flat back, hips level.',
    instructions:
      'Hinge at the hip — don’t squat. Flat back, hips level, no opening up to the side.',
    whyItMatters:
      'Trains the posterior chain at length plus the ankle-and-hip balance that keeps you steady driving to the rim.',
    progression: 'Add load; slow the lower before you chase more depth.',
    images: [],
    demoUrl: 'https://www.youtube.com/watch?v=Zfr6wizR8rs',
  },

  // ── Durability program: Wrists & forearms ───────────────────────────
  d_wrist_flexext: {
    id: 'd_wrist_flexext',
    name: 'Wrist Flexion & Extension',
    targetMuscle: 'Flexors + extensors',
    cue: 'Curl up and lower slow — don’t skip palm-down.',
    instructions:
      'Forearm on a table, wrist over the edge, light weight. Curl up and lower slow — palm-down (extensors) and palm-up (flexors). Don’t skip palm-down; it’s the weak one.',
    whyItMatters:
      'Balanced flexor and extensor strength steadies the wrist under a sudden load — and the extensors on top of the forearm are usually the weak, injury-prone side.',
    progression: 'Add weight slowly — small joints need a gentle ramp.',
    images: [],
    demoUrl: 'https://www.youtube.com/watch?v=eOYwu-dHAD4',
  },
  d_wrist_deviation: {
    id: 'd_wrist_deviation',
    name: 'Radial & Ulnar Deviation',
    targetMuscle: 'Side-to-side',
    cue: 'Hammer grip, thumb up; tilt slow, forearm still.',
    instructions:
      'Hold a light dumbbell like a hammer, thumb up; tilt the wrist up and down, slow. Keep the forearm still — motion comes only from the wrist.',
    whyItMatters:
      'These side-to-side muscles are what a racquet swing and a one-handed catch load hardest — and almost nobody trains them, which is why they’re a common tweak.',
    progression: 'Hold the weight farther out (longer lever), or add load.',
    images: [],
    demoUrl: 'https://www.youtube.com/watch?v=rOWoiAWEvwQ',
  },
  d_wrist_rotation: {
    id: 'd_wrist_rotation',
    name: 'Pronation & Supination',
    targetMuscle: 'Rotational control',
    cue: 'Elbow at side, rotate palm up then down, controlled.',
    instructions:
      'Elbow at your side bent 90°, hold one end of a dumbbell like a hammer; rotate the palm up, then down, controlled the whole way.',
    whyItMatters:
      'Rotational strength steadies the wrist and forearm when you catch, swing, or brace a fall — the twisting load a straight curl misses.',
    progression: 'Longer lever or more weight; keep it smooth, no jerking.',
    images: [],
    demoUrl: 'https://www.youtube.com/watch?v=9XVf_yGLXNk',
  },

  // ── Durability program: Fingers & grip ──────────────────────────────
  d_finger_ext: {
    id: 'd_finger_ext',
    name: 'Finger Extension (Band)',
    targetMuscle: 'Extensors · balance',
    cue: 'Spread fingers wide against the band, hold a beat.',
    instructions:
      'Loop a band around the fingertips; spread the fingers wide against it, hold a beat, release slow. A hair tie works to start.',
    whyItMatters:
      'Everything you do grips the fingers; the openers get neglected. Training them balances the joints and braces them against the sideways forces that sprain a finger.',
    progression: 'Add a second band, or use a dedicated finger-extension trainer.',
    images: [],
    demoUrl: 'https://www.youtube.com/watch?v=lQPppTK7mFc',
  },
  d_grip_crush: {
    id: 'd_grip_crush',
    name: 'Grip / Crush',
    targetMuscle: 'Flexors · grip',
    cue: 'Crush closed, hold a beat, open under control.',
    instructions:
      'Squeeze a gripper (or a ball / rolled towel) closed, crush for a beat, open under control. Set a gripper deep in the palm — quality reps, not sloppy ones.',
    whyItMatters:
      'A strong grip catches and holds the ball and controls the racquet — and it’s one of the best single markers of long-term health. Balance it with the extension work above.',
    progression: 'Heavier gripper once you own 3×12 clean. Respect tendons — a few times a week, not daily max effort.',
    images: [],
    demoUrl: 'https://www.youtube.com/watch?v=6l1FyKL_dmg',
  },
  d_tendon_glides: {
    id: 'd_tendon_glides',
    name: 'Tendon Glides',
    targetMuscle: 'Tendon health',
    cue: 'Move through the shapes slow, taking each fully.',
    instructions:
      'Move the fingers through the shapes — straight, hook, full fist, tabletop, straight fist — slow, taking each one fully. No weight.',
    whyItMatters:
      'Keeps the finger tendons sliding smoothly through their sheaths, which maintains full motion and helps a jammed finger recover faster. Safe to do often.',
    progression: 'This is maintenance — keep it light and frequent, especially after a knock.',
    images: [],
    demoUrl: 'https://www.youtube.com/watch?v=grbacaaEwjg',
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

  // ── Durability · Heavy strength (2×/week, non-consecutive days) ──────
  { id: 'du-04', phase: 'dura_heavy', exerciseId: 'd_calf_straight', sets: 4, reps: 8, displayAmount: '6–8 reps', tempo: '3s down · 2s up', load: 'Heavy' },
  { id: 'du-05', phase: 'dura_heavy', exerciseId: 'd_calf_bent', sets: 4, reps: 10, displayAmount: '8–10 reps', tempo: '3s down · 2s up', load: 'Heavy' },
  { id: 'du-06', phase: 'dura_heavy', exerciseId: 'd_heel_drop', sets: 3, reps: 15, displayAmount: '10–15 reps', tempo: '3s down · one leg', load: 'Bodyweight → vest' },
  { id: 'du-07', phase: 'dura_heavy', exerciseId: 'd_step_down_ecc', sets: 3, reps: 8, displayAmount: '8 per leg', tempo: '3s down · tap · 1s up', load: 'Bodyweight → DBs' },
  { id: 'du-08', phase: 'dura_heavy', exerciseId: 'd_bulgarian', sets: 3, reps: 8, displayAmount: '8 per leg', tempo: '3s down · 1s up', load: 'Dumbbells' },
  { id: 'du-09', phase: 'dura_heavy', exerciseId: 'd_nordic', sets: 3, reps: 8, displayAmount: '5–8 reps', tempo: 'Slow down · push up', load: 'Bodyweight' },
  { id: 'du-10', phase: 'dura_heavy', exerciseId: 'd_sl_rdl', sets: 3, reps: 8, displayAmount: '8 per leg', tempo: '3s down · 2s up', load: 'DB / KB' },

  // ── Durability · Small-joint strength (2–3×/week, light & high-rep) ──
  { id: 'du-01', phase: 'dura_small', exerciseId: 'd_ankle4way', sets: 3, reps: 20, displayAmount: '15–20 per direction', tempo: 'Slow + hold', load: 'Light band' },
  { id: 'du-11', phase: 'dura_small', exerciseId: 'd_wrist_flexext', sets: 3, reps: 20, displayAmount: '15–20 each way', tempo: 'Slow both ways', load: 'Light DB' },
  { id: 'du-12', phase: 'dura_small', exerciseId: 'd_wrist_deviation', sets: 3, reps: 15, displayAmount: '12–15 per way', tempo: 'Slow · hold', load: 'Light' },
  { id: 'du-13', phase: 'dura_small', exerciseId: 'd_wrist_rotation', sets: 3, reps: 15, displayAmount: '12–15 reps', tempo: 'Slow rotate', load: 'Light' },
  { id: 'du-14', phase: 'dura_small', exerciseId: 'd_finger_ext', sets: 3, reps: 20, displayAmount: '15–20 reps', tempo: 'Open + hold 5s', load: 'Band' },
  { id: 'du-15', phase: 'dura_small', exerciseId: 'd_grip_crush', sets: 3, reps: 12, displayAmount: '8–12 reps', tempo: 'Crush + hold', load: 'Moderate' },

  // ── Durability · Daily (balance, reactive landing & tendon glides) ───
  { id: 'du-02', phase: 'dura_daily', exerciseId: 'd_sl_balance', sets: 3, durationSeconds: 40, displayAmount: '30–45s per leg', tempo: 'Eyes closed', load: 'Bodyweight' },
  { id: 'du-03', phase: 'dura_daily', exerciseId: 'd_hop_stick', sets: 3, reps: 5, displayAmount: '5 per leg', tempo: 'Stick 2–3s', load: 'Bodyweight' },
  { id: 'du-16', phase: 'dura_daily', exerciseId: 'd_tendon_glides', sets: 2, displayAmount: '5–10 cycles', tempo: 'Slow · full shapes', load: 'None' },
]

export function protocolFor(phase: Phase): ProtocolItem[] {
  return PROTOCOL.filter(p => p.phase === phase)
}

export function exercise(id: string): Exercise {
  return EXERCISES[id]
}

/** The durability program, grouped by the guide's own "how to run it" schedule. */
export const DURABILITY_GROUPS: { phase: Phase; title: string; cadence: string }[] = [
  { phase: 'dura_heavy', title: 'Heavy strength', cadence: '2×/week · non-consecutive days · progress by adding weight' },
  { phase: 'dura_small', title: 'Small joints', cadence: '2–3×/week · light & high-rep · ramp gently' },
  { phase: 'dura_daily', title: 'Daily — balance & glides', cadence: 'daily is great · low-load, thrives on frequency' },
]

/** Every protocol item in the durability program, across all three groups. */
export function durabilityItems(): ProtocolItem[] {
  return DURABILITY_GROUPS.flatMap(g => protocolFor(g.phase))
}
