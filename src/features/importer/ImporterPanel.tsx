import { useState } from 'react'
import { Button, Panel } from '../../shared/components/ui'

/**
 * Feature: importer.
 * Owns moving churches off EasyWorship and other tools. EasyWorship
 * schedule files (.ews) are ZIP archives, and its song library lives in
 * Songs.db plus SongWords.dat; OpenLP's open source EasyWorship importer
 * is the documented reference for both formats. Parsing lands here, one
 * format at a time, and never touches EasyWorship's own code.
 */
export function ImporterPanel() {
  const [note, setNote] = useState<string | null>(null)

  return (
    <Panel title="Import" className="h-full">
      <p className="text-sm text-slate-400">
        Bring a whole Sunday over from EasyWorship, OpenSong or OpenLP.
        Pick a file and True Worship reads your songs and schedules into
        its own library.
      </p>
      <div className="mt-3 space-y-2">
        <label className="block text-sm text-slate-300">
          EasyWorship schedule (.ews)
          <input
            type="file"
            accept=".ews"
            className="mt-1 block w-full text-sm text-slate-400"
            onChange={() =>
              setNote('.ews parsing arrives with the importer milestone.')
            }
          />
        </label>
        <label className="block text-sm text-slate-300">
          EasyWorship song database (Songs.db)
          <input
            type="file"
            accept=".db"
            className="mt-1 block w-full text-sm text-slate-400"
            onChange={() =>
              setNote('Songs.db parsing arrives with the importer milestone.')
            }
          />
        </label>
      </div>
      {note && <p className="mt-3 text-sm text-amber-400">{note}</p>}
      <div className="mt-3">
        <Button onClick={() => setNote('Import checklist: songs, last Sunday’s schedule, fonts, backgrounds, test run.')}>
          Show transition checklist
        </Button>
      </div>
    </Panel>
  )
}
