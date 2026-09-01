import { useLiveQuery } from 'dexie-react-hooks'
import { ArrowRight, Check, Info, Sunrise, X } from 'lucide-react'
import { toast } from 'sonner'
import {
  db,
  latestGateResults,
  recordGateTest,
  setProgramPhase,
  type GateTestResult,
} from '@/lib/db'
import {
  ADVANCEMENTS,
  advancementReady,
  GATE_GROUPS,
  gateGroup,
  gateTestsInGroup,
  isGroupPassed,
} from '@/programs/tibantTests'
import type { Advancement, GateTest, GateTestGroupId } from '@/programs/tibantTests'
import { isNextPhase, isPhaseAhead, phaseOf, PROGRAMS } from '@/programs'
import type { ProgramState } from '@/programs/types'
import { programColor } from '@/lib/programColors'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

/** 'Phase C — Energy storage' → 'Phase C'. The full name is too long for a button. */
function shortPhaseName(name: string): string {
  return name.split('—')[0].trim()
}

function shortDate(dateISO: string): string {
  return new Date(dateISO + 'T00:00:00').toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  })
}

function TestCard({ test, latest }: { test: GateTest; latest?: GateTestResult }) {
  const passed = latest?.passed === true
  const failed = latest?.passed === false

  async function record(pass: boolean) {
    try {
      await recordGateTest(test.id, pass)
      toast.success(`${test.name} — ${pass ? 'passed' : 'not yet'}`)
    } catch {
      toast.error('Could not save that result — try again.')
    }
  }

  return (
    <Card
      className={cn(
        'gap-0 py-0',
        passed && 'border-emerald-500/40 bg-emerald-500/5',
        failed && 'border-amber-500/40 bg-amber-500/5',
      )}
    >
      <CardContent className="space-y-2 p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-medium">{test.name}</h3>
          {test.program === 'knee' && (
            <span
              className={cn(
                'shrink-0 rounded-full px-2 py-0.5 text-[10px] leading-4',
                programColor('knee').chip,
              )}
            >
              knee
            </span>
          )}
        </div>

        <p className="text-sm text-muted-foreground">{test.criterion}</p>

        {test.nextMorning && (
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Sunrise className="size-3.5 shrink-0" aria-hidden />
            Check again the next morning before you call it a pass.
          </p>
        )}

        <details className="group rounded-md border px-3 py-2">
          <summary className="cursor-pointer list-none text-xs font-medium text-muted-foreground marker:content-none">
            <span className="inline-block transition-transform group-open:rotate-90">›</span> How to do
            it
          </summary>
          <div className="space-y-2 pt-2 text-sm leading-relaxed">
            {test.needs && (
              <p className="text-xs text-muted-foreground">
                <span className="font-medium">Needs — </span>
                {test.needs}
              </p>
            )}
            <ol className="list-decimal space-y-1.5 pl-4 text-muted-foreground">
              {test.how.map((step, i) => (
                <li key={i}>{step}</li>
              ))}
            </ol>
          </div>
        </details>

        <div className="flex items-center gap-2 pt-1">
          <Button
            variant={passed ? 'default' : 'outline'}
            size="sm"
            className="flex-1"
            onClick={() => record(true)}
          >
            <Check /> Pass
          </Button>
          <Button
            variant={failed ? 'secondary' : 'outline'}
            size="sm"
            className="flex-1"
            onClick={() => record(false)}
          >
            <X /> Fail
          </Button>
        </div>

        {latest && (
          <p
            className={cn(
              'text-xs',
              passed ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400',
            )}
          >
            {passed ? 'Passed' : 'Failed'} {shortDate(latest.date)}
          </p>
        )}
      </CardContent>
    </Card>
  )
}

/** 'a, b and c' — for naming the gates that are done or still owed. */
function sentenceList(parts: string[]): string {
  if (parts.length < 2) return parts.join('')
  return `${parts.slice(0, -1).join(', ')} and ${parts[parts.length - 1]}`
}

/** A group that is still owed, with what is left in it when that is short. */
function owedLabel(id: GateTestGroupId, latest: ReadonlyMap<string, GateTestResult>): string {
  const title = gateGroup(id)?.title ?? id
  const left = gateTestsInGroup(id).filter(t => latest.get(t.id)?.passed !== true)
  if (left.length === 0 || left.length > 2) {
    return `${title} (${left.length} left)`
  }
  return `${title}: ${sentenceList(left.map(t => t.name.toLowerCase()))}`
}

/**
 * The offer to take a phase, next to the tests that earn it. A phase costs
 * every group its `entryCriteria` name — Phase C wants Phase B exit *and* the
 * jog — so this renders once per advancement rather than once per group, under
 * the last group it needs, and disappears once the program is at or past it.
 *
 * The button is only for a one-phase step on a running program. Gates half
 * done, a program two phases back, a paused program: all get a line saying what
 * is in the way instead, because jumping phases from here would skip loading
 * the user has not done.
 */
