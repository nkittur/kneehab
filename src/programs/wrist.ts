import type { CheckInQuestion, Exercise, ProgramDef, ProtocolItem } from './types'

/**
 * Wrist (right) — overuse tendinopathy rehab, generated from
 * `docs/research/wrist-fingers.md` (Program 1).
 *
 * Four phases: isometric → isotonic → weight-bearing (closed chain) →
 * sport-specific / graded return. Progression is governed by two rules taken
 * straight from the tendinopathy literature: pain during exercise stays ≤3/10,
 * and the 24-hour response (next-day pain and morning stiffness the same or
 * better) is the gate to adding load.
 */

// ─────────────────────────────────────────────────────────────────────────────
// Self-assessment router (Section 2 of the research doc)
// ─────────────────────────────────────────────────────────────────────────────

export type WristAssessmentStep = {
  id: string
  name: string
  instructions: string
  /** What a positive result means / where it routes. */
  positiveMeans: string
}

export type WristVariant = {
  id: string
  name: string
  /** How the standard protocol changes for this variant. */
  tweaks: string
}

/**
 * Run once, ~5 minutes, before starting Phase 1. Test the left wrist first as a
 * reference. "Positive" means it clearly reproduces *your* pain in a spot you
 * can cover with one fingertip — vague discomfort is not a positive. The goal is
 * to route to a variant, not to diagnose.
 */
export const wristSelfAssessment: {
  steps: WristAssessmentStep[]
  variants: WristVariant[]
} = {
  steps: [
    {
      id: 'point-to-it',
      name: 'Step 0 — Point to it',
      instructions:
        'Point with one finger to the single worst spot. Note which side of the wrist it is on — back-of-hand (dorsal), palm-side (volar), thumb-side (radial) or pinky-side (ulnar) — whether it hurts more to push (weight-bearing) or to pull/grip, and whether there is any clicking, clunking, snapping or visible swelling.',
      positiveMeans:
        'A single fingertip-sized spot plus a push-vs-grip answer. This is the map the rest of the tests confirm.',
    },
    {
      id: 'resisted-wrist-extension',
      name: 'Step 1a — Resisted wrist extension',
      instructions:
        'Forearm on the thigh palm-down; the other hand pushes down on the back of your hand while you resist.',
      positiveMeans:
        'Pain on the back of the wrist / into the forearm → dorsal extensor tendinopathy (ECRB/ECRL/EDC). Check the elbow too; this overlaps with tennis elbow.',
    },
    {
      id: 'resisted-wrist-flexion',
      name: 'Step 1b — Resisted wrist flexion',
      instructions:
        'Forearm on the thigh palm-up; the other hand pulls the fingers back while you resist.',
      positiveMeans: 'Pain on the palm side → volar flexor tendinopathy (FCR / FCU).',
    },
    {
      id: 'resisted-ulnar-deviation',
      name: 'Step 1c — Resisted ulnar deviation + extension',
      instructions:
        'Forearm pronated, wrist extended; pull toward the pinky against resistance from the other hand.',
      positiveMeans:
        'Pain along the pinky-side groove on the back of the wrist → ECU tendinopathy.',
    },
    {
      id: 'resisted-thumb-extension',
      name: 'Step 1d — Resisted thumb extension / abduction',
      instructions:
        'Thumb in the "hitchhiker" position; resist as the other hand pushes the thumb toward the palm.',
      positiveMeans:
        'Pain at the thumb-side wrist ~1–2 cm above the styloid → De Quervain’s (1st dorsal compartment).',
    },
    {
      id: 'finkelstein',
      name: 'Step 2 — Finkelstein (radial / thumb-side)',
      instructions:
        'Grasp your own thumb, pull it into palmar flexion, then ulnar-deviate the wrist. Do the true Finkelstein, not the fist-over-thumb version (that is Eichhoff’s test).',
      positiveMeans:
        'Sharp pain over the first dorsal compartment → De Quervain variant. If the fist version hurts but the isolated thumb pull does not, downgrade your suspicion — Eichhoff’s produces many more false positives.',
    },
    {
      id: 'ulnar-grind-press-up',
      name: 'Step 3a — Ulnar grind / press-up',
      instructions:
        'Push yourself up out of a chair with palms flat on the armrests, then repeat with the wrist ulnar-deviated.',
      positiveMeans: 'Sharp deep pinky-side pain → ulnar-sided screen positive; continue Step 3.',
    },
    {
      id: 'load-and-rotate',
      name: 'Step 3b — Load + rotate',
      instructions:
        'Wrist ulnar-deviated, then rotate the forearm palm-up ↔ palm-down under axial pressure.',
      positiveMeans:
        'Clicking, clunking or deep pain → suspect TFCC. Stop loading and get assessed; this is fibrocartilage and ligament, not tendon.',
    },
    {
      id: 'doorknob-wringing',
      name: 'Step 3c — Doorknob / wringing test',
      instructions: 'Wring out a towel, or turn a stiff doorknob.',
      positiveMeans: 'Focal ulnar pain with weakness → ulnar-sided pathology; use Steps 3b/3d to sort tendon from TFCC.',
    },
    {
      id: 'ecu-ice-cream-scoop',
      name: 'Step 3d — ECU "ice-cream scoop"',
      instructions:
        'Forearm pronated, wrist extended and ulnar-deviated; make a scooping motion.',
      positiveMeans:
        'A tendon that snaps or pops over the distal ulna → ECU subsheath injury. Get assessed; it frequently coexists with a TFCC tear.',
    },
    {
      id: 'prayer-nerve-screen',
      name: 'Step 3e — Prayer nerve screen',
      instructions:
        'Press the palms together prayer-style with even pressure, then shift toward the sore side.',
      positiveMeans:
        'Obvious reproduction of pins and needles / numbness → think nerve, not tendon. Stop and get assessed.',
    },
  ],
  variants: [
    {
      id: 'standard-dorsal',
      name: 'Standard — dorsal extensor',
      tweaks:
        'Full protocol as written. Bias Phase 2 toward wrist extension eccentrics (FlexBar Tyler twist, eccentric-only extension). Check the elbow — this overlaps with tennis elbow.',
    },
    {
      id: 'standard-volar',
      name: 'Standard — volar flexor',
      tweaks:
        'Bias Phase 2 toward flexion work. Go slower on the push-up progression — extension end-range compresses the volar structures — and use fist / parallette variants earlier.',
    },
    {
      id: 'de-quervain',
      name: 'De Quervain variant (radial)',
      tweaks:
        'Add thumb extension band work. Defer radial-deviation loading (and the radial half of the hammer drill) to Phase 3. Semi-rigid thumb spica for provocative tasks only — not full-time rigid immobilisation. Also defer firm-grade tip pinch and heavy pinch holds in the finger program.',
    },
    {
      id: 'intersection',
      name: 'Intersection variant (radial, higher in forearm)',
      tweaks:
        'Same handling as De Quervain, but expect faster resolution (~60% settle in 2–3 weeks with activity change and splinting). Taping over the crepitus area can eliminate the squeaking.',
    },
    {
      id: 'ecu',
      name: 'ECU variant (ulnar, no click)',
      tweaks:
        'Add ECU-specific loading (extension + ulnar deviation diagonal). Avoid end-range supination under load early; a rotation-limiting brace for play. Irritable cases tolerate 4–6 weeks of splinting at ~30° extension with slight ulnar deviation.',
    },
    {
      id: 'tfcc-suspected',
      name: 'STOP — suspected TFCC',
      tweaks:
        'Deep focal ulnar pain with axial load + forearm rotation, clicking or a sense of instability. Do not self-load. Get assessed — progressive loading is the wrong tool for fibrocartilage and ligament.',
    },
    {
      id: 'nerve-involvement',
      name: 'STOP — nerve involvement',
      tweaks:
        'Any numbness, tingling or pins-and-needles in the hand. Not tendinopathy. Get assessed before loading anything.',
    },
  ],
}

