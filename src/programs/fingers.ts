import type { CheckInQuestion, Exercise, ProgramDef, ProtocolItem } from './types'

/**
 * Fingers — grip strength & jam-proofing, generated from
 * `docs/research/wrist-fingers.md` (Program 2).
 *
 * This is strength training, not rehab: there is no injury to heal and no exit
 * criteria in the medical sense, just three levels you graduate through and
 * then maintain, 3–5 sessions per week, indefinitely. Most of it is genuinely
 * couch work.
 *
 * Evidence honesty is baked in — see `fingersNotes`. No study shows finger
 * strength training reduces jammed-finger incidence in basketball; the
 * mechanism is inferred from the climbing literature, and it is labelled as
 * inference wherever it appears.
 */

// ─────────────────────────────────────────────────────────────────────────────
// Non-exercise content: the two things better-evidenced than the training
// ─────────────────────────────────────────────────────────────────────────────

export const fingersNotes: {
  taping: string[]
  technique: string[]
  evidence: string
} = {
  taping: [
    'Buddy-tape the ring/middle pair — or a previously injured digit to its neighbour — for competitive games, from day one. Taping is protective equipment, not training: it does not wait on any level or phase.',
    'Tape above and below the PIP joint, never across the joint itself.',
    'Snug, not tourniquet-tight — you should still get quick capillary refill in the fingertip. A pale, cold or numb fingertip means take it off.',
    'Do not tape the index to the middle finger; it kills ball control.',
    'Taping is not a substitute for catching technique. It blocks the sideways and hyperextension stress that sprains a volar plate; it does not stop the ball arriving at your fingertips.',
    'Drop the tape for practice as tolerance builds; keep it for competitive play. Pre-made buddy straps work if tape is a hassle.',
  ],
  technique: [
    'Meet the ball, thumbs in, ball into the palms, then give. The injury mechanism is literally the ball striking the fingertip instead of landing in the palm.',
    'Two hands whenever possible; move toward the pass rather than reaching for it.',
    'Soft, giving arms — absorb through six inches of elbow travel rather than catching rigid.',
    'The failure mode to eliminate is the one-handed stab with straight, splayed fingers under time pressure. If reactive drills degrade into that, slow down until the technique holds.',
  ],
  evidence:
    'Ranked by how well each leg is supported: taping > technique > strength. Buddy taping is the established treatment for volar plate injuries and mechanically blocks the injury mechanism (strongest). Catching technique addresses the cause directly but is empirically thin (mechanistically strong). Strength and tissue conditioning is the weakest leg — grip training reliably adds ~10–30% crush strength over 4–12 weeks and elite climbers show thicker capsules, collateral ligaments, palmar plates, pulleys and flexor tendons plus ~0.86–0.98 mm more cortical bone than controls, but no trial links any of that to fewer or milder jams in a basketball gym. That link is extrapolation, and it is labelled as such throughout. Grip qualities also transfer poorly between each other — crush, support, pinch and extension are largely separate and each has to be trained. Rice-bucket work has essentially no formal literature; its plausible niche is support-grip endurance and extensor work, not maximal strength.',
}

/**
 * Sequencing rules between the wrist and finger programs (they share a
 * forearm). The planner may consume these later; for now they are mirrored as
 * notes on the affected items.
 */
export const wristFingerInteractions: string[] = [
  'R1 — Wrist phase gates finger level. Wrist Phase 1: Base only (no grippers above light, no hangs, no rice bucket, no pinch holds, no fingertip push-ups). Wrist Phase 2: Base plus light gripper and rice bucket if painless — no weighted hangs, pinch blocks, edge hangs or floor fingertip push-ups. Wrist Phase 3: Intermediate, still no edge hangs, weighted pinch blocks or heavy gripper holds. Wrist Phase 4 or discharged: Advanced unlocked.',
  'R2 — Extensor work is the exception and can start immediately. Extensor band work and putty spread are low-load and pull opposite the flexor-dominant pattern that drives most overuse forearm pain; they are safe in wrist Phase 1 and appear in both programs.',
  'R3 — Grip work loads the wrist even when it does not feel like it. Hard crushing recruits the finger flexors that cross the wrist and co-contracts the wrist extensors to stabilise. If a gripper session leaves the wrist sore next morning, that is a wrist-program flare: apply the 24-hour rule and drop back a step in both programs.',
  'R4 — Hangs load the wrist in traction, not compression, so they usually clear earlier than push-ups. Use the wrist program’s passive dead-hang check as the test: a painless 20-second hang with no 24-hour flare green-lights support hangs and towel hangs even if flat-palm push-ups are not there yet.',
  'R5 — Push-ups are the shared spine. Never work a fingertip variant at a rung the flat-palm version has not already cleared: wall lean → wall push-up → high incline → low incline → quadruped rock → fist → full push-up, with the fingertip branch (wall fingertip → floor fingertip) hanging off a clean full push-up.',
  'R6 — Do not progress both programs in the same week. Add load to the wrist program or the finger program, never both — if something flares you want to know which one did it.',
  'R7 — Volume budget: 3–4 hard forearm/hand sessions per week, ideally not consecutive days, and a pickleball session counts as one of them. Base-level couch work (band, putty, tendon glides) is low enough load to run daily on top.',
  'R8 — Taping does not wait. Buddy taping is protective equipment; use it in games from day one regardless of what phase or level anything else is in.',
  'R9 — De Quervain variant blocks a specific thing. With a positive Finkelstein, defer firm-grade tip pinch, heavy pinch plate holds, and the radial half of the hammer deviation drill until radial-side symptoms settle.',
  'R10 — ECU variant blocks another. With a positive ECU screen, avoid loaded end-range supination and any hanging or rotational drill that produces the snap, until it has been assessed.',
]

// ─────────────────────────────────────────────────────────────────────────────
// Exercises
// ─────────────────────────────────────────────────────────────────────────────

