import { useState } from 'react'
import { Link } from 'react-router-dom'
import { entryKey, itemName } from '@/lib/useDayPlan'
import { EXERCISES, phaseOf, programList } from '@/programs'
import type { ContextTag, ProgramDef, ProgramId, ProgramState, ProtocolItem } from '@/programs/types'
import { areaLabel, areaShortLabel, programColor } from '@/lib/programColors'
import { cn } from '@/lib/utils'

/** Where an item can be done, in the words the buckets use. */
const CONTEXT_LABEL: Record<ContextTag, string> = {
  couch: '🛋 couch',
  standing: '🧍 standing',
  floor: '🧘 floor',
  gym: '🏋 gym',
  sweat: '💦 sweat',
}

/** A leading set count: '3 × …', '2–3 × …'. Not a '×' anywhere in the string. */
const LEADING_SETS = /^\s*\d+(–\d+)?\s*×/

/**
 * The dose in one line. `displayAmount` is authored inconsistently — some items
 * spell the set count out ('3 × 15'), others give the per-set amount ('12–15
 * reps', '10 × 5s hold') — so the sets are prefixed only where the amount does
 * not already open with a set count, rather than printing '3 × 3 × 15'.
 */
function doseLabel(item: ProtocolItem): string {
  return LEADING_SETS.test(item.displayAmount)
    ? item.displayAmount
    : `${item.sets} × ${item.displayAmount}`
}

/* ---------- persistence ----------
 * Both choices are settings, not session state: the area is what the user is
 * working on this month, and the hidden levels are the ones they have outgrown.
 * Hidden ids are stored rather than shown ones so a level added later to a
 * program appears rather than being silently filtered away.
 */
const AREA_KEY = 'durable.library.area'
const hiddenKey = (programId: ProgramId) => `durable.library.hidden.${programId}`

function readArea(fallback: ProgramId): ProgramId {
  try {
    const stored = localStorage.getItem(AREA_KEY)
    return stored && programList().some(p => p.id === stored) ? (stored as ProgramId) : fallback
  } catch {
    return fallback
  }
}

function writeArea(id: ProgramId) {
  try {
    localStorage.setItem(AREA_KEY, id)
  } catch {
    // Storage blocked (private mode, quota) — the pick just won't outlive the screen.
  }
}

function readHidden(programId: ProgramId): Set<string> {
  try {
    const raw = localStorage.getItem(hiddenKey(programId))
    const parsed: unknown = raw ? JSON.parse(raw) : []
    return new Set(Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === 'string') : [])
  } catch {
    return new Set()
  }
}

function writeHidden(programId: ProgramId, hidden: Set<string>) {
  try {
    localStorage.setItem(hiddenKey(programId), JSON.stringify([...hidden]))
  } catch {
    // See writeArea.
  }
}

/* ---------- levels ---------- */

/** One run of items the user can switch on or off — a phase, or a pre/postgame block. */
type Level = { id: string; label: string; shortLabel: string; items: ProtocolItem[]; current: boolean }

/** 'Phase B — Progressive loading' → 'Phase B'; names without a dash are kept whole. */
function shortName(name: string): string {
  return name.split(/\s+[—–-]\s+/)[0].trim() || name
}

function levelsOf(program: ProgramDef, currentPhaseId: string): Level[] {
  const levels: Level[] = program.phases.map(phase => ({
    id: phase.id,
    label: phase.name,
    shortLabel: shortName(phase.name),
    items: phase.items,
    current: phase.id === currentPhaseId,
  }))
  // Pre/postgame items belong to no phase but are still exercises the user owns,
  // so they get their own levels rather than being invisible here.
  if (program.pregameItems?.length) {
    levels.push({ id: 'pregame', label: 'Pre-game', shortLabel: 'Pre-game', items: program.pregameItems, current: false })
  }
  if (program.postgameItems?.length) {
    levels.push({ id: 'postgame', label: 'Post-game', shortLabel: 'Post-game', items: program.postgameItems, current: false })
  }
  return levels
}

/* ---------- pieces ---------- */

/** A scrolling row of chips; each program wears its own colour when picked. */
function AreaTabs({
  programs,
  value,
  onChange,
}: {
  programs: ProgramDef[]
  value: ProgramId
  onChange: (id: ProgramId) => void
}) {
  return (
    <div
      className="-mx-4 overflow-x-auto px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      role="group"
      aria-label="Which area"
    >
      <div className="flex w-max gap-1">
        {programs.map(program => {
          const active = program.id === value
          return (
            <button
              key={program.id}
              type="button"
              aria-pressed={active}
              onClick={() => onChange(program.id)}
              className={cn(
                'shrink-0 rounded-full border px-3 py-1 text-xs font-medium transition-colors',
                active
                  ? cn(programColor(program.id).chip, 'border-transparent')
                  : 'border-transparent text-muted-foreground hover:bg-accent',
              )}
            >
              {areaShortLabel(program.id, program.name)}
            </button>
          )
        })}
      </div>
    </div>
  )
}

