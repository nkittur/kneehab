import type { Phase } from './protocol'

export function daysSince(startISO: string, nowISO: string): number {
  const a = new Date(startISO + 'T00:00:00')
  const b = new Date(nowISO + 'T00:00:00')
  return Math.floor((b.getTime() - a.getTime()) / 86400000)
}

export function weekNumber(startISO: string, nowISO: string): number {
  return Math.floor(daysSince(startISO, nowISO) / 7) + 1
}

export function rehabPhaseFor(startISO: string, nowISO: string): Phase {
  return weekNumber(startISO, nowISO) <= 2 ? 'phase1' : 'phase2'
}
