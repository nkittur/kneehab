/**
 * The tibialis-anterior program's gate tests — the phase exit/entry criteria
 * and the return-to-play checklist from `docs/research/tibialis-anterior.md`
 * (sections 2 and 7), written out as things you can actually go and do.
 *
 * Static content, like the rest of `src/programs/*`. Results live in Dexie
 * (`gateTests`, see `src/lib/db.ts`).
 */

import type { ProgramId } from './types'

export type GateTestGroupId = 'B-exit' | 'C-entry' | 'C-exit' | 'RTP'

export type GateTest = {
  id: string
  group: GateTestGroupId
  name: string
  /** The pass bar, short enough to read in one line. */
  criterion: string
  /** How to actually run the test. */
  how: string[]
  /** Equipment or setting needed, e.g. 'step edge', 'flat 30-min route'. */
  needs?: string
  /** Pass depends on a 24h check — the UI shows a reminder. */
  nextMorning?: boolean
  /** Which problem the gate belongs to. Defaults to the tib ant program. */
  program?: Extract<ProgramId, 'tibant' | 'knee'>
}

export type GateTestGroup = {
  id: GateTestGroupId
  title: string
  blurb: string
}

/**
 * A phase move and everything it costs. No single group earns a phase on its
 * own — `tibant.ts` asks for Phase B exit *and* the 5-minute jog before Phase
 * C, and Phase C exit *and* the whole return-to-play checklist before Phase D —
 * so the requirement is a set of groups, mirroring those `entryCriteria`.
 */
export type Advancement = {
  programId: Extract<ProgramId, 'tibant'>
  /** `PhaseDef.id` the move lands on. */
  toPhaseId: string
  /** Every group that has to be passed, in the order the page shows them. */
  requires: GateTestGroupId[]
}

export const GATE_GROUPS: GateTestGroup[] = [
  {
    id: 'B-exit',
    title: 'Phase B exit',
    blurb:
      'Phase B is the long one — the heavy slow loading that actually changes the tendon. These six say the tendon and the knee have the capacity to be bounced on. Passing them all, plus the jog in the next group, unlocks Phase C energy-storage work: pogos, rope, bounds. Going into plyometrics on a tendon that still complains on stairs, or on a knee that is reactive to a step-down, is the single most common way to restart this whole process.',
  },
  {
    id: 'C-entry',
    title: 'Phase C entry',
    blurb:
      'One extra gate between passing Phase B and starting the plyometric block: the tendon has to tolerate a short jog first. Jogging is a much gentler energy-storage load than hopping, so it is the cheap test to run before you spend three weeks bouncing.',
  },
  {
    id: 'C-exit',
    title: 'Phase C exit',
    blurb:
      'Energy-storage capacity and symmetry. Two of these are hop tests measured against the left leg — a limb symmetry index below 90% means you would be walking onto a court with a leg that cannot do what the other one does, which is how compensations and re-injuries happen. Passing this group and the checklist below it unlocks the graded return to play, not unrestricted play.',
  },
  {
    id: 'RTP',
    title: 'Return to play',
    blurb:
      'The section 7 checklist. Mostly items not covered above — the settling-and-stability criteria: a tendon that behaves for weeks rather than for one good afternoon, a knee that survives ordinary life, shoes you can lace normally, and a maintenance plan you will still be running in six months. Two are re-tests of Phase B gates at a harder bar, because what gets you into plyometrics is not what gets you back on a court. Recurrence in this tendon is common when the loading stops, so the last box matters as much as the first.',
  },
]

/**
 * Which groups earn which phase. Keep in step with the `entryCriteria` on the
 * tib ant phases in `tibant.ts` — those are the source, this is the machine
 * -readable copy. There is no advancement into Phase A or B: those are check-in
 * moves, not gate-test ones.
 */
export const ADVANCEMENTS: Advancement[] = [
  { programId: 'tibant', toPhaseId: 'phaseC', requires: ['B-exit', 'C-entry'] },
  { programId: 'tibant', toPhaseId: 'phaseD', requires: ['C-exit', 'RTP'] },
]