/** Multi-select level chips. A ticked chip means "show me this level". */
function LevelFilters({
  levels,
  hidden,
  onToggle,
}: {
  levels: Level[]
  hidden: Set<string>
  onToggle: (id: string) => void
}) {
  return (
    <div className="flex flex-wrap gap-1" role="group" aria-label="Which levels">
      {levels.map(level => {
        const on = !hidden.has(level.id)
        return (
          <button
            key={level.id}
            type="button"
            aria-pressed={on}
            onClick={() => onToggle(level.id)}
            className={cn(
              'rounded-full border px-2.5 py-1 text-xs transition-colors',
              on
                ? 'border-transparent bg-primary text-primary-foreground'
                : 'border-border text-muted-foreground line-through decoration-muted-foreground/60 hover:bg-accent',
            )}
          >
            {level.shortLabel}
            {level.current && (
              <span className={cn('ml-1 text-[10px]', on ? 'opacity-80' : 'opacity-60')} aria-label="current">
                •
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}

function ItemRow({
  programId,
  item,
  today,
}: {
  programId: string
  item: ProtocolItem
  today: boolean
}) {
  const contextTag = EXERCISES[item.exerciseId]?.contextTag
  return (
    <Link
      to={`/exercise/${programId}/${item.id}`}
      className="flex items-start gap-2 rounded-md border px-3 py-2 hover:bg-accent"
    >
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-sm font-medium leading-snug">{itemName(item)}</span>
          {today && (
            <span className="rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-medium leading-3 text-primary-foreground">
              today
            </span>
          )}
        </div>
        <div className="mt-0.5 flex flex-wrap gap-x-2 text-xs text-muted-foreground">
          <span>{doseLabel(item)}</span>
          {item.tempo && <span>tempo {item.tempo}</span>}
          {item.load && <span>{item.load}</span>}
        </div>
      </div>
      {contextTag && (
        <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[10px] leading-4 text-muted-foreground">
          {CONTEXT_LABEL[contextTag]}
        </span>
      )}
    </Link>
  )
}

function LevelSection({
  programId,
  level,
  todayKeys,
}: {
  programId: ProgramId
  level: Level
  todayKeys: Set<string>
}) {
  return (
    <section className="space-y-1.5">
      <div className="flex items-baseline gap-2 px-1">
        <h3 className="text-sm font-semibold">{level.label}</h3>
        {level.current && (
          <span className="rounded-full bg-primary/15 px-1.5 py-0.5 text-[10px] font-medium leading-3 text-primary">
            current
          </span>
        )}
        <span className="ml-auto shrink-0 text-xs tabular-nums text-muted-foreground">
          {level.items.length}
        </span>
      </div>
      {level.items.length === 0 ? (
        <p className="px-2 text-xs text-muted-foreground">No exercises at this level.</p>
      ) : (
        <div className="space-y-1.5">
          {level.items.map(item => (
            <ItemRow
              key={item.id}
              programId={programId}
              item={item}
              today={todayKeys.has(entryKey(programId, item.id))}
            />
          ))}
        </div>
      )}
    </section>
  )
}

/**
 * Every exercise the app knows, one area at a time — the answer to "what else
 * is there for my shin?". Pick the area, then tick the levels worth seeing;
 * both picks are remembered, so once a level is outgrown it stays out of the
 * way. Browsing only: logging sets happens on the detail screen.
 */
export function ExerciseLibrary({
  states,
  todayKeys,
}: {
  states: ProgramState[]
  todayKeys: Set<string>
}) {
  const programs = programList()
  const [areaId, setAreaId] = useState<ProgramId>(() => readArea(programs[0].id))
  const [hidden, setHidden] = useState<Set<string>>(() => readHidden(areaId))

  const program = programs.find(p => p.id === areaId) ?? programs[0]
  const state = states.find(s => s.programId === program.id)
  // A state pointing at a phase that no longer exists reads as "not started".
  const currentPhaseId =
    state && phaseOf(program, state.phase) ? state.phase : program.phases[0].id
  const levels = levelsOf(program, currentPhaseId)
  const shown = levels.filter(level => !hidden.has(level.id))

  function pickArea(id: ProgramId) {
    setAreaId(id)
    setHidden(readHidden(id))
    writeArea(id)
  }

  function toggleLevel(id: string) {
    setHidden(prev => {
      const next = new Set(prev)
      if (!next.delete(id)) next.add(id)
      writeHidden(program.id, next)
      return next
    })
  }

  return (
    <div className="space-y-4">
      <AreaTabs programs={programs} value={program.id} onChange={pickArea} />

      <div className="space-y-2">
        <div className="flex flex-wrap items-baseline gap-2">
          <span
            className={cn('size-2.5 shrink-0 self-center rounded-full', programColor(program.id).dot)}
            aria-hidden
          />
          <h2 className="font-semibold">{areaLabel(program.id, program.name)}</h2>
          <span className="text-xs text-muted-foreground">{program.name}</span>
        </div>
        <LevelFilters levels={levels} hidden={hidden} onToggle={toggleLevel} />
      </div>

      {shown.length === 0 ? (
        <p className="px-1 text-sm text-muted-foreground">
          Every level is switched off. Tap a level above to show its exercises.
        </p>
      ) : (
        <div className="space-y-5">
          {shown.map(level => (
            <LevelSection key={level.id} programId={program.id} level={level} todayKeys={todayKeys} />
          ))}
        </div>
      )}
    </div>
  )
}
