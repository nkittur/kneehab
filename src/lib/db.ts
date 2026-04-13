import Dexie, { type EntityTable } from 'dexie'

export type DailyLog = {
  date: string // YYYY-MM-DD (local)
  isSportDay: boolean
  sport?: 'basketball' | 'pickleball' | null
  pops?: number | null
  pain?: number | null // 0–10
  updatedAt: number
}

export type SetCompletion = {
  id?: number
  date: string
  protocolId: string
  setNumber: number
  completedAt: number
}

export type Settings = {
  key: 'singleton'
  programStartDate: string // YYYY-MM-DD
  darkMode?: boolean
}

export const db = new Dexie('kneehab') as Dexie & {
  dailyLogs: EntityTable<DailyLog, 'date'>
  setCompletions: EntityTable<SetCompletion, 'id'>
  settings: EntityTable<Settings, 'key'>
}

db.version(1).stores({
  dailyLogs: 'date, isSportDay',
  setCompletions: '++id, date, protocolId, [date+protocolId+setNumber]',
  settings: 'key',
})

export function todayISO(d = new Date()): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export async function ensureSettings(): Promise<Settings> {
  const existing = await db.settings.get('singleton')
  if (existing) return existing
  const s: Settings = { key: 'singleton', programStartDate: todayISO() }
  await db.settings.put(s)
  return s
}

export function getSettings(): Promise<Settings | undefined> {
  return db.settings.get('singleton')
}

export async function upsertDailyLog(date: string, patch: Partial<DailyLog>) {
  const existing = await db.dailyLogs.get(date)
  const next: DailyLog = {
    date,
    isSportDay: false,
    ...existing,
    ...patch,
    updatedAt: Date.now(),
  }
  await db.dailyLogs.put(next)
  return next
}

export async function toggleSet(date: string, protocolId: string, setNumber: number): Promise<boolean> {
  const existing = await db.setCompletions
    .where('[date+protocolId+setNumber]')
    .equals([date, protocolId, setNumber])
    .first()
  if (existing) {
    await db.setCompletions.delete(existing.id!)
    return false
  }
  await db.setCompletions.add({ date, protocolId, setNumber, completedAt: Date.now() })
  return true
}
