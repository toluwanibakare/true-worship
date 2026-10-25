import { useState } from 'react'
import type { Song } from '../../shared/lib/types'
import { Panel, SearchInput } from '../../shared/components/ui'

/**
 * Feature: songs.
 * Owns the song library: search, list, and opening a song into the
 * preview pane. Song storage moves to SQLite; this panel only renders
 * whatever the app hands it.
 */
export function SongLibrary({
  songs,
  onOpen,
}: {
  songs: Song[]
  onOpen: (song: Song) => void
}) {
  const [query, setQuery] = useState('')
  const lower = query.toLowerCase()
  const visible = songs.filter(
    (song) =>
      song.title.toLowerCase().includes(lower) ||
      song.author.toLowerCase().includes(lower) ||
      song.verses.some((verse) =>
        verse.lines.some((line) => line.toLowerCase().includes(lower)),
      ),
  )

  return (
    <Panel title="Songs" className="h-full">
      <SearchInput
        value={query}
        onChange={setQuery}
        placeholder="Search title, author, or lyric..."
      />
      <ul className="mt-3 space-y-1">
        {visible.map((song) => (
          <li key={song.id}>
            <button
              type="button"
              onClick={() => onOpen(song)}
              className="w-full rounded-md px-2 py-2 text-left text-sm text-slate-800 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-800"
            >
              <span className="block font-medium">{song.title}</span>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                {song.author} · {song.source}
              </span>
            </button>
          </li>
        ))}
        {visible.length === 0 && (
          <li className="px-2 py-4 text-sm text-slate-500">No songs match.</li>
        )}
      </ul>
    </Panel>
  )
}
