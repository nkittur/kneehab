# Health Hub — Architecture Design

Evolves the kneehab PWA into a whole-body training/rehab planner. Working brand: **Durable**
(single source of truth in `src/lib/brand.ts`; trivial to rename). Stack unchanged: React 19 +
Vite + Tailwind 4 + Dexie (local-first, phone-only) + vite-plugin-pwa, served at `/kneehab/`.

## Product model

Seven **programs**, each an independent state machine with phases:

| id          | area                                | nature                          |
|-------------|-------------------------------------|---------------------------------|
| `tibant`    | R anterior tibialis tendonitis      | acute rehab, phased, top priority |
| `knee`      | PFPS (existing kneehab protocol)    | rehab → maintenance             |
| `wrist`     | R wrist tendonitis                  | rehab, phased                   |
| `fingers`   | finger/grip jam-proofing            | strength, leveled               |
| `strength`  | durability strength (49yo court sports) | ongoing, hard/easy sequencing |
| `cardio`    | Zone 2 + intervals, knee-safe menu  | ongoing                         |
| `body`      | weight trend                        | metric logging only             |

Protocol content lives in static TS files (`src/programs/*.ts`) generated from the cited research
docs in `docs/research/`. Program *state* (current phase, start date, paused) lives in Dexie.

## Daily plan engine (`src/lib/planner.ts`)

Pure function, unit-tested:
`buildPlan(date, programStates, history, settings) → DayPlan`

A DayPlan is a list of plan items grouped into three context buckets shown on the Today screen:

- **Couch** — TV-safe: seated, quiet, no sweat (wrist/finger work, isometrics, band work). Always
  offered; this is opportunistic volume.
- **Quick** — 2–10 min standing/floor micro-sessions (balance, tendon isometrics, tib-ant sets).
- **Workout** — the day's main block, selectable Short (~15–20m) / Medium (~30–45m) / Long (~60m)
  variant at render time.

Scheduling rules (encoded, from the research docs' sequencing sections):
1. Priority: acute rehab (tibant) > knee > wrist > fingers/strength > cardio.
2. Respect per-item frequency (daily / 2×wk / 3×wk) with minimum-spacing constraints
   (≥48h between heavy loading of the same tissue; isometrics allowed daily).
3. Sport-day awareness: no hard workout block on a sport day; no heavy lower-body strength the
   day before a planned sport day. The app never plans warm-ups or cool-downs — the user handles
   those.
4. Skips rebalance: a skipped 2×/wk item reflows to the next legal day this week; no streak guilt.
5. Swaps: each item offers alternates matched on (program, movement target, context, equipment).
6. Phase advancement is gated on weekly check-ins (pain/function scores vs. the protocol's exit
   criteria); the app *proposes* advancement, user confirms. Regression rules on pain spikes.

## Data model (Dexie v3, migrating v1)

```ts
programState:   { programId, phase, startedPhaseAt, paused? }
planItems:      { id++, date, programId, itemId, bucket, sets, targetPerSet,
                  status: pending|done|skipped, swappedToItemId?, updatedAt }
setCompletions: (kept; gains programId — v1 rows map to programId 'knee')
dailyLogs:      { date, sportDay?, sport?, painScores: {knee, tibant, wrist}, pops?, notes?, updatedAt }
checkIns:       { id++, date, programId, answers, proposedAction }
bodyMetrics:    { date, weightKg?, restingHR? }
gateTests:      { id++, testId, date, passed, note? }   // append-only; latest date wins
settings:       { key:'singleton', equipment: string[], defaultWorkoutSize, sportDaysHint, darkMode }
```

Migration: v1 `dailyLogs.pain/pops` → `painScores.knee`/`pops`; v1 completions → `programId:'knee'`;
`programStartDate` → knee `programState`.

## UI (keep bottom nav, max-w-md mobile layout)

- **Exercises** (home, `/`) — the full library first, the day's suggestion second.
  - *Suggested today* — a collapsible strip, closed by default (choice persisted in
    `localStorage`), summarised when closed as "N items · done/planned sets". Open, it is the
    old Today screen: sport-day toggle, context/area filters, progress ring, and the three bucket
    sections with item cards (tap = detail, one-tap "✓ all sets", per-set ticks, swap, skip;
    S/M/L segmented control on the workout bucket).
  - *Library* — every program in registry priority order, grouped by phase. The program's current
    phase (from `programState`) is expanded, the rest collapsed; pre/postgame blocks get their own
    groups. Each row shows name, sets × amount, tempo/load, context-tag chip, and a "today" badge
    when the item is in today's plan. Tap opens `/exercise/:programId/:itemId`. Browsing only —
    set logging lives on the detail screen.
- **Programs** — one card per program: phase, days-in-phase, progress vs. exit criteria, weekly
  check-in entry point, pause/resume, and a subdued "Change phase" escape hatch (dialog listing the
  program's phases, current one ticked, calling `setProgramPhase`).
- **Tests** — the gate tests from `src/programs/tibantTests.ts`, grouped by phase gate (Phase B
  exit, Phase C entry/exit, return to play): pass bar, how-to steps, pass/fail buttons per test,
  and a per-group progress bar. Results append to `gateTests`. A group carrying `unlocks`
  (B-exit → `phaseC`, C-exit → `phaseD`) shows an advance banner once every test in it has a
  passing latest result and the program is still behind that phase — one tap calls
  `setProgramPhase`, and the live query retires the banner. Phase order is the index in
  `program.phases` (`phaseIndexOf` / `isPhaseAhead` in `src/programs/index.ts`).
- **Trends** — recharts: pain per area over time, adherence, weight trend, weekly minutes.
- **Settings** — equipment owned, rename/brand, export/import JSON (existing backup.ts extended),
  "AI review export" button (same export + a prompt template from `docs/ai-review.md`).

## AI review loop

Rules run locally; adaptation happens when the user asks Claude to review. `docs/ai-review.md`
holds the ritual: export JSON → session reads it plus `docs/research/*` → Claude edits
`src/programs/*.ts` (phases, loads, swaps) → commit. No API key in the app.

## Build slices

1. **Foundation** — brand.ts, types (`src/programs/types.ts`), Dexie v2 + migration, planner
   skeleton + vitest setup. (blocks everything)
2. **Content ×3** — research docs → `src/programs/{tibant,wrist-fingers,strength-cardio}.ts`
   (+ knee port). Parallel, after types land.
3. **Planner** — full rules + tests. After types; parallel with content.
4. **UI** — Exercises/Programs/Tests/Trends/Settings rework. After 1+3; content can be stubbed.
5. **Polish** — migration test against real data shape, PWA manifest rebrand, build, deploy.

Each slice: opus-worker implements → opus-reviewer verifies → coordinator accepts.
