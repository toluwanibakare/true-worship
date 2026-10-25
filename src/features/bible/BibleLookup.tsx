import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { ResourceView } from '../../shared/components/ResourceView'
import { ResourceTable, type Column } from '../../shared/components/ResourceTable'
import { Modal } from '../../shared/components/Modal'
import { FALLBACK_VERSIONS, fetchPassage, fetchVersions, type BibleVersion } from './api'
import {
  BOOK_ORDER,
  PACKS,
  bookKey,
  displayBook,
  downloadPack,
  listPackIds,
  matchesBook,
  readPack,
  savePack,
  type PackInfo,
} from './packs'

/** A version the user has added to the side panel. */
type Installed = { id: string; name: string }

/** One verse in the table. */
type Row = {
  key: string
  translationId: string
  reference: string
  text: string
  /** Lower-case reference and text, for searching. */
  hay: string
  /** Canonical position: book, chapter and verse folded into one number. */
  order: number
  /** The book, reduced to letters and digits for matching ("1john"). */
  book: string
  chapter: number
  verse: number
}

const INSTALLED_KEY = 'tw-bible-versions'
const MORE_AVAILABLE = 'More Available…'
const POSITION_KEY = 'tw-bible-position'

/** Where the search box opens: the last verse selected, or the very beginning. */
function loadPosition(): string {
  try {
    return localStorage.getItem(POSITION_KEY) || 'Genesis 1:1'
  } catch {
    return 'Genesis 1:1'
  }
}

/** KJV is in the side panel to begin with; every other version is added by the user. */
const DEFAULT_INSTALLED: Installed[] = [{ id: 'kjv', name: 'King James Version' }]

function loadInstalled(): Installed[] {
  try {
    const raw = JSON.parse(localStorage.getItem(INSTALLED_KEY) ?? 'null')
    if (
      Array.isArray(raw) &&
      raw.length > 0 &&
      raw.every((item) => typeof item?.id === 'string' && typeof item?.name === 'string')
    ) {
      return raw
    }
  } catch {
    // Unreadable storage: fall back to the default.
  }
  return DEFAULT_INSTALLED
}

/** "John 3:16" into the Book, Chapter and Verse fields. */
function splitReference(reference: string) {
  const parts = /^(.*)\s+(\d+):(\d+)$/.exec(reference.trim())
  return parts
    ? { book: parts[1], chapter: parts[2], verse: parts[3] }
    : { book: reference.trim() || 'Genesis', chapter: '1', verse: '1' }
}

const abbrOf = (id: string) => PACKS.find((pack) => pack.id === id)?.abbr ?? id.toUpperCase()

function makeRow(translationId: string, reference: string, text: string, order: number): Row {
  const parts = /^(.*)\s+(\d+):(\d+)$/.exec(reference)
  return {
    book: parts ? bookKey(parts[1]) : '',
    chapter: parts ? Number(parts[2]) : 0,
    verse: parts ? Number(parts[3]) : 0,
    key: `${translationId}:${reference.toLowerCase()}`,
    translationId,
    reference,
    text,
    hay: `${reference} ${text}`.toLowerCase(),
    order,
  }
}

/** Where a verse sits in the Bible, from its reference, when the book is a standard one. */
function orderOfReference(reference: string): number {
  const match = /^(.*?)\s+(\d+):(\d+)/.exec(reference)
  if (!match) return 0
  const wanted = bookKey(match[1])
  const index = BOOK_ORDER.findIndex((book) => bookKey(book) === wanted)
  return index < 0 ? 0 : index * 1e6 + Number(match[2]) * 1e3 + Number(match[3])
}

/**
 * A book, chapter and verse as people type them: "john 3 16", "jn3:16",
 * "1 cor 13 4-7", "gen", "psalm 23". The book is a prefix ("joh" finds
 * John and 1 John); the chapter and verses are optional.
 */
function parseReference(text: string) {
  const match =
    /^((?:[1-3]\s*)?[a-z][a-z .]*?)(?:\s*(\d+)(?:\s*[:.,\s]\s*(\d+)(?:\s*-\s*(\d+))?)?)?$/i.exec(text.trim())
  if (!match) return null
  return {
    book: match[1].trim(),
    chapter: match[2] ? Number(match[2]) : null,
    from: match[3] ? Number(match[3]) : null,
    to: match[4] ? Number(match[4]) : null,
  }
}

const BCV = 'Book Chapter Verse'

type Download = { id: string; progress: number | null; error: string | null }