export const fingersExercises: Record<string, Exercise> = {
  // ── Level 1 — Base ──────────────────────────────────────────────────
  'finger-ext-band-base': {
    id: 'finger-ext-band-base',
    name: 'Rubber band finger extension',
    targetArea: 'Finger extensors',
    cue: 'Spread as if pushing four walls apart, then take 2 seconds to close.',
    instructions:
      'Band around all the fingertips and the thumb. Open the hand fully against it, then close slowly.',
    whyItMatters:
      'The extensors are chronically outmatched by the flexors and are the neglected half of hand strength — this is the cheapest correction available.',
    contextTag: 'couch',
    equipment: ['band'],
    commonMistakes: [
      'Index and thumb doing all the work',
      'Band placed too far down toward the knuckles',
    ],
    progression: 'Two bands; a graded extensor trainer; then slow eccentric closes.',
    regression: 'Thinner band; band around three fingers only.',
  },
  'putty-gross-grip': {
    id: 'putty-gross-grip',
    name: 'Putty full-hand squeeze',
    targetArea: 'Crush grip',
    cue: 'Squeeze until the putty is fully through the fingers, not just dented.',
    instructions:
      'Squeeze a ball of therapy putty in a full-hand grip, roll it back out, repeat. Putty is colour-graded, so resistance is dosable one step at a time.',
    contextTag: 'couch',
    equipment: ['putty'],
    commonMistakes: ['Skipping grades too fast — the single most common error in home hand programs'],
    progression: 'Next putty colour when the current one is easy for 3 sets.',
    regression: 'Softer grade; fewer reps.',
  },
  'putty-tip-pinch': {
    id: 'putty-tip-pinch',
    name: 'Putty tip pinch, thumb to each finger',
    targetArea: 'Pinch grip',
    cue: 'Pinch tip-to-tip, keeping the finger joints slightly bent, not collapsed.',
    instructions:
      'Pinch a piece of putty between the thumb tip and each fingertip in turn, working through all four digits.',
    contextTag: 'couch',
    equipment: ['putty'],
    commonMistakes: ['Letting the thumb IP joint hyperextend', 'Only using the index'],
    progression: 'Firmer putty; add a 3-second hold.',
    regression: 'Softer putty; index and middle only.',
  },
  'putty-finger-spread': {
    id: 'putty-finger-spread',
    name: 'Putty finger abduction (spread)',
    targetArea: 'Intrinsics · finger abductors',
    cue: 'Move at the knuckles; keep the fingers straight.',
    instructions:
      'Wrap putty around two adjacent fingers and spread them apart against it. Work through all the pairs.',
    contextTag: 'couch',
    equipment: ['putty'],
    commonMistakes: [
      'Using the wrist to help',
      'Skipping the ring/little pair — the weakest and the pair most often buddy-taped',
    ],
    progression: 'Firmer putty; hold the spread 3 s.',
    regression: 'Softer putty; use a rubber band around two fingers.',
  },
  'tendon-glide-fingers': {
    id: 'tendon-glide-fingers',
    name: 'Finger tendon glide series',
    targetArea: 'Flexor tendons',
    cue: 'Hit each distinct shape and pause.',
    instructions:
      'Cycle through straight → hook fist → full fist → tabletop → straight fist, pausing in each position.',
    contextTag: 'couch',
    equipment: [],
    commonMistakes: ['Blurring the shapes together', 'Going fast'],
    progression: 'Add gentle overpressure into each end position.',
    regression: 'Fewer positions.',
  },
  'intrinsic-lumbrical-hold': {
    id: 'intrinsic-lumbrical-hold',
    name: 'Tabletop / lumbrical position hold',
    targetArea: 'Intrinsics · lumbricals',
    cue: 'Knuckles bent, finger joints dead straight — a right angle at the knuckle only.',
    instructions:
      'Hold the "tabletop" hand shape (knuckles bent ~90°, fingers straight) and resist gently with the other hand or a band across the fingers.',
    contextTag: 'couch',
    equipment: [],
    commonMistakes: ['Curling the fingertips — that is the flexors taking over'],
    progression: 'Add band resistance; hold longer.',
    regression: 'No resistance; shorter holds.',
  },
  'finger-lifts-table': {
    id: 'finger-lifts-table',
    name: 'Individual finger lifts, palm flat',
    targetArea: 'Finger extensors',
    cue: 'Keep the other four fingers pressed flat.',
    instructions:
      'Palm flat on a table. Lift one finger at a time as high as possible and hold 2 s, then lower.',
    contextTag: 'couch',
    equipment: [],
    commonMistakes: ['Lifting the whole hand', 'Rushing'],
    progression: 'Add a light weight or band over the finger; lift two non-adjacent fingers.',
    regression: 'Assist the lift with the other hand.',
  },
  'thumb-opposition-putty': {
    id: 'thumb-opposition-putty',
    name: 'Thumb opposition press into putty',
    targetArea: 'Thenar · opposition',
    cue: 'Form a round "O", not a pinched flat shape.',
    instructions:
      'Press the thumb pad to each fingertip with putty between, squeezing it to a flat disc.',
    contextTag: 'couch',
    equipment: ['putty'],
    commonMistakes: ['Collapsing the thumb joint'],
    progression: 'Firmer putty.',
    regression: 'Softer putty; index and middle only.',
  },
  'gripper-light': {
    id: 'gripper-light',
    name: 'Light gripper reps',
    targetArea: 'Crush grip',
    cue: 'Full close, full open, controlled both directions.',
    instructions:
      'An easy-setting adjustable gripper for high reps. Grippers train crush grip specifically — one of three grip qualities, not all of them.',
    contextTag: 'couch',
    equipment: ['gripper'],
    commonMistakes: [
      'Partial reps',
      'Going heavy immediately',
      'Doing this while the wrist is acute',
    ],
    progression: 'Increase the setting when 3×20 is easy, then move to the moderate gripper.',
    regression: 'Easier setting; squeeze a ball instead.',
  },
  'catch-technique-drill': {
    id: 'catch-technique-drill',
    name: 'Two-hand catch, palm-target rehearsal',
    targetArea: 'Catching technique',
    cue: '"Meet the ball, thumbs in, ball into the palms, then give."',
    instructions:
      'Deliberate slow-motion catches focusing on the palm as the target, off a partner or a wall.',
    whyItMatters:
      'The injury mechanism is the ball hitting the fingertip instead of the palm — this is the most directly causal item in the whole program.',
    contextTag: 'standing',
    equipment: ['basketball'],
    commonMistakes: [
      'Catching with stiff, straight, splayed fingers',
      'One-handed stabs at chest passes',
      'Ball arriving at the fingertips because you reached late',
    ],
    progression: 'Faster passes → off-angle passes → buddy-taped drill → reactive wall catches.',
    regression: 'Slower, softer ball, closer range.',
  },

  // ── Level 2 — Intermediate ──────────────────────────────────────────
  'finger-ext-band-heavy': {
    id: 'finger-ext-band-heavy',
    name: 'Heavier extensor band, full range',
    targetArea: 'Finger extensors',
    cue: 'Full spread; keep the wrist neutral, not extended.',
    instructions:
      'The base band exercise with a firm band or a purpose-built extensor trainer, at progressive resistance.',
    contextTag: 'couch',
    equipment: ['band'],
    commonMistakes: ['Letting the wrist do the extending instead of the fingers'],
    progression: 'Firmer resistance; single-finger work.',
    regression: 'Back to the light band.',
  },
  'finger-ext-eccentric': {
    id: 'finger-ext-eccentric',
    name: 'Slow eccentric finger extension',
    targetArea: 'Finger extensors',
    cue: 'Count "one-two-three-four" on the way closed, every rep.',
    instructions: 'Open against the band, then take 4 slow seconds to close.',
    contextTag: 'couch',
    equipment: ['band'],
    commonMistakes: ['Snapping shut', 'Skipping the count when you get tired'],
    progression: 'Firmer band; 6-second close.',
    regression: '2-second close.',
  },
  'putty-firm-grip': {
    id: 'putty-firm-grip',
    name: 'Firm putty gross grip + pinch circuit',
    targetArea: 'Crush · pinch grip',
    cue: 'The grade jump should feel hard but not painful in the joints.',
    instructions:
      'Green or blue putty through the full circuit — gross grip, tip pinch, finger spread.',
    contextTag: 'couch',
    equipment: ['putty'],
    commonMistakes: [
      'Jumping two grades at once',
      'Working through joint pain — unlike muscular fatigue, that is a stop signal',
    ],
    progression: 'Next grade.',
    regression: 'Back a grade.',
  },
  'gripper-moderate': {
    id: 'gripper-moderate',
    name: 'Moderate gripper, crush reps',
    targetArea: 'Crush grip',
    cue: 'Set the handle deep in the palm before the first rep.',
    instructions:
      'Mid-setting adjustable gripper for hard reps. Expect meaningful crush-grip gains over 4–12 weeks.',
    contextTag: 'couch',
    equipment: ['gripper'],
    commonMistakes: ['Letting the gripper slide', 'Reps that do not fully close'],
    progression: 'Harder setting, then heavy closes with a hold.',
    regression: 'Easier setting; drop back to the light gripper.',
  },
  'rice-bucket-circuit': {
    id: 'rice-bucket-circuit',
    name: 'Rice bucket circuit (dig, open, rotate, grab)',
    targetArea: 'Extensors · support-grip endurance',
    cue: 'Bury to the wrist and open the hand *against* the rice — the extension is the point.',
    instructions:
      'Hand buried in a bucket of rice: squeeze and release, open the hand against the rice, rotate the forearm, dig, grab and pull out.',
    whyItMatters:
      'Thin formal evidence — mostly rehab tradition. Its plausible niche is extensor work and support-grip endurance, not maximal strength.',
    contextTag: 'couch',
    equipment: ['rice-bucket'],
    commonMistakes: [
      'Only doing flexion drills — that is just a squishy gripper',
      'Going so long the forearm cramps',
    ],
    progression: 'Deeper bucket, longer intervals, add wrist rotation drills.',
    regression: 'Shorter intervals; use a bowl of dry beans.',
  },
  'pinch-plate-hold': {
    id: 'pinch-plate-hold',
    name: 'Two-plate / pinch block hold',
    targetArea: 'Pinch grip',
    cue: 'Thumb pad flat against the plate; keep the wrist straight.',
    instructions:
      'Pinch two smooth plates together (smooth sides out) or a pinch block, and hold for time. Pinch is a separate grip quality from crush and has to be trained on its own.',
    contextTag: 'gym',
    equipment: ['pinch-block'],
    commonMistakes: [
      'Letting the plates rest on the fingers instead of pinching',
      'Jerking on the pickup',
    ],
    progression: 'Heavier plates; longer holds; then a weighted pinch block.',
    regression: 'One lighter plate; a thick book.',
  },
  'wall-fingertip-pushup': {
    id: 'wall-fingertip-pushup',
    name: 'Wall push-up on fingertips',
    targetArea: 'Finger joints under compression',
    cue: 'Fingers slightly bent and "domed", never collapsed flat or hyperextended.',
    instructions:
      'Push-up against a wall with only the fingertips and thumb in contact. Speculative for jam-proofing — the rationale is loading the finger joints in compression through a functional range, borrowed from climbing and gymnastics practice, not from a prevention trial.',
    contextTag: 'standing',
    equipment: [],
    commonMistakes: ['Doing this on the floor first', 'Letting the joints buckle backward'],
    progression: 'Step the feet back; then incline; then floor fingertip push-ups.',
    regression: 'Stand closer; use four fingers plus the palm heel.',
  },
  'dead-hang-support': {
    id: 'dead-hang-support',
    name: 'Support-grip dead hang',
    targetArea: 'Support grip',
    cue: 'Shoulders slightly engaged, not fully passive; breathe.',
    instructions:
      'Hang from a bar with an open support grip. Trains the support grip quality, which is distinct from crush, and loads the wrist gently in traction.',
    contextTag: 'gym',
    equipment: ['pull-up-bar'],
    commonMistakes: [
      'Doing them with an active wrist or hand injury — hangs are contraindicated there',
      'Dropping off the bar suddenly',
    ],
    progression: 'Longer holds → towel hang → weighted hang → edge hang.',
    regression: 'Feet on a box taking part of the weight.',
  },
  'towel-hang-or-carry': {
    id: 'towel-hang-or-carry',
    name: 'Towel-over-bar hang or towel farmer carry',
    targetArea: 'Support grip · thick grip',
    cue: 'Thick, unstable grip — that is the point.',
    instructions:
      'Hang from towels draped over a bar, or carry dumbbells with a towel wrapped around the handles.',
    contextTag: 'gym',
    equipment: ['pull-up-bar', 'towel'],
    commonMistakes: ['Grinding the palms raw', 'Going to failure every set'],
    progression: 'Thicker towel; one towel per hand; add weight.',
    regression: 'Regular bar hang or a standard farmer carry.',
  },
  'buddy-tape-catch-drill': {
    id: 'buddy-tape-catch-drill',
    name: 'Buddy-taped catching drill',
    targetArea: 'Catching under protection',
    cue: 'Tape above and below the PIP joint, never over it. Snug, not tourniquet-tight.',
    instructions:
      'Tape ring+middle (or the previously injured digit to its neighbour) and run game-speed catching.',
    whyItMatters:
      'The highest-confidence protective intervention in the whole program: buddy taping mechanically blocks the sideways and hyperextension motion that sprains a PIP joint, and it is the standard treatment for volar plate injuries.',
    contextTag: 'standing',
    equipment: ['basketball', 'tape'],
    commonMistakes: [
      'Taping the index to the middle — it kills ball control',
      'Taping across the joint itself',
      'Taping so tight the finger goes white or numb',
      'Using tape as a substitute for technique',
    ],
    progression: 'Wear it for competitive games; drop it for practice as tolerance builds.',
    regression: 'Wear it for everything, or use a pre-made buddy strap.',
  },

  // ── Level 3 — Advanced (optional) ───────────────────────────────────
  'gripper-heavy-holds': {
    id: 'gripper-heavy-holds',
    name: 'Heavy gripper close + hold',
    targetArea: 'Crush grip',
    cue: 'Set deep in the palm, close hard, then *keep* squeezing.',
    instructions: 'Close a hard-setting gripper and hold the closed position for 5–8 s.',
    contextTag: 'couch',
    equipment: ['gripper'],
    commonMistakes: [
      'Ego-loading a gripper you cannot fully close',
      'Doing these while wrist symptoms linger',
    ],
    progression: 'Harder gripper; longer holds.',
    regression: 'Moderate gripper reps.',
  },
  'pinch-block-weighted': {
    id: 'pinch-block-weighted',
    name: 'Weighted pinch block hold',
    targetArea: 'Pinch grip',
    cue: 'Wrist straight, thumb pad flat.',
    instructions: 'Pinch grip on a block with weight hanging from it, held for time.',
    contextTag: 'gym',
    equipment: ['pinch-block', 'dumbbell'],
    commonMistakes: [
      'Loading fast',
      'Letting the block slip and catching it — a genuine finger injury risk',
    ],
    progression: 'More weight; wider block.',
    regression: 'Back to the unweighted plate pinch hold.',
  },
  'edge-hang-20mm': {
    id: 'edge-hang-20mm',
    name: 'Half-crimp / open-hand edge hang, ≥20 mm',
    targetArea: 'Finger flexors · pulleys',
    cue: 'Never go to failure — stop each hang with about 3 seconds still in the tank.',
    instructions:
      'Feet-assisted hangs on a 20 mm or larger edge, open-hand or half-crimp, 7–10 s per set with full rest between. Big returns for the previously untrained, near-nothing for the already-strong.',
    whyItMatters:
      'This is where the climbing-derived joint-thickening rationale lives — and also where the osteoarthritis caveat applies. Optional for a reason.',
    contextTag: 'gym',
    equipment: ['hangboard'],
    commonMistakes: [
      'Edges under 20 mm',
      'Full crimp',
      'Bodyweight-plus loading',
      'More than 2×/week',
    ],
    progression: 'More weight before smaller edges. Never the reverse.',
    regression: 'More foot assistance; back to support-grip hangs.',
  },
  'weighted-dead-hang': {
    id: 'weighted-dead-hang',
    name: 'Weighted support-grip hang',
    targetArea: 'Support grip',
    cue: 'Add weight in small increments (5 lb).',
    instructions: 'Support-grip hang from a bar with added weight, held for time.',
    contextTag: 'gym',
    equipment: ['pull-up-bar', 'weight-vest'],
    commonMistakes: ['Jumping straight to a heavy vest'],
    progression: 'More weight, longer holds.',
    regression: 'Bodyweight hang.',
  },
  'fingertip-pushup-floor': {
    id: 'fingertip-pushup-floor',
    name: 'Floor fingertip push-up (knees → full)',
    targetArea: 'Finger joints under compression',
    cue: 'Domed fingers, weight spread across all five digits, wrist straight.',
    instructions:
      'Push-ups on the fingertips from the knees, progressing to full. Speculative for jam-proofing.',
    contextTag: 'floor',
    equipment: [],
    commonMistakes: [
      'Full push-ups on day one',
      'Joints collapsing',
      'Ignoring finger joint aching',
    ],
    progression: 'Knees → full → feet elevated.',
    regression: 'Back to wall fingertip push-ups.',
  },
  'reactive-catch-wall': {
    id: 'reactive-catch-wall',
    name: 'Reactive one/two-hand wall catches',
    targetArea: 'Reactive catching',
    cue: 'Track the ball all the way in; hands soft, ready, thumbs in on chest-height balls.',
    instructions:
      'Rapid-fire tennis ball and basketball catches off a wall, including off-angle and one-handed.',
    contextTag: 'sweat',
    equipment: ['basketball'],
    commonMistakes: [
      'Stabbing with straight fingers under time pressure — exactly the failure mode you are trying to eliminate',
    ],
    progression: 'Faster, closer, more unpredictable angles.',
    regression: 'Bigger, slower ball; two hands only.',
  },
  'weighted-ball-catch': {
    id: 'weighted-ball-catch',
    name: 'Weighted-ball catch progression',
    targetArea: 'Impact absorption',
    cue: 'Absorb — catch and give with the elbows over a good six inches of travel.',
    instructions: 'Catch a 4–8 lb medicine ball from a partner or rebounder.',
    contextTag: 'sweat',
    equipment: ['med-ball'],
    commonMistakes: [
      'Heavy ball with a hard catch',
      'Catching on the fingertips — that is exactly a jam',
    ],
    progression: 'Heavier ball; more velocity.',
    regression: 'Lighter ball; catch off a bounce.',
  },
  'finger-maintenance-block': {
    id: 'finger-maintenance-block',
    name: 'Maintenance: band + putty + gripper',
    targetArea: 'Grip · extensors',
    cue: 'Two sets each, twice a week, forever.',
    instructions:
      'Band finger extension, putty circuit and gripper reps — two sets of each — as the permanent maintenance dose.',
    contextTag: 'couch',
    equipment: ['band', 'putty', 'gripper'],
    progression: 'Add a set rather than a grade if you want more.',
    regression: 'Band and putty only.',
  },
}

