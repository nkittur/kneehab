import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { AlertTriangle, Pause, Play } from 'lucide-react'
import {
  db,
  setProgramPaused,
  todayISO,
  type ProgramState,
} from '@/lib/db'
import { daysBetween } from '@/lib/planner'
import {
  cardioNotes,
  fingersNotes,
  phaseOf,
  programList,
  sequencingRules,
  tibantNotes,
  wristSelfAssessment,
} from '@/programs'
import type { PhaseDef, ProgramDef } from '@/programs/types'
import { CheckInDialog } from '@/components/CheckInDialog'
import { programColor } from '@/lib/programColors'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { cn } from '@/lib/utils'

function Disclosure({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <details className="group rounded-md border px-3 py-2">
      <summary className="cursor-pointer list-none text-xs font-medium text-muted-foreground marker:content-none">
        <span className="inline-block transition-transform group-open:rotate-90">›</span> {title}
      </summary>
      <div className="pt-2 text-sm leading-relaxed">{children}</div>
    </details>
  )
}

function Bullets({ items }: { items: string[] }) {
  return (
    <ul className="list-disc space-y-1.5 pl-4 text-muted-foreground">
      {items.map((t, i) => (
        <li key={i}>{t}</li>
      ))}
    </ul>
  )
}

function ProgramNotes({ program, phase }: { program: ProgramDef; phase?: PhaseDef }) {
  switch (program.id) {
    case 'tibant':
      return (
        <>
          <Disclosure title="Load management">
            <Bullets items={tibantNotes.loadManagement} />
          </Disclosure>
          <Disclosure title="Peloton cleat fix">
            <Bullets items={tibantNotes.pelotonFix} />
          </Disclosure>
          <Disclosure title="Cardio for this phase">
            <p className="text-muted-foreground">
              {(phase && tibantNotes.cardioByPhase[phase.id]) ?? 'No cardio guidance for this phase.'}
            </p>
          </Disclosure>
        </>
      )
    case 'fingers':
      return (
        <>
          <Disclosure title="Taping">
            <Bullets items={fingersNotes.taping} />
          </Disclosure>
          <Disclosure title="Catching technique">
            <Bullets items={fingersNotes.technique} />
          </Disclosure>
          <Disclosure title="Evidence">
            <p className="text-muted-foreground">{fingersNotes.evidence}</p>
          </Disclosure>
        </>
      )
    case 'cardio':
      return (
        <>
          <Disclosure title="Zone 2">
            <p className="text-muted-foreground">{cardioNotes.zone2}</p>
          </Disclosure>
          <Disclosure title="Intervals">
            <p className="text-muted-foreground">{cardioNotes.intervals}</p>
          </Disclosure>
          <Disclosure title="Weekly minutes target">
            <p className="text-muted-foreground">{cardioNotes.weeklyMinutesTarget}</p>
          </Disclosure>
          <Disclosure title="Weight management">
            <Bullets items={cardioNotes.weightManagement} />
          </Disclosure>
        </>
      )
    case 'strength':
      return (
        <Disclosure title={`Sequencing rules (${sequencingRules.length})`}>
          <Bullets items={sequencingRules} />
        </Disclosure>
      )
    case 'wrist':
      return (
        <Disclosure title="Self-assessment — run this once before Phase 1">
          <p className="mb-2 text-muted-foreground">
            Five minutes. Test the left wrist first as a reference. "Positive" means it clearly
            reproduces your pain in a spot you can cover with one fingertip.
          </p>
          <ol className="space-y-3">
            {wristSelfAssessment.steps.map(step => (
              <li key={step.id} className="flex gap-2">
                <Checkbox disabled className="mt-1" aria-hidden />
                <div>
                  <div className="font-medium">{step.name}</div>
                  <p className="text-muted-foreground">{step.instructions}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    <span className="font-medium">Positive → </span>
                    {step.positiveMeans}
                  </p>
                </div>
              </li>
            ))}
          </ol>
          <div className="mt-3 text-xs font-medium text-muted-foreground">Variants</div>
          <ul className="mt-1 space-y-1.5 text-muted-foreground">
            {wristSelfAssessment.variants.map(v => (
              <li key={v.id}>
                <span className="font-medium text-foreground">{v.name}</span> — {v.tweaks}
              </li>
            ))}
          </ul>
        </Disclosure>
      )
    default:
      return null
  }
}

