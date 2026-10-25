import { useEffect, useState } from 'react'
import { ResourceView } from '../../shared/components/ResourceView'
import { Modal } from '../../shared/components/Modal'
import {
  FALLBACK_VERSIONS,
  fetchPassage,
  fetchVersions,
  passageToSlides,
  type BibleVersion,
} from './api'

type Entry = {
  translation: string
  translationId: string
  reference: string
  text: string
  slides: string[][]
}

/**
 * Feature: bible.
 * Owns scripture lookup. Laid out as a resource tab: search and the SCRIPTURES source list on the left, a table
 * of Translation, Reference and Scripture on the right, a count along
 * the bottom. Click a row to preview it, double-click to go live.
 * Search works the way the Scriptures search does: type words and
 * every word must appear somewhere in the reference or the text, so
 * "loved world" finds the verses that contain both words. The
 * version list and passages come live from bible-api.com
 * (public-domain translations only); the bundled demo passage stays
 * as the offline fallback, and a lookup that fails leaves it
 * untouched. A looked-up passage opens one slide per verse. The +
 * button at the bottom of the side panel adds a scripture by hand:
 * translation, reference and text, kept for this session until
 * library storage arrives.
 */
export function BibleLookup({
  passages,
  onOpen,
  onGoLive,
}: {
  passages: Record<string, string>
  onOpen: (reference: string, slides: string[][]) => void
  onGoLive: (reference: string, slides: string[][]) => void
}) {
  const [entries, setEntries] = useState<Entry[]>(() =>
    Object.entries(passages).map(([reference, text]) => ({
      translation: 'King James Version',
      translationId: 'kjv',
      reference,
      text,
      slides: [[text]],
    })),
  )
  const [versions, setVersions] = useState<BibleVersion[]>(FALLBACK_VERSIONS)
  const [versionsOffline, setVersionsOffline] = useState(false)
  const [selectedId, setSelectedId] = useState('kjv')
  const [query, setQuery] = useState('')
  const [lookup, setLookup] = useState('')
  const [pickedKey, setPickedKey] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showAdd, setShowAdd] = useState(false)
  const [addTranslation, setAddTranslation] = useState('kjv')
  const [addReference, setAddReference] = useState('')
  const [addText, setAddText] = useState('')

  useEffect(() => {
    let live = true
    fetchVersions().then((list) => {
      if (!live) return
      setVersions(list)
      setVersionsOffline(list === FALLBACK_VERSIONS)
      if (!list.some((version) => version.id === 'kjv')) {
        setSelectedId(list[0].id)
      }
    })
    return () => {
      live = false
    }
  }, [])

  const selected = versions.find((version) => version.id === selectedId)
  const sources = selected
    ? [
        selected.name,
        ...versions
          .filter((version) => version.id !== selected.id)
          .map((version) => version.name),
      ]
    : []

  const words = query
    .toLowerCase()
    .split(/\s+/)
    .filter((word) => word.length > 0)
  const visible = entries.filter((entry) => {
    const haystack =
      `${entry.reference} ${entry.text} ${entry.translation}`.toLowerCase()
    return words.every((word) => haystack.includes(word))
  })

  async function runLookup() {
    setBusy(true)
    setError(null)
    try {
      const passage = await fetchPassage(lookup, selectedId)
      const entry: Entry = {
        translation: passage.translationName || selected?.name || selectedId,
        translationId: selectedId,
        reference: passage.reference,
        text: passage.text,
        slides: passageToSlides(passage),
      }
      const key = `${entry.translationId}:${entry.reference.toLowerCase()}`
      setEntries((current) => [
        entry,
        ...current.filter(
          (item) =>
            `${item.translationId}:${item.reference.toLowerCase()}` !== key,
        ),
      ])
      setPickedKey(key)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lookup failed.')
    } finally {
      setBusy(false)
    }
  }

  function addScripture() {
    const reference = addReference.trim()
    const text = addText.trim()
    if (!reference || !text) return
    const version = versions.find((item) => item.id === addTranslation)
    const entry: Entry = {
      translation: version ? version.name : addTranslation,
      translationId: version ? version.id : addTranslation,
      reference,
      text,
      slides: [[text]],
    }
    const key = `${entry.translationId}:${entry.reference.toLowerCase()}`
    setEntries((current) => [
      entry,
      ...current.filter(
        (item) =>
          `${item.translationId}:${item.reference.toLowerCase()}` !== key,
      ),
    ])
    setPickedKey(key)
    setAddReference('')
    setAddText('')
    setShowAdd(false)
  }

  return (
    <>
      <ResourceView
        query={query}
        onQuery={setQuery}
        placeholder="Search reference or words"
        sourcesTitle="Scriptures"
        sources={sources}
        footer={`${visible.length} of ${entries.length} ${entries.length === 1 ? 'reference' : 'references'}`}
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
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 px-3 py-2 dark:border-slate-800">
          <input
            value={lookup}
            onChange={(event) => setLookup(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') void runLookup()
            }}
            placeholder="Look up a reference, for example John 3:16"
            className="min-w-52 flex-1 rounded border border-slate-300 bg-white px-2 py-1 text-sm dark:border-slate-700 dark:bg-slate-900"
          />
          <select
            value={selectedId}
            onChange={(event) => setSelectedId(event.target.value)}
            aria-label="Bible version"
            className="rounded border border-slate-300 bg-white px-2 py-1 text-sm dark:border-slate-700 dark:bg-slate-900"
          >
            {versions.map((version) => (
              <option key={version.id} value={version.id}>
                {version.name}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => void runLookup()}
            disabled={busy}
            className="rounded bg-slate-800 px-3 py-1 text-sm text-white disabled:opacity-50 dark:bg-slate-100 dark:text-slate-900"
          >
            {busy ? 'Looking up…' : 'Look up'}
          </button>
        </div>
        {error && (
          <p className="px-3 py-2 text-sm text-red-600 dark:text-red-400">
            {error}
          </p>
        )}
        {versionsOffline && (
          <p className="px-3 py-2 text-sm text-slate-500">
            Version list is offline, showing KJV and WEB. Nigerian-language
            translations arrive with the downloadable Bible packs.
          </p>
        )}
        <table className="w-full border-collapse text-sm">
          <thead className="sticky top-0 bg-slate-200 dark:bg-slate-800">
            <tr className="text-left">
              <th className="px-3 py-1.5 font-semibold">Translation</th>
              <th className="px-3 py-1.5 font-semibold">Reference</th>
              <th className="px-3 py-1.5 font-semibold">Scripture</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((entry) => {
              const key = `${entry.translationId}:${entry.reference.toLowerCase()}`
              return (
                <tr
                  key={key}
                  onClick={() => {
                    setPickedKey(key)
                    onOpen(entry.reference, entry.slides)
                  }}
                  onDoubleClick={() => onGoLive(entry.reference, entry.slides)}
                  title="Double-click to go live"
                  className={`cursor-pointer border-t border-slate-200 dark:border-slate-800 ${
                    key === pickedKey
                      ? 'bg-slate-300 dark:bg-slate-700'
                      : 'hover:bg-slate-200 dark:hover:bg-slate-800'
                  }`}
                >
                  <td className="px-3 py-1.5">{entry.translation}</td>
                  <td className="px-3 py-1.5 font-medium">{entry.reference}</td>
                  <td className="px-3 py-1.5 leading-relaxed">{entry.text}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {visible.length === 0 && (
          <p className="px-3 py-4 text-sm text-slate-500">
            No passages match. Look one up above, add one with the +
            button, or check the spelling.
          </p>
        )}
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
                {versions.map((version) => (
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
    </>
  )
}