// ─────────────────────────────────────────────────────────────────────────────
// Shared level furniture
// ─────────────────────────────────────────────────────────────────────────────

/** Section 8 — fingers. Do not train through these. */
const fingersRedFlags: string[] = [
  'An acute jam with joint instability or visible deformity — the finger feels loose, gives way sideways, or moves abnormally; any angulation or rotation. Get medical care, do not rehab through it.',
  'A fingertip that droops and will not straighten (mallet finger), or a middle joint that bends down while the tip cocks back (boutonnière) — extensor tendon injuries that become permanent deformities without prompt treatment.',
  'Inability to actively straighten or bend the joint after a jam.',
  'Severe swelling, obvious bruising, or a joint that will not move at all after 2–3 days.',
  'A jam that is not clearly improving after 1–2 weeks, or pain that is still increasing.',
  'Any suspicion of a fracture — point tenderness over bone, deformity, pain with axial load.',
  'Numbness or a fingertip that is pale or cold — including from taping too tight.',
  'Joint pain, swelling or morning finger stiffness from training: not a doctor visit, but a stop signal — regress a level. These are the finger-specific analogue of the tendon 24-hour rule.',
]

/** The finger-specific analogue of the 24-hour rule, asked at every level. */
const jointGateQuestions: CheckInQuestion[] = [
  { id: 'joint_pain', label: 'Finger joint pain this week (0–10)', type: 'pain0to10' },
  { id: 'joint_swelling', label: 'Finger joints free of swelling?', type: 'yesNo' },
  { id: 'morning_stiffness', label: 'Mornings free of finger stiffness?', type: 'yesNo' },
]