function ProgramCard({ program, state }: { program: ProgramDef; state?: ProgramState }) {
  const [checkInOpen, setCheckInOpen] = useState(false)
  const phase = state ? phaseOf(program, state.phase) : undefined
  const index = phase ? program.phases.findIndex(p => p.id === phase.id) : -1
  const days = state ? daysBetween(state.startedPhaseAt, todayISO()) : 0
  const paused = state?.paused ?? false

  return (
    <Card className={cn('gap-0 py-0', paused && 'opacity-60')}>
      <CardContent className="space-y-3 p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={cn('size-2.5 shrink-0 rounded-full', programColor(program.id).dot)}
                aria-hidden
              />
              <h2 className="font-semibold">{program.name}</h2>
              {paused && (
                <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] leading-4 text-muted-foreground">
                  paused
                </span>
              )}
            </div>
            <div className="text-sm text-muted-foreground">
              {phase?.name ?? 'No phase set'}
              {state && ` · day ${Math.max(0, days) + 1}`}
            </div>
          </div>
          <Button
            variant="outline"
            size="icon-sm"
            aria-label={paused ? `Resume ${program.name}` : `Pause ${program.name}`}
            onClick={() => setProgramPaused(program.id, !paused)}
          >
            {paused ? <Play /> : <Pause />}
          </Button>
        </div>

        <div className="flex items-center gap-1.5">
          {program.phases.map((p, i) => (
            <span
              key={p.id}
              title={p.name}
              className={cn(
                'h-1.5 flex-1 rounded-full',
                i < index ? 'bg-primary/50' : i === index ? 'bg-primary' : 'bg-muted',
              )}
            />
          ))}
          <span className="ml-1 shrink-0 text-[11px] tabular-nums text-muted-foreground">
            {index + 1}/{program.phases.length}
          </span>
        </div>

        <div className="space-y-2">
          {phase?.exitCriteria && (
            <Disclosure title="Exit criteria">
              <p className="text-muted-foreground">{phase.exitCriteria}</p>
              {phase.entryCriteria && (
                <p className="mt-2 text-xs text-muted-foreground">Entered on: {phase.entryCriteria}</p>
              )}
            </Disclosure>
          )}

          {phase?.redFlags && phase.redFlags.length > 0 && (
            <details className="group rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2">
              <summary className="flex cursor-pointer list-none items-center gap-1.5 text-xs font-medium text-destructive marker:content-none">
                <AlertTriangle className="size-3.5" /> Red flags — stop and get it looked at
              </summary>
              <ul className="list-disc space-y-1.5 pl-4 pt-2 text-sm leading-relaxed text-destructive">
                {phase.redFlags.map((f, i) => (
                  <li key={i}>{f}</li>
                ))}
              </ul>
            </details>
          )}

          <ProgramNotes program={program} phase={phase} />
        </div>

        <Button
          variant="secondary"
          className="w-full"
          disabled={!phase}
          onClick={() => setCheckInOpen(true)}
        >
          Weekly check-in
        </Button>
      </CardContent>

      {phase && (
        <CheckInDialog program={program} phase={phase} open={checkInOpen} onOpenChange={setCheckInOpen} />
      )}
    </Card>
  )
}

export function ProgramsPage() {
  const states = useLiveQuery(() => db.programState.toArray(), [])
  if (!states) return null
  const byId = new Map(states.map(s => [s.programId, s]))

  return (
    <div className="mx-auto max-w-md space-y-4 px-4 pb-28 pt-6">
      <h1 className="text-2xl font-semibold">Programs</h1>
      {programList().map(p => (
        <ProgramCard key={p.id} program={p} state={byId.get(p.id)} />
      ))}
    </div>
  )
}
