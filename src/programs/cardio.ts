import type { Exercise, ProgramDef, ProtocolItem } from './types'

/**
 * Cardio — built from `docs/research/durability-cardio.md` §2 (R16–R20),
 * §3(e) and §4. One ongoing phase: Zone 2 is the unrestricted volume filler,
 * intervals are capped at one session a week by `frequency`.
 *
 * Heart-rate anchors assume a Tanaka HRmax of ~174 bpm for a 49-year-old
 * (208 − 0.7 × age). Individual variation around any age-based estimate runs
 * roughly ±7–12 bpm, so the talk test outranks the number.
 */

export const cardioExercises: Record<string, Exercise> = {
  'elliptical-zone2': {
    id: 'elliptical-zone2',
    name: 'Elliptical Zone 2',
    targetArea: 'Aerobic base',
    cue: "Smooth and boring — if you're working, slow down.",
    instructions:
      'Steady elliptical at 122–139 bpm (RPE 3–4), no arm-flailing, consistent stride rate. You should be able to speak full sentences the whole way.',
    whyItMatters:
      'The lowest-impact way to accumulate aerobic minutes, and the default modality while the anterior tibialis is symptomatic. Cardiorespiratory fitness has a dose-response relationship with all-cause mortality with no observed upper limit.',
    contextTag: 'sweat',
    equipment: ['elliptical', 'hr-monitor'],
    commonMistakes: [
      'Leaning on the handles — drops the effort without dropping the number',
      'Ramping resistance to make it feel like a workout',
      'Drifting above threshold into the grey zone',
    ],
    progression: 'Longer first (30 → 45 → 60 min), then more resistance at the same heart rate.',
    regression: 'Shorter, or swap to a recovery walk.',
  },
  'peloton-zone2': {
    id: 'peloton-zone2',
    name: 'Peloton Zone 2',
    targetArea: 'Aerobic base',
    cue: 'Spin light, not grind heavy.',
    instructions:
      'Steady ride at cadence 85–95 with moderate resistance, holding 122–139 bpm. Ride to your heart rate, not to a class’s script.',
    whyItMatters:
      'Zero-impact and the resistance is quantified, which makes it the workhorse for both Zone 2 and intervals once the bike fit is right.',
    contextTag: 'sweat',
    equipment: ['peloton', 'hr-monitor'],
    commonMistakes: [
      'Low-cadence, high-resistance riding — that turns a Zone 2 ride into a knee-loading strength session',
      'Letting a scripted class dictate the effort instead of your heart rate',
    ],
    progression: 'Longer, then more output at the same heart rate.',
    regression: 'Lower resistance, shorter. If the knee still complains after a cleat/float/fore-aft fix, switch to the elliptical and revisit the fit.',
  },
  'incline-walk-zone2': {
    id: 'incline-walk-zone2',
    name: 'Treadmill Incline Walk',
    targetArea: 'Aerobic base',
    cue: 'Hands off the handles — if you need them, lower the incline.',
    instructions: 'Treadmill at 8–12% incline, 3.0–3.5 mph, holding 122–139 bpm, hands off the rails.',
    whyItMatters:
      'Weight-bearing aerobic work that builds calf and glute endurance alongside the aerobic base — but sustained incline walking loads dorsiflexion continuously, so it waits until the tibialis is quiet.',
    contextTag: 'sweat',
    equipment: ['treadmill', 'hr-monitor'],
    commonMistakes: [
      'Holding on, which invalidates the effort',
      'Running instead of walking',
      'Using it while the anterior tibialis is symptomatic',
    ],
    progression: 'Steeper incline, then a weight vest.',
    regression: 'Lower incline, slower, or switch to the elliptical.',
  },
  'recovery-walk': {
    id: 'recovery-walk',
    name: 'Easy Walk',
    targetArea: 'Recovery',
    cue: 'Conversational, nasal breathing.',
    instructions: 'Easy outdoor walk of 20–40 minutes under 113 bpm.',
    whyItMatters:
      'Free aerobic minutes with essentially no recovery cost — the volume you can add on a day when everything else is already spoken for.',
    contextTag: 'standing',
    equipment: [],
    commonMistakes: ['Turning it into a workout'],
    progression: 'Longer, or add light hills.',
    regression: 'Shorter.',
  },
  'peloton-4x4': {
    id: 'peloton-4x4',
    name: 'Norwegian 4×4 Intervals',
    targetArea: 'VO2max',
    cue: 'Effort should be such that the fourth interval is barely completable — no more.',
    instructions:
      '10 min warm-up; 4 × [4 min at 157–165 bpm (RPE 8–9) / 3 min easy spinning]; 5 min cool-down. About 43 minutes total.',
    whyItMatters:
      'The highest-yield VO2max session in the program — roughly 7% gains in 8 weeks in middle-aged adults, and run safely twice weekly for five years by 70-year-olds in the Generation 100 trial.',
    contextTag: 'sweat',
    equipment: ['peloton', 'elliptical', 'hr-monitor'],
    commonMistakes: [
      'Starting interval 1 too hard and fading',
      'Cutting the recovery short',
      'Doing this more than once a week at 49',
    ],
    progression: 'Raise the power held at the same heart rate; add a fifth interval only if the fourth still feels controlled.',
    regression: '3 intervals, or 3-minute work periods.',
  },
  'elliptical-30-30': {
    id: 'elliptical-30-30',
    name: '30/30 Short Intervals',
    targetArea: 'VO2max',
    cue: 'Repeatable — every hard 30 should look like the first.',
    instructions:
      '2–3 blocks of 8–10 × (30 s at RPE 8 / 30 s easy), with 3 minutes between blocks.',
    whyItMatters:
      'Accumulates similar time near VO2max to a 4×4 with lower perceived misery — the gentler alternative when the 4×4 feels like a wall.',
    contextTag: 'sweat',
    equipment: ['elliptical', 'hr-monitor'],
    commonMistakes: ['Going all-out on the first block'],
    progression: 'More reps per block, then a third block.',
    regression: '20 s work / 40 s rest, fewer reps.',
  },
  'bike-10x1': {
    id: 'bike-10x1',
    name: '10 × 1-Minute Intervals',
    targetArea: 'VO2max',
    cue: "Hard means you're counting down the seconds, not surviving.",
    instructions:
      '4 min warm-up; 10 × (1 min hard at RPE 8–9 / 1 min easy); 3 min cool-down. About 24 minutes total.',
    whyItMatters: 'The best short-session intensity option — the whole thing fits in under half an hour.',
    contextTag: 'sweat',
    equipment: ['peloton', 'hr-monitor'],
    commonMistakes: ['Pacing the first three as sprints'],
    progression: '12 reps, or raise the target power.',
    regression: '6–8 reps.',
  },
  'court-conditioning-shuttles': {
    id: 'court-conditioning-shuttles',
    name: 'Court Conditioning Shuttles',
    targetArea: 'Sport-specific conditioning',
    cue: 'Touch the line — the change of direction is the point.',
    instructions: '6–10 × 15–25 s max-effort suicides or lane shuttles, with 45–60 s rest.',
    whyItMatters:
      'The only conditioning that rehearses repeated change of direction under fatigue — which is exactly the state in which landing mechanics fall apart. Last modality added, not the first.',
    contextTag: 'sweat',
    equipment: ['court'],
    commonMistakes: [
      'Adding these before the aerobic base is built',
      'Doing them the day before a game',
    ],
    progression: 'More reps, shorter rest.',
    regression: 'Fewer reps, longer rest, or replace with the 10 × 1-minute bike session.',
  },
}