// ─────────────────────────────────────────────────────────────────────────────
// Level items
// ─────────────────────────────────────────────────────────────────────────────

/** Level 1 — Base. All low-load, all couch bar the catching drill. */
const fingersBaseItems: ProtocolItem[] = [
  {
    id: 'f1-ext-band',
    exerciseId: 'finger-ext-band-base',
    sets: 3,
    reps: 18,
    displayAmount: '3 × 15–20',
    tempo: '2-1-2',
    load: 'Rubber band / light extensor band',
    frequency: { perWeek: 5 },
    bucket: 'couch',
    tissues: ['fingers'],
    intensity: 'easy',
    alternates: ['f2-ext-band-heavy', 'f2-ext-eccentric'],
    notes:
      'R2 — extensor work is the exception to the wrist gate: low-load and pulling opposite the flexor-dominant pattern, so it is safe even in wrist Phase 1.',
  },
  {
    id: 'f1-putty-grip',
    exerciseId: 'putty-gross-grip',
    sets: 3,
    reps: 15,
    displayAmount: '3 × 15',
    tempo: '2-1-2',
    load: 'Soft (yellow/red) therapy putty',
    frequency: { perWeek: 5 },
    bucket: 'couch',
    tissues: ['fingers'],
    intensity: 'easy',
    alternates: ['f2-putty-firm'],
  },
  {
    id: 'f1-putty-pinch',
    exerciseId: 'putty-tip-pinch',
    sets: 2,
    reps: 10,
    displayAmount: '2 × 10 per digit',
    tempo: '2-1-2',
    load: 'Soft putty',
    frequency: { perWeek: 5 },
    bucket: 'couch',
    tissues: ['fingers'],
    intensity: 'easy',
    alternates: ['f1-thumb-opp'],
    notes:
      'R9 — with a positive Finkelstein (De Quervain variant), stay on soft grades and defer firm-grade pinch until radial-side symptoms settle.',
  },
  {
    id: 'f1-putty-spread',
    exerciseId: 'putty-finger-spread',
    sets: 3,
    reps: 12,
    displayAmount: '3 × 12',
    tempo: '2-1-2',
    load: 'Soft putty ring',
    frequency: { perWeek: 5 },
    bucket: 'couch',
    tissues: ['fingers'],
    intensity: 'easy',
    notes: 'R2 — safe alongside any wrist phase. Do not skip the ring/little pair.',
  },
  {
    id: 'f1-glides',
    exerciseId: 'tendon-glide-fingers',
    sets: 2,
    reps: 10,
    displayAmount: '2 × 10 full sequences',
    tempo: 'Slow',
    load: 'None',
    frequency: { perWeek: 'daily' },
    bucket: 'couch',
    intensity: 'easy',
  },
  {
    id: 'f1-lumbrical',
    exerciseId: 'intrinsic-lumbrical-hold',
    sets: 3,
    durationSeconds: 20,
    displayAmount: '3 × 20s hold',
    tempo: 'Hold',
    load: 'None, or a light band over the knuckles',
    frequency: { perWeek: 5 },
    bucket: 'couch',
    tissues: ['fingers'],
    intensity: 'easy',
  },
  {
    id: 'f1-finger-lifts',
    exerciseId: 'finger-lifts-table',
    sets: 2,
    reps: 10,
    displayAmount: '2 × 10 per digit',
    tempo: '1-2-1',
    load: 'Flat surface',
    frequency: { perWeek: 5 },
    bucket: 'couch',
    tissues: ['fingers'],
    intensity: 'easy',
  },
  {
    id: 'f1-thumb-opp',
    exerciseId: 'thumb-opposition-putty',
    sets: 2,
    reps: 10,
    displayAmount: '2 × 10 per digit',
    tempo: '2-1-2',
    load: 'Soft putty',
    frequency: { perWeek: 5 },
    bucket: 'couch',
    tissues: ['fingers'],
    intensity: 'easy',
    alternates: ['f1-putty-pinch'],
  },
  {
    id: 'f1-gripper-light',
    exerciseId: 'gripper-light',
    sets: 3,
    reps: 18,
    displayAmount: '3 × 15–20',
    tempo: '2-1-2',
    load: 'Adjustable gripper, easy setting',
    frequency: { perWeek: 3 },
    minSpacingDays: 2,
    bucket: 'couch',
    tissues: ['fingers', 'wrist-flexors'],
    intensity: 'easy',
    alternates: ['f2-gripper-moderate', 'f3-gripper-heavy'],
    notes:
      'R1 — hold this until the wrist is out of Phase 1; it is allowed in wrist Phase 2 only if painless. R3 — hard crushing loads the wrist through the finger flexors: if a gripper session leaves the wrist sore next morning, that is a wrist flare, so drop back a step in both programs.',
  },
  {
    id: 'f1-catch-technique',
    exerciseId: 'catch-technique-drill',
    sets: 3,
    reps: 20,
    displayAmount: '3 × 20 catches',
    tempo: 'Controlled',
    load: 'Basketball, partner or wall',
    frequency: { perWeek: 2 },
    bucket: 'quick',
    tissues: ['fingers'],
    intensity: 'easy',
    alternates: ['f2-buddy-tape-catch', 'f3-reactive-catch'],
    notes:
      'The most directly causal item in the program. R8 — buddy tape for actual games from day one regardless of what level you are on.',
  },
]

