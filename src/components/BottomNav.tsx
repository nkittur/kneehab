import { NavLink } from 'react-router-dom'
import {
  ClipboardCheck,
  Dumbbell,
  LineChart,
  ListChecks,
  Settings as SettingsIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const items = [
  { to: '/', label: 'Exercises', Icon: Dumbbell },
  { to: '/programs', label: 'Programs', Icon: ListChecks },
  { to: '/tests', label: 'Tests', Icon: ClipboardCheck },
  { to: '/progress', label: 'Trends', Icon: LineChart },
  { to: '/settings', label: 'Settings', Icon: SettingsIcon },
]

export function BottomNav() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-10 border-t bg-background/95 backdrop-blur">
      <div className="mx-auto grid max-w-md grid-cols-5">
        {items.map(({ to, label, Icon }) => (
          <NavLink
            key={to}
            to={to}
            end
            className={({ isActive }) =>
              cn('flex flex-col items-center gap-1 py-3 text-xs', isActive ? 'text-foreground' : 'text-muted-foreground')
            }
          >
            <Icon className="h-5 w-5" />
            <span>{label}</span>
          </NavLink>
        ))}
      </div>
      <div className="h-[env(safe-area-inset-bottom)]" />
    </nav>
  )
}