/**
 * Feature: bible.
 * Owns scripture lookup. Laid out as a resource tab: a search box with
 * a field menu (Any Field, Reference, Scripture) over the SCRIPTURES
 * list of the versions the user has added (KJV to begin with) and
 * "More Available…" on the left; a table with a row per verse
 * (Translation, Reference, Scripture) on the right, a count along the
 * bottom.
 *
 * A version with its full text downloaded lists every verse and
 * searches them all, offline. "More Available…" offers the public-domain
 * Bibles to download (see packs.ts); only the versions the user picks are
 * fetched. A version without a download shows the verses looked up from
 * bible-api.com or added by hand. Typing words filters the rows; typing
 * a reference such as John 3:16 and pressing Enter jumps to it.
 */
export function BibleLookup({
  passages,
  onOpen,
  onGoLive,
  registerStepper,
  registerSelection,
}: {
  passages: Record<string, string>
  /**
   * Hands the app a function that puts the previous (-1) or next (1) verse
   * live, after a verse from this table went live. It returns false when
   * there is no live verse here to step from. The app calls it from the
   * Up and Down arrow keys.
   */
  registerStepper: (step: ((direction: -1 | 1) => boolean) | null) => void
  /**
   * Hands the app a function that reads the verse highlighted in the table (or
   * the verses an Enter just previewed), for the "+" and play buttons.
   */
  registerSelection: (
    read: (() => { reference: string; slides: string[][]; version: string } | null) | null,
  ) => void
  /** `version` is the short name, for example KJV, shown under the verse. */
  onOpen: (reference: string, slides: string[][], version: string) => void
  onGoLive: (reference: string, slides: string[][], version: string) => void
}) {
  // Verses looked up online or added by hand, for versions without a download.
  const [entries, setEntries] = useState<Row[]>(() =>
    Object.entries(passages).map(([reference, text]) =>
      makeRow('kjv', reference, text, orderOfReference(reference)),
    ),
  )
  const [installed, setInstalled] = useState<Installed[]>(loadInstalled)
  const [selectedId, setSelectedId] = useState(() => loadInstalled()[0].id)
  const [packedIds, setPackedIds] = useState<string[]>([])
  const [packRows, setPackRows] = useState<Row[] | null>(null)
  const [packBooks, setPackBooks] = useState<string[]>([])
  const [packLoading, setPackLoading] = useState(false)
  const [download, setDownload] = useState<Download | null>(null)
  const [showMore, setShowMore] = useState(false)
  const [catalogue, setCatalogue] = useState<BibleVersion[] | null>(null)
  // Text search (Scripture, Any Field).
  const [query, setQuery] = useState('')
  // Book, Chapter and Verse: three fields; they open on the last verse used.
  const [book, setBook] = useState(() => splitReference(loadPosition()).book)
  const [chapter, setChapter] = useState(() => splitReference(loadPosition()).chapter)
  const [verse, setVerse] = useState(() => splitReference(loadPosition()).verse)
  const setFields = (reference: string) => {
    const parts = splitReference(reference)
    setBook(parts.book)
    setChapter(parts.chapter)
    setVerse(parts.verse)
  }
  /** The three fields as one reference, empty chapter and verse counting as 1. */
  const bcvQuery = `${book.trim()} ${chapter || '1'}:${verse || '1'}`
  const [field, setField] = useState(BCV)
  const [pickedKey, setPickedKey] = useState<string | null>(null)
  const [scrollKey, setScrollKey] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showAdd, setShowAdd] = useState(false)
  const [addTranslation, setAddTranslation] = useState('kjv')
  const [addReference, setAddReference] = useState('')
  const [addText, setAddText] = useState('')

  const selected = installed.find((version) => version.id === selectedId) ?? installed[0]
  const selectedPack = PACKS.find((pack) => pack.id === selected.id)
  const isPacked = packedIds.includes(selected.id)

  useEffect(() => {
    try {
      localStorage.setItem(INSTALLED_KEY, JSON.stringify(installed))
    } catch {
      // Storage unavailable: the list just resets next launch.
    }
  }, [installed])

  // Which versions already have their full text on this computer.
  useEffect(() => {
    listPackIds()
      .then((ids) => setPackedIds(ids.map(String)))
      .catch(() => setPackedIds([]))
  }, [])

  // Load the chosen version's verses when it has a download.
  useEffect(() => {
    setPackRows(null)
    setPackBooks([])
    if (!isPacked) return
    let current = true
    setPackLoading(true)
    readPack(selected.id)
      .then((stored) => {
        if (!current || !stored) return
        setPackBooks(stored.books.map(displayBook))
        setPackRows(
          stored.rows.map(([book, chapter, verse, text]) =>
            makeRow(
              stored.id,
              `${displayBook(stored.books[book])} ${chapter}:${verse}`,
              text,
              book * 1e6 + chapter * 1e3 + verse,
            ),
          ),
        )
      })
      .catch(() => current && setError('Could not read the downloaded Bible from storage.'))
      .finally(() => current && setPackLoading(false))
    return () => {
      current = false
    }
  }, [selected.id, isPacked])

  // The catalogue of online-only versions is fetched only when "More Available…" opens.
  useEffect(() => {
    if (!showMore || catalogue) return
    let live = true
    fetchVersions().then((list) => {
      if (live) setCatalogue(list)
    })
    return () => {
      live = false
    }
  }, [showMore, catalogue])

  const allRows = useMemo(
    () => packRows ?? entries.filter((entry) => entry.translationId === selected.id),
    [packRows, entries, selected.id],
  )
  /** True when the typed text names a book that is in these rows: a place to go to, not words to find. */
  function isReferenceIn(rows: Row[], text: string) {
    const reference = parseReference(text)
    const wanted = reference ? bookKey(reference.book) : ''
    return Boolean(reference && wanted && rows.some((row) => matchesBook(row.book, wanted)))
  }

  /** The first verse a reference points at: the start of the book, chapter or verse typed. */
  function firstVerseOf(rows: Row[], text: string): Row | undefined {
    const reference = parseReference(text)
    if (!reference) return undefined
    const wanted = bookKey(reference.book)
    return rows.find(
      (row) =>
        matchesBook(row.book, wanted) &&
        (reference.chapter === null || row.chapter === reference.chapter) &&
        (reference.from === null || row.verse >= reference.from),
    )
  }

  // In Book Chapter Verse the box is a place to go to, not words to find; but
  // if the Book field holds something that is not a book ("love"), those words
  // search the text instead.
  const searchText = field === BCV ? book : query
  const words = searchText.toLowerCase().split(/\s+/).filter(Boolean)
  const visible = useMemo(() => {
    if (words.length === 0) return allRows
    if (field === BCV && isReferenceIn(allRows, bcvQuery)) return allRows
    return allRows.filter((row) => {
      const haystack =
        field === 'Scripture'
            ? row.text.toLowerCase()
            : row.hay
      return words.every((word) => haystack.includes(word))
    })
    // `words` follows from `query`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allRows, query, book, bcvQuery, field])

  // The verse from this table that is on the screen, if any.
  const liveKey = useRef<string | null>(null)
  // Every verse of the chosen version in Bible order, for stepping.
  const inBibleOrder = useMemo(
    () => [...allRows].sort((a, b) => a.order - b.order),
    [allRows],
  )

  // What the last Enter previewed, so a second Enter on the same verse goes live.
  const enterPreview = useRef<{ key: string; label: string; slides: string[][]; version: string } | null>(null)

  const goLiveRow = (row: Row) => {
    liveKey.current = row.key
    onGoLive(row.reference, [[row.text]], abbrOf(row.translationId))
  }

  const stepLiveVerse = (direction: -1 | 1) => {
    if (!liveKey.current) return false
    const at = inBibleOrder.findIndex((row) => row.key === liveKey.current)
    if (at < 0) return false
    const next = inBibleOrder[at + direction]
    // Past the first or last verse there is nowhere to go; the key is still ours.
    if (!next) return true
    setPickedKey(next.key)
    setScrollKey(next.key)
    goLiveRow(next)
    return true
  }
  // Re-registered every render so the app always calls the current version.
  useEffect(() => {
    registerStepper(stepLiveVerse)
    return () => registerStepper(null)
  })
  useEffect(() => {
    registerSelection(() => {
      const previewed = enterPreview.current
      if (previewed && previewed.key === pickedKey) {
        return { reference: previewed.label, slides: previewed.slides, version: previewed.version }
      }
      const row = allRows.find((entry) => entry.key === pickedKey)
      return row
        ? { reference: row.reference, slides: [[row.text]], version: abbrOf(row.translationId) }
        : null
    })
    return () => registerSelection(null)
  })

  // Book, chapter, verse: the table shows the whole Bible and the box takes it
  // to what was typed, highlighting the first verse there. It opens on the last
  // verse used (Genesis 1:1 the first time).
  useEffect(() => {
    if (field !== BCV) return
    const target = firstVerseOf(allRows, bcvQuery)
    if (target) {
      setPickedKey(target.key)
      setScrollKey(target.key)
      remember(target.reference)
    }
    // firstVerseOf and remember only read their arguments.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bcvQuery, field, allRows])

  const remember = (reference: string) => {
    try {
      localStorage.setItem(POSITION_KEY, reference)
    } catch {
      // Storage unavailable: the box opens on Genesis 1:1 next time.
    }
  }

  const select = (row: Row) => {
    // Picking a verse puts its reference in the box, so the box shows where you are.
    if (field === BCV) {
      setFields(row.reference)
      remember(row.reference)
    }
    setPickedKey(row.key)
    onOpen(row.reference, [[row.text]], abbrOf(row.translationId))
  }

  /** Jump to a reference in a downloaded Bible, without going online. */
  function jumpInPack(reference: NonNullable<ReturnType<typeof parseReference>>) {
    const wanted = bookKey(reference.book)
    const bookIndex = wanted.length < 2 ? -1 : packBooks.findIndex((book) => matchesBook(bookKey(book), wanted))
    if (bookIndex < 0) {
      setError(`${selected.name} has no book called "${reference.book}".`)
      return
    }
    const chapter = reference.chapter ?? 1
    const base = bookIndex * 1e6 + chapter * 1e3
    const low = base + (reference.from ?? 0)
    const high = base + (reference.to ?? reference.from ?? 999)
    const found = (packRows ?? []).filter((row) => row.order >= low && row.order <= high)
    if (found.length === 0) {
      setError(`${packBooks[bookIndex]} ${chapter}${reference.from ? `:${reference.from}` : ''} is not in ${selected.name}.`)
      return
    }
    setError(null)
    setFields(found[0].reference)
    remember(found[0].reference)
    setPickedKey(found[0].key)
    setScrollKey(found[0].key)
    // A chapter alone jumps to its first verse; verses are shown together.
    const shown = reference.from === null ? found.slice(0, 1) : found
    const label =
      shown.length > 1
        ? `${packBooks[bookIndex]} ${chapter}:${reference.from}-${shown[shown.length - 1].reference.split(':')[1]}`
        : shown[0].reference
    const slides = shown.map((row) => [row.text])
    onOpen(label, slides, abbrOf(selected.id))
    enterPreview.current = { key: found[0].key, label, slides, version: abbrOf(selected.id) }
  }

  async function lookupOnline(reference: string) {
    setBusy(true)
    setError(null)
    try {
      const passage = await fetchPassage(reference, selected.id)
      const rows = passage.verses.map((verse) =>
        makeRow(
          selected.id,
          `${verse.book} ${verse.chapter}:${verse.verse}`,
          verse.text.trim(),
          orderOfReference(`${verse.book} ${verse.chapter}:${verse.verse}`),
        ),
      )
      if (rows.length === 0) throw new Error('No verses came back for that reference.')
      setEntries((current) => [
        ...rows,
        ...current.filter((item) => !rows.some((row) => row.key === item.key)),
      ])
      setPickedKey(rows[0].key)
      setScrollKey(rows[0].key)
      // The fields show the verse the lookup landed on.
      setFields(rows[0].reference)
      remember(rows[0].reference)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lookup failed.')
    } finally {
      setBusy(false)
    }
  }

  // Enter once previews the verse; Enter again, with nothing changed, puts it live.
  function submitSearch() {
    if (field !== BCV) return
    const reference = parseReference(bcvQuery)
    if (!reference) return
    const target = firstVerseOf(allRows, bcvQuery)
    const previewed = enterPreview.current
    if (previewed && target && previewed.key === target.key) {
      liveKey.current = previewed.key
      onGoLive(previewed.label, previewed.slides, previewed.version)
      enterPreview.current = null
      return
    }
    if (isPacked && packRows) jumpInPack(reference)
    else void lookupOnline(bcvQuery)
  }

  /** The full name of the book a typed start belongs to, for completing as you type. */
  const completeBook = (typed: string): string | null => {
    const names = packBooks.length > 0 ? packBooks : BOOK_ORDER
    const lower = typed.toLowerCase()
    return names.find((name) => name.toLowerCase().startsWith(lower)) ?? null
  }

  /** On leaving Book, a typed "joh" becomes the full name of the book it found. */
  function finishBook() {
    const wanted = bookKey(book)
    const names = packBooks.length > 0 ? packBooks : BOOK_ORDER
    const found = names.find((name) => matchesBook(bookKey(name), wanted))
    if (wanted && found) setBook(found)
  }

  async function downloadVersion(pack: PackInfo) {
    setDownload({ id: pack.id, progress: 0, error: null })
    try {
      const stored = await downloadPack(pack, (progress) =>
        setDownload((current) => (current?.id === pack.id ? { ...current, progress } : current)),
      )
      await savePack(stored)
      setPackedIds((ids) => (ids.includes(pack.id) ? ids : [...ids, pack.id]))
      setInstalled((current) =>
        current.some((item) => item.id === pack.id)
          ? current
          : [...current, { id: pack.id, name: pack.name }],
      )
      setSelectedId(pack.id)
      setDownload(null)
      setShowMore(false)
    } catch (err) {
      setDownload({
        id: pack.id,
        progress: null,
        error: err instanceof Error ? err.message : 'The download failed.',
      })
    }
  }

  function addOnlineVersion(version: BibleVersion) {
    setInstalled((current) =>
      current.some((item) => item.id === version.id)
        ? current
        : [...current, { id: version.id, name: version.name }],
    )
    setSelectedId(version.id)
    setShowMore(false)
  }

  function addScripture() {
    const reference = addReference.trim()
    const text = addText.trim()
    if (!reference || !text) return
    const version = installed.find((item) => item.id === addTranslation)
    const row = makeRow(version ? version.id : addTranslation, reference, text, orderOfReference(reference))
    setEntries((current) => [row, ...current.filter((item) => item.key !== row.key)])
    setPickedKey(row.key)
    setAddReference('')
    setAddText('')
    setShowAdd(false)
  }

  const columns: Column<Row>[] = [
    { key: 'translation', label: 'Translation', width: '100px', value: (row) => abbrOf(row.translationId) },
    { key: 'reference', label: 'Reference', width: '170px', value: (row) => row.reference, sortValue: (row) => row.order, className: 'font-medium' },
    { key: 'text', label: 'Scripture', width: '1fr', value: (row) => row.text },
  ]
  const sources = [...installed.map((version) => version.name), MORE_AVAILABLE]
  const onlineOnly = (catalogue ?? []).filter((version) => !PACKS.some((pack) => pack.id === version.id))

  return (
    <>
      <ResourceView
        query={query}
        onQuery={setQuery}
        placeholder={`Search ${field}`}
        searchFields={[BCV, 'Scripture', 'Any Field']}
        searchField={field}
        onSearchField={(next) => {
          setField(next)
          setQuery('')
        }}
        onSearchSubmit={submitSearch}
        searchSlot={
          field === BCV ? (
            <ReferenceBox
              fields={[BCV, 'Scripture', 'Any Field']}
              field={field}
              onField={(next) => {
                setField(next)
                setQuery('')
              }}
              book={book}
              chapter={chapter}
              verse={verse}
              onChange={(nextBook, nextChapter, nextVerse) => {
                setBook(nextBook)
                setChapter(nextChapter)
                setVerse(nextVerse)
              }}
              onBookDone={finishBook}
              isBook={(text) => allRows.some((row) => matchesBook(row.book, bookKey(text)))}
              complete={completeBook}
              onSubmit={submitSearch}
            />
          ) : undefined
        }
        sourcesTitle="Scriptures"
        sources={sources}
        activeSource={selected.name}
        onSelectSource={(source) => {
          if (source === MORE_AVAILABLE) {
            setShowMore(true)
            return
          }
          const version = installed.find((item) => item.name === source)
          if (version) {
            setSelectedId(version.id)
            if (field !== BCV) setQuery('')
            setError(null)
          }
        }}
        footer={`${visible.length.toLocaleString()} of ${allRows.length.toLocaleString()} ${allRows.length === 1 ? 'reference' : 'references'}`}
        sideFooter={
          <button
            type="button"
            onClick={() => setShowAdd(true)}
            title="Add scripture"
            aria-label="Add scripture"
            className="rounded bg-slate-800 px-3 py-1 text-lg font-bold leading-none text-white dark:bg-slate-100 dark:text-slate-900"
          >
            +
          </button>
        }
      >
        <div className="flex h-full min-h-0 flex-col">
          {!isPacked && selectedPack && (
            <div className="flex shrink-0 flex-wrap items-center gap-3 border-b border-slate-200 px-3 py-2 text-sm dark:border-slate-800">
              <span className="text-slate-600 dark:text-slate-300">
                Only verses you look up are listed for {selected.name}. Download it to list and search every verse, offline.
              </span>
              <button
                type="button"
                disabled={download?.id === selectedPack.id && download.progress !== null}
                onClick={() => void downloadVersion(selectedPack)}
                className="rounded bg-slate-800 px-3 py-1 text-white disabled:opacity-50 dark:bg-slate-100 dark:text-slate-900"
              >
                {download?.id === selectedPack.id && download.progress !== null
                  ? `Downloading… ${Math.round(download.progress * 100)}%`
                  : 'Download all verses'}
              </button>
              {download?.id === selectedPack.id && download.error && (
                <span className="text-red-600 dark:text-red-400">{download.error}</span>
              )}
            </div>
          )}
          {packLoading && <p className="shrink-0 px-3 py-2 text-sm text-slate-500">Opening {selected.name}…</p>}
          {busy && <p className="shrink-0 px-3 py-2 text-sm text-slate-500">Looking up the passage…</p>}
          {error && <p className="shrink-0 px-3 py-2 text-sm text-red-600 dark:text-red-400">{error}</p>}
          <div className="min-h-0 flex-1">
            <ResourceTable
              columns={columns}
              rows={visible}
              rowKey={(row) => row.key}
              selectedKey={pickedKey}
              onSelect={select}
              onActivate={goLiveRow}
              scrollToKey={scrollKey}
              empty={
                isPacked
                  ? 'No verses match.'
                  : 'No verses yet. Type a reference such as John 3:16 and press Enter to look it up, or add one with the + button.'
              }
            />
          </div>
        </div>
      </ResourceView>
      {showAdd && (
        <Modal title="Add scripture" onClose={() => setShowAdd(false)}>
          <div className="flex flex-col gap-3 text-sm">
            <label className="flex flex-col gap-1">
              <span className="font-medium">Translation</span>
              <select
                value={addTranslation}
                onChange={(event) => setAddTranslation(event.target.value)}
                className="rounded border border-slate-300 bg-white px-2 py-1.5 dark:border-slate-700 dark:bg-slate-900"
              >
                {installed.map((version) => (
                  <option key={version.id} value={version.id}>
                    {version.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1">
              <span className="font-medium">Reference</span>
              <input
                value={addReference}
                onChange={(event) => setAddReference(event.target.value)}
                placeholder="For example, Psalm 23:1"
                className="rounded border border-slate-300 bg-white px-2 py-1.5 dark:border-slate-700 dark:bg-slate-900"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="font-medium">Scripture</span>
              <textarea
                value={addText}
                onChange={(event) => setAddText(event.target.value)}
                placeholder="Paste or type the passage text"
                rows={6}
                className="rounded border border-slate-300 bg-white px-2 py-1.5 dark:border-slate-700 dark:bg-slate-900"
              />
            </label>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Added scriptures live in this session and preview like any
              other row. Saving them into the library arrives with
              SQLite storage.
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowAdd(false)}
                className="rounded bg-slate-200 px-3 py-1.5 font-medium text-slate-800 dark:bg-slate-800 dark:text-slate-200"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={addScripture}
                disabled={!addReference.trim() || !addText.trim()}
                className="rounded bg-slate-800 px-3 py-1.5 text-white disabled:opacity-50 dark:bg-slate-100 dark:text-slate-900"
              >
                Add scripture
              </button>
            </div>
          </div>
        </Modal>
      )}
      {showMore && (
        <Modal title="More Available" onClose={() => setShowMore(false)}>
          <p className="mb-3 text-xs text-slate-500 dark:text-slate-400">
            Add a Bible to put it in the side panel. A full Bible is downloaded to this
            computer once, so every verse is listed and searchable offline. Only the ones
            you add are downloaded, and these are all public domain.
          </p>
          <ul className="divide-y divide-slate-200 dark:divide-slate-800">
            {PACKS.map((pack) => {
              const have = packedIds.includes(pack.id)
              const working = download?.id === pack.id && download.progress !== null
              return (
                <li key={pack.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                  <span>
                    <span className="block font-medium">{pack.name}</span>
                    <span className="block text-xs text-slate-500 dark:text-slate-400">
                      {pack.language} · Public Domain
                      {download?.id === pack.id && download.error && (
                        <span className="ml-2 text-red-600 dark:text-red-400">{download.error}</span>
                      )}
                    </span>
                  </span>
                  <button
                    type="button"
                    disabled={have || working || download !== null}
                    onClick={() => void downloadVersion(pack)}
                    className="shrink-0 rounded bg-slate-800 px-3 py-1 text-white disabled:opacity-50 dark:bg-slate-100 dark:text-slate-900"
                  >
                    {have ? 'Added' : working ? `${Math.round((download?.progress ?? 0) * 100)}%` : 'Download'}
                  </button>
                </li>
              )
            })}
          </ul>
          <h3 className="mb-1 mt-5 border-t border-slate-300 pt-4 text-sm font-semibold dark:border-slate-700">
            Online lookup only
          </h3>
          <p className="mb-2 text-xs text-slate-500 dark:text-slate-400">
            These are not downloaded. Passages are fetched from bible-api.com when you look them up.
          </p>
          {!catalogue ? (
            <p className="text-sm text-slate-500">Loading the list…</p>
          ) : catalogue === FALLBACK_VERSIONS ? (
            <p className="text-sm text-slate-500">The online list could not be reached.</p>
          ) : (
            <ul className="divide-y divide-slate-200 dark:divide-slate-800">
              {onlineOnly.map((version) => {
                const added = installed.some((item) => item.id === version.id)
                return (
                  <li key={version.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                    <span>
                      <span className="block font-medium">{version.name}</span>
                      <span className="block text-xs text-slate-500 dark:text-slate-400">
                        {version.language} · {version.license}
                      </span>
                    </span>
                    <button
                      type="button"
                      disabled={added}
                      onClick={() => addOnlineVersion(version)}
                      className="shrink-0 rounded bg-slate-800 px-3 py-1 text-white disabled:opacity-50 dark:bg-slate-100 dark:text-slate-900"
                    >
                      {added ? 'Added' : 'Add'}
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </Modal>
      )}
    </>
  )
}

/**
 * The Book Chapter Verse search: one box that reads like a reference,
 * "Genesis 1:1". Click the book, the chapter or the verse and just that
 * part is highlighted, so typing replaces it, and the table follows as you
 * type, and a book fills itself in as you type it. Right and Left (or Tab
 * and Shift+Tab) move between the three parts; in the chapter and verse, Up
 * and Down add or take one. Enter previews the verses, and Enter again,
 * with nothing changed, puts them live.
 */
function ReferenceBox({
  fields,
  field,
  onField,
  book,
  chapter,
  verse,
  onChange,
  onBookDone,
  isBook,
  complete,
  onSubmit,
}: {
  fields: string[]
  field: string
  onField: (field: string) => void
  book: string
  chapter: string
  verse: string
  onChange: (book: string, chapter: string, verse: string) => void
  onBookDone: () => void
  /** True when the text is, or starts, the name of a book of this Bible. */
  isBook: (text: string) => boolean
  /** The full book name a typed start belongs to, or null. */
  complete: (typed: string) => string | null
  onSubmit: () => void
}) {
  const input = useRef<HTMLInputElement>(null)
  const byMouse = useRef(false)
  // Where to put the caret after the next render: React resets it when it
  // rewrites the text (for example when a new chapter sends the verse back to 1).
  const caretAfter = useRef<[number, number] | null>(null)
  // Re-renders even when the text did not change (a completed book equal to the old one), so the selection below is applied.
  const [, rerender] = useState(0)
  const text = `${book} ${chapter}:${verse}`

  /** The character range of each part: Book, Chapter, Verse. */
  const ranges = (): [number, number][] => [
    [0, book.length],
    [book.length + 1, book.length + 1 + chapter.length],
    [book.length + chapter.length + 2, text.length],
  ]
  const partAt = (position: number) =>
    position <= book.length ? 0 : position <= book.length + 1 + chapter.length ? 1 : 2

  useLayoutEffect(() => {
    if (caretAfter.current !== null && input.current) {
      input.current.setSelectionRange(caretAfter.current[0], caretAfter.current[1])
      caretAfter.current = null
    }
  })

  const selectPart = (part: number) => {
    const [from, to] = ranges()[part]
    input.current?.setSelectionRange(from, to)
  }

  const typed = (raw: string, caret: number, deleting: boolean) => {
    let nextBook: string
    let nextChapter: string
    let nextVerse: string
    // One space separates the book from the chapter; any further space belongs to the book ("1 cor").
    const exact = raw.includes(':') ? /^(.*)\s(\d*):(\d*)$/.exec(raw) : null
    if (exact) {
      ;[, nextBook, nextChapter, nextVerse] = exact
    } else {
      // A whole reference typed or pasted without the colon: "john 3 16".
      const loose = parseReference(raw)
      nextBook = loose ? loose.book : raw
      nextChapter = loose?.chapter == null ? '' : String(loose.chapter)
      nextVerse = loose?.from == null ? '' : String(loose.from)
    }
    // Digits typed straight after a complete book name are the chapter: "john3".
    const trailing = /^(.*[a-z.])\s*(\d+)$/i.exec(nextBook)
    if (trailing && isBook(trailing[1])) {
      nextBook = trailing[1].trimEnd()
      nextChapter = trailing[2]
      nextVerse = '1'
    }
    const changed = nextBook !== book ? 0 : nextChapter !== chapter ? 1 : nextVerse !== verse ? 2 : -1
    const part = changed < 0 ? 0 : changed
    // A new book starts at its first verse, and a new chapter at its first
    // verse, unless the whole reference was typed in one go.
    if (part === 0 && nextChapter === chapter && nextVerse === verse) {
      nextChapter = '1'
      nextVerse = '1'
    } else if (part === 1 && nextVerse === verse) {
      nextVerse = '1'
    }
    // Typing a book: show the book it looks like, with the rest of its name
    // highlighted so the next keystroke replaces it (not while deleting).
    let selectFrom: number | null = null
    if (part === 0 && changed === 0 && !deleting && !trailing && nextBook.trim() !== '') {
      const full = complete(nextBook)
      if (full && full.toLowerCase().startsWith(nextBook.toLowerCase()) && full.length > nextBook.length) {
        selectFrom = nextBook.length
        nextBook = full
      }
    }
    const end =
      changed < 0
        ? Math.min(caret, raw.length)
        : part === 0
          ? nextBook.length
          : part === 1
            ? nextBook.length + 1 + nextChapter.length
            : nextBook.length + nextChapter.length + 2 + nextVerse.length
    caretAfter.current = selectFrom !== null ? [selectFrom, nextBook.length] : [end, end]
    onChange(nextBook, nextChapter, nextVerse)
    rerender((tick) => tick + 1)
  }

  const nudge = (part: number, delta: number) => {
    const value = Math.max(1, (Number(part === 1 ? chapter : verse) || 1) + delta)
    const nextChapter = part === 1 ? String(value) : chapter
    const nextVerse = part === 1 ? '1' : String(value)
    const end =
      part === 1
        ? book.length + 1 + nextChapter.length
        : book.length + nextChapter.length + 2 + nextVerse.length
    caretAfter.current = [end, end]
    onChange(book, nextChapter, nextVerse)
    rerender((tick) => tick + 1)
  }

  return (
    <div className="flex items-center rounded-md border border-slate-300 bg-slate-200 pl-1.5 focus-within:border-blue-500 dark:border-slate-700 dark:bg-slate-800">
      <span
        className="relative flex shrink-0 items-center gap-0.5 text-slate-500 dark:text-slate-400"
        title={`Search field: ${field}`}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
          <circle cx="11" cy="11" r="7" />
          <path d="M20 20l-4-4" />
        </svg>
        <span className="text-[8px]">▼</span>
        <select
          aria-label="Search field"
          value={field}
          onChange={(event) => onField(event.target.value)}
          className="absolute inset-0 w-full cursor-pointer opacity-0"
        >
          {fields.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>
      </span>
      <input
        ref={input}
        type="text"
        aria-label="Book, chapter and verse"
        spellCheck={false}
        autoComplete="off"
        value={text}
        onChange={(event) =>
          typed(
            event.target.value,
            event.target.selectionStart ?? event.target.value.length,
            String((event.nativeEvent as InputEvent).inputType ?? '').startsWith('delete'),
          )
        }
        onMouseDown={() => {
          byMouse.current = true
        }}
        onMouseUp={(event) => {
          byMouse.current = false
          const box = event.currentTarget
          // Dragging out a selection of your own is left alone.
          if (box.selectionStart !== box.selectionEnd) return
          selectPart(partAt(box.selectionStart ?? 0))
        }}
        onFocus={() => {
          // Tabbing in (not clicking) starts on the book.
          if (!byMouse.current) selectPart(0)
        }}
        onBlur={onBookDone}
        onKeyDown={(event) => {
          const box = event.currentTarget
          const part = partAt(box.selectionStart ?? 0)
          // A space or colon at the end of a complete book, or of the chapter, moves
          // on to the next part, so "john 3 16" can be typed straight through.
          const atPartEnd = box.selectionEnd === ranges()[part][1]
          if (
            (event.key === ' ' || event.key === ':') &&
            atPartEnd &&
            ((part === 0 && /[a-z]/i.test(book) && isBook(book)) || (part === 1 && chapter !== ''))
          ) {
            event.preventDefault()
            selectPart(part + 1)
          } else if (event.key === 'ArrowRight' && part < 2) {
            // Right goes on to the chapter, then the verse; Left comes back.
            event.preventDefault()
            selectPart(part + 1)
          } else if (event.key === 'ArrowLeft' && part > 0) {
            event.preventDefault()
            selectPart(part - 1)
          } else if (event.key === 'Enter') {
            onSubmit()
          } else if (event.key === 'Tab') {
            const next = part + (event.shiftKey ? -1 : 1)
            if (next >= 0 && next <= 2) {
              event.preventDefault()
              selectPart(next)
            }
          } else if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
            event.preventDefault()
            // Up adds one and Down takes one, like any number field.
            if (part > 0) nudge(part, event.key === 'ArrowUp' ? 1 : -1)
          }
        }}
        className="min-w-0 flex-1 bg-transparent px-1.5 py-1.5 text-sm text-slate-900 outline-none dark:text-slate-100"
      />
    </div>
  )
}