/** Level 2 — Intermediate. Real resistance introduced; wrist must be Phase 3+. */
const fingersIntermediateItems: ProtocolItem[] = [
  {
    id: 'f2-ext-band-heavy',
    exerciseId: 'finger-ext-band-heavy',
    sets: 3,
    reps: 14,
    displayAmount: '3 × 12–15',
    tempo: '2-1-3',
    load: 'Firm extensor band / X-grip device',
    frequency: { perWeek: 4 },
    bucket: 'couch',
    tissues: ['fingers'],
    intensity: 'easy',
    alternates: ['f1-ext-band', 'f2-ext-eccentric'],
  },
  {
    id: 'f2-ext-eccentric',
    exerciseId: 'finger-ext-eccentric',
    sets: 3,
    reps: 10,
    displayAmount: '3 × 10',
    tempo: '1-0-4',
    load: 'Extensor band',
    frequency: { perWeek: 3 },
    minSpacingDays: 2,
    bucket: 'couch',
    tissues: ['fingers'],
    intensity: 'easy',
    alternates: ['f1-ext-band', 'f2-ext-band-heavy'],
  },
  {
    id: 'f2-putty-firm',
    exerciseId: 'putty-firm-grip',
    sets: 3,
    reps: 12,
    displayAmount: '3 × 12',
    tempo: '2-1-2',
    load: 'Green/blue putty',
    frequency: { perWeek: 4 },
    bucket: 'couch',
    tissues: ['fingers'],
    intensity: 'easy',
    alternates: ['f1-putty-grip'],
    notes:
      'Advance one grade at a time when you hit the top of the rep range with clean form for two consecutive sessions.',
  },
  {
    id: 'f2-gripper-moderate',
    exerciseId: 'gripper-moderate',
    sets: 3,
    reps: 10,
    displayAmount: '3 × 8–12',
    tempo: '2-1-2',
    load: 'Adjustable gripper, mid setting',
    frequency: { perWeek: 3 },
    minSpacingDays: 2,
    bucket: 'couch',
    tissues: ['fingers', 'wrist-flexors'],
    intensity: 'hard',
    alternates: ['f1-gripper-light', 'f3-gripper-heavy'],
    notes:
      'R1 — banned while the wrist is in Phase 1–2. R3 — grip work loads the wrist even when it does not feel like it; a sore wrist the next morning means drop back in both programs.',
  },
  {
    id: 'f2-rice-bucket',
    exerciseId: 'rice-bucket-circuit',
    sets: 3,
    durationSeconds: 50,
    displayAmount: '3 × 45–60s per drill',
    tempo: 'Continuous',
    load: '5-gallon bucket + ~15 lb rice',
    frequency: { perWeek: 3 },
    minSpacingDays: 2,
    bucket: 'couch',
    tissues: ['fingers', 'wrist-extensors'],
    intensity: 'easy',
    notes:
      'R1 — banned in wrist Phase 1; allowed in wrist Phase 2 only if painless. Thin evidence base; the extension work is the part worth keeping.',
  },
  {
    id: 'f2-pinch-plate',
    exerciseId: 'pinch-plate-hold',
    sets: 3,
    durationSeconds: 25,
    displayAmount: '3 × 20–30s hold',
    tempo: 'Hold',
    load: '2 × 5 lb plates or a pinch block',
    frequency: { perWeek: 2 },
    minSpacingDays: 2,
    bucket: 'workout',
    workoutSizes: ['M', 'L'],
    tissues: ['fingers'],
    intensity: 'hard',
    alternates: ['f3-pinch-block-weighted'],
    notes:
      'R1 — banned until the wrist reaches Phase 3. R9 — defer heavy pinch holds with a positive Finkelstein.',
  },
  {
    id: 'f2-wall-fingertip',
    exerciseId: 'wall-fingertip-pushup',
    sets: 3,
    reps: 10,
    displayAmount: '3 × 10',
    tempo: '3-1-2',
    load: 'Bodyweight against a wall',
    frequency: { perWeek: 2 },
    minSpacingDays: 2,
    bucket: 'quick',
    tissues: ['fingers', 'upper-push'],
    intensity: 'hard',
    alternates: ['f3-fingertip-pushup-floor'],
    notes:
      'R5 — never work a fingertip variant at a rung the flat-palm push-up has not already cleared. Speculative for jam-proofing.',
  },
  {
    id: 'f2-dead-hang-support',
    exerciseId: 'dead-hang-support',
    sets: 3,
    durationSeconds: 30,
    displayAmount: '3 × 20–40s hang',
    tempo: 'Hold',
    load: 'Bodyweight on a pull-up bar',
    frequency: { perWeek: 2 },
    minSpacingDays: 2,
    bucket: 'workout',
    workoutSizes: ['S', 'M', 'L'],
    tissues: ['fingers', 'upper-pull'],
    intensity: 'hard',
    alternates: ['f2-towel-hang', 'f3-weighted-hang'],
    notes:
      'R4 — hangs load the wrist in traction, not compression, so they clear earlier than push-ups. The wrist program’s passive dead-hang check is the gate: a painless 20s hang with no 24-hour flare green-lights this even if flat-palm push-ups are not there yet. R1 — banned outright while the wrist is in Phase 1–2.',
  },
  {
    id: 'f2-towel-hang',
    exerciseId: 'towel-hang-or-carry',
    sets: 3,
    durationSeconds: 25,
    displayAmount: '3 × 20–30s hold',
    tempo: 'Hold',
    load: 'Towel over a bar, or towel-wrapped dumbbells',
    frequency: { perWeek: 2 },
    minSpacingDays: 2,
    bucket: 'workout',
    workoutSizes: ['L'],
    tissues: ['fingers', 'upper-pull'],
    intensity: 'hard',
    alternates: ['f2-dead-hang-support', 'f3-weighted-hang'],
    notes: 'R4 — same traction gate as the support hang.',
  },
  {
    id: 'f2-buddy-tape-catch',
    exerciseId: 'buddy-tape-catch-drill',
    sets: 3,
    reps: 25,
    displayAmount: '3 × 25 catches',
    tempo: 'Game speed',
    load: 'Basketball + athletic tape',
    frequency: { perWeek: 2 },
    bucket: 'quick',
    tissues: ['fingers'],
    intensity: 'easy',
    alternates: ['f1-catch-technique', 'f3-reactive-catch'],
    notes:
      'R8 — taping does not wait on any level. This is the best-evidenced protective item in either program.',
  },
]