const ongoingItems: ProtocolItem[] = [
  {
    id: 'ca-elliptical-zone2',
    exerciseId: 'elliptical-zone2',
    sets: 1,
    durationSeconds: 2400,
    displayAmount: '30–60 min',
    tempo: 'continuous',
    load: 'Elliptical, steady resistance',
    frequency: { perWeek: 3 },
    bucket: 'workout',
    workoutSizes: ['S', 'M', 'L'],
    alternates: ['ca-peloton-zone2', 'ca-incline-walk-zone2'],
    tissues: [],
    intensity: 'easy',
    notes:
      '122–139 bpm, RPE 3–4, full sentences with slightly laboured breathing. Zone 2 is unrestricted (R16) — any day, including the day before sport, including twice in a day. Expect HR to drift up 5–10 bpm over an hour at constant power; hold the effort, not the number. Bpm targets assume HRmax ≈ 174; age-based estimates carry ±7–12 bpm of error, so the talk test is the referee. S ≈ 18 min flat, M ≈ 40 min, L = 60 min continuous.',
  },
  {
    id: 'ca-peloton-zone2',
    exerciseId: 'peloton-zone2',
    sets: 1,
    durationSeconds: 2400,
    displayAmount: '30–60 min',
    tempo: 'continuous',
    load: 'Moderate resistance, cadence 85–95',
    frequency: { perWeek: 3 },
    bucket: 'workout',
    workoutSizes: ['S', 'M', 'L'],
    alternates: ['ca-elliptical-zone2', 'ca-incline-walk-zone2'],
    tissues: [],
    intensity: 'easy',
    notes:
      'Fine even in tibant Phase A — cycling barely loads this tendon — but ONLY after the cleat float/rotation fix, and keep it an easy spin there (15–20 min). Cadence 85–95 rpm at moderate resistance, 122–139 bpm. Low cadence against heavy resistance is what turns this into a knee-loading session — spin light. If it still reproduces knee pain after the cleat, float and fore-aft fix, switch to the elliptical rather than pushing through (R20).',
  },
  {
    id: 'ca-incline-walk-zone2',
    exerciseId: 'incline-walk-zone2',
    sets: 1,
    durationSeconds: 2100,
    displayAmount: '30–45 min',
    tempo: 'continuous',
    load: '8–12% incline, 3.0–3.5 mph',
    frequency: { perWeek: 2 },
    bucket: 'workout',
    workoutSizes: ['M'],
    alternates: ['ca-elliptical-zone2', 'ca-peloton-zone2'],
    tissues: [],
    intensity: 'easy',
    requiresPhase: { programId: 'tibant', phaseId: 'phaseC' },
    notes:
      '122–139 bpm, hands off the rails. Held until tibant Phase C — sustained incline walking loads dorsiflexion continuously (R19), so it waits for the tendon to be quiet.',
  },
  {
    id: 'ca-recovery-walk',
    exerciseId: 'recovery-walk',
    sets: 1,
    durationSeconds: 1800,
    displayAmount: '20–40 min',
    tempo: 'continuous',
    load: 'None',
    frequency: { perWeek: 'daily' },
    bucket: 'workout',
    workoutSizes: ['S'],
    tissues: [],
    intensity: 'easy',
    notes:
      'Under 113 bpm. Optional daily filler, and the 15-minute tail on a 45-minute long Zone 2 day.',
  },
  {
    id: 'ca-peloton-4x4',
    exerciseId: 'peloton-4x4',
    sets: 4,
    durationSeconds: 2580,
    displayAmount: '4 × 4 min hard / 3 min easy',
    tempo: '4 min work · 3 min recovery',
    load: 'Hard = 157–165 bpm, RPE 8–9',
    frequency: { perWeek: 1 },
    minSpacingDays: 2,
    bucket: 'workout',
    workoutSizes: ['M', 'L'],
    alternates: ['ca-elliptical-30-30', 'ca-bike-10x1'],
    tissues: [],
    intensity: 'hard',
    requiresPhase: { programId: 'tibant', phaseId: 'phaseC' },
    notes:
      'One interval session per week, maximum — zero in any week with 4 sport days (R17). Non-impact, so no tissues are declared and the planner will offer it the day after sport; R18 (≥48h from sport either side, never within 24h of heavy lower-body strength) is on you, and Sunday is the natural slot in the baseline week. Avoid the day before a game if legs feel heavy.',
  },
  {
    id: 'ca-elliptical-30-30',
    exerciseId: 'elliptical-30-30',
    sets: 3,
    durationSeconds: 1500,
    displayAmount: '2–3 blocks × 8–10 × (30 s / 30 s)',
    tempo: '30 s work · 30 s easy',
    load: 'Hard = RPE 8; 3 min between blocks',
    frequency: { perWeek: 1 },
    minSpacingDays: 2,
    bucket: 'workout',
    workoutSizes: ['M', 'L'],
    alternates: ['ca-peloton-4x4', 'ca-bike-10x1'],
    tissues: [],
    intensity: 'hard',
    requiresPhase: { programId: 'tibant', phaseId: 'phaseC' },
    notes:
      'Alternative to the 4×4 — same weekly slot, same R17/R18 constraints, and R18 is likewise unenforced because the modality is non-impact. Stays legal while the tibialis is settling from Phase B on (R19). Avoid the day before a game if legs feel heavy.',
  },
  {
    id: 'ca-bike-10x1',
    exerciseId: 'bike-10x1',
    sets: 10,
    durationSeconds: 1440,
    displayAmount: '10 × (1 min hard / 1 min easy)',
    tempo: '1 min work · 1 min easy',
    load: 'RPE 8–9',
    frequency: { perWeek: 1 },
    minSpacingDays: 2,
    bucket: 'workout',
    workoutSizes: ['S'],
    alternates: ['ca-peloton-4x4', 'ca-elliptical-30-30'],
    tissues: [],
    intensity: 'hard',
    requiresPhase: { programId: 'tibant', phaseId: 'phaseC' },
    notes:
      'The short-session intensity option, ~24 min total. Still spends the week’s single interval slot (R17). Non-impact, so the planner leaves R18 spacing to your judgement. Avoid the day before a game if legs feel heavy.',
  },
  {
    id: 'ca-court-conditioning-shuttles',
    exerciseId: 'court-conditioning-shuttles',
    sets: 8,
    durationSeconds: 20,
    displayAmount: '6–10 × 15–25 s (45–60 s rest)',
    tempo: 'max effort',
    load: 'Court; bodyweight',
    frequency: { perWeek: 1 },
    minSpacingDays: 3,
    bucket: 'workout',
    workoutSizes: ['M'],
    alternates: ['ca-bike-10x1', 'ca-peloton-4x4'],
    tissues: ['quads', 'achilles-calf', 'tibant-tendon'],
    intensity: 'hard',
    requiresPhase: { programId: 'tibant', phaseId: 'phaseD' },
    notes:
      'The last modality added — held until tibant Phase D, then only after 3–4 uninterrupted weeks of full sport, and never while the tibialis anterior is symptomatic (R19). Skip it in any week with 3+ sport days; you are already getting this on the court.',
  },
]

