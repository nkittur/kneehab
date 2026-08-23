import { useLiveQuery } from 'dexie-react-hooks'
import { useRef } from 'react'
import { toast } from 'sonner'
import { db, getSettings, todayISO, type Settings } from '@/lib/db'
import { copyExportToClipboard, downloadBackup, importJSON } from '@/lib/backup'
import { allEquipmentKeys, equipmentLabel } from '@/lib/equipment'
import { APP_NAME } from '@/lib/brand'
import type { WorkoutSize } from '@/programs/types'
import { WorkoutSizeControl } from '@/components/WorkoutSizeControl'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

function SettingsCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card className="gap-0 py-0">
      <CardContent className="space-y-3 p-4">
        <div className="text-sm font-medium">{title}</div>
        {children}
      </CardContent>
    </Card>
  )
}

export function SettingsPage() {
  const settings = useLiveQuery(() => getSettings(), [])
  const fileRef = useRef<HTMLInputElement>(null)

  if (!settings) return null

  async function patch(p: Partial<Settings>) {
    await db.settings.put({ ...settings!, ...p })
  }

  async function onImport(f: File) {
    try {
      await importJSON(await f.text())
      toast.success('Imported backup')
    } catch (e) {
      toast.error('Import failed: ' + (e as Error).message)
    }
  }

  async function copyExport() {
    try {
      await copyExportToClipboard()
      toast.success('Export copied — paste it into a Claude session')
    } catch {
      toast.error('Clipboard unavailable; download the JSON instead')
    }
  }

  const equipment = settings.equipment ?? []
  const sportDays = settings.sportDaysHint ?? []

  return (
    <div className="mx-auto max-w-md space-y-4 px-4 pb-28 pt-6">
      <h1 className="text-2xl font-semibold">Settings</h1>

      <SettingsCard title="Appearance">
        <div className="flex items-center justify-between">
          <Label htmlFor="dark-mode">Dark mode</Label>
          <div className="flex gap-1">
            <Button
              id="dark-mode"
              size="sm"
              variant={settings.darkMode ? 'default' : 'outline'}
              onClick={() => patch({ darkMode: true })}
            >
              On
            </Button>
            <Button
              size="sm"
              variant={settings.darkMode ? 'outline' : 'default'}
              onClick={() => patch({ darkMode: false })}
            >
              Off
            </Button>
          </div>
        </div>
      </SettingsCard>

      <SettingsCard title="Planning">
        <div className="flex items-center justify-between">
          <Label>Default workout size</Label>
          <WorkoutSizeControl
            value={(settings.defaultWorkoutSize ?? 'M') as WorkoutSize}
            onChange={s => patch({ defaultWorkoutSize: s })}
          />
        </div>
        <div>
          <Label className="text-xs text-muted-foreground">Usual sport days</Label>
          <div className="mt-1.5 flex gap-1.5">
            {WEEKDAYS.map((d, i) => {
              const on = sportDays.includes(i)
              return (
                <button
                  key={i}
                  type="button"
                  aria-pressed={on}
                  aria-label={`Weekday ${i}`}
                  onClick={() =>
                    patch({ sportDaysHint: on ? sportDays.filter(x => x !== i) : [...sportDays, i].sort() })
                  }
                  className={cn(
                    'size-9 rounded-full border text-xs font-medium transition-colors',
                    on ? 'border-primary bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-accent',
                  )}
                >
                  {d}
                </button>
              )
            })}
          </div>
          <p className="mt-1.5 text-xs text-muted-foreground">
            The planner keeps heavy lower-body work off the day before these.
          </p>
        </div>
      </SettingsCard>

      <SettingsCard title="Equipment you own">
        <div className="flex flex-wrap gap-1.5">
          {allEquipmentKeys().map(key => {
            const on = equipment.includes(key)
            return (
              <button
                key={key}
                type="button"
                aria-pressed={on}
                onClick={() =>
                  patch({ equipment: on ? equipment.filter(e => e !== key) : [...equipment, key].sort() })
                }
                className={cn(
                  'rounded-full border px-3 py-1.5 text-xs transition-colors',
                  on ? 'border-primary bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-accent',
                )}
              >
                {equipmentLabel(key)}
              </button>
            )
          })}
        </div>
      </SettingsCard>

      <SettingsCard title="Program start date">
        <div className="text-sm">{settings.programStartDate}</div>
        <Button
          variant="outline"
          onClick={async () => {
            if (!confirm('Reset program start date to today?')) return
            await patch({ programStartDate: todayISO() })
            toast.success('Program start reset to today')
          }}
        >
          Reset to today
        </Button>
      </SettingsCard>

      <SettingsCard title="Backup & AI review">
        <div className="flex flex-wrap gap-2">
          <Button onClick={downloadBackup}>Download JSON</Button>
          <Button variant="outline" onClick={() => fileRef.current?.click()}>
            Restore
          </Button>
          <Button variant="outline" onClick={copyExport}>
            Copy AI-review export
          </Button>
          <Input
            ref={fileRef}
            type="file"
            accept="application/json"
            className="hidden"
            onChange={e => e.target.files?.[0] && onImport(e.target.files[0])}
          />
        </div>
        <p className="text-xs text-muted-foreground">
          {APP_NAME} keeps everything on this device. Download a backup regularly; restore replaces all
          local data. The AI-review export is the same JSON — paste it into a Claude session in this repo
          and ask it to tune the programs (see docs/ai-review.md).
        </p>
      </SettingsCard>
    </div>
  )
}
