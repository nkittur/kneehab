import { useLiveQuery } from 'dexie-react-hooks'
import { Bar, BarChart, CartesianGrid, ComposedChart, Legend, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { db, getSettings } from '@/lib/db'
import { protocolFor } from '@/lib/protocol'
import { rehabPhaseFor } from '@/lib/phase'
import { Card, CardContent } from '@/components/ui/card'

function lastNDays(n: number): string[] {
  const out: string[] = []
  const now = new Date()
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now)
    d.setDate(now.getDate() - i)
    out.push(d.toISOString().slice(0, 10))
  }
  return out
}

export function ProgressPage() {
  const settings = useLiveQuery(() => getSettings(), [])
  const logs = useLiveQuery(() => db.dailyLogs.toArray(), []) ?? []
  const completions = useLiveQuery(() => db.setCompletions.toArray(), []) ?? []

  if (!settings) return null

  const days = lastNDays(28)
  const logByDate = new Map(logs.map(l => [l.date, l]))
  const compByDate = new Map<string, number>()
  completions.forEach(c => compByDate.set(c.date, (compByDate.get(c.date) ?? 0) + 1))

  const rows = days.map(d => {
    const log = logByDate.get(d)
    const isSport = log?.isSportDay ?? false
    const phase = isSport ? 'pregame' : rehabPhaseFor(settings.programStartDate, d)
    const items = protocolFor(phase).concat(isSport ? protocolFor('postgame') : [])
    const total = items.reduce((s, p) => s + p.sets, 0) || 1
    const done = compByDate.get(d) ?? 0
    return {
      date: d.slice(5),
      adherence: Math.min(100, Math.round((done / total) * 100)),
      pops: log?.pops ?? null,
      pain: log?.pain ?? null,
    }
  })

  return (
    <div className="max-w-md mx-auto px-4 pt-6 pb-28 space-y-4">
      <h1 className="text-2xl font-semibold">Progress</h1>

      <Card>
        <CardContent className="p-4">
          <div className="text-sm font-medium mb-2">Daily adherence (28d)</div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={rows}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} interval={3} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
              <Tooltip />
              <Bar dataKey="adherence" fill="var(--color-primary)" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="text-sm font-medium mb-2">Pops & pain vs consistency</div>
          <ResponsiveContainer width="100%" height={220}>
            <ComposedChart data={rows}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} interval={3} />
              <YAxis yAxisId="left" tick={{ fontSize: 10 }} />
              <YAxis yAxisId="right" orientation="right" domain={[0, 10]} tick={{ fontSize: 10 }} />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar yAxisId="left" dataKey="adherence" fill="var(--color-muted-foreground)" opacity={0.3} name="Adherence %" />
              <Line yAxisId="left" dataKey="pops" stroke="#e11d48" strokeWidth={2} dot={false} name="Pops" connectNulls />
              <Line yAxisId="right" dataKey="pain" stroke="#f59e0b" strokeWidth={2} dot={false} name="Pain (0–10)" connectNulls />
            </ComposedChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  )
}