// ─────────────────────────────────────────────────────────────────────────────
// Exercises
// ─────────────────────────────────────────────────────────────────────────────

export const wristExercises: Record<string, Exercise> = {
  // ── Phase 1 — Calm & isometric ──────────────────────────────────────
  'wrist-ext-isometric': {
    id: 'wrist-ext-isometric',
    name: 'Wrist extension isometric',
    targetArea: 'Wrist extensors',
    cue: 'Push into a wall that doesn’t move — steady pressure, normal breathing.',
    instructions:
      'Rest the forearm palm-down on your thigh with the hand off the knee. Press the back of that hand up into your other hand and hold a steady sub-maximal effort — nothing should move.',
    whyItMatters:
      'Isometrics load the tendon without moving it through the painful arc, which is how you keep capacity while symptoms settle.',
    contextTag: 'couch',
    equipment: [],
    commonMistakes: [
      'Going maximal — this should feel like ~5/10 effort',
      'Letting the wrist actually extend',
      'Holding your breath',
      'Picking an angle that hurts',
    ],
    progression: 'Longer holds → higher effort % → do it at the mildly provocative angle.',
    regression: 'Shorter holds, lower effort, the least painful wrist angle.',
  },
  'wrist-flex-isometric': {
    id: 'wrist-flex-isometric',
    name: 'Wrist flexion isometric',
    targetArea: 'Wrist flexors',
    cue: 'Forearm stays glued to the thigh.',
    instructions:
      'Same setup as the extension isometric but palm-up: press the palm up into the opposite hand and hold a steady sub-maximal effort.',
    contextTag: 'couch',
    equipment: [],
    commonMistakes: [
      'Recruiting the shoulder or elbow to help',
      'Gripping hard — keep the fingers relaxed',
    ],
    progression: 'Longer holds, then higher effort %.',
    regression: 'Shorter holds; drop the effort to ~30%.',
  },
  'wrist-ulnar-isometric': {
    id: 'wrist-ulnar-isometric',
    name: 'Ulnar deviation isometric',
    targetArea: 'ECU · ulnar deviators',
    cue: 'Move nothing — the effort is all in the forearm.',
    instructions:
      'Forearm supported thumb-up. Press the hand toward the pinky side against the opposite hand and hold.',
    contextTag: 'couch',
    equipment: [],
    commonMistakes: ['Letting the hand actually drift', 'Bracing through the shoulder'],
    progression: 'Add effort, then progress into the hammer deviation drill in Phase 2.',
    regression: 'Reduce effort to ~30%.',
  },
  'wrist-radial-isometric': {
    id: 'wrist-radial-isometric',
    name: 'Radial deviation isometric',
    targetArea: 'Radial deviators',
    cue: 'Move nothing — the effort is all in the forearm.',
    instructions:
      'Forearm supported thumb-up. Press the hand toward the thumb side against the opposite hand and hold.',
    contextTag: 'couch',
    equipment: [],
    commonMistakes: ['Doing this early with a positive Finkelstein — it can flare the radial side'],
    progression: 'Add effort, then progress into the hammer deviation drill in Phase 2.',
    regression: 'Reduce effort to ~30%; drop the direction entirely if it hurts.',
  },
  'forearm-rotation-isometric': {
    id: 'forearm-rotation-isometric',
    name: 'Pronation / supination isometric',
    targetArea: 'Forearm rotators',
    cue: 'Elbow stays pinned to the ribs.',
    instructions:
      'Elbow at 90° tucked to your side, loose fist. The other hand grips the fist and resists as you try to turn palm-up, then palm-down.',
    contextTag: 'couch',
    equipment: [],
    commonMistakes: ['Letting the shoulder rotate instead of the forearm'],
    progression: 'Progress to the hammer rotation drill in Phase 2.',
    regression: 'Lower effort; for suspected ECU issues, skip end-range supination.',
  },
  'wrist-arom-circuit': {
    id: 'wrist-arom-circuit',
    name: 'Pain-free wrist AROM circuit',
    targetArea: 'Wrist range of motion',
    cue: 'Go to the edge of comfortable, not the edge of possible.',
    instructions:
      'Move the wrist through flexion, extension, radial and ulnar deviation and circles, staying strictly inside the pain-free range. Unresisted.',
    contextTag: 'couch',
    equipment: [],
    commonMistakes: ['Pushing into pain "to stretch it out"'],
    progression: 'Bigger range as it opens up, then add load.',
    regression: 'Smaller arcs; use the other hand to assist.',
  },
  'tendon-glide-series': {
    id: 'tendon-glide-series',
    name: 'Flexor tendon glide series',
    targetArea: 'Flexor tendons',
    cue: 'Each shape is distinct — don’t blur them together.',
    instructions:
      'Cycle the hand through straight → hook fist → full fist → tabletop → straight fist, pausing 2 s in each position.',
    contextTag: 'couch',
    equipment: [],
    commonMistakes: ['Rushing', 'Squeezing hard — this is a glide, not a strength drill'],
    progression: 'Add gentle overpressure; add the lumbrical/tabletop hold.',
    regression: 'Do fewer shapes; assist with the other hand.',
  },
  'grip-submax-ball': {
    id: 'grip-submax-ball',
    name: 'Sub-max soft ball squeeze',
    targetArea: 'Grip · finger flexors',
    cue: 'Half effort. If your forearm is shaking, back off.',
    instructions: 'Squeeze a soft ball at about half effort, hold 5 s, release. Repeat.',
    contextTag: 'couch',
    equipment: ['stress-ball'],
    commonMistakes: ['Max-effort squeezing while the wrist is irritable'],
    progression: 'Light gripper, then a moderate gripper (finger program).',
    regression: 'Squeeze a rolled towel instead; drop the hold to 2 s.',
  },
  'band-scap-row': {
    id: 'band-scap-row',
    name: 'Seated band row / scapular set',
    targetArea: 'Scapular retractors',
    cue: '"Back pocket with your elbow" — chin tucked, no shrug.',
    instructions:
      'Anchor a band at chest height, sit tall, and row with the elbows close, holding the squeeze for 5 s. Hold the handle in a neutral, relaxed grip.',
    whyItMatters:
      'The elbow/wrist rehab literature pairs distal loading with scapular strengthening as kinetic-chain support — it is part of forearm rehab, not a side dish.',
    contextTag: 'couch',
    equipment: ['band'],
    commonMistakes: ['Shrugging', 'Yanking the band', 'Letting the wrist do the work'],
    progression: 'Heavier band, single-arm, longer lever.',
    regression: 'Lighter band; a pure scapular squeeze with no band at all.',
  },
  'wrist-ext-stretch': {
    id: 'wrist-ext-stretch',
    name: 'Wrist extensor stretch',
    targetArea: 'Wrist extensors',
    cue: 'Mild pull, never sharp.',
    instructions:
      'Arm straight out in front, palm down, gently pull the fingers toward you. Skip it entirely if it goes above 3/10.',
    contextTag: 'couch',
    equipment: [],
    commonMistakes: ['Cranking on it — above 3/10 means stop, not push'],
    progression: 'Straighten the elbow more; add finger extension.',
    regression: 'Bend the elbow; drop to 15 s.',
  },

  // ── Phase 2 — Isotonic loading ──────────────────────────────────────
  'wrist-ext-curl': {
    id: 'wrist-ext-curl',
    name: 'Supported wrist extension curl',
    targetArea: 'Wrist extensors',
    cue: 'The forearm never leaves the thigh — only the wrist moves.',
    instructions:
      'Forearm resting palm-down on your thigh, hand past the knee, holding a light dumbbell. Curl the back of the hand up, then lower for a 3-count.',
    whyItMatters:
      'Slow, controlled concentric/eccentric loading is the actual remodeling stimulus — the part of the program that changes the tendon.',
    contextTag: 'couch',
    equipment: ['dumbbell'],
    commonMistakes: [
      'Too much weight — 2 lb is a legitimate starting load',
      'Bouncing at the bottom',
      'Lifting the forearm to cheat',
    ],
    progression: '+1 lb when 3×15 is clean two sessions running; then shift toward 3×8 heavier.',
    regression: 'No weight, then back to the extension isometric.',
  },
  'wrist-flex-curl': {
    id: 'wrist-flex-curl',
    name: 'Supported wrist flexion curl',
    targetArea: 'Wrist flexors',
    cue: 'Let the weight roll to the fingertips at the bottom, then curl it back up.',
    instructions:
      'Same setup as the extension curl but palm-up. Curl the weight up, lower for a 3-count.',
    contextTag: 'couch',
    equipment: ['dumbbell'],
    commonMistakes: [
      'Overloading — the flexors are ~3× stronger than the extensors, so it is tempting to jump weight here and then be sore everywhere',
    ],
    progression: '+1 lb when 3×15 is clean two sessions running; then toward 3×8 heavier.',
    regression: 'No weight, then back to the flexion isometric.',
  },
  'wrist-ext-eccentric': {
    id: 'wrist-ext-eccentric',
    name: 'Eccentric-only wrist extension',
    targetArea: 'Wrist extensors',
    cue: '"Fight it down for four seconds."',
    instructions:
      'Lift the dumbbell into wrist extension using your other hand, then lower it with the sore wrist over a slow 4-count.',
    contextTag: 'couch',
    equipment: ['dumbbell'],
    commonMistakes: [
      'Dropping it instead of lowering it',
      'Matching the concentric weight straight away — eccentrics tolerate more, but ramp gradually',
    ],
    progression: 'More weight; then remove the assist and make it a full concentric/eccentric.',
    regression: 'Fewer reps; 2-second lowering; less weight.',
  },
  'radial-ulnar-hammer': {
    id: 'radial-ulnar-hammer',
    name: 'Radial / ulnar deviation with hammer',
    targetArea: 'Wrist deviators',
    cue: 'Choke up on the handle to make it easier, down to make it harder — a free load dial.',
    instructions:
      'Forearm on the thigh with the thumb up, holding a hammer near the end of the handle. Tilt the head up and down under control.',
    contextTag: 'couch',
    equipment: ['hammer'],
    commonMistakes: [
      'Rotating the forearm instead of deviating the wrist',
      'Too long a lever too early',
    ],
    progression: 'Slide the hand further from the head.',
    regression: 'Choke way up; drop the radial half if Finkelstein was positive.',
  },
  'forearm-rotation-hammer': {
    id: 'forearm-rotation-hammer',
    name: 'Pronation / supination with hammer',
    targetArea: 'Forearm rotators',
    cue: 'Elbow stays against the ribs the whole set.',
    instructions:
      'Elbow pinned at 90°, hammer held vertically, rotate slowly palm-up to palm-down and back. Choke long on the handle for more torque.',
    contextTag: 'couch',
    equipment: ['hammer'],
    commonMistakes: [
      'Swinging from the shoulder',
      'Going to full supination under load early with an ECU presentation',
    ],
    progression: 'Longer lever.',
    regression: 'Choke up; use no weight.',
  },
  'flexbar-tyler-twist': {
    id: 'flexbar-tyler-twist',
    name: 'FlexBar Tyler twist (extensor eccentric)',
    targetArea: 'Wrist extensors',
    cue: 'The good hand does the work; the sore wrist only resists the unwind.',
    instructions:
      'Hold the bar vertically in the sore hand with the wrist extended, twist it with the other hand, then extend both arms and slowly let the sore wrist unwind over 4 seconds.',
    whyItMatters:
      'The best-supported eccentric loading tool for extensor-side wrist and lateral elbow pain.',
    contextTag: 'couch',
    equipment: ['flexbar'],
    commonMistakes: ['Too stiff a bar — start green or red, not blue', 'Unwinding fast'],
    progression: 'Stiffer bar; slower unwind.',
    regression: 'Lower-resistance bar; fewer reps.',
  },
  'thumb-ext-band': {
    id: 'thumb-ext-band',
    name: 'Thumb extension / abduction with band',
    targetArea: 'Thumb extensors (1st compartment)',
    cue: 'Move at the base of the thumb, not the tip.',
    instructions:
      'Loop a small band around the thumb and index finger, spread the thumb away from the palm against the band, then return slowly. Primary add-on for the De Quervain variant.',
    contextTag: 'couch',
    equipment: ['band'],
    commonMistakes: ['Band too stiff early — this compartment is easily irritated'],
    progression: 'Firmer band; add radial deviation once symptoms settle.',
    regression: 'No band, active motion only.',
  },
  'ecu-ulnar-extension': {
    id: 'ecu-ulnar-extension',
    name: 'ECU-biased extension + ulnar deviation',
    targetArea: 'ECU',
    cue: 'Draw a diagonal to the pinky-side corner.',
    instructions:
      'Forearm pronated on the thigh holding a light dumbbell. Extend and ulnar-deviate in one diagonal motion, then lower slowly.',
    contextTag: 'couch',
    equipment: ['dumbbell'],
    commonMistakes: ['Pure extension with no ulnar deviation', 'Too much weight — start at 1 lb'],
    progression: 'More weight; then rotation under load; then weight-bearing.',
    regression: 'Isometric only; brace during provocative activity.',
  },
  'finger-ext-band': {
    id: 'finger-ext-band',
    name: 'Rubber band finger extension',
    targetArea: 'Finger extensors',
    cue: 'Spread wide, then resist the closing.',
    instructions:
      'Rubber band around all five fingertips. Open the hand against it, then close slowly. Low enough load to run alongside any wrist phase.',
    contextTag: 'couch',
    equipment: ['band'],
    commonMistakes: ['Only the index and thumb doing the work', 'Snapping the hand shut'],
    progression: 'Two bands, then a graded extensor device.',
    regression: 'Thinner band; a hair tie; loop it lower on the fingers.',
  },
  'wrist-roller': {
    id: 'wrist-roller',
    name: 'Wrist roller',
    targetArea: 'Wrist extensors · forearm endurance',
    cue: 'Elbows locked at shoulder height — the wrists do everything.',
    instructions:
      'Roll a weighted cord up onto the bar with alternating wrist extension, then lower it under control.',
    contextTag: 'standing',
    equipment: ['wrist-roller'],
    commonMistakes: ['Loading heavy immediately — the eccentric lowering is where forearms get wrecked'],
    progression: 'More weight; more up/down cycles.',
    regression: '2.5 lb; do only the upward (extension) direction.',
  },
  'farmer-carry-light': {
    id: 'farmer-carry-light',
    name: 'Light farmer carry',
    targetArea: 'Grip · forearm endurance',
    cue: 'Stand tall — don’t let the weights pull you into a shrug.',
    instructions:
      'Walk with a moderate weight in each hand, shoulders down, wrists neutral, for time.',
    contextTag: 'standing',
    equipment: ['dumbbell'],
    commonMistakes: ['Death-gripping', 'Letting the wrist flop into flexion'],
    progression: 'Heavier, longer, or single-arm (adds a core demand).',
    regression: 'Lighter; a static hold instead of a walk.',
  },

  // ── Phase 3 — Weight-bearing / closed chain ─────────────────────────
  'wall-lean-hold': {
    id: 'wall-lean-hold',
    name: 'Wall lean isometric hold',
    targetArea: 'Wrist extension under compression',
    cue: 'Push the floor away — actively press, don’t sag.',
    instructions:
      'Hands flat on a wall at shoulder height, lean in so real weight goes through the wrists, and hold.',
    contextTag: 'standing',
    equipment: [],
    commonMistakes: ['Standing too close (no load)', 'Standing so far back it hurts'],
    progression: 'Step the feet back to increase the angle, then wall push-ups.',
    regression: 'Step closer; put the hands higher.',
  },
  'wall-pushup': {
    id: 'wall-pushup',
    name: 'Wall push-up',
    targetArea: 'Wrist extension under compression',
    cue: 'Ribs down, body one line, elbows at ~45°.',
    instructions: 'Standard push-up against a wall, slow and controlled.',
    contextTag: 'standing',
    equipment: [],
    commonMistakes: ['Bouncing', 'Letting the hips lead'],
    progression: 'Feet further back → counter → couch seat → floor.',
    regression: 'Back to the wall lean hold.',
  },
  'incline-pushup-high': {
    id: 'incline-pushup-high',
    name: 'High incline push-up (counter)',
    targetArea: 'Wrist extension under compression',
    cue: 'Grip the surface with the fingertips to spread load away from the heel of the hand.',
    instructions:
      'Push-ups with the hands on a kitchen counter or the back of the couch — the second rung of the angle ladder.',
    contextTag: 'standing',
    equipment: [],
    commonMistakes: ['Skipping rungs', 'Sagging hips', 'Rushing the descent'],
    progression: 'Lower the surface; add reps; slow the eccentric.',
    regression: 'Higher surface; fewer reps.',
  },
  'incline-pushup-low': {
    id: 'incline-pushup-low',
    name: 'Low incline push-up (couch seat / step)',
    targetArea: 'Wrist extension under compression',
    cue: 'Grip the surface with the fingertips to spread load away from the heel of the hand.',
    instructions:
      'Push-ups with the hands on a couch seat, bench or stair — the rung before the floor.',
    contextTag: 'floor',
    equipment: ['step'],
    commonMistakes: ['Skipping rungs', 'Sagging hips', 'Rushing the descent'],
    progression: 'Lower the surface, then fists on the floor, then flat palms.',
    regression: 'Back up to the counter.',
  },
  'quadruped-wrist-rock': {
    id: 'quadruped-wrist-rock',
    name: 'Quadruped loaded wrist rocking',
    targetArea: 'Wrist extension under compression',
    cue: 'Rock only as far forward as stays ≤2/10.',
    instructions:
      'On hands and knees with palms flat, rock slowly forward and back so the wrist moves through extension under partial body weight.',
    contextTag: 'floor',
    equipment: [],
    commonMistakes: ['Rocking into pain', 'Locked elbows', 'Holding the breath'],
    progression: 'Rock further; shift weight to one arm; go to a plank base.',
    regression: 'Fists instead of palms; forearms down.',
  },
  'quadruped-shoulder-tap': {
    id: 'quadruped-shoulder-tap',
    name: 'Quadruped knuckle shoulder taps',
    targetArea: 'Single-arm weight-bearing',
    cue: 'Hips stay square — don’t twist to reach.',
    instructions:
      'In a quadruped or knee-plank position, tap the opposite shoulder, alternating sides. Adds a single-arm weight-bearing demand with a rotation component.',
    contextTag: 'floor',
    equipment: [],
    commonMistakes: ['Fast taps', 'Hips rolling'],
    progression: 'Knees off the floor; feet wider → narrower.',
    regression: 'Knuckles / fists; do it standing against a wall.',
  },
  'fist-pushup': {
    id: 'fist-pushup',
    name: 'Fist / neutral-wrist push-up',
    targetArea: 'Upper push (neutral wrist)',
    cue: 'Fists point forward, wrists locked straight in line with the forearm.',
    instructions:
      'Push-up on fists, parallettes or dumbbell handles. Keeps the wrist neutral and removes ~60–80° of extension.',
    whyItMatters:
      'Lets you keep training the pushing pattern at full load while wrist extension tolerance catches up separately.',
    contextTag: 'floor',
    equipment: ['parallettes'],
    commonMistakes: ['Fists collapsing into flexion', 'Doing them on a hard floor without a mat'],
    progression: 'Full push-up on flat palms.',
    regression: 'Incline fist push-up.',
  },
  'full-pushup': {
    id: 'full-pushup',
    name: 'Full floor push-up, flat palms',
    targetArea: 'Upper push · wrist extension',
    cue: 'Screw the hands outward into the floor and grip with the fingers.',
    instructions: 'Flat palms on the floor, full range, 3-second lowering.',
    contextTag: 'floor',
    equipment: [],
    commonMistakes: ['All the weight on the heel of the hand', 'Flaring the elbows to 90°'],
    progression: 'Reps, then tempo, then feet elevated; eventually plyo push-ups.',
    regression: 'Back to fists or an incline.',
  },
  'plank-hold-palms': {
    id: 'plank-hold-palms',
    name: 'Plank on flat palms',
    targetArea: 'Wrist extension under compression',
    cue: 'Push the floor away, ribs down, glutes on.',
    instructions: 'Plank on flat palms, actively pressing rather than hanging on the joints.',
    contextTag: 'floor',
    equipment: [],
    commonMistakes: ['Sagging into the wrists passively'],
    progression: 'Longer holds; add shoulder taps.',
    regression: 'Forearm plank (zero wrist load) or fists.',
  },
  'dead-hang-wrist-check': {
    id: 'dead-hang-wrist-check',
    name: 'Passive dead hang (wrist tolerance test)',
    targetArea: 'Wrist in traction · grip',
    cue: 'Shoulders active (slight pull down), not fully dumped.',
    instructions:
      'Passive hang from a bar. This is a test as much as an exercise — hanging loads the wrist in traction rather than compression, so it usually clears earlier than push-ups.',
    contextTag: 'gym',
    equipment: ['pull-up-bar'],
    commonMistakes: ['Doing it while the wrist is still acute', 'Jumping off carelessly'],
    progression: 'Support-grip dead hangs in the finger program.',
    regression: 'Feet on the ground taking part of the weight; use a rack pull instead.',
  },

  // ── Phase 4 — Sport-specific / return to play ───────────────────────
  'paddle-shadow-swings': {
    id: 'paddle-shadow-swings',
    name: 'Paddle shadow swings, graded speed',
    targetArea: 'Sport-specific forearm load',
    cue: 'Loose grip — roughly 4/10 pressure — and rotate from the trunk, not the wrist.',
    instructions:
      'Shadow the full pickleball stroke set (dinks, drives, backhands) with no ball, building from slow to full speed.',
    contextTag: 'standing',
    equipment: ['paddle'],
    commonMistakes: ['Rehearsing the same over-gripping "arming" pattern that caused the problem'],
    progression: 'Full speed → live ball → competitive play.',
    regression: 'Slower, fewer reps, shorter swings.',
  },
  'dribble-control-drill': {
    id: 'dribble-control-drill',
    name: 'Stationary dribble series, both hands',
    targetArea: 'Sport-specific wrist control',
    cue: 'Push the ball with the fingerpads, wrist relaxed.',
    instructions: 'Stationary dribbling series with both hands, varying the height.',
    contextTag: 'standing',
    equipment: ['basketball'],
    commonMistakes: ['Slapping the ball with a stiff wrist'],
    progression: 'Faster, lower, two balls.',
    regression: 'Slower and higher; fewer sets.',
  },
  'wall-ball-toss': {
    id: 'wall-ball-toss',
    name: 'Two-hand wall ball toss / catch',
    targetArea: 'Impact tolerance',
    cue: 'Catch soft — absorb by letting the elbows bend.',
    instructions: 'Two-hand chest toss into a wall, catch, repeat.',
    contextTag: 'standing',
    equipment: ['basketball'],
    commonMistakes: ['Catching with straight, rigid arms'],
    progression: 'Heavier ball, closer wall, faster tempo.',
    regression: 'Lighter ball, further back.',
  },
  'med-ball-chest-pass': {
    id: 'med-ball-chest-pass',
    name: 'Med ball chest pass to wall',
    targetArea: 'Impact tolerance',
    cue: 'Full arm extension, finish with the wrists neutral and firm.',
    instructions:
      'Explosive chest pass into a wall. The ECU rehab literature uses medicine-ball throws at varied wrist angles as a late-stage loading step.',
    contextTag: 'sweat',
    equipment: ['med-ball'],
    commonMistakes: ['Too heavy a ball too early', 'Letting the wrist hyperextend on the catch'],
    progression: 'Heavier ball; add overhead and rotational passes.',
    regression: 'Lighter ball; pass only, let it drop rather than catching.',
  },
  'plyo-pushup-optional': {
    id: 'plyo-pushup-optional',
    name: 'Hand-release / plyo push-up (optional)',
    targetArea: 'Upper push · impact tolerance',
    cue: 'Land with soft elbows and fingers gripping.',
    instructions:
      'Hand-release or clapping push-up. Genuinely optional — only worth it if you want full impact tolerance.',
    contextTag: 'sweat',
    equipment: [],
    commonMistakes: ['Doing these before flat-palm push-ups are painless'],
    progression: 'Higher, faster.',
    regression: 'Hand-release push-up (lift the hands, no jump).',
  },
  'graded-return-schedule': {
    id: 'graded-return-schedule',
    name: 'Graded return-to-play session ladder',
    targetArea: 'Return to sport',
    cue: 'Judge the previous session by tomorrow morning, not by how it felt at the time.',
    instructions:
      'Three weeks: week 1 half-length at 50% intensity with no competitive play, week 2 full length at 75%, week 3 normal play. Advance only if the 24-hour rule holds.',
    contextTag: 'sweat',
    equipment: [],
    commonMistakes: ['Feeling good in week one and jumping straight to a tournament'],
    progression: 'Add competitive play last.',
    regression: 'Repeat the previous week’s dose.',
  },
  'wrist-maintenance-block': {
    id: 'wrist-maintenance-block',
    name: 'Maintenance: Phase-2 loading, permanently',
    targetArea: 'Wrist extensors · flexors',
    cue: 'Non-negotiable, ten minutes, on the couch.',
    instructions:
      'Two sets of the Phase-2 loading work (extension and flexion curls), twice a week, permanently. This is the recurrence-prevention dose.',
    whyItMatters:
      'Stopping the moment it stops hurting is the most common cause of recurrence.',
    contextTag: 'couch',
    equipment: ['dumbbell'],
    commonMistakes: ['Stopping the moment it stops hurting'],
    regression: 'One set of each direction rather than dropping it entirely.',
  },
}

