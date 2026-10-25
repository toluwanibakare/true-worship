import type { Song } from '../../shared/lib/types'
import { Panel } from '../../shared/components/ui'

/**
 * Feature: songbook.
 * Owns the community songbook: shared lyrics that churches improve
 * together and that sync to everyone. Edits are versioned, reviewed, and
 * credited; copyrighted lyrics need permission or a CCLI licence and are
 * never bundled silently. The sync service lands in Phase 3; this panel
 * is where that UI will live.
 */
export function SongbookPanel({ songs }: { songs: Song[] }) {
  return (
    <Panel title="Community Songbook" className="h-full">
      <p className="text-sm text-slate-400">
        Shared songs, kept correct by the churches that sing them. Edit a
        lyric and the fix syncs to everyone, with full version history so
        any bad edit rolls back in one click.
      </p>
      <ul className="mt-3 space-y-1">
        {songs.map((song) => (
          <li
            key={song.id}
            className="rounded-md px-2 py-2 text-sm text-slate-200 hover:bg-slate-800"
          >
            <span className="block font-medium">{song.title}</span>
            <span className="text-xs text-slate-400">
              {song.author} · shared · {song.source}
            </span>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-xs text-slate-500">
        Sync status: local only for now. The sync service arrives in Phase 3.
      </p>
    </Panel>
  )
}