function AdvanceBanner({
  adv,
  state,
  latest,
}: {
  adv: Advancement
  state?: ProgramState
  latest: ReadonlyMap<string, GateTestResult>
}) {
  const program = PROGRAMS[adv.programId]
  const target = program ? phaseOf(program, adv.toPhaseId) : undefined
  if (!program || !target) return null
  if (!isPhaseAhead(program, state?.phase, adv.toPhaseId)) return null

  const done = adv.requires.filter(id => isGroupPassed(id, latest))
  // Nothing earned yet — the group's own progress bar already says so.
  if (done.length === 0) return null

  const short = shortPhaseName(target.name)
  const programName = program.name
  const ready = advancementReady(adv, latest)
  const adjacent = isNextPhase(program, state?.phase, adv.toPhaseId)

  async function advance() {
    try {
      await setProgramPhase(adv.programId, adv.toPhaseId)
      toast.success(`${programName} moved to ${short}`)
    } catch {
      toast.error('Could not change the phase — try again.')
    }
  }

  if (ready && adjacent && !state?.paused) {
    return (
      <Card className="gap-0 border-primary/40 bg-primary/5 py-0">
        <CardContent className="space-y-3 p-4">
          <p className="text-sm font-medium leading-relaxed">
            Every gate for {short} passed — advance {programName} to {short}
          </p>
          <p className="text-xs text-muted-foreground">{target.name}</p>
          <Button className="w-full" onClick={advance}>
            Advance to {short} <ArrowRight />
          </Button>
        </CardContent>
      </Card>
    )
  }

  const doneTitles = sentenceList(done.map(id => gateGroup(id)?.title ?? id))
  const currentName = shortPhaseName(
    (phaseOf(program, state?.phase ?? '') ?? program.phases[0]).name,
  )
  let message: string
  if (!ready) {
    const owed = adv.requires.filter(id => !isGroupPassed(id, latest))
    message = `${doneTitles} passed — ${short} also needs ${sentenceList(owed.map(id => owedLabel(id, latest)))}.`
  } else if (state?.paused) {
    message = `Every gate for ${short} passed, but ${programName} is paused. Resume it on Programs to take the phase.`
  } else {
    message = `Every gate for ${short} passed, but ${programName} is still in ${currentName}. Move it a phase at a time from Programs if you really mean to skip ahead.`
  }

  return (
    <Card className="gap-0 border-dashed py-0">
      <CardContent className="p-4">
        <p className="flex items-start gap-2 text-sm leading-relaxed text-muted-foreground">
          <Info className="mt-0.5 size-4 shrink-0" aria-hidden />
          <span>{message}</span>
        </p>
      </CardContent>
    </Card>
  )
}

export function TestsPage() {
  const latest = useLiveQuery(() => latestGateResults(), [])
  const states = useLiveQuery(() => db.programState.toArray(), [])
  if (!latest || !states) return null
  const stateOf = new Map(states.map(s => [s.programId, s]))

  return (
    <div className="mx-auto max-w-md space-y-6 px-4 pb-28 pt-6">
      <div>
        <h1 className="text-2xl font-semibold">Gate tests</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Progress by capacity, not by calendar — pass every gate a phase asks for to unlock it.
        </p>
      </div>

      {GATE_GROUPS.map(group => {
        const tests = gateTestsInGroup(group.id)
        const passed = tests.filter(t => latest.get(t.id)?.passed === true).length
        return (
          <section key={group.id} className="space-y-3">
            <div>
              <div className="flex items-baseline justify-between gap-2">
                <h2 className="font-semibold">{group.title}</h2>
                <span
                  className={cn(
                    'shrink-0 text-xs tabular-nums',
                    passed === tests.length ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground',
                  )}
                >
                  {passed}/{tests.length} passed
                </span>
              </div>
              <div className="mt-1.5 flex items-center gap-1.5">
                {tests.map(t => (
                  <span
                    key={t.id}
                    title={t.name}
                    className={cn(
                      'h-1.5 flex-1 rounded-full',
                      latest.get(t.id)?.passed === true ? 'bg-primary' : 'bg-muted',
                    )}
                  />
                ))}
              </div>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{group.blurb}</p>
            </div>
            {ADVANCEMENTS.filter(a => a.requires[a.requires.length - 1] === group.id).map(adv => (
              <AdvanceBanner
                key={adv.toPhaseId}
                adv={adv}
                state={stateOf.get(adv.programId)}
                latest={latest}
              />
            ))}
            {tests.map(t => (
              <TestCard key={t.id} test={t} latest={latest.get(t.id)} />
            ))}
          </section>
        )
      })}
    </div>
  )
}