// ─────────────────────────────────────────────────────────────────────────────
// Shared phase furniture
// ─────────────────────────────────────────────────────────────────────────────

/** Section 8 — wrist. Stop the program and get assessed. */
const wristRedFlags: string[] = [
  'Deep focal pinky-side pain with forearm rotation under axial load — especially with clicking, clunking or a sense of instability. Suspected TFCC tear: cartilage and ligament, not tendon, and progressive loading is the wrong tool. Get assessed.',
  'A tendon that visibly snaps or pops over the bone on the ulnar side (positive ice-cream scoop) — ECU subsheath injury, which frequently coexists with a TFCC tear.',
  'Numbness, tingling or pins-and-needles anywhere in the hand — nerve involvement, not tendinopathy.',
  'Any history of a fall onto an outstretched hand with ongoing pain, especially anatomical snuffbox tenderness — scaphoid fractures are notorious for being missed.',
  'Visible deformity, significant swelling, or hot/red skin.',
  'Night pain that wakes you, or pain at complete rest, that is not improving.',
  'Locking, catching, or an inability to fully straighten a finger or the wrist.',
  'Grip strength that keeps declining despite consistent loading.',
  'No meaningful improvement after 8–12 weeks of consistent, correctly-dosed loading — a plateau at 12 weeks means the diagnosis needs revisiting.',
]

