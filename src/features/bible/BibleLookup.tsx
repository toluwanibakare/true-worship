import { useEffect, useMemo, useState } from 'react'
import { ResourceView } from '../../shared/components/ResourceView'
import { ResourceTable, type Column } from '../../shared/components/ResourceTable'
import { Modal } from '../../shared/components/Modal'
import { FALLBACK_VERSIONS, fetchPassage, fetchVersions, type BibleVersion } from './api'
import {
  BOOK_ORDER,
  PACKS,
  bookKey,
  downloadPack,
  listPackIds,
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
}

const INSTALLED_KEY = 'tw-bible-versions'
const MORE_AVAILABLE = 'More Available…'

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

const abbrOf = (id: string) => PACKS.find((pack) => pack.id === id)?.abbr ?? id.toUpperCase()

function makeRow(translationId: string, reference: string, text: string, order: number): Row {
  return {
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

/** "John 3", "John 3:16" or "1 Cor 13:4-7": a book, a chapter, maybe verses. */
function parseReference(text: string) {
  const match = /^((?:[1-3]\s*)?[a-z][a-z .]*?)\s*(\d+)(?::(\d+)(?:\s*-\s*(\d+))?)?$/i.exec(text.trim())
  if (!match) return null
  return {
    book: match[1].trim(),
    chapter: Number(match[2]),
    from: match[3] ? Number(match[3]) : null,
    to: match[4] ? Number(match[4]) : null,
  }
}

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
}: {
  passages: Record<string, string>
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
  const [query, setQuery] = useState('')
  const [field, setField] = useState('Any Field')
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
        setPackBooks(stored.books)
        setPackRows(
          stored.rows.map(([book, chapter, verse, text]) =>
            makeRow(
              stored.id,
              `${stored.books[book]} ${chapter}:${verse}`,
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
  const words = query.toLowerCase().split(/\s+/).filter(Boolean)
  const visible = useMemo(() => {
    if (words.length === 0) return allRows
    return allRows.filter((row) => {
      const haystack =
        field === 'Reference'
          ? row.reference.toLowerCase()
          : field === 'Scripture'
            ? row.text.toLowerCase()
            : row.hay
      return words.every((word) => haystack.includes(word))
    })
    // `words` follows from `query`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allRows, query, field])

  const select = (row: Row) => {
    setPickedKey(row.key)
    onOpen(row.reference, [[row.text]], abbrOf(row.translationId))
  }

  /** Jump to a reference in a downloaded Bible, without going online. */
  function jumpInPack(reference: NonNullable<ReturnType<typeof parseReference>>) {
    const wanted = bookKey(reference.book)
    const bookIndex = wanted.length < 2 ? -1 : packBooks.findIndex((book) => bookKey(book).startsWith(wanted))
    if (bookIndex < 0) {
      setError(`${selected.name} has no book called "${reference.book}".`)
      return
    }
    const base = bookIndex * 1e6 + reference.chapter * 1e3
    const low = base + (reference.from ?? 0)
    const high = base + (reference.to ?? reference.from ?? 999)
    const found = (packRows ?? []).filter((row) => row.order >= low && row.order <= high)
    if (found.length === 0) {
      setError(`${packBooks[bookIndex]} ${reference.chapter}${reference.from ? `:${reference.from}` : ''} is not in ${selected.name}.`)
      return
    }
    setError(null)
    setQuery('')
    setPickedKey(found[0].key)
    setScrollKey(found[0].key)
    // A chapter alone jumps to its first verse; verses are shown together.
    const shown = reference.from === null ? found.slice(0, 1) : found
    onOpen(
      shown.length > 1
        ? `${packBooks[bookIndex]} ${reference.chapter}:${reference.from}-${shown[shown.length - 1].reference.split(':')[1]}`
        : shown[0].reference,
      shown.map((row) => [row.text]),
      abbrOf(selected.id),
    )
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
      // The reference has done its job; clear the box so the new rows show.
      setQuery('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lookup failed.')
    } finally {
      setBusy(false)
    }
  }

  function submitSearch() {
    const reference = parseReference(query)
    if (!reference) return
    if (isPacked && packRows) jumpInPack(reference)
    else void lookupOnline(query)
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
        searchFields={['Any Field', 'Reference', 'Scripture']}
        searchField={field}
        onSearchField={setField}
        onSearchSubmit={submitSearch}
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
            setQuery('')
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
              onActivate={(row) => onGoLive(row.reference, [[row.text]], abbrOf(row.translationId))}
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
