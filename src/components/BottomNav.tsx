import { NavLink } from 'react-router-dom'
import { Home, LineChart, Settings as SettingsIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

export function BottomNav() {
  const items = [
    { to: '/', label: 'Today', Icon: Home },
    { to: '/progress', label: 'Progress', Icon: LineChart },
    { to: '/settings', label: 'Settings', Icon: SettingsIcon },
  ]
  return (
    <nav className="fixed bottom-0 inset-x-0 border-t bg-background/95 backdrop-blur z-10">
      <div className="max-w-md mx-auto grid grid-cols-3">
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
