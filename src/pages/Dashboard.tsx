import { useLiveQuery } from 'dexie-react-hooks'
import { Link } from 'react-router-dom'
import { db, getSettings, todayISO, upsertDailyLog } from '@/lib/db'
import { protocolFor, exercise } from '@/lib/protocol'
import { rehabPhaseFor, weekNumber } from '@/lib/phase'
import { ProgressRing } from '@/components/ProgressRing'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { useEffect } from 'react'
import { ChevronRight } from 'lucide-react'

export function Dashboard() {
  const date = todayISO()
  const settings = useLiveQuery(() => getSettings(), [])
  const log = useLiveQuery(() => db.dailyLogs.get(date), [date])
  const completions = useLiveQuery(() => db.setCompletions.where('date').equals(date).toArray(), [date]) ?? []

  useEffect(() => {
    if (!log) upsertDailyLog(date, { isSportDay: false })
  }, [log, date])

  if (!settings) return null

  const phase = log?.isSportDay ? 'pregame' : rehabPhaseFor(settings.programStartDate, date)
  const items = protocolFor(phase)
  const postGameItems = log?.isSportDay ? protocolFor('postgame') : []
  const allItems = [...items, ...postGameItems]

  const totalSets = allItems.reduce((n, p) => n + p.sets, 0)
  const doneSets = completions.length
  const pct = totalSets ? (doneSets / totalSets) * 100 : 0
  const week = weekNumber(settings.programStartDate, date)

  function completedFor(protocolId: string) {
    return completions.filter(c => c.protocolId === protocolId).length
  }

  return (
    <div className="max-w-md mx-auto px-4 pt-6 pb-28 space-y-6">
      <header>
        <div className="text-sm text-muted-foreground">Week {week} · {log?.isSportDay ? 'Sport Day' : 'Rehab Day'}</div>
        <div className="text-2xl font-semibold">{new Date(date + 'T00:00:00').toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}</div>
      </header>

      <div className="flex items-center gap-4">
        <ProgressRing value={pct} label={`${doneSets}/${totalSets} sets`} />
        <div className="flex-1 flex gap-2">
          <Button
            variant={log?.isSportDay ? 'default' : 'outline'}
            className="flex-1"
            onClick={() => upsertDailyLog(date, { isSportDay: true })}
          >
            Sport
          </Button>
          <Button
            variant={!log?.isSportDay ? 'default' : 'outline'}
            className="flex-1"
            onClick={() => upsertDailyLog(date, { isSportDay: false, sport: null })}
          >
            Rehab
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-4 space-y-4">
          <div className="text-sm font-medium">Today's symptoms</div>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <Label className="text-xs text-muted-foreground">Knee pops today</Label>
                <span className="text-2xl font-semibold tabular-nums">{log?.pops ?? 0}</span>
              </div>
              <div className="flex gap-2">
                <Button
                  className="flex-1 h-14 text-base"
                  onClick={() => upsertDailyLog(date, { pops: (log?.pops ?? 0) + 1 })}
                >
                  +1 pop
                </Button>
                <Button
                  variant="outline"
                  className="h-14 px-5"
                  disabled={(log?.pops ?? 0) <= 0}
                  onClick={() => upsertDailyLog(date, { pops: Math.max(0, (log?.pops ?? 0) - 1) })}
                >
                  −
                </Button>
              </div>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Pain: {log?.pain ?? 0}/10</Label>
              <Slider
                min={0}
                max={10}
                step={1}
                value={[log?.pain ?? 0]}
                onValueChange={([v]) => upsertDailyLog(date, { pain: v })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-3">
        <div className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
          {log?.isSportDay ? 'Pre-game warmup' : phase === 'phase1' ? 'Phase 1 routine' : 'Phase 2 routine'}
        </div>
        {items.map(p => {
          const ex = exercise(p.exerciseId)
          const done = completedFor(p.id)
          return (
            <Link key={p.id} to={`/exercise/${p.id}`}>
              <Card className="hover:bg-accent/50 transition">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="flex-1">
                    <div className="font-medium">{ex.name}</div>
                    <div className="text-sm text-muted-foreground">{p.sets} × {p.displayAmount}</div>
                  </div>
                  <div className="text-sm tabular-nums text-muted-foreground">{done}/{p.sets}</div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </CardContent>
              </Card>
            </Link>
          )
        })}

        {log?.isSportDay && postGameItems.length > 0 && (
          <>
            <div className="text-sm font-medium text-muted-foreground uppercase tracking-wide pt-2">Post-game</div>
            {postGameItems.map(p => {
              const ex = exercise(p.exerciseId)
              const done = completedFor(p.id)
              return (
                <Link key={p.id} to={`/exercise/${p.id}`}>
                  <Card className="hover:bg-accent/50 transition">
                    <CardContent className="p-4 flex items-center gap-3">
                      <div className="flex-1">
                        <div className="font-medium">{ex.name}</div>
                        <div className="text-sm text-muted-foreground">{p.displayAmount}</div>
                      </div>
                      <div className="text-sm tabular-nums text-muted-foreground">{done}/{p.sets}</div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </CardContent>
                  </Card>
                </Link>
              )
            })}
          </>
        )}
      </div>
    </div>
  )
}