/** The 24-hour response gate, asked identically in every phase. */
const painGateQuestions: CheckInQuestion[] = [
  {
    id: 'pain_during',
    label: 'Worst wrist pain during this week’s exercises (0–10)',
    type: 'pain0to10',
  },
  {
    id: 'flare_24h',
    label: 'Was pain or morning stiffness worse 24h after any session?',
    type: 'yesNo',
  },
]

// ─────────────────────────────────────────────────────────────────────────────
// Phase items
// ─────────────────────────────────────────────────────────────────────────────

/** Phase 1 — calm & isometric. All couch work; isometrics run daily. */
const wristPhase1Items: ProtocolItem[] = [
  {
    id: 'w1-ext-iso',
    exerciseId: 'wrist-ext-isometric',
    sets: 5,
    durationSeconds: 40,
    displayAmount: '5 × 30–45s hold',
    tempo: 'Hold',
    load: 'Opposite hand or table edge, 40–70% effort',
    frequency: { perWeek: 'daily' },
    bucket: 'couch',
    tissues: ['wrist-extensors'],
    intensity: 'easy',
    notes:
      '1–2×/day. Note on treatment offers: corticosteroid injections are commonly offered and often help short-term, but for tendinopathy they are associated with worse long-term outcomes — worth knowing before you are in the room.',
    alternates: ['w1-flex-iso'],
  },
  {
    id: 'w1-flex-iso',
    exerciseId: 'wrist-flex-isometric',
    sets: 5,
    durationSeconds: 40,
    displayAmount: '5 × 30–45s hold',
    tempo: 'Hold',
    load: 'Opposite hand, 40–70% effort',
    frequency: { perWeek: 'daily' },
    bucket: 'couch',
    tissues: ['wrist-flexors'],
    intensity: 'easy',
    notes: '1–2×/day.',
    alternates: ['w1-ext-iso'],
  },
  {
    id: 'w1-ulnar-iso',
    exerciseId: 'wrist-ulnar-isometric',
    sets: 3,
    durationSeconds: 30,
    displayAmount: '3 × 30s hold',
    tempo: 'Hold',
    load: 'Opposite hand',
    frequency: { perWeek: 'daily' },
    bucket: 'couch',
    tissues: ['wrist-extensors'],
    intensity: 'easy',
    notes: '1–2×/day. The ECU variant lives here — keep it sub-maximal.',
    alternates: ['w1-radial-iso'],
  },
  {
    id: 'w1-radial-iso',
    exerciseId: 'wrist-radial-isometric',
    sets: 3,
    durationSeconds: 30,
    displayAmount: '3 × 30s hold',
    tempo: 'Hold',
    load: 'Opposite hand',
    frequency: { perWeek: 'daily' },
    bucket: 'couch',
    tissues: ['wrist-extensors'],
    intensity: 'easy',
    notes: '1–2×/day. Skip early if Finkelstein was positive — the radial version can flare it.',
    alternates: ['w1-ulnar-iso'],
  },
  {
    id: 'w1-rot-iso',
    exerciseId: 'forearm-rotation-isometric',
    sets: 3,
    durationSeconds: 30,
    displayAmount: '3 × 30s each direction',
    tempo: 'Hold',
    load: 'Opposite hand gripping your fist',
    frequency: { perWeek: 'daily' },
    bucket: 'couch',
    tissues: ['wrist-extensors', 'wrist-flexors'],
    intensity: 'easy',
    notes: 'ECU variant: skip end-range supination.',
  },
  {
    id: 'w1-arom',
    exerciseId: 'wrist-arom-circuit',
    sets: 3,
    reps: 10,
    displayAmount: '3 × 10 each direction',
    tempo: '2-0-2',
    load: 'None',
    frequency: { perWeek: 'daily' },
    bucket: 'couch',
    intensity: 'easy',
  },
  {
    id: 'w1-glides',
    exerciseId: 'tendon-glide-series',
    sets: 2,
    reps: 10,
    displayAmount: '2 × 10 full sequences',
    tempo: 'Slow, 2s per shape',
    load: 'None',
    frequency: { perWeek: 'daily' },
    bucket: 'couch',
    intensity: 'easy',
  },
  {
    id: 'w1-grip-ball',
    exerciseId: 'grip-submax-ball',
    sets: 3,
    reps: 10,
    displayAmount: '3 × 10 × 5s hold',
    tempo: 'Hold 5s',
    load: 'Soft stress ball, ~50% effort',
    frequency: { perWeek: 'daily' },
    bucket: 'couch',
    tissues: ['fingers'],
    intensity: 'easy',
  },
  {
    id: 'w1-scap-row',
    exerciseId: 'band-scap-row',
    sets: 3,
    reps: 10,
    displayAmount: '3 × 10 (5s hold)',
    tempo: '2-5-2',
    load: 'Light band anchored at chest height',
    frequency: { perWeek: 'daily' },
    bucket: 'couch',
    tissues: ['upper-pull'],
    intensity: 'easy',
  },
  {
    id: 'w1-ext-stretch',
    exerciseId: 'wrist-ext-stretch',
    sets: 3,
    durationSeconds: 30,
    displayAmount: '3 × 30s',
    tempo: 'Hold',
    load: 'None — skip if pain >3/10',
    frequency: { perWeek: 'daily' },
    bucket: 'couch',
    intensity: 'easy',
    notes: 'Up to 3×/day. Above 3/10 means stop, not push.',
  },
]

