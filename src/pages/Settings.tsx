import { useLiveQuery } from 'dexie-react-hooks'
import { useRef } from 'react'
import { toast } from 'sonner'
import { db, ensureSettings } from '@/lib/db'
import { downloadBackup, importJSON } from '@/lib/backup'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export function SettingsPage() {
  const settings = useLiveQuery(() => ensureSettings(), [])
  const fileRef = useRef<HTMLInputElement>(null)

  if (!settings) return null

  async function onImport(f: File) {
    try {
      const text = await f.text()
      await importJSON(text)
      toast.success('Imported backup')
    } catch (e) {
      toast.error('Import failed: ' + (e as Error).message)
    }
  }

  async function resetProgram() {
    if (!confirm('Reset program start date to today?')) return
    await db.settings.put({ ...settings!, programStartDate: new Date().toISOString().slice(0, 10) })
    toast.success('Program reset to today')
  }

  return (
    <div className="max-w-md mx-auto px-4 pt-6 pb-28 space-y-4">
      <h1 className="text-2xl font-semibold">Settings</h1>

      <Card>
        <CardContent className="p-4 space-y-3">
          <div>
            <Label className="text-xs text-muted-foreground">Program start date</Label>
            <div className="text-sm">{settings.programStartDate}</div>
          </div>
          <Button variant="outline" onClick={resetProgram}>Reset program to today</Button>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="text-sm font-medium">Backup & restore</div>
          <div className="flex gap-2">
            <Button onClick={downloadBackup}>Download JSON</Button>
            <Button variant="outline" onClick={() => fileRef.current?.click()}>Restore</Button>
            <Input
              ref={fileRef}
              type="file"
              accept="application/json"
              className="hidden"
              onChange={e => e.target.files?.[0] && onImport(e.target.files[0])}
            />
          </div>
          <p className="text-xs text-muted-foreground">Data lives on this device only. Download a backup regularly; restore replaces all local data.</p>
        </CardContent>
      </Card>
    </div>
  )
}