/**
 * The doc's cardio and weight-management guidance, condensed for the UI.
 */
export const cardioNotes: {
  zone2: string
  intervals: string
  weeklyMinutesTarget: string
  weightManagement: string[]
} = {
  zone2:
    'Zone 2 is roughly 70–80% of HRmax — about 122–139 bpm on an estimated HRmax of 174 (Tanaka: 208 − 0.7 × 49), RPE 3–4, full sentences with slightly laboured breathing and nasal breathing still possible. Age-based HRmax estimates carry ±7–12 bpm of individual error, so the talk test outranks the number: if you cannot finish a sentence you have drifted out of Zone 2, which is the single most common error. Expect HR to drift up 5–10 bpm over 60 minutes at constant power — hold the effort, not the number. It is unrestricted (R16): any day, including the day before sport, including the same day as strength. Progress by extending duration first (30 → 45 → 60 min), then by producing more power or incline at the same heart rate — rising output at constant HR is the adaptation.',
  intervals:
    'One interval session per week maximum, and zero in any week with 4 sport days (R17). Intervals must sit ≥48h from a sport day on either side and never within 24h of heavy lower-body strength (R18), which in the baseline week means Sunday or nothing. Hard = 90–95% HRmax, about 157–165 bpm, RPE 8–9, a few words at most. Prefer non-impact modalities (Peloton, elliptical) until the tibialis anterior is fully quiet and PFPS is stable through a full sport week (R19); court shuttles are the last thing added. The 4×4 is the highest-yield version (~7% VO2max in 8 weeks); 30/30s and 10×1s are equivalent-slot alternatives.',
  weeklyMinutesTarget:
    '150–300 minutes a week of moderate-or-harder aerobic activity with sport included, drifting toward 250–300+ for the weight-management goal. Keep roughly 80% of aerobic minutes genuinely easy and 15–20% genuinely hard, with as little time as possible in the middle. The 10-minute-bout minimum was removed from the guidelines, so 18 easy minutes still counts.',
  weightManagement: [
    'Zone 2 volume is the lever, not intervals and not lifting. Below ~150 min/week of aerobic exercise produces minimal weight change; 150 min/week is worth roughly 2–3 kg; 225–420 min/week is what 5–7.5 kg takes without any dietary change. Zone 2 is the only modality you can accumulate 200–300 minutes a week of without wrecking recovery.',
    'The scale is the wrong instrument. Resistance training prevents roughly 93% of the lean mass otherwise lost during caloric restriction in older adults, so if you are lifting twice a week and losing fat, the scale moves slower than the mirror and the belt. Track waist circumference monthly and how you feel in the fourth quarter; ignore day-to-day weight.',
    'Protein: about 1.6 g/kg body weight per day is where extra intake stops adding to training-induced lean mass, with the confidence interval running to ~2.2 g/kg. The effect is smaller with age, which argues for the higher end. For 85 kg that is ~135 g/day — roughly 35–40 g at each of three meals plus a snack. Spread it out, get some after lifting. No supplement is required.',
    'The rest of the diet in one line: fibre and protein at every meal make food volume self-limiting; liquid calories are the highest-leverage single cut because they do not reduce hunger; alcohol impairs recovery and sleep at exactly the age where both are already narrowing.',
    'Do not diet aggressively during a week with 4 sport days. Under-fuelling around sport degrades late-game movement quality, and degraded late-game movement is when knees and ankles get hurt.',
  ],
}