/** Phase 2 — isotonic loading. The main event; heavy work every other day. */
const wristPhase2Items: ProtocolItem[] = [
  {
    id: 'w2-ext-curl',
    exerciseId: 'wrist-ext-curl',
    sets: 3,
    reps: 15,
    displayAmount: '3 × 15 → 10 → 8',
    tempo: '3s down · 1s pause · 2s up',
    load: '1–5 lb dumbbell',
    frequency: { perWeek: 4 },
    minSpacingDays: 2,
    bucket: 'couch',
    tissues: ['wrist-extensors'],
    intensity: 'hard',
    alternates: ['w2-ext-ecc', 'w2-flexbar'],
    notes: 'Every other day — the tendon needs ~48h. Progress load first, then toward heavier 3×8.',
  },
  {
    id: 'w2-flex-curl',
    exerciseId: 'wrist-flex-curl',
    sets: 3,
    reps: 15,
    displayAmount: '3 × 15 → 10 → 8',
    tempo: '3s down · 1s pause · 2s up',
    load: '1–5 lb dumbbell',
    frequency: { perWeek: 4 },
    minSpacingDays: 2,
    bucket: 'couch',
    tissues: ['wrist-flexors'],
    intensity: 'hard',
    notes: 'Every other day. The flexors are ~3× stronger than the extensors — resist jumping load.',
  },
  {
    id: 'w2-ext-ecc',
    exerciseId: 'wrist-ext-eccentric',
    sets: 3,
    reps: 12,
    displayAmount: '3 × 12',
    tempo: '4s lower · assisted lift',
    load: 'Dumbbell — lift with the other hand, lower with the sore one',
    frequency: { perWeek: 4 },
    minSpacingDays: 2,
    bucket: 'couch',
    tissues: ['wrist-extensors'],
    intensity: 'hard',
    alternates: ['w2-ext-curl', 'w2-flexbar'],
    notes: 'Every other day.',
  },
  {
    id: 'w2-hammer-dev',
    exerciseId: 'radial-ulnar-hammer',
    sets: 3,
    reps: 12,
    displayAmount: '3 × 12 each direction',
    tempo: '3s down · 1s pause · 2s up',
    load: 'Hammer or short dumbbell held near the end',
    frequency: { perWeek: 4 },
    minSpacingDays: 2,
    bucket: 'couch',
    tissues: ['wrist-extensors'],
    intensity: 'hard',
    alternates: ['w2-hammer-rot'],
    notes: 'Every other day. De Quervain variant: drop the radial half until radial symptoms settle.',
  },
  {
    id: 'w2-hammer-rot',
    exerciseId: 'forearm-rotation-hammer',
    sets: 3,
    reps: 12,
    displayAmount: '3 × 12 each direction',
    tempo: '3s down · 1s pause · 2s up',
    load: 'Hammer, choked long for more torque',
    frequency: { perWeek: 4 },
    minSpacingDays: 2,
    bucket: 'couch',
    tissues: ['wrist-extensors', 'wrist-flexors'],
    intensity: 'hard',
    alternates: ['w2-hammer-dev'],
    notes: 'Every other day. ECU variant: stop short of full supination under load early on.',
  },
  {
    id: 'w2-flexbar',
    exerciseId: 'flexbar-tyler-twist',
    sets: 3,
    reps: 15,
    displayAmount: '3 × 15',
    tempo: '4s unwind · 2s reset',
    load: 'Green or red FlexBar',
    frequency: { perWeek: 4 },
    minSpacingDays: 2,
    bucket: 'couch',
    tissues: ['wrist-extensors'],
    intensity: 'hard',
    alternates: ['w2-ext-curl', 'w2-ext-ecc'],
    notes: 'Every other day. Highest-value item for extensor/dorsal pain or tennis-elbow overlap.',
  },
  {
    id: 'w2-thumb-band',
    exerciseId: 'thumb-ext-band',
    sets: 3,
    reps: 15,
    displayAmount: '3 × 15',
    tempo: '2-1-2',
    load: 'Small loop band around thumb + index',
    frequency: { perWeek: 'daily' },
    bucket: 'couch',
    intensity: 'easy',
    notes: 'Primary add-on for the De Quervain variant; harmless for everyone else.',
  },
  {
    id: 'w2-ecu-diag',
    exerciseId: 'ecu-ulnar-extension',
    sets: 3,
    reps: 12,
    displayAmount: '3 × 12',
    tempo: '3s down · 1s pause · 2s up',
    load: '1–3 lb dumbbell, forearm pronated',
    frequency: { perWeek: 4 },
    minSpacingDays: 2,
    bucket: 'couch',
    tissues: ['wrist-extensors'],
    intensity: 'hard',
    notes: 'Every other day. The ECU-specific loading step — skip unless the ulnar screen was positive.',
  },
  {
    id: 'w2-finger-ext-band',
    exerciseId: 'finger-ext-band',
    sets: 3,
    reps: 15,
    displayAmount: '3 × 15',
    tempo: '2-1-2',
    load: 'Rubber band or extensor band',
    frequency: { perWeek: 'daily' },
    bucket: 'couch',
    tissues: ['fingers'],
    intensity: 'easy',
    notes: 'Pulls in the opposite direction from the flexor-dominant pattern — safe from day one.',
  },
  {
    id: 'w2-roller',
    exerciseId: 'wrist-roller',
    sets: 2,
    reps: 2,
    displayAmount: '2 × 2 up/down',
    tempo: 'Slow, controlled lowering',
    load: 'Wrist roller, 2.5–10 lb',
    frequency: { perWeek: 2 },
    minSpacingDays: 2,
    bucket: 'quick',
    tissues: ['wrist-extensors', 'fingers'],
    intensity: 'hard',
    alternates: ['w2-farmer'],
  },
  {
    id: 'w2-farmer',
    exerciseId: 'farmer-carry-light',
    sets: 3,
    durationSeconds: 30,
    displayAmount: '3 × 30s carry',
    tempo: 'Steady walk',
    load: 'Dumbbells / kettlebells 15–30 lb',
    frequency: { perWeek: 2 },
    minSpacingDays: 2,
    bucket: 'quick',
    tissues: ['fingers', 'wrist-flexors'],
    intensity: 'hard',
    alternates: ['w2-roller'],
  },
]

