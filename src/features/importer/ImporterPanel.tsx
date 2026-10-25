import { useState } from 'react'
import { Button, Panel } from '../../shared/components/ui'
import type { ScheduleItem, Song } from '../../shared/lib/types'
import { downloadTworship, importFile, type ImportResult } from './index'
import wasmUrl from './sqlWasmUrl'

/**
 * Feature: importer.
 * Owns moving churches off EasyWorship and other tools, and True
 * Worship's own .tworship format. One file input takes everything:
 * .tworship, .ews/.ewsx, OpenSong/OpenLyrics .xml, plain .txt songs,
 * SQLite song databases (.db/.sqlite), and zips of song files.
 * Results land in the app library and schedule through the callbacks;
 * warnings are shown, never hidden.
 */
export function ImporterPanel({
  songs,
  schedule,
  onSongsImported,
  onScheduleImported,
}: {
  songs: Song[]
  schedule: ScheduleItem[]
  onSongsImported: (songs: Song[]) => void
  onScheduleImported: (items: ScheduleItem[]) => void
}) {
  const [results, setResults] = useState<ImportResult[]>([])
  const [busy, setBusy] = useState(false)
  const [exportTitle, setExportTitle] = useState('Sunday Service')

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return
    setBusy(true)
    const next: ImportResult[] = []
    for (const file of Array.from(files)) {
      const result = await importFile(file, { wasmUrl })
      next.push(result)
      if (result.songs.length > 0) onSongsImported(result.songs)
      if (result.schedule.length > 0) onScheduleImported(result.schedule)
    }
    setResults((current) => [...next, ...current])
    setBusy(false)
  }

  return (
    <Panel title="Import" className="h-full">
      <p className="text-sm text-slate-500 dark:text-slate-400">
        Bring a whole Sunday over from EasyWorship, OpenSong, OpenLP or
        another True Worship install. Pick files and they land in the
        library and schedule.
      </p>
      <label className="mt-3 block text-sm text-slate-700 dark:text-slate-300">
        Import files (.tworship, .ews, .ewsx, .xml, .txt, .db, .sqlite, .zip)
        <input
          type="file"
          multiple
          accept=".tworship,.ews,.ewsx,.xml,.txt,.db,.sqlite,.sqlite3,.zip"
          className="mt-1 block w-full text-sm text-slate-500 dark:text-slate-400"
          onChange={(event) => void handleFiles(event.target.files)}
        />
      </label>
      {busy && <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Reading files…</p>}
      {results.map((result) => (
        <div key={result.source} className="mt-3 rounded border border-slate-300 dark:border-slate-800 p-2">
          <p className="text-sm text-slate-800 dark:text-slate-200">
            {result.source}: {result.songs.length} song(s), {result.schedule.length}{' '}
            schedule item(s)
          </p>
          {result.warnings.map((warning) => (
            <p key={warning} className="mt-1 text-xs text-amber-400">
              {warning}
            </p>
          ))}
        </div>
      ))}

      <div className="mt-4 border-t border-slate-300 dark:border-slate-800 pt-3">
        <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">Export as .tworship</p>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          True Worship's own format: a zip with a manifest and your songs
          and schedule as JSON. Send it to another computer and import it
          there.
        </p>
        <label className="mt-2 block text-sm text-slate-700 dark:text-slate-300">
          Title
          <input
            type="text"
            value={exportTitle}
            onChange={(event) => setExportTitle(event.target.value)}
            className="mt-1 block w-full rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-1 text-sm text-slate-900 dark:text-slate-100"
          />
        </label>
        <div className="mt-2 flex flex-wrap gap-2">
          <Button
            onClick={() =>
              void downloadTworship({
                title: exportTitle,
                kind: 'schedule',
                songs,
                schedule,
              })
            }
          >
            Export this service
          </Button>
          <Button
            onClick={() =>
              void downloadTworship({ title: exportTitle, kind: 'library', songs, schedule: [] })
            }
          >
            Export song library
          </Button>
        </div>
      </div>

      <div className="mt-3">
        <Button
          onClick={() =>
            setResults((current) => [
              {
                songs: [],
                schedule: [],
                warnings: [
                  'Transition checklist: songs, last Sunday’s schedule, fonts, backgrounds, test run on the projector.',
                ],
                source: 'Checklist',
              },
              ...current,
            ])
          }
        >
          Show transition checklist
        </Button>
      </div>
    </Panel>
  )
}