export const cardioProgram: ProgramDef = {
  id: 'cardio',
  name: 'Cardio',
  priority: 60,
  phases: [
    {
      id: 'ongoing',
      name: 'Ongoing',
      exitCriteria:
        'No exit — this program runs indefinitely. Zone 2 is the unrestricted volume filler; intervals stay capped at one session a week (R17), and drop to zero in a 4-sport-day or deload week.',
      items: ongoingItems,
      checkInQuestions: [
        {
          id: 'zone2_talk_test',
          label: 'Could you speak full sentences through your Zone 2 sessions?',
          type: 'yesNo',
        },
        {
          id: 'knee_after_bike',
          label: 'Knee pain during or after cycling (0–10)',
          type: 'pain0to10',
        },
        {
          id: 'hit_weekly_minutes',
          label: 'Did you hit 150+ moderate-or-harder aerobic minutes (sport included)?',
          type: 'yesNo',
        },
      ],
      redFlags: [
        'Chest pressure, unusual shortness of breath, or lightheadedness during interval work. At 49, do not rationalize this.',
        'Resting heart rate 5–7 bpm above your morning baseline for 3+ consecutive days — back off intervals before adding any.',
        'Knee pain reproduced by the bike after cleat, float and saddle-fore-aft adjustment: that is a mechanical problem to be fixed, not pushed through.',
        'Calf pain that is one-sided, warm, and present at rest — rule out DVT before assuming it is training load.',
      ],
    },
  ],
}