/**
 * Phase 3 — weight-bearing / closed chain. The angle ladder
 * (wall → high incline → low incline → floor) plus neutral-wrist variants.
 */
const wristPhase3Items: ProtocolItem[] = [
  {
    id: 'w3-wall-lean',
    exerciseId: 'wall-lean-hold',
    sets: 3,
    durationSeconds: 40,
    displayAmount: '3 × 30–45s hold',
    tempo: 'Hold',
    load: 'Bodyweight through flat hands at shoulder height',
    frequency: { perWeek: 4 },
    minSpacingDays: 2,
    bucket: 'quick',
    tissues: ['wrist-extensors'],
    intensity: 'easy',
    alternates: ['w3-wall-pushup'],
    notes: 'Every other day. A 30s hold at ~45° with pain ≤2/10 is the entry gate for this phase.',
  },
  {
    id: 'w3-wall-pushup',
    exerciseId: 'wall-pushup',
    sets: 3,
    reps: 12,
    displayAmount: '3 × 10–15',
    tempo: '2-1-2',
    load: 'Bodyweight',
    frequency: { perWeek: 4 },
    minSpacingDays: 2,
    bucket: 'quick',
    tissues: ['wrist-extensors', 'upper-push'],
    intensity: 'easy',
    alternates: ['w3-wall-lean'],
    notes: 'Every other day. Rung 1 of the angle ladder.',
  },
  {
    id: 'w3-incline-high',
    exerciseId: 'incline-pushup-high',
    sets: 3,
    reps: 10,
    displayAmount: '3 × 10',
    tempo: '3s down · 1s pause · 2s up',
    load: 'Bodyweight on a counter / couch back',
    frequency: { perWeek: 4 },
    minSpacingDays: 2,
    bucket: 'workout',
    workoutSizes: ['S', 'M', 'L'],
    tissues: ['wrist-extensors', 'upper-push'],
    intensity: 'hard',
    alternates: ['w3-incline-low', 'w3-fist-pushup', 'w3-full-pushup'],
    notes: 'Every other day. Advance a rung when 3×10 is clean at ≤2/10 with no next-day flare.',
  },
  {
    id: 'w3-incline-low',
    exerciseId: 'incline-pushup-low',
    sets: 3,
    reps: 10,
    displayAmount: '3 × 10',
    tempo: '3s down · 1s pause · 2s up',
    load: 'Bodyweight on a couch seat, bench or stair',
    frequency: { perWeek: 4 },
    minSpacingDays: 2,
    bucket: 'workout',
    workoutSizes: ['S', 'M', 'L'],
    tissues: ['wrist-extensors', 'upper-push'],
    intensity: 'hard',
    alternates: ['w3-incline-high', 'w3-fist-pushup', 'w3-full-pushup'],
    notes: 'Every other day. Rung 3 of the ladder.',
  },
  {
    id: 'w3-quad-rock',
    exerciseId: 'quadruped-wrist-rock',
    sets: 3,
    reps: 10,
    displayAmount: '3 × 10 rocks',
    tempo: '3s forward · 3s back',
    load: 'Bodyweight on hands and knees',
    frequency: { perWeek: 4 },
    minSpacingDays: 2,
    bucket: 'workout',
    workoutSizes: ['S', 'M', 'L'],
    tissues: ['wrist-extensors'],
    intensity: 'hard',
    alternates: ['w3-quad-tap'],
    notes:
      'Every other day. Rock only as far forward as stays ≤2/10. Loaded wrist extension under bodyweight — hard, like its incline-push-up siblings.',
  },
  {
    id: 'w3-quad-tap',
    exerciseId: 'quadruped-shoulder-tap',
    sets: 3,
    reps: 8,
    displayAmount: '3 × 8 per side',
    tempo: 'Slow',
    load: 'Bodyweight, fists or flat palms',
    frequency: { perWeek: 4 },
    minSpacingDays: 2,
    bucket: 'workout',
    workoutSizes: ['M', 'L'],
    tissues: ['wrist-extensors'],
    intensity: 'hard',
    alternates: ['w3-quad-rock'],
    notes: 'Every other day. Single-arm weight-bearing on an extended wrist — hard.',
  },
  {
    id: 'w3-fist-pushup',
    exerciseId: 'fist-pushup',
    sets: 3,
    reps: 10,
    displayAmount: '3 × 8–12',
    tempo: '3s down · 1s pause · 2s up',
    load: 'Fists, parallettes or dumbbell handles',
    frequency: { perWeek: 4 },
    minSpacingDays: 2,
    bucket: 'workout',
    workoutSizes: ['M', 'L'],
    tissues: ['upper-push'],
    intensity: 'hard',
    alternates: ['w3-incline-low', 'w3-full-pushup'],
    notes:
      'Every other day. Keeps the wrist neutral, so pushing strength keeps training while extension tolerance catches up.',
  },
  {
    id: 'w3-full-pushup',
    exerciseId: 'full-pushup',
    sets: 3,
    reps: 10,
    displayAmount: '3 × 8–12',
    tempo: '3s down · 1s pause · 2s up',
    load: 'Bodyweight, flat palms',
    frequency: { perWeek: 4 },
    minSpacingDays: 2,
    bucket: 'workout',
    workoutSizes: ['M', 'L'],
    tissues: ['wrist-extensors', 'upper-push'],
    intensity: 'hard',
    alternates: ['w3-fist-pushup', 'w3-incline-low'],
    notes: 'Every other day. The phase exit target: 3×10 clean at ≤2/10, no 24-hour flare.',
  },
  {
    id: 'w3-plank-palms',
    exerciseId: 'plank-hold-palms',
    sets: 3,
    durationSeconds: 40,
    displayAmount: '3 × 30–45s',
    tempo: 'Hold, actively pressing',
    load: 'Bodyweight',
    frequency: { perWeek: 4 },
    minSpacingDays: 2,
    bucket: 'workout',
    workoutSizes: ['L'],
    tissues: ['wrist-extensors'],
    intensity: 'hard',
    notes: 'Every other day. Sustained bodyweight through an extended wrist — hard.',
  },
  {
    id: 'w3-dead-hang-check',
    exerciseId: 'dead-hang-wrist-check',
    sets: 3,
    durationSeconds: 20,
    displayAmount: '3 × 15–30s hang',
    tempo: 'Hold',
    load: 'Bodyweight on a pull-up bar',
    frequency: { perWeek: 2 },
    minSpacingDays: 2,
    bucket: 'workout',
    workoutSizes: ['L'],
    tissues: ['fingers', 'upper-pull'],
    intensity: 'hard',
    notes:
      'Traction, not compression — so this usually clears earlier than push-ups. A painless 20s hang with no 24h flare green-lights the finger program’s support hangs even if flat-palm push-ups are not there yet.',
  },
]