/**
 * Level 3 — Advanced. Optional: the marginal jam-proofing benefit is
 * speculative and the joint-stress cost is real.
 */
const fingersAdvancedItems: ProtocolItem[] = [
  {
    id: 'f3-gripper-heavy',
    exerciseId: 'gripper-heavy-holds',
    sets: 4,
    reps: 5,
    displayAmount: '4 × 5 reps, 5–8s hold',
    tempo: 'Close + hold',
    load: 'Adjustable / graded gripper, hard setting',
    frequency: { perWeek: 2 },
    minSpacingDays: 2,
    bucket: 'couch',
    tissues: ['fingers', 'wrist-flexors'],
    intensity: 'hard',
    alternates: ['f2-gripper-moderate', 'f1-gripper-light'],
    requiresPhase: { programId: 'wrist', phaseId: 'phase3' },
    notes:
      'R1 — requires the wrist in Phase 4 or discharged. R3 — the heaviest crush work in the program; wrist soreness the next morning is a flare in both programs.',
  },
  {
    id: 'f3-pinch-block-weighted',
    exerciseId: 'pinch-block-weighted',
    sets: 4,
    durationSeconds: 18,
    displayAmount: '4 × 15–20s hold',
    tempo: 'Hold',
    load: 'Pinch block + loading pin / dumbbell',
    frequency: { perWeek: 2 },
    minSpacingDays: 2,
    bucket: 'workout',
    workoutSizes: ['M', 'L'],
    tissues: ['fingers'],
    intensity: 'hard',
    alternates: ['f2-pinch-plate'],
    requiresPhase: { programId: 'wrist', phaseId: 'phase3' },
    notes: 'R1 — requires the wrist in Phase 4. R9 — defer with a positive Finkelstein.',
  },
  {
    id: 'f3-edge-hang',
    exerciseId: 'edge-hang-20mm',
    sets: 4,
    durationSeconds: 8,
    displayAmount: '4 × 7–10s hang',
    tempo: 'Hold, ~3s reserve',
    load: 'Hangboard 20 mm+ edge, feet assisted',
    frequency: { perWeek: 2 },
    minSpacingDays: 2,
    bucket: 'workout',
    workoutSizes: ['L'],
    tissues: ['fingers', 'upper-pull'],
    intensity: 'hard',
    alternates: ['f3-weighted-hang', 'f2-dead-hang-support'],
    requiresPhase: { programId: 'wrist', phaseId: 'phase3' },
    notes:
      'The most optional item in either program. This is where the climbing-derived joint-thickening rationale lives and also where the osteoarthritis caveat bites: the same climbers with thicker capsules and ligaments went from 12.9% to 74.2% radiographic DIP osteoarthritis over ten years. That is an extreme-loading population, but it is the reason to keep this moderate — 20 mm or larger, feet assisted, never to failure, never more than 2×/week, and add weight before you ever shrink the edge. R1 — requires the wrist in Phase 4 or discharged.',
  },
  {
    id: 'f3-weighted-hang',
    exerciseId: 'weighted-dead-hang',
    sets: 3,
    durationSeconds: 18,
    displayAmount: '3 × 15–20s hang',
    tempo: 'Hold',
    load: 'Bar + weight vest / dumbbell between the feet',
    frequency: { perWeek: 2 },
    minSpacingDays: 2,
    bucket: 'workout',
    workoutSizes: ['S', 'M', 'L'],
    tissues: ['fingers', 'upper-pull'],
    intensity: 'hard',
    requiresPhase: { programId: 'wrist', phaseId: 'phase4' },
    alternates: ['f2-dead-hang-support', 'f2-towel-hang', 'f3-edge-hang'],
    notes: 'R4 — traction, so it clears before compression work. R1 — wrist Phase 4 only.',
  },
  {
    id: 'f3-fingertip-pushup-floor',
    exerciseId: 'fingertip-pushup-floor',
    sets: 3,
    reps: 8,
    displayAmount: '3 × 6–10',
    tempo: '3-1-2',
    load: 'Bodyweight, knees → full',
    frequency: { perWeek: 2 },
    minSpacingDays: 2,
    bucket: 'workout',
    workoutSizes: ['M', 'L'],
    tissues: ['fingers', 'upper-push'],
    intensity: 'hard',
    alternates: ['f2-wall-fingertip'],
    requiresPhase: { programId: 'wrist', phaseId: 'phase3' },
    notes:
      'R5 — only once flat-palm floor push-ups are clean; never work a fingertip variant at a rung the flat-palm version has not cleared. R1 — banned until the wrist reaches Phase 4. Speculative for jam-proofing.',
  },
  {
    id: 'f3-reactive-catch',
    exerciseId: 'reactive-catch-wall',
    sets: 4,
    durationSeconds: 30,
    displayAmount: '4 × 30s',
    tempo: 'Fast',
    load: 'Tennis ball + basketball',
    frequency: { perWeek: 2 },
    minSpacingDays: 2,
    bucket: 'workout',
    workoutSizes: ['S', 'M', 'L'],
    tissues: ['fingers'],
    intensity: 'easy',
    alternates: ['f1-catch-technique', 'f2-buddy-tape-catch'],
    notes:
      'If the technique degrades into straight-fingered stabs, slow it down — that is the failure mode you are training out.',
  },
  {
    id: 'f3-weighted-ball-catch',
    exerciseId: 'weighted-ball-catch',
    sets: 3,
    reps: 10,
    displayAmount: '3 × 10 catches',
    tempo: 'Controlled',
    load: '4–8 lb med ball, partner or rebounder',
    frequency: { perWeek: 2 },
    minSpacingDays: 2,
    bucket: 'workout',
    workoutSizes: ['L'],
    tissues: ['fingers', 'upper-push'],
    intensity: 'hard',
    alternates: ['f3-reactive-catch'],
  },
  {
    id: 'f3-maintenance',
    exerciseId: 'finger-maintenance-block',
    sets: 2,
    reps: 15,
    displayAmount: '2 × 15 of each',
    tempo: '2-1-2',
    load: 'Band, putty, gripper',
    frequency: { perWeek: 2 },
    minSpacingDays: 2,
    bucket: 'couch',
    tissues: ['fingers'],
    intensity: 'easy',
    notes: 'Forever. Whatever level you stop at, this is the dose that holds it.',
  },
]

