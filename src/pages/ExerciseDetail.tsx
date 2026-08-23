import { Link, useParams } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { ChevronLeft } from 'lucide-react'
import { db, todayISO, toggleSet } from '@/lib/db'
import { findProtocolItem } from '@/lib/useDayPlan'
import { EXERCISES, PROGRAMS } from '@/programs'
import type { ProgramId } from '@/programs/types'
import { ExerciseDemo } from '@/components/ExerciseDemo'
import { ProgramBadge } from '@/components/ProgramBadge'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-1 text-xs uppercase tracking-wide text-muted-foreground">{title}</div>
      <div className="text-sm leading-relaxed">{children}</div>
    </div>
  )
}

export function ExerciseDetail() {
  const { programId = '', itemId = '' } = useParams()
  const date = todayISO()
  const item = findProtocolItem(programId, itemId)
  const completions =
    useLiveQuery(
      () =>
        db.setCompletions
          .where('[date+protocolId+setNumber]')
          .between([date, itemId, 0], [date, itemId, 999])
          .toArray(),
      [date, itemId],
    ) ?? []

  const program = PROGRAMS[programId as ProgramId]
  if (!item || !program) {
    return (
      <div className="mx-auto max-w-md px-4 pb-28 pt-6 space-y-3">
        <div className="text-sm">That exercise is no longer in the plan.</div>
        <Link to="/" className="text-sm underline">
          Back to Today
        </Link>
      </div>
    )
  }

  const ex = EXERCISES[item.exerciseId]
  const name = ex?.name ?? item.exerciseId
  const doneSet = new Set(completions.map(c => c.setNumber))

  return (
    <div className="mx-auto max-w-md space-y-4 px-4 pb-28 pt-4">
      <Link to="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground">
        <ChevronLeft className="h-4 w-4" /> Back
      </Link>

      <ExerciseDemo name={name} demoUrl={ex?.demoUrl} />

      <div>
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-semibold">{name}</h1>
          <ProgramBadge programId={program.id} name={program.name} />
        </div>
        {ex?.targetArea && <div className="text-sm text-muted-foreground">{ex.targetArea}</div>}
      </div>

      <div className="flex flex-wrap gap-2">
        <span className="rounded-full bg-muted px-3 py-1 text-xs">
          <span className="text-muted-foreground">Dose </span>
          {item.sets} × {item.displayAmount}
        </span>
        {item.tempo && (
          <span className="rounded-full bg-muted px-3 py-1 text-xs">
            <span className="text-muted-foreground">Tempo </span>
            {item.tempo}
          </span>
        )}
        {item.load && (
          <span className="rounded-full bg-muted px-3 py-1 text-xs">
            <span className="text-muted-foreground">Load </span>
            {item.load}
          </span>
        )}
        <span className="rounded-full bg-muted px-3 py-1 text-xs">
          <span className="text-muted-foreground">Frequency </span>
          {item.frequency.perWeek === 'daily' ? 'daily' : `${item.frequency.perWeek}×/week`}
        </span>
      </div>

      {ex?.cue && (
        <Card className="border-primary/20 bg-primary/5 py-0">
          <CardContent className="p-4">
            <div className="mb-1 text-xs uppercase tracking-wide text-muted-foreground">Form cue</div>
            <div className="text-lg font-medium leading-snug">{ex.cue}</div>
          </CardContent>
        </Card>
      )}

      {ex?.instructions && <Section title="How to do it">{ex.instructions}</Section>}

      {ex?.commonMistakes && ex.commonMistakes.length > 0 && (
        <Section title="Common mistakes">
          <ul className="list-disc space-y-1 pl-4 text-muted-foreground">
            {ex.commonMistakes.map(m => (
              <li key={m}>{m}</li>
            ))}
          </ul>
        </Section>
      )}

      {item.notes && <Section title="Notes">{item.notes}</Section>}
      {ex?.whyItMatters && <Section title="Why it matters">{ex.whyItMatters}</Section>}
      {ex?.progression && (
        <Section title="Progression">
          <span className="text-muted-foreground">{ex.progression}</span>
        </Section>
      )}
      {ex?.regression && (
        <Section title="Regression">
          <span className="text-muted-foreground">{ex.regression}</span>
        </Section>
      )}

      <div>
        <div className="mb-2 text-sm text-muted-foreground">
          {item.sets} × {item.displayAmount}
        </div>
        <div className="grid grid-cols-3 gap-2">
          {Array.from({ length: item.sets }, (_, i) => i + 1).map(n => {
            const done = doneSet.has(n)
            return (
              <Button
                key={n}
                variant={done ? 'default' : 'outline'}
                className="h-20 text-lg"
                onClick={() => toggleSet(date, item.id, n, program.id)}
              >
                {done ? '✓' : `Set ${n}`}
              </Button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
