import { useState } from 'react'
import type { Song } from '../../shared/lib/types'
import { ResourceView } from '../../shared/components/ResourceView'

/**
 * Feature: songs.
 * Owns the song library: search, list, and opening a song into the
 * preview pane. Laid out as a resource tab: search
 * and the SONGS source list on the left, a table of Title, Author and
 * Source on the right, a count along the bottom. Click a row to
 * preview it, double-click to go live. Song storage moves to SQLite;
 * this panel only renders
 * whatever the app hands it.
 */
export function SongLibrary({
  songs,
  onOpen,
  onGoLive,
}: {
  songs: Song[]
  onOpen: (song: Song) => void
  onGoLive: (song: Song) => void
}) {
  const [query, setQuery] = useState('')
  const [pickedId, setPickedId] = useState<string | null>(null)
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
    <ResourceView
      query={query}
      onQuery={setQuery}
      placeholder="Search any field"
      sourcesTitle="Songs"
      sources={['All Songs']}
      footer={`${visible.length} of ${songs.length} ${songs.length === 1 ? 'song' : 'songs'}`}
    >
      <table className="w-full border-collapse text-sm">
        <thead className="sticky top-0 bg-slate-200 dark:bg-slate-800">
          <tr className="text-left">
            <th className="px-3 py-1.5 font-semibold">Title</th>
            <th className="px-3 py-1.5 font-semibold">Author</th>
            <th className="px-3 py-1.5 font-semibold">Source</th>
          </tr>
        </thead>
        <tbody>
          {visible.map((song) => (
            <tr
              key={song.id}
              onClick={() => {
                setPickedId(song.id)
                onOpen(song)
              }}
              onDoubleClick={() => onGoLive(song)}
              title="Double-click to go live"
              className={`cursor-pointer border-t border-slate-200 dark:border-slate-800 ${
                song.id === pickedId
                  ? 'bg-slate-300 dark:bg-slate-700'
                  : 'hover:bg-slate-200 dark:hover:bg-slate-800'
              }`}
            >
              <td className="px-3 py-1.5 font-medium">{song.title}</td>
              <td className="px-3 py-1.5">{song.author}</td>
              <td className="px-3 py-1.5 text-slate-500 dark:text-slate-400">{song.source}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {visible.length === 0 && (
        <p className="px-3 py-4 text-sm text-slate-500">No songs match.</p>
      )}
    </ResourceView>
  )
}
