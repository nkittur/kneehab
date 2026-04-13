import { Link, useParams } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { ChevronLeft } from 'lucide-react'
import { db, todayISO, toggleSet } from '@/lib/db'
import { PROTOCOL, exercise } from '@/lib/protocol'
import { ExerciseDemo } from '@/components/ExerciseDemo'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export function ExerciseDetail() {
  const { protocolId = '' } = useParams()
  const date = todayISO()
  const item = PROTOCOL.find(p => p.id === protocolId)
  const completions = useLiveQuery(
    () => db.setCompletions.where('[date+protocolId+setNumber]').between([date, protocolId, 0], [date, protocolId, 999]).toArray(),
    [date, protocolId],
  ) ?? []

  if (!item) return <div className="p-6">Not found. <Link to="/" className="underline">Home</Link></div>
  const ex = exercise(item.exerciseId)
  const doneSet = new Set(completions.map(c => c.setNumber))

  return (
    <div className="max-w-md mx-auto px-4 pt-4 pb-28 space-y-4">
      <Link to="/" className="inline-flex items-center text-sm text-muted-foreground gap-1">
        <ChevronLeft className="h-4 w-4" /> Back
      </Link>

      <ExerciseDemo name={ex.name} />

      <div>
        <h1 className="text-2xl font-semibold">{ex.name}</h1>
        {ex.targetMuscle && <div className="text-sm text-muted-foreground">{ex.targetMuscle}</div>}
      </div>

      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="p-4">
          <div className="text-xs uppercase tracking-wide text-muted-foreground mb-1">Form cue</div>
          <div className="font-medium">{ex.cue}</div>
        </CardContent>
      </Card>

      {ex.instructions && (
        <div className="text-sm leading-relaxed text-muted-foreground">{ex.instructions}</div>
      )}

      <div>
        <div className="text-sm text-muted-foreground mb-2">{item.sets} × {item.displayAmount}</div>
        <div className="grid grid-cols-3 gap-2">
          {Array.from({ length: item.sets }).map((_, i) => {
            const n = i + 1
            const done = doneSet.has(n)
            return (
              <Button
                key={n}
                variant={done ? 'default' : 'outline'}
                className="h-20 text-lg"
                onClick={() => toggleSet(date, item.id, n)}
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
