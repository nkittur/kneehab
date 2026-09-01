import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import { entryKey, itemName } from '@/lib/useDayPlan'
import { EXERCISES, phaseOf, programList } from '@/programs'
import type { ContextTag, ProgramDef, ProgramState, ProtocolItem } from '@/programs/types'
import { areaLabel, programColor } from '@/lib/programColors'
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

/** A collapsible run of items — one phase, or a pre/postgame block. */
type Group = { id: string; label: string; items: ProtocolItem[]; current: boolean }

function groupsOf(program: ProgramDef, currentPhaseId: string): Group[] {
  const groups: Group[] = program.phases.map(phase => ({
    id: phase.id,
    label: phase.name,
    items: phase.items,
    current: phase.id === currentPhaseId,
  }))
  // Pre/postgame items belong to no phase but are still exercises the user owns,
  // so they get their own groups rather than being invisible here.
  if (program.pregameItems?.length) {
    groups.push({ id: 'pregame', label: 'Pre-game', items: program.pregameItems, current: false })
  }
  if (program.postgameItems?.length) {
    groups.push({ id: 'postgame', label: 'Post-game', items: program.postgameItems, current: false })
  }
  return groups
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

function ProgramSection({
  program,
  state,
  todayKeys,
}: {
  program: ProgramDef
  state?: ProgramState
  todayKeys: Set<string>
}) {
  // A state pointing at a phase that no longer exists reads as "not started".
  const currentPhaseId =
    state && phaseOf(program, state.phase) ? state.phase : program.phases[0].id
  const groups = groupsOf(program, currentPhaseId)
  // Only the phase the user is actually in opens on arrival; the rest are one
  // tap away, which is the whole point of the screen.
  const [openIds, setOpenIds] = useState<Set<string>>(() => new Set([currentPhaseId]))

  function toggle(id: string) {
    setOpenIds(prev => {
      const next = new Set(prev)
      if (!next.delete(id)) next.add(id)
      return next
    })
  }

  return (
    <section className="space-y-2">
      <div className="flex flex-wrap items-baseline gap-2">
        <span
          className={cn('size-2.5 shrink-0 self-center rounded-full', programColor(program.id).dot)}
          aria-hidden
        />
        <h3 className="font-semibold">{areaLabel(program.id, program.name)}</h3>
        <span className="text-xs text-muted-foreground">{program.name}</span>
      </div>

      {groups.map(group => {
        const open = openIds.has(group.id)
        return (
          <div key={group.id} className="space-y-1.5">
            <button
              type="button"
              onClick={() => toggle(group.id)}
              aria-expanded={open}
              className="flex w-full items-center gap-1.5 rounded-md px-1 py-1 text-left hover:bg-accent"
            >
              <ChevronRight
                className={cn(
                  'size-3.5 shrink-0 text-muted-foreground transition-transform',
                  open && 'rotate-90',
                )}
                aria-hidden
              />
              <span className="text-sm">{group.label}</span>
              {group.current && (
                <span className="rounded-full bg-primary/15 px-1.5 py-0.5 text-[10px] font-medium leading-3 text-primary">
                  current
                </span>
              )}
              <span className="ml-auto shrink-0 text-xs tabular-nums text-muted-foreground">
                {group.items.length}
              </span>
            </button>

            {open &&
              (group.items.length === 0 ? (
                <p className="px-2 text-xs text-muted-foreground">No exercises in this phase.</p>
              ) : (
                <div className="space-y-1.5">
                  {group.items.map(item => (
                    <ItemRow
                      key={item.id}
                      programId={program.id}
                      item={item}
                      today={todayKeys.has(entryKey(program.id, item.id))}
                    />
                  ))}
                </div>
              ))}
          </div>
        )
      })}
    </section>
  )
}

/**
 * Every exercise the app knows, by program and phase — the answer to "what else
 * is there?". Browsing only: logging sets happens on the detail screen.
 */
export function ExerciseLibrary({
  states,
  todayKeys,
}: {
  states: ProgramState[]
  todayKeys: Set<string>
}) {
  const byId = new Map(states.map(s => [s.programId, s]))
  return (
    <div className="space-y-6">
      {programList().map(program => (
        <ProgramSection
          key={program.id}
          program={program}
          state={byId.get(program.id)}
          todayKeys={todayKeys}
        />
      ))}
    </div>
  )
}
