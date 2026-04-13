import { db } from './db'

export async function exportJSON(): Promise<string> {
  const [dailyLogs, setCompletions, settings] = await Promise.all([
    db.dailyLogs.toArray(),
    db.setCompletions.toArray(),
    db.settings.toArray(),
  ])
  return JSON.stringify({ version: 1, exportedAt: new Date().toISOString(), dailyLogs, setCompletions, settings }, null, 2)
}

export async function downloadBackup() {
  const json = await exportJSON()
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `kneehab-backup-${new Date().toISOString().slice(0, 10)}.json`
  a.click()
  URL.revokeObjectURL(url)
}

export async function importJSON(text: string) {
  const data = JSON.parse(text)
  if (data.version !== 1) throw new Error(`Unsupported backup version: ${data.version}`)
  await db.transaction('rw', db.dailyLogs, db.setCompletions, db.settings, async () => {
    await Promise.all([db.dailyLogs.clear(), db.setCompletions.clear(), db.settings.clear()])
    if (data.dailyLogs?.length) await db.dailyLogs.bulkPut(data.dailyLogs)
    if (data.setCompletions?.length) {
      // drop existing ids to avoid collisions
      await db.setCompletions.bulkAdd(data.setCompletions.map((s: { id?: number }) => ({ ...s, id: undefined })))
    }
    if (data.settings?.length) await db.settings.bulkPut(data.settings)
  })
}