export const GATE_TESTS: GateTest[] = [
  // ── Phase B exit ────────────────────────────────────────────────────
  {
    id: 'b-walk-30',
    group: 'B-exit',
    name: '30-minute flat walk',
    criterion: '≤2/10 during, no next-morning increase',
    needs: 'Flat 30-min route, your normal walking shoes with the laces set as you now wear them',
    nextMorning: true,
    how: [
      'Pick a genuinely flat route — no hills, no long downhill stretch, which is a different (and harder) test.',
      'Walk 30 minutes continuously at your normal pace. No stopping to let it settle.',
      'Rate the worst pain you felt at the front of the ankle during the walk.',
      'Check again the next morning: first steps out of bed should be no stiffer or sorer than the morning before.',
    ],
  },
  {
    id: 'b-heel-walk-45s',
    group: 'B-exit',
    name: 'Heel walk, 45 seconds',
    criterion: '≤2/10 for the full 45 s',
    needs: 'Shoes or a carpeted stretch, timer',
    how: [
      'Lift the toes and forefeet and walk forward on your heels, taking short controlled steps.',
      'Keep going for 45 seconds on the timer — no forefoot touch-downs to rest.',
      'Short steps, toes high, no slapping. Long strides or a slapping forefoot means the test is over.',
      'Rate the worst pain over the 45 seconds.',
    ],
  },
  {
    id: 'b-tib-raise-15',
    group: 'B-exit',
    name: '15 slow weighted tib raises, both legs',
    criterion: 'Same load left and right, right ≤3/10 and not visibly weaker',
    needs: 'Dumbbell or kettlebell, a towel, a seat',
    how: [
      'Sit with heels on the floor and the weight resting across the top of the forefoot, a towel underneath. Keep the weight forward over the toes, not back near the ankle.',
      'Lift the forefoot over 3 seconds, hold 1, lower over 3. Heel stays down.',
      'Do 15 reps on the left at your working load, then 15 on the right at the same load.',
      'Watch the last few reps: the right should move the same height at the same speed as the left, with no tempo collapse.',
      'Rate the worst pain on the right side.',
    ],
  },
  {
    id: 'b-calf-raise-25',
    group: 'B-exit',
    name: '25 single-leg calf raises (right)',
    criterion: '25 clean reps, full range',
    needs: 'Step edge, fingertip on a wall for balance',
    how: [
      'Stand on the right forefoot on the edge of a step, fingertips on a wall or rail for balance only.',
      'Rise to full height over 3 seconds, lower below step level over 3 seconds.',
      'Count until form breaks — heel not reaching full height, knee bending to cheat the top, or bouncing out of the bottom.',
      'A weak calf changes your gait and dumps work onto the anterior compartment, which is why this one is a tib ant gate at all.',
    ],
  },
  {
    id: 'b-stairs',
    group: 'B-exit',
    name: 'Stairs, up and down at normal pace',
    criterion: '≤2/10 both directions',
    needs: 'A full flight of stairs',
    how: [
      'Walk up a full flight at your ordinary pace — no railing hauling, no slowing down to protect the ankle.',
      'Walk back down at the same pace. Descending is the harder direction for this tendon.',
      'Repeat for two or three flights so the tendon has to do it more than once.',
      'Rate the worst pain, and note whether it was on the way up or the way down.',
    ],
  },
  {
    id: 'b-step-down-eccentric',
    group: 'B-exit',
    name: 'Eccentric step-down',
    criterion: '≤2/10 at the knee',
    needs: '4–8 inch step',
    program: 'knee',
    how: [
      'Stand on the step on the right leg, hands off or fingertips on a wall.',
      'Lower the left heel toward the floor over 4 seconds, tap lightly, and return.',
      'The right knee stays stacked over the middle of the foot the whole way down — no caving inward, no fast drop.',
      'Do 8–10 reps and rate the worst pain at the front of the knee.',
      'This is the PFPS gate: do not enter plyometrics with a reactive knee. If it is above 2/10, lower the step and retest another day.',
    ],
  },

  // ── Phase C entry ───────────────────────────────────────────────────
  {
    id: 'c-jog-5',
    group: 'C-entry',
    name: '5-minute flat jog',
    criterion: '≤2/10 during, no next-day flare',
    needs: 'Flat ground or treadmill at 0%',
    nextMorning: true,
    how: [
      'Warm up by walking for 5 minutes first.',
      'Jog 5 minutes continuously on flat ground at an easy conversational pace.',
      'Rate the worst pain at the front of the ankle during the jog.',
      'Check the next morning: no increase in stiffness or soreness over your recent baseline.',
    ],
  },

  // ── Phase C exit ────────────────────────────────────────────────────
  {
    id: 'c-jog-10',
    group: 'C-exit',
    name: '10-minute continuous flat jog',
    criterion: '≤2/10 during, no flare at 24 h',
    needs: 'Flat ground or treadmill at 0%',
    nextMorning: true,
    how: [
      'Walk 5 minutes to warm up, then jog 10 minutes without stopping.',
      'Flat only — a downhill stretch turns this into the decline test.',
      'Rate the worst pain during the jog.',
      'Re-check at 24 hours: no flare above your recent baseline.',
    ],
  },
  {
    id: 'c-pogo-double',
    group: 'C-exit',
    name: '3 × 20 double-leg pogo hops',
    criterion: '≤3/10, no flare at 24 h',
    needs: 'Wood floor or a thin mat — not concrete',
    nextMorning: true,
    how: [
      'Small, fast, springy hops in place off the balls of the feet, ankles stiff and knees nearly straight.',
      'Bounce off the floor like it is hot — minimal ground contact time. Squatting into each hop makes it a jump, not a pogo.',
      '3 sets of 20, resting as needed between sets.',
      'Rate the worst pain, then re-check at 24 hours.',
    ],
  },
  {
    id: 'c-pogo-single',
    group: 'C-exit',
    name: '3 × 15 single-leg pogo hops (right)',
    criterion: '≤3/10, no flare at 24 h',
    needs: 'Wood floor or a thin mat',
    nextMorning: true,
    how: [
      'Same hop, right leg only. Stay tall and quiet — you should barely hear the landings.',
      'Hop in place: drifting forward across the room, or the hip dropping on each landing, means stop.',
      '3 sets of 15.',
      'Rate the worst pain, then re-check at 24 hours.',
    ],
  },
  {
    id: 'c-jump-rope',
    group: 'C-exit',
    name: 'Jump rope, 4 × 45 s',
    criterion: '≤2/10 across all four sets',
    needs: 'Jump rope, forgiving surface',
    how: [
      'Low-amplitude continuous skipping — wrists turn the rope, ankles do the work.',
      '45 seconds per set, 4 sets, with a short rest between.',
      'No big high jumps and no heel landings; both change which tissue is doing the work.',
      'Rate the worst pain over the whole session.',
    ],
  },
  {
    id: 'c-lateral-bound',
    group: 'C-exit',
    name: 'Lateral bound and stick, 6 each side',
    criterion: 'Controlled landings, no knee valgus, ≤2/10 ankle and knee',
    needs: 'Open floor space, about 2 m',
    how: [
      'Push off the left leg, bound sideways, land on the right and hold the landing for a full 2 seconds before going back.',
      'Stick it and freeze — if you wobble, you bounded too far. Distance is not what is being tested here.',
      'Watch the landing knee: any inward collapse fails the test regardless of pain.',
      '6 bounds each direction. Rate the worst pain at the ankle and at the knee.',
    ],
  },
  {
    id: 'c-single-hop-lsi',
    group: 'C-exit',
    name: 'Single hop for distance',
    criterion: '≥90% limb symmetry index (right ÷ left)',
    needs: 'Tape or chalk for a start line, a tape measure, ~4 m of clear floor',
    how: [
      'Mark a start line. Stand on one leg with the toe on the line, hands free.',
      'Hop as far forward as you can and stick the landing for 2 seconds — a hop you cannot hold does not count.',
      'Measure toe-to-toe: start line to the toe of the landing foot.',
      'Take the best of 3 on each leg, testing the left (uninjured) side first as the reference.',
      'LSI = right ÷ left × 100. Pass at 90% or better.',
    ],
  },
  {
    id: 'c-triple-hop-lsi',
    group: 'C-exit',
    name: 'Triple hop for distance',
    criterion: '≥90% limb symmetry index (right ÷ left)',
    needs: 'Start line, tape measure, ~8 m of clear floor',
    how: [
      'Same setup as the single hop, but take three consecutive hops on the same leg.',
      'Land the third hop and stick it for 2 seconds before the measurement counts.',
      'Measure toe-to-toe from the start line to the final landing.',
      'Best of 3 per leg, left first. LSI = right ÷ left × 100, pass at 90% or better.',
    ],
  },
  {
    id: 'c-decline-walk',
    group: 'C-exit',
    name: '3–5 minutes of controlled decline walking',
    criterion: '≤2/10 during',
    needs: 'Treadmill at −3%, or a mild street hill',
    how: [
      'Set the treadmill to −3%, or find a gentle street hill you can walk down for a few minutes.',
      'Walk 3–5 minutes at a slow pace with short, quick steps — let the whole foot land, do not reach out with the heel.',
      'Downhill is the specific eccentric stressor for this tendon, so long over-striding heel-first steps invalidate the test.',
      'Rate the worst pain during the walk.',
    ],
  },

  // ── Return to play ──────────────────────────────────────────────────
  {
    id: 'rtp-morning-stiffness',
    group: 'RTP',
    name: 'No morning stiffness, 7 days running',
    criterion: 'Seven consecutive mornings with no front-of-ankle stiffness',
    how: [
      'Check the first 10–20 steps out of bed each morning, before anything loosens up.',
      'Log it daily for a week. Any single stiff morning restarts the count.',
      'Morning stiffness is the classic tendinopathy signal — it lingers after pain during activity is already gone.',
    ],
  },
  {
    id: 'rtp-palpation',
    group: 'RTP',
    name: 'Palpation pain',
    criterion: '≤2/10 pressing directly on the tendon',
    how: [
      'Sit with the foot relaxed. Find the tendon on the front of the ankle — it stands up when you pull the toes toward you.',
      'Press firmly with a thumb along the tendon and over the tender spot you know.',
      'Compare to the same spot on the left ankle to calibrate what "normal pressure discomfort" feels like.',
      'Rate the worst pain on the right.',
    ],
  },
  {
    id: 'rtp-settles-24h',
    group: 'RTP',
    name: 'Everything settles within 24 h, 2 weeks running',
    criterion: 'Back to baseline the next morning after every session, for 14 days',
    nextMorning: true,
    how: [
      'After each rehab session, check the following morning against your baseline.',
      'The tendon has to be back at baseline within 24 hours every single time for two consecutive weeks.',
      'One session that is still sore at 24 hours restarts the two weeks.',
      'This is the difference between a "stable" tendon and an "irritable" one, and it is the criterion that most often lags the others.',
    ],
  },
  {
    id: 'rtp-df-strength-equal',
    group: 'RTP',
    name: 'Resisted dorsiflexion strength, side to side',
    criterion: 'Equal left and right, with no weakness whatsoever',
    how: [
      'Sit down and have someone push down on the top of your foot while you pull the toes toward your shin, or push against your own hand.',
      'Hold against maximal resistance for 5 seconds on the left, then the right.',
      'The right must feel equal to the left. This is a pass/fail on strength, not on pain.',
      'Red flag: any true dorsiflexion weakness — a foot that gives way, slaps, or catches on the floor — is not a rehab problem. Fail this and see a clinician.',
    ],
  },
  {
    id: 'rtp-tib-raise-strict',
    group: 'RTP',
    name: '15 heavy slow tib raises, both legs',
    criterion: 'Same load left and right, right ≤2/10 — stricter than the Phase B bar of ≤3/10',
    needs: 'Dumbbell or kettlebell, a towel, a seat',
    how: [
      'Same test as the Phase B gate: 15 slow reps on the left at your working load, then 15 on the right at the same load.',
      'The bar is tighter here. Phase B lets you into plyometrics at ≤3/10 on the right; going back on a court asks for ≤2/10 at the load you are actually training with.',
      'The load matters as much as the pain — a right side that only stays quiet by dropping the weight is a fail, not a pass.',
      'Rate the worst pain on the right.',
    ],
  },
  {
    id: 'rtp-shuffle-cut',
    group: 'RTP',
    name: '5-minute shuffle/cut drill at 80%',
    criterion: '≤3/10 during, no flare at 24 h',
    needs: 'Cones or markers, court or open floor',
    nextMorning: true,
    how: [
      'Set out cones for a shuffle-and-cut pattern: shuffle side to side, then plant and cut.',
      'Run it for 5 minutes at about 80% of full intensity — not full speed.',
      'Plant on a wide base and push off; do not twist on a stuck foot, and do not cross the feet.',
      'Rate the worst pain at the ankle and knee, then re-check at 24 hours.',
    ],
  },
  {
    id: 'rtp-step-down-8in',
    group: 'RTP',
    name: 'Eccentric step-down at 8 inches',
    criterion: '≤2/10 at the knee, at a full 8-inch step',
    needs: 'An 8-inch step — a standard stair riser',
    program: 'knee',
    how: [
      'Same movement as the Phase B step-down, but the height is fixed: a full 8 inches, not the 4–8 inch range you were allowed to pick from.',
      'Stand on the step on the right leg, lower the left heel toward the floor over 4 seconds, tap lightly, and return.',
      'The right knee stays stacked over the middle of the foot the whole way down — no caving inward, no fast drop.',
      'Do 8–10 reps and rate the worst pain at the front of the knee. Passing at 4 inches does not count here.',
    ],
  },
  {
    id: 'rtp-sl-squat-60',
    group: 'RTP',
    name: 'Single-leg squat to 60°',
    criterion: 'No inward knee collapse',
    program: 'knee',
    how: [
      'Stand on the right leg in front of a mirror or with your phone recording from the front.',
      'Squat down to roughly 60° of knee bend — about a third of the way to a full squat — and come back up under control.',
      'Watch the knee, not the pain: it must track over the middle of the foot the whole way down and up.',
      'Do 5 reps. Any rep where the knee drifts inward over the big toe fails the test.',
    ],
  },
  {
    id: 'rtp-knee-daily-life',
    group: 'RTP',
    name: 'No knee pain in ordinary life',
    criterion: 'No pain sitting for long periods or descending stairs',
    program: 'knee',
    how: [
      'Sit for a long stretch — a movie, a long meeting, a flight — with the knee bent, then stand up and walk.',
      'Separately, walk down a few flights of stairs at normal pace.',
      'Both are the classic patellofemoral provocations; either one hurting means the knee is not ready for court volume.',
    ],
  },
  {
    id: 'rtp-lace-tension',
    group: 'RTP',
    name: 'Basketball shoes at normal lace tension',
    criterion: 'No tendon pain with laces at play tension',
    needs: 'The shoes you actually play in',
    how: [
      'Lace your basketball shoes the way you would for a real game — normal tension, no skipped eyelets over the sore spot.',
      'Wear them for a warm-up and 15–20 minutes of movement.',
      'Tight laces over the front of the ankle compress the tendon under the retinaculum, and this is a common primary cause — so passing at play tension matters, not just in loose shoes.',
      'Fail if you feel the tendon, or find yourself loosening the laces to get through it.',
    ],
  },
  {
    id: 'rtp-maintenance-plan',
    group: 'RTP',
    name: 'Maintenance loading plan in place',
    criterion: 'Heavy tib loading 2×/week, scheduled indefinitely',
    how: [
      'Name the two days each week that carry the heavy tib raise and the hip/knee work, on the days between court sessions.',
      'Put them somewhere you will actually see them — this is the box people tick mentally and then drop within a month.',
      'Recurrence in this tendon is common when loading stops, so "indefinitely" is the actual dose.',
    ],
  },
]

export function gateTestsInGroup(group: GateTestGroupId): GateTest[] {
  return GATE_TESTS.filter(t => t.group === group)
}

export function gateGroup(id: GateTestGroupId): GateTestGroup | undefined {
  return GATE_GROUPS.find(g => g.id === id)
}

/**
 * Has every test in the group been passed? Keyed on the *latest* result per
 * test (see `latestGateResults`), so a retest that fails takes the group back
 * down. An empty group is never "passed".
 */
export function isGroupPassed(
  group: GateTestGroupId,
  latest: ReadonlyMap<string, { passed: boolean }>,
): boolean {
  const tests = gateTestsInGroup(group)
  return tests.length > 0 && tests.every(t => latest.get(t.id)?.passed === true)
}

/** Every group the advancement asks for is passed. */
export function advancementReady(
  adv: Advancement,
  latest: ReadonlyMap<string, { passed: boolean }>,
): boolean {
  return adv.requires.length > 0 && adv.requires.every(g => isGroupPassed(g, latest))
}
