import type { ProgramId } from '@/programs/types'

/**
 * One colour per program, used for the badge chips on Today and for the
 * recharts series on Trends (hence both Tailwind classes and a raw hex).
 */
export const PROGRAM_COLORS: Record<ProgramId, { chip: string; dot: string; hex: string }> = {
  tibant: { chip: 'bg-amber-500/15 text-amber-700 dark:text-amber-300', dot: 'bg-amber-500', hex: '#f59e0b' },
  knee: { chip: 'bg-sky-500/15 text-sky-700 dark:text-sky-300', dot: 'bg-sky-500', hex: '#0ea5e9' },
  wrist: { chip: 'bg-violet-500/15 text-violet-700 dark:text-violet-300', dot: 'bg-violet-500', hex: '#8b5cf6' },
  fingers: { chip: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300', dot: 'bg-emerald-500', hex: '#10b981' },
  strength: { chip: 'bg-rose-500/15 text-rose-700 dark:text-rose-300', dot: 'bg-rose-500', hex: '#f43f5e' },
  cardio: { chip: 'bg-orange-500/15 text-orange-700 dark:text-orange-300', dot: 'bg-orange-500', hex: '#fb923c' },
  body: { chip: 'bg-slate-500/15 text-slate-700 dark:text-slate-300', dot: 'bg-slate-500', hex: '#64748b' },
}

export function programColor(id: ProgramId) {
  return PROGRAM_COLORS[id] ?? PROGRAM_COLORS.body
}