/** Phase 4 — sport-specific / graded return. Ongoing. */
const wristPhase4Items: ProtocolItem[] = [
  {
    id: 'w4-paddle-shadow',
    exerciseId: 'paddle-shadow-swings',
    sets: 3,
    reps: 20,
    displayAmount: '3 × 20 swings',
    tempo: 'Build slow → full speed',
    load: 'Pickleball paddle',
    frequency: { perWeek: 3 },
    bucket: 'quick',
    tissues: ['wrist-extensors'],
    intensity: 'easy',
    notes:
      'Equipment is a real load lever: grip ~4.125"+ circumference (each overgrip layer adds ~1/16"), paddle weight around 7.7–8.2 oz, and a 4/10 grip pressure that only tightens at contact.',
  },
  {
    id: 'w4-dribble',
    exerciseId: 'dribble-control-drill',
    sets: 3,
    durationSeconds: 45,
    displayAmount: '3 × 45s',
    tempo: 'Steady',
    load: 'Basketball',
    frequency: { perWeek: 3 },
    bucket: 'quick',
    tissues: ['wrist-extensors', 'fingers'],
    intensity: 'easy',
    alternates: ['w4-wall-toss'],
  },
  {
    id: 'w4-wall-toss',
    exerciseId: 'wall-ball-toss',
    sets: 3,
    reps: 20,
    displayAmount: '3 × 20 catches',
    tempo: 'Reactive',
    load: 'Basketball or 4–6 lb med ball',
    frequency: { perWeek: 2 },
    minSpacingDays: 2,
    bucket: 'quick',
    tissues: ['wrist-extensors', 'fingers'],
    intensity: 'easy',
    alternates: ['w4-dribble'],
  },
  {
    id: 'w4-med-ball-pass',
    exerciseId: 'med-ball-chest-pass',
    sets: 3,
    reps: 10,
    displayAmount: '3 × 10 passes',
    tempo: 'Explosive',
    load: '6–10 lb med ball',
    frequency: { perWeek: 2 },
    minSpacingDays: 2,
    bucket: 'workout',
    workoutSizes: ['M', 'L'],
    tissues: ['wrist-extensors', 'upper-push'],
    intensity: 'hard',
  },
  {
    id: 'w4-plyo-pushup',
    exerciseId: 'plyo-pushup-optional',
    sets: 3,
    reps: 5,
    displayAmount: '3 × 5',
    tempo: 'Explosive',
    load: 'Bodyweight',
    frequency: { perWeek: 2 },
    minSpacingDays: 2,
    bucket: 'workout',
    workoutSizes: ['L'],
    tissues: ['wrist-extensors', 'upper-push'],
    intensity: 'hard',
    notes: 'Optional. Only once flat-palm push-ups are painless.',
  },
  {
    id: 'w4-graded-return',
    exerciseId: 'graded-return-schedule',
    sets: 1,
    displayAmount: '50% → 75% → 100% over 3 weeks',
    tempo: 'As scheduled',
    load: 'The actual sport',
    frequency: { perWeek: 2 },
    minSpacingDays: 2,
    bucket: 'workout',
    workoutSizes: ['M', 'L'],
    tissues: ['wrist-extensors', 'wrist-flexors'],
    intensity: 'hard',
    notes:
      'Cap consecutive playing days: three 60-minute sessions on non-consecutive days beats two 3-hour marathons. Warm up 3–5 min of light range plus isometrics before play.',
  },
  {
    id: 'w4-maintenance',
    exerciseId: 'wrist-maintenance-block',
    sets: 2,
    reps: 12,
    displayAmount: '2 × 12',
    tempo: '3s down · 1s pause · 2s up',
    load: 'Dumbbell',
    frequency: { perWeek: 2 },
    minSpacingDays: 2,
    bucket: 'couch',
    tissues: ['wrist-extensors', 'wrist-flexors'],
    intensity: 'hard',
    notes: 'Forever. This is the recurrence-prevention dose.',
  },
]