// ─────────────────────────────────────────────────────────────────────────────
// Program
// ─────────────────────────────────────────────────────────────────────────────

export const fingersProgram: ProgramDef = {
  id: 'fingers',
  name: 'Finger Strength',
  priority: 40,
  phases: [
    {
      id: 'base',
      name: 'Level 1 — Base',
      entryCriteria:
        'Anyone, including while the wrist program is in Phase 1–2 (R1). Extensor band and putty spread work are the exception to every wrist gate — they are low-load and pull opposite the flexor-dominant pattern (R2). Run 3–5 sessions per week; most are 8–12 minutes on a couch.',
      exitCriteria:
        'Advance when the Base exercises are easy for 3 sets at the target reps with clean form for two consecutive sessions, with no joint pain, swelling or morning finger stiffness — and the wrist program has reached Phase 3. Typically 4–6 weeks. Staying here indefinitely is a legitimate choice.',
      items: fingersBaseItems,
      checkInQuestions: [
        ...jointGateQuestions,
        {
          id: 'top_of_range',
          label: 'Hit the top of the rep range clean, two sessions running?',
          type: 'yesNo',
        },
      ],
      redFlags: fingersRedFlags,
    },
    {
      id: 'intermediate',
      name: 'Level 2 — Intermediate',
      entryCriteria:
        'Base exercises easy for 3 sets at the target reps, and the wrist program in Phase 3 or later (R1). Real resistance starts here: firmer putty, a moderate gripper, rice bucket, pinch holds, wall fingertip loading and support-grip hangs.',
      exitCriteria:
        'Comfortable at the top of every rep range with no joint pain, swelling or morning stiffness, and the wrist program fully in Phase 4 or discharged. Typically 6–12 weeks. Advancing past this level is optional — this is a perfectly good place to stop and maintain.',
      items: fingersIntermediateItems,
      checkInQuestions: [
        ...jointGateQuestions,
        {
          id: 'top_of_range',
          label: 'Hit the top of the rep range clean, two sessions running?',
          type: 'yesNo',
        },
        { id: 'wrist_quiet', label: 'Wrist quiet the morning after grip sessions?', type: 'yesNo' },
      ],
      redFlags: fingersRedFlags,
    },
    {
      id: 'advanced',
      name: 'Level 3 — Advanced (optional)',
      entryCriteria:
        'OPTIONAL — do not treat this as the finish line. Requires Intermediate comfortable, the wrist fully in Phase 4, and no finger joint pain or swelling. The marginal jam-proofing benefit here is speculative while the joint-stress cost is real: the climbing cohort that grew thicker capsules, ligaments, palmar plates and pulleys also went from 12.9% to 74.2% clear radiographic DIP osteoarthritis over ten years. That is an extreme-loading population — repeated near-maximal crimping at bodyweight — not what is prescribed here, but it is the reason to keep finger loading moderate and progressive rather than chasing maximal edge hangs at 49. Level 2 plus maintenance is a legitimate endpoint.',
      exitCriteria:
        'Ongoing, no exit — maintain 2×/week. Progress by adding resistance only when you hit the top of the rep range with clean form for two consecutive sessions, and remember finger strength gains outpace connective-tissue tolerance, so progress slower than you feel able to. Regress a level on any joint pain, swelling or morning finger stiffness. Never progress the wrist and finger programs in the same week (R6).',
      items: fingersAdvancedItems,
      checkInQuestions: [
        ...jointGateQuestions,
        { id: 'wrist_quiet', label: 'Wrist quiet the morning after grip sessions?', type: 'yesNo' },
        {
          id: 'still_worth_it',
          label: 'Still worth the joint load? (Level 2 + maintenance is a fine endpoint)',
          type: 'yesNo',
        },
      ],
      redFlags: fingersRedFlags,
    },
  ],
  pregameItems: [
    {
      id: 'f-pg-tape',
      exerciseId: 'buddy-tape-catch-drill',
      sets: 1,
      reps: 10,
      displayAmount: 'Tape up + 10 warm-up catches',
      tempo: 'Controlled',
      load: 'Athletic tape + basketball',
      frequency: { perWeek: 'daily' },
      bucket: 'quick',
      tissues: ['fingers'],
      intensity: 'easy',
      notes:
        'R8 — buddy-tape ring+middle (or the previously injured digit) for competitive games from day one, whatever level you are on.',
    },
    {
      id: 'f-pg-glides',
      exerciseId: 'tendon-glide-fingers',
      sets: 1,
      reps: 10,
      displayAmount: '1 × 10 full sequences',
      tempo: 'Slow',
      load: 'None',
      frequency: { perWeek: 'daily' },
      bucket: 'quick',
      intensity: 'easy',
    },
  ],
}
