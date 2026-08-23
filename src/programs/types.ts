/**
 * Content types for the multi-program model. Program *content* is static TS
 * (`src/programs/*.ts`); program *state* lives in Dexie (see `src/lib/db.ts`).
 */

/** Where an item can realistically be done — drives the Today screen's buckets. */
export type ContextTag = 'couch' | 'standing' | 'floor' | 'gym' | 'sweat'

export type ProgramId =
  | 'tibant'
  | 'knee'
  | 'wrist'
  | 'fingers'
  | 'strength'
  | 'cardio'
  | 'body'

/** The three context buckets shown on the Today screen. */
export type Bucket = 'couch' | 'quick' | 'workout'

/** Workout variants: Short (~15–20m) / Medium (~30–45m) / Long (~60m). */
export type WorkoutSize = 'S' | 'M' | 'L'

export type Exercise = {
  id: string
  name: string
  /** Tissue or capability trained, e.g. 'Glute medius', 'Achilles'. */
  targetArea?: string
  cue: string
  instructions?: string
  images?: string[]
  /** Direct video demo; UI falls back to a YouTube search when absent. */
  demoUrl?: string
  contextTag: ContextTag
  /** Free-form equipment keys; matched against Settings.equipment. */
  equipment: string[]
  commonMistakes?: string[]
  progression?: string
  regression?: string
  /** Short "why bother" blurb shown on the detail screen. */
  whyItMatters?: string
}

export type Frequency = { perWeek: number | 'daily' }

/**
 * Tissues an item loads meaningfully — the planner's same-tissue recovery
 * spacing (48–72h between hard sessions) keys on these. Keep coarse.
 */
export type Tissue =
  | 'tibant-tendon'
  | 'patellar-tendon'
  | 'achilles-calf'
  | 'quads'
  | 'hamstrings'
  | 'glutes'
  | 'wrist-extensors'
  | 'wrist-flexors'
  | 'fingers'
  | 'trunk'
  | 'upper-push'
  | 'upper-pull'

/**
 * How much recovery an item demands. 'hard' items count against the weekly
 * hard-day budget and are barred the day before sport (rule R4); 'easy' items
 * (isometrics, mobility, Zone 2, balance) are unrestricted.
 */
export type Intensity = 'hard' | 'easy'

export type ProtocolItem = {
  id: string
  exerciseId: string
  sets: number
  reps?: number
  durationSeconds?: number
  displayAmount: string
  tempo?: string
  load?: string
  frequency: Frequency
  /** Minimum days between sessions of this item (heavy loading needs ≥2). */
  minSpacingDays?: number
  bucket: Bucket
  /** Which workout variants include this item. Only meaningful for bucket 'workout'. */
  workoutSizes?: WorkoutSize[]
  /** Ids of swap-equivalent items (same program, target, context). */
  alternates?: string[]
  /** Tissues loaded hard enough to matter for spacing. Omit for negligible load. */
  tissues?: Tissue[]
  /** Defaults to 'easy' when omitted. */
  intensity?: Intensity
  /** Item is planned only once the named program has reached (or passed) this phase. */
  requiresPhase?: { programId: ProgramId; phaseId: string }
  notes?: string
}

export type CheckInQuestion = {
  id: string
  label: string
  type: 'pain0to10' | 'yesNo'
}

export type PhaseDef = {
  id: string
  name: string
  entryCriteria?: string
  exitCriteria: string
  items: ProtocolItem[]
  checkInQuestions?: CheckInQuestion[]
  /**
   * When false, check-ins never propose leaving this phase (e.g. strength's
   * ongoing → deload move is signal- or calendar-driven, not a promotion).
   */
  advanceProposals?: boolean
  /** Symptoms that mean "stop and see a professional", shown on the program card. */
  redFlags?: string[]
}

export type ProgramDef = {
  id: ProgramId
  name: string
  /** Lower = more important. Drives ordering and rebalancing in the planner. */
  priority: number
  phases: PhaseDef[]
  pregameItems?: ProtocolItem[]
  postgameItems?: ProtocolItem[]
}

/** The full shape, once every program exists. */
export type ProgramRegistry = Record<ProgramId, ProgramDef>

/** What the app actually holds while programs land incrementally. */
export type PartialProgramRegistry = Partial<ProgramRegistry>

/**
 * Per-program runtime state (Dexie table `programState`). Lives here rather
 * than in db.ts so pure modules (planner, tests) can use it without Dexie.
 */
export type ProgramState = {
  programId: ProgramId
  /** PhaseDef.id of the program's current phase. */
  phase: string
  /** YYYY-MM-DD the current phase was entered. */
  startedPhaseAt: string
  paused?: boolean
}
