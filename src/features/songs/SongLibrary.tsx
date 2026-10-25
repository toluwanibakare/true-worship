import { useState } from 'react'
import type { Song } from '../../shared/lib/types'
import { Panel, SearchInput } from '../../shared/components/ui'

/**
 * Feature: songs.
 * Owns the song library: search, list, and opening a song into the
 * preview pane. The list is a table the way EasyWorship's resource
 * lists are: Title, Author, Source, one row per song, click a row to
 * preview it. Song storage moves to SQLite; this panel only renders
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
      <table className="mt-3 w-full border-collapse text-sm">
        <thead>
          <tr className="bg-slate-200 text-left dark:bg-slate-800">
            <th className="px-2 py-1.5 font-semibold">Title</th>
            <th className="px-2 py-1.5 font-semibold">Author</th>
            <th className="px-2 py-1.5 font-semibold">Source</th>
          </tr>
        </thead>
        <tbody>
          {visible.map((song) => (
            <tr
              key={song.id}
              onClick={() => onOpen(song)}
              className="cursor-pointer border-t border-slate-200 hover:bg-slate-200 dark:border-slate-800 dark:hover:bg-slate-800"
            >
              <td className="px-2 py-1.5 font-medium">{song.title}</td>
              <td className="px-2 py-1.5">{song.author}</td>
              <td className="px-2 py-1.5 text-slate-500">{song.source}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {visible.length === 0 && (
        <p className="px-2 py-4 text-sm text-slate-500">No songs match.</p>
      )}
    </Panel>
  )
}
