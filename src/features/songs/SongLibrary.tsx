import { useState } from 'react'
import type { Song } from '../../shared/lib/types'
import { ResourceView } from '../../shared/components/ResourceView'
import {
  LYRICS_RIGHTS_NOTE,
  lyricsToSong,
  searchLyrics,
  type LyricResult,
} from './api'

/**
 * Feature: songs.
 * Owns the song library: search, list, and opening a song into the
 * preview pane. Laid out as a resource tab: search
 * and the SONGS source list on the left, a table of Title, Author and
 * Source on the right, a count along the bottom. Click a row to
 * preview it, double-click to go live. Song storage moves to SQLite;
 * this panel only renders
 * whatever the app hands it. The online section searches LRCLIB and
 * adds a found lyric to the library with source 'community'.
 */
export function SongLibrary({
  songs,
  onOpen,
  onGoLive,
  onAdd,
}: {
  songs: Song[]
  onOpen: (song: Song) => void
  onGoLive: (song: Song) => void
  onAdd: (song: Song) => void
}) {
  const [query, setQuery] = useState('')
  const [pickedId, setPickedId] = useState<string | null>(null)
  const [onlineQuery, setOnlineQuery] = useState('')
  const [onlineResults, setOnlineResults] = useState<LyricResult[]>([])
  const [onlineBusy, setOnlineBusy] = useState(false)
  const [onlineError, setOnlineError] = useState<string | null>(null)
  const [addedIds, setAddedIds] = useState<string[]>([])

  const lower = query.toLowerCase()
  const visible = songs.filter(
    (song) =>
      song.title.toLowerCase().includes(lower) ||
      song.author.toLowerCase().includes(lower) ||
      song.verses.some((verse) =>
        verse.lines.some((line) => line.toLowerCase().includes(lower)),
      ),
  )

  async function runOnlineSearch() {
    setOnlineBusy(true)
    setOnlineError(null)
    try {
      setOnlineResults(await searchLyrics(onlineQuery))
    } catch (err) {
      setOnlineError(
        err instanceof Error ? err.message : 'Lyrics search failed.',
      )
    } finally {
      setOnlineBusy(false)
    }
  }

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
      <div className="border-t border-slate-200 px-3 py-3 dark:border-slate-800">
        <p className="text-sm font-semibold">Search online lyrics</p>
        <p className="py-1 text-xs text-slate-500 dark:text-slate-400">
          {LYRICS_RIGHTS_NOTE}
        </p>
        <div className="flex flex-wrap items-center gap-2 py-1">
          <input
            value={onlineQuery}
            onChange={(event) => setOnlineQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') void runOnlineSearch()
            }}
            placeholder="Song title or artist"
            className="min-w-52 flex-1 rounded border border-slate-300 bg-white px-2 py-1 text-sm dark:border-slate-700 dark:bg-slate-900"
          />
          <button
            type="button"
            onClick={() => void runOnlineSearch()}
            disabled={onlineBusy}
            className="rounded bg-slate-800 px-3 py-1 text-sm text-white disabled:opacity-50 dark:bg-slate-100 dark:text-slate-900"
          >
            {onlineBusy ? 'Searching…' : 'Search'}
          </button>
        </div>
        {onlineError && (
          <p className="py-1 text-sm text-red-600 dark:text-red-400">
            {onlineError}
          </p>
        )}
        {onlineResults.map((result) => {
          const song = lyricsToSong(result)
          const added = addedIds.includes(song.id)
          return (
            <div
              key={result.id}
              className="flex items-center justify-between gap-2 border-t border-slate-200 py-2 dark:border-slate-800"
            >
              <div className="text-sm">
                <p className="font-medium">{result.title}</p>
                <p className="text-slate-500 dark:text-slate-400">
                  {result.artist}
                  {result.album ? ` · ${result.album}` : ''}
                </p>
              </div>
              <button
                type="button"
                disabled={added || song.verses.length === 0}
                onClick={() => {
                  onAdd(song)
                  setAddedIds((current) => [...current, song.id])
                }}
                className="shrink-0 rounded bg-slate-800 px-3 py-1 text-sm text-white disabled:opacity-50 dark:bg-slate-100 dark:text-slate-900"
              >
                {added ? 'Added' : 'Add to library'}
              </button>
            </div>
          )
        })}
      </div>
    </ResourceView>
  )
}
