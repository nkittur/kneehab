import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { toast } from 'sonner'
import { db, todayISO, upsertBodyMetric } from '@/lib/db'
import { addDays, weekOf } from '@/lib/planner'
import { PROGRAM_COLORS } from '@/lib/programColors'
import { programList } from '@/programs'
import type { ProgramId } from '@/programs/types'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const KG_PER_LB = 0.45359237
const PAIN_AREAS: ProgramId[] = ['knee', 'tibant', 'wrist']
const PAIN_LABEL: Partial<Record<ProgramId, string>> = { knee: 'Knee', tibant: 'Shin', wrist: 'Wrist' }

function lastNDays(n: number, end = todayISO()): string[] {
  return Array.from({ length: n }, (_, i) => addDays(end, i - (n - 1)))
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card className="gap-0 py-0">
      <CardContent className="p-4">
        <div className="mb-2 text-sm font-medium">{title}</div>
        {children}
      </CardContent>
    </Card>
  )
}

export function TrendsPage() {
  const logs = useLiveQuery(() => db.dailyLogs.toArray(), [])
  const completions = useLiveQuery(() => db.setCompletions.toArray(), [])
  const metrics = useLiveQuery(() => db.bodyMetrics.toArray(), [])
  const [weightLb, setWeightLb] = useState('')

  if (!logs || !completions || !metrics) return null

  const days = lastNDays(28)
  const logByDate = new Map(logs.map(l => [l.date, l]))

  const painRows = days.map(d => {
    const log = logByDate.get(d)
    const scores = log?.painScores ?? {}
    return {
      date: d.slice(5),
      knee: scores.knee ?? log?.pain ?? null,
      tibant: scores.tibant ?? null,
      wrist: scores.wrist ?? null,
      pops: log?.pops ?? null,
    }
  })

  // Weight: stored in kg, shown in lb, with a 7-day trailing mean.
  const weightByDate = new Map(metrics.filter(m => m.weightKg != null).map(m => [m.date, m.weightKg!]))
  const weightDays = lastNDays(90)
  const weightRows: { date: string; lb: number | null; avg: number | null }[] = []
  for (let i = 0; i < weightDays.length; i++) {
    const kg = weightByDate.get(weightDays[i])
    const window: number[] = []
    for (let j = Math.max(0, i - 6); j <= i; j++) {
      const w = weightByDate.get(weightDays[j])
      if (w != null) window.push(w)
    }
    weightRows.push({
      date: weightDays[i].slice(5),
      lb: kg == null ? null : Number((kg / KG_PER_LB).toFixed(1)),
      avg: window.length ? Number((window.reduce((a, b) => a + b, 0) / window.length / KG_PER_LB).toFixed(1)) : null,
    })
  }
  const hasWeight = weightByDate.size > 0

  // Adherence: completed sets per week, split by program colour. Honest and cheap —
  // a retroactive "planned" denominator is unknowable, so this counts work done.
  const weekStarts = [3, 2, 1, 0].map(back => weekOf(addDays(todayISO(), -7 * back)))
  const programs = programList()
  const setRows = weekStarts.map(start => {
    const row: Record<string, string | number> = { week: start.slice(5) }
    for (const p of programs) row[p.id] = 0
    for (const c of completions) {
      if (weekOf(c.date) !== start) continue
      const id = (c.programId ?? 'knee') as ProgramId
      if (row[id] === undefined) row[id] = 0
      row[id] = (row[id] as number) + 1
    }
    return row
  })
  const totalSets = setRows.reduce(
    (sum, row) => sum + programs.reduce((s, p) => s + ((row[p.id] as number) ?? 0), 0),
    0,
  )

  async function addWeight() {
    const lb = Number(weightLb)
    if (!Number.isFinite(lb) || lb <= 0) {
      toast.error('Enter a weight in lb')
      return
    }
    await upsertBodyMetric(todayISO(), { weightKg: lb * KG_PER_LB })
    setWeightLb('')
    toast.success(`Logged ${lb} lb`)
  }

  return (
    <div className="mx-auto max-w-md space-y-4 px-4 pb-28 pt-6">
      <h1 className="text-2xl font-semibold">Trends</h1>

      <ChartCard title="Pain by area (28d)">
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={painRows}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="date" tick={{ fontSize: 10 }} interval={6} />
            <YAxis domain={[0, 10]} tick={{ fontSize: 10 }} width={24} />
            <Tooltip />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            {PAIN_AREAS.map(area => (
              <Line
                key={area}
                dataKey={area}
                name={PAIN_LABEL[area]}
                stroke={PROGRAM_COLORS[area].hex}
                strokeWidth={2}
                dot={false}
                connectNulls
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>

      <Card className="gap-0 py-0">
        <CardContent className="space-y-3 p-4">
          <div className="text-sm font-medium">Weight</div>
          <div className="flex items-end gap-2">
            <div className="flex-1">
              <Label className="text-xs text-muted-foreground" htmlFor="weight-lb">
                Today's weight (lb)
              </Label>
              <Input
                id="weight-lb"
                type="number"
                inputMode="decimal"
                step="0.1"
                value={weightLb}
                onChange={e => setWeightLb(e.target.value)}
                placeholder="e.g. 178.4"
              />
            </div>
            <Button onClick={addWeight}>Log</Button>
          </div>
          {hasWeight ? (
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={weightRows}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} interval={14} />
                <YAxis domain={['dataMin - 2', 'dataMax + 2']} tick={{ fontSize: 10 }} width={34} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Line dataKey="lb" name="lb" stroke="var(--color-muted-foreground)" strokeWidth={1} dot={{ r: 2 }} connectNulls />
                <Line dataKey="avg" name="7-day avg" stroke={PROGRAM_COLORS.body.hex} strokeWidth={2} dot={false} connectNulls />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-xs text-muted-foreground">Log a weight to start the trend. Stored in kg, shown in lb.</p>
          )}
        </CardContent>
      </Card>

      <ChartCard title="Sets completed per week (4 weeks)">
        {totalSets === 0 ? (
          <p className="text-xs text-muted-foreground">No sets logged in the last four weeks.</p>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={setRows}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="week" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} width={24} />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              {programs.map(p => (
                <Bar key={p.id} dataKey={p.id} name={p.name} stackId="sets" fill={PROGRAM_COLORS[p.id].hex} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        )}
      </ChartCard>

      <ChartCard title="Knee pops (28d)">
        <ResponsiveContainer width="100%" height={160}>
          <LineChart data={painRows}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="date" tick={{ fontSize: 10 }} interval={6} />
            <YAxis tick={{ fontSize: 10 }} width={24} />
            <Tooltip />
            <Line dataKey="pops" name="Pops" stroke="#e11d48" strokeWidth={2} dot={false} connectNulls />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  )
}
