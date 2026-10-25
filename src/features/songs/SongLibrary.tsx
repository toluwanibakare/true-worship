import { useState } from 'react'
import type { Song } from '../../shared/lib/types'
import { ResourceView } from '../../shared/components/ResourceView'
import { ResourceTable, type Column } from '../../shared/components/ResourceTable'
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
 * preview it, double-click to go live, right-click for New Song,
 * Edit Song and Delete. The side panel lists All Songs, with a + for
 * a new song and a gear menu at the bottom. Song storage moves to SQLite;
 * this panel only renders
 * whatever the app hands it. The online section searches LRCLIB and
 * adds a found lyric to the library with source 'community'.
 */
export function SongLibrary({
  songs,
  onOpen,
  onGoLive,
  onAdd,
  onNew,
  onEdit,
  onDelete,
}: {
  songs: Song[]
  onOpen: (song: Song) => void
  onGoLive: (song: Song) => void
  onAdd: (song: Song) => void
  onNew: () => void
  onEdit: (song: Song) => void
  onDelete: (song: Song) => void
}) {
  const [query, setQuery] = useState('')
  const [pickedId, setPickedId] = useState<string | null>(null)
  const [gearOpen, setGearOpen] = useState(false)
  const [onlineOpen, setOnlineOpen] = useState(false)
  const [menu, setMenu] = useState<{ x: number; y: number; song: Song | null } | null>(null)
  const picked = songs.find((song) => song.id === pickedId) ?? null
  const columns: Column<Song>[] = [
    { key: 'title', label: 'Title', width: '34%', value: (song) => song.title, className: 'font-medium' },
    { key: 'author', label: 'Author', width: '26%', value: (song) => song.author },
    { key: 'copyright', label: 'Copyright', width: '26%', value: (song) => song.copyright ?? '' },
    { key: 'source', label: 'Source', width: '14%', value: (song) => song.source },
  ]
  const [onlineQuery, setOnlineQuery] = useState('')
  const [onlineResults, setOnlineResults] = useState<LyricResult[]>([])
  const [onlineBusy, setOnlineBusy] = useState(false)
  const [onlineError, setOnlineError] = useState<string | null>(null)
  const [addedIds, setAddedIds] = useState<string[]>([])

  const [field, setField] = useState('Any Field')
  const lower = query.toLowerCase()
  const inTitle = (song: Song) => song.title.toLowerCase().includes(lower)
  const inAuthor = (song: Song) => song.author.toLowerCase().includes(lower)
  const inLyrics = (song: Song) =>
    song.verses.some((verse) => verse.lines.some((line) => line.toLowerCase().includes(lower)))
  const visible = songs.filter((song) =>
    field === 'Title'
      ? inTitle(song)
      : field === 'Author'
        ? inAuthor(song)
        : field === 'Lyrics'
          ? inLyrics(song)
          : inTitle(song) || inAuthor(song) || inLyrics(song),
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
      placeholder={`Search ${field}`}
      searchFields={['Any Field', 'Title', 'Author', 'Lyrics']}
      searchField={field}
      onSearchField={setField}
      sourcesTitle="Songs"
      sources={['All Songs']}
      footer={`${visible.length} of ${songs.length} ${songs.length === 1 ? 'song' : 'songs'}`}
      sideFooter={
        <div className="relative flex items-center gap-1">
          <button
            type="button"
            onClick={onNew}
            title="New song"
            aria-label="New song"
            className="rounded bg-slate-800 px-3 py-1 text-lg font-bold leading-none text-white dark:bg-slate-100 dark:text-slate-900"
          >
            +
          </button>
          <button
            type="button"
            onClick={() => setGearOpen((open) => !open)}
            title="Song actions"
            aria-label="Song actions"
            className="rounded px-2 py-1 text-base leading-none text-slate-600 hover:bg-slate-300 dark:text-slate-300 dark:hover:bg-slate-700"
          >
            ⚙ ▾
          </button>
          {gearOpen && (
            <>
              <button
                type="button"
                aria-label="Close menu"
                className="fixed inset-0 z-40 cursor-default"
                onClick={() => setGearOpen(false)}
              />
              <SongMenu
                className="absolute bottom-full right-0 z-50 mb-1"
                song={picked}
                onNew={onNew}
                onEdit={onEdit}
                onDelete={onDelete}
                close={() => setGearOpen(false)}
              />
            </>
          )}
        </div>
      }
    >
      <div className="flex h-full min-h-0 flex-col">
        <div className="min-h-0 flex-1">
          <ResourceTable
            columns={columns}
            rows={visible}
            rowKey={(song) => song.id}
            selectedKey={pickedId}
            onSelect={(song) => {
              setPickedId(song.id)
              onOpen(song)
            }}
            onActivate={onGoLive}
            onContextMenu={(song, event) => {
              event.preventDefault()
              setPickedId(song.id)
              setMenu({ x: event.clientX, y: event.clientY, song })
            }}
            empty="No songs match."
          />
        </div>
        <div className="shrink-0 border-t border-slate-200 dark:border-slate-800">
          <button
            type="button"
            aria-expanded={onlineOpen}
            onClick={() => setOnlineOpen((open) => !open)}
            className="flex w-full items-center gap-1.5 px-3 py-1 text-left text-xs font-semibold text-slate-600 hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            <span className="w-2 text-[9px]">{onlineOpen ? '▾' : '▸'}</span>
            Search online lyrics
          </button>
          {onlineOpen && (
        <div className="max-h-56 overflow-auto px-3 pb-3">
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
          )}
        </div>
      </div>
      {menu && (
        <>
          <button
            type="button"
            aria-label="Close menu"
            className="fixed inset-0 z-40 cursor-default"
            onClick={() => setMenu(null)}
            onContextMenu={(event) => {
              event.preventDefault()
              setMenu(null)
            }}
          />
          <SongMenu
            className="fixed z-50"
            style={{ left: menu.x, top: menu.y }}
            song={menu.song}
            onNew={onNew}
            onEdit={onEdit}
            onDelete={onDelete}
            close={() => setMenu(null)}
          />
        </>
      )}
    </ResourceView>
  )
}

/** The New Song / Edit Song / Delete menu, from the right-click and the gear. */
function SongMenu({
  song,
  onNew,
  onEdit,
  onDelete,
  close,
  className,
  style,
}: {
  song: Song | null
  onNew: () => void
  onEdit: (song: Song) => void
  onDelete: (song: Song) => void
  close: () => void
  className?: string
  style?: React.CSSProperties
}) {
  const item =
    'block w-full px-3 py-1.5 text-left text-sm hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent dark:hover:bg-slate-800'
  const run = (action: () => void) => () => {
    close()
    action()
  }
  return (
    <div
      style={style}
      className={`w-44 rounded-md border border-slate-300 bg-white py-1 text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 ${className ?? ''}`}
    >
      <button type="button" className={item} onClick={run(onNew)}>
        New Song…
      </button>
      <button type="button" className={item} disabled={!song} onClick={run(() => song && onEdit(song))}>
        Edit Song…
      </button>
      <button type="button" className={item} disabled={!song} onClick={run(() => song && onDelete(song))}>
        Delete
      </button>
    </div>
  )
}
