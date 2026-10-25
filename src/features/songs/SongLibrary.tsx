import { useEffect, useState } from 'react'
import type { Song } from '../../shared/lib/types'
import { ResourceView } from '../../shared/components/ResourceView'
import { ResourceTable, type Column } from '../../shared/components/ResourceTable'
import { encodeResource } from '../../shared/lib/resourceDrag'
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
 * Edit Song and Delete. The side panel lists All Songs, with a Settings
 * button at the bottom that opens the same New, Edit and Delete menu.
 * Rows can be dragged onto the schedule. Song storage moves to SQLite;
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
  focus,
}: {
  /** A song the schedule picked: highlighted and scrolled to here. A new `nonce` is a new request. */
  focus?: { id: string; nonce: number } | null
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
  const [scrollKey, setScrollKey] = useState<string | null>(null)
  useEffect(() => {
    if (!focus) return
    setPickedId(focus.id)
    setScrollKey(focus.id)
    // Only a new request.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focus?.nonce])
  const [onlineOpen, setOnlineOpen] = useState(false)

  // Esc closes the online lyrics search.
  useEffect(() => {
    if (!onlineOpen) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOnlineOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onlineOpen])
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

  const [field, setField] = useState('Title')
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
      searchFields={['Title', 'Author', 'Lyrics', 'Any Field']}
      searchField={field}
      onSearchField={setField}
      sourcesTitle="Songs"
      sources={['All Songs']}
      footer={`${visible.length} of ${songs.length} ${songs.length === 1 ? 'song' : 'songs'}`}
      sideFooter={
        <div className="relative flex w-full justify-end">
          <button
            type="button"
            onClick={() => setGearOpen((open) => !open)}
            title="Settings"
            aria-label="Settings"
            aria-haspopup="menu"
            aria-expanded={gearOpen}
            className={`flex h-8 w-8 items-center justify-center rounded-md text-slate-700 dark:text-slate-200 ${
              gearOpen
                ? 'bg-slate-300 dark:bg-slate-700'
                : 'hover:bg-slate-300 dark:hover:bg-slate-700'
            }`}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true">
              <g fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.5">
                <circle cx="12" cy="12" r="3" />
                <path d="M13.7654 2.15224C13.3978 2 12.9319 2 12 2C11.0681 2 10.6022 2 10.2346 2.15224C9.74457 2.35523 9.35522 2.74458 9.15223 3.23463C9.05957 3.45834 9.0233 3.7185 9.00911 4.09799C8.98826 4.65568 8.70226 5.17189 8.21894 5.45093C7.73564 5.72996 7.14559 5.71954 6.65219 5.45876C6.31645 5.2813 6.07301 5.18262 5.83294 5.15102C5.30704 5.08178 4.77518 5.22429 4.35436 5.5472C4.03874 5.78938 3.80577 6.1929 3.33983 6.99993C2.87389 7.80697 2.64092 8.21048 2.58899 8.60491C2.51976 9.1308 2.66227 9.66266 2.98518 10.0835C3.13256 10.2756 3.3397 10.437 3.66119 10.639C4.1338 10.936 4.43789 11.4419 4.43786 12C4.43783 12.5581 4.13375 13.0639 3.66118 13.3608C3.33965 13.5629 3.13248 13.7244 2.98508 13.9165C2.66217 14.3373 2.51966 14.8691 2.5889 15.395C2.64082 15.7894 2.87379 16.193 3.33973 17C3.80568 17.807 4.03865 18.2106 4.35426 18.4527C4.77508 18.7756 5.30694 18.9181 5.83284 18.8489C6.07289 18.8173 6.31632 18.7186 6.65204 18.5412C7.14547 18.2804 7.73556 18.27 8.2189 18.549C8.70224 18.8281 8.98826 19.3443 9.00911 19.9021C9.02331 20.2815 9.05957 20.5417 9.15223 20.7654C9.35522 21.2554 9.74457 21.6448 10.2346 21.8478C10.6022 22 11.0681 22 12 22C12.9319 22 13.3978 22 13.7654 21.8478C14.2554 21.6448 14.6448 21.2554 14.8477 20.7654C14.9404 20.5417 14.9767 20.2815 14.9909 19.902C15.0117 19.3443 15.2977 18.8281 15.781 18.549C16.2643 18.2699 16.8544 18.2804 17.3479 18.5412C17.6836 18.7186 17.927 18.8172 18.167 18.8488C18.6929 18.9181 19.2248 18.7756 19.6456 18.4527C19.9612 18.2105 20.1942 17.807 20.6601 16.9999C21.1261 16.1929 21.3591 15.7894 21.411 15.395C21.4802 14.8691 21.3377 14.3372 21.0148 13.9164C20.8674 13.7243 20.6602 13.5628 20.3387 13.3608C19.8662 13.0639 19.5621 12.558 19.5621 11.9999C19.5621 11.4418 19.8662 10.9361 20.3387 10.6392C20.6603 10.4371 20.8675 10.2757 21.0149 10.0835C21.3378 9.66273 21.4803 9.13087 21.4111 8.60497C21.3592 8.21055 21.1262 7.80703 20.6602 7C20.1943 6.19297 19.9613 5.78945 19.6457 5.54727C19.2249 5.22436 18.693 5.08185 18.1671 5.15109C17.9271 5.18269 17.6837 5.28136 17.3479 5.4588C16.8545 5.71959 16.2644 5.73002 15.7811 5.45096C15.2977 5.17191 15.0117 4.65566 14.9909 4.09794C14.9767 3.71848 14.9404 3.45833 14.8477 3.23463C14.6448 2.74458 14.2554 2.35523 13.7654 2.15224Z" />
              </g>
            </svg>
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
                className="absolute bottom-full right-0 z-50 mb-1 w-44"
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
            scrollToKey={scrollKey}
            onSelect={(song) => {
              setPickedId(song.id)
              onOpen(song)
            }}
            onActivate={onGoLive}
            dragData={(song) => encodeResource({ kind: 'song', id: song.id })}
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
            className="fixed z-50 w-44"
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
      className={`rounded-md border border-slate-300 bg-white py-1 text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 ${className ?? ''}`}
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
