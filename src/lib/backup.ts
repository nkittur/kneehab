import { db } from './db'
import { APP_NAME } from './brand'

/** Current export format. v1 exports (three legacy tables) still import. */
export const BACKUP_VERSION = 'durable-v2'

export type BackupFile = {
  version: string
  exportedAt: string
  dailyLogs: unknown[]
  setCompletions: unknown[]
  settings: unknown[]
  programState: unknown[]
  planItems: unknown[]
  checkIns: unknown[]
  bodyMetrics: unknown[]
}

export async function exportBackup(): Promise<BackupFile> {
  const [dailyLogs, setCompletions, settings, programState, planItems, checkIns, bodyMetrics] =
    await Promise.all([
      db.dailyLogs.toArray(),
      db.setCompletions.toArray(),
      db.settings.toArray(),
      db.programState.toArray(),
      db.planItems.toArray(),
      db.checkIns.toArray(),
      db.bodyMetrics.toArray(),
    ])
  return {
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    dailyLogs,
    setCompletions,
    settings,
    programState,
    planItems,
    checkIns,
    bodyMetrics,
  }
}

export async function exportJSON(): Promise<string> {
  return JSON.stringify(await exportBackup(), null, 2)
}

export async function downloadBackup() {
  const json = await exportJSON()
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${APP_NAME.toLowerCase()}-backup-${new Date().toISOString().slice(0, 10)}.json`
  a.click()
  URL.revokeObjectURL(url)
}

/** Copy the export to the clipboard — the input to the AI review ritual. */
export async function copyExportToClipboard(): Promise<void> {
  await navigator.clipboard.writeText(await exportJSON())
}

type Row = { id?: number }

/**
 * Replace all local data with a backup. Accepts this app's v2 exports and the
 * legacy kneehab v1 shape (`version: 1`, three tables) — v1 rows then flow
 * through the Dexie v2 upgrade path on the next open.
 */
export async function importJSON(text: string) {
  const data = JSON.parse(text) as Omit<Partial<BackupFile>, 'version'> & { version?: string | number }
  const isV1 = data.version === 1
  const isV2 = data.version === BACKUP_VERSION
  if (!isV1 && !isV2) throw new Error(`Unsupported backup version: ${String(data.version)}`)

  await db.transaction(
    'rw',
    [db.dailyLogs, db.setCompletions, db.settings, db.programState, db.planItems, db.checkIns, db.bodyMetrics],
    async () => {
      await Promise.all([
        db.dailyLogs.clear(),
        db.setCompletions.clear(),
        db.settings.clear(),
        db.programState.clear(),
        db.planItems.clear(),
        db.checkIns.clear(),
        db.bodyMetrics.clear(),
      ])

      if (data.dailyLogs?.length) await db.dailyLogs.bulkPut(data.dailyLogs as never)
      if (data.setCompletions?.length) {
        // Drop auto-increment ids so restoring twice cannot collide.
        await db.setCompletions.bulkAdd(
          (data.setCompletions as Row[]).map(s => ({ ...s, id: undefined })) as never,
        )
      }
      if (data.settings?.length) await db.settings.bulkPut(data.settings as never)

      if (isV1) return // v1 exports carry nothing else.

      if (data.programState?.length) await db.programState.bulkPut(data.programState as never)
      if (data.planItems?.length) {
        await db.planItems.bulkAdd((data.planItems as Row[]).map(p => ({ ...p, id: undefined })) as never)
      }
      if (data.checkIns?.length) {
        await db.checkIns.bulkAdd((data.checkIns as Row[]).map(c => ({ ...c, id: undefined })) as never)
      }
      if (data.bodyMetrics?.length) await db.bodyMetrics.bulkPut(data.bodyMetrics as never)
    },
  )
}