// ─────────────────────────────────────────────────────────────────────────────
// Program
// ─────────────────────────────────────────────────────────────────────────────

export const wristProgram: ProgramDef = {
  id: 'wrist',
  name: 'Wrist Rehab (R)',
  priority: 30,
  phases: [
    {
      id: 'phase1',
      name: 'Phase 1 — Calm & isometric',
      entryCriteria:
        'Self-assessment routed into the program (no TFCC-suspicious pattern, no numbness). Especially if the wrist hurts at rest, at night, or with light daily tasks. Cut provocative volume rather than everything — reduce play, do not stop it, unless pain is >5/10 during play.',
      exitCriteria:
        'Full pain-free active range; isometric holds at high effort with pain ≤2/10; no night pain; 3×10 unresisted wrist motion clean. Typically 1–3 weeks.',
      items: wristPhase1Items,
      checkInQuestions: [
        { id: 'pain_rest', label: 'Wrist pain at rest or at night (0–10)', type: 'pain0to10' },
        { id: 'pain_daily', label: 'Wrist pain with light daily tasks (0–10)', type: 'pain0to10' },
        ...painGateQuestions,
        { id: 'arom_clean', label: '3×10 unresisted wrist motion, pain-free?', type: 'yesNo' },
      ],
      redFlags: wristRedFlags,
    },
    {
      id: 'phase2',
      name: 'Phase 2 — Isotonic loading',
      entryCriteria:
        'Phase 1 exit criteria met. Phase 1 isometrics stay in as a warm-up from here on — do not drop them.',
      exitCriteria:
        '3×15 with a clearly challenging load in all four directions (flexion, extension, radial, ulnar) plus pronation/supination, pain ≤2/10 during, no 24-hour flare. Grip strength within ~80–90% of the left hand. Typically 3–8 weeks.',
      items: wristPhase2Items,
      checkInQuestions: [
        ...painGateQuestions,
        {
          id: 'progress_trigger',
          label: 'Two or three sessions in a row with no flare and ≤+1 pain?',
          type: 'yesNo',
        },
        { id: 'grip_symmetry', label: 'Grip within ~80–90% of the left hand?', type: 'yesNo' },
      ],
      redFlags: wristRedFlags,
    },
    {
      id: 'phase3',
      name: 'Phase 3 — Weight-bearing / closed chain',
      entryCriteria:
        'Phase 2 exit met AND a 30-second hands-on-wall lean at ~45° with pain ≤2/10. Overlaps Phase 2 — keep the isotonic loading running.',
      exitCriteria:
        '3×10 full floor push-ups on flat palms, pain ≤2/10, no 24-hour flare; a 30-second loaded tabletop/plank on flat palms. Typically 2–6 weeks.',
      items: wristPhase3Items,
      checkInQuestions: [
        {
          id: 'pain_pushup',
          label: 'Wrist pain in the push-up position (0–10)',
          type: 'pain0to10',
        },
        ...painGateQuestions,
        { id: 'floor_pushups', label: '3×10 flat-palm floor push-ups clean?', type: 'yesNo' },
      ],
      redFlags: wristRedFlags,
    },
    {
      id: 'phase4',
      name: 'Phase 4 — Sport-specific / return to play',
      entryCriteria:
        'Phase 3 exit met. Graded return: week 1 half-length at 50% and no competitive play, week 2 full length at 75%, week 3 normal play — advancing a step only if the 24-hour rule held after the previous session.',
      exitCriteria:
        'Ongoing. Normal competitive play with no 24-hour flare, plus 2×/week of Phase-2 loading kept permanently — that maintenance dose is what prevents recurrence.',
      items: wristPhase4Items,
      checkInQuestions: [
        {
          id: 'pain_after_play',
          label: 'Wrist pain the morning after playing (0–10)',
          type: 'pain0to10',
        },
        ...painGateQuestions,
        { id: 'maintenance_kept', label: 'Kept 2×/week of Phase-2 loading?', type: 'yesNo' },
      ],
      redFlags: wristRedFlags,
    },
  ],
  pregameItems: [
    {
      id: 'w-pg-iso',
      exerciseId: 'wrist-ext-isometric',
      sets: 3,
      durationSeconds: 30,
      displayAmount: '3 × 30s hold',
      tempo: 'Hold',
      load: 'Opposite hand, ~50% effort',
      frequency: { perWeek: 'daily' },
      bucket: 'quick',
      tissues: ['wrist-extensors'],
      intensity: 'easy',
      notes: 'Part of the 3–5 min pre-play warm-up.',
    },
    {
      id: 'w-pg-arom',
      exerciseId: 'wrist-arom-circuit',
      sets: 2,
      reps: 10,
      displayAmount: '2 × 10 each direction',
      tempo: '2-0-2',
      load: 'None',
      frequency: { perWeek: 'daily' },
      bucket: 'quick',
      intensity: 'easy',
      notes: 'Light wrist/forearm range before play.',
    },
  ],
  postgameItems: [
    {
      id: 'w-post-glides',
      exerciseId: 'tendon-glide-series',
      sets: 2,
      reps: 10,
      displayAmount: '2 × 10 full sequences',
      tempo: 'Slow',
      load: 'None',
      frequency: { perWeek: 'daily' },
      bucket: 'couch',
      intensity: 'easy',
      notes: 'Judge the session by tomorrow morning, not by how it felt at the time.',
    },
  ],
}
