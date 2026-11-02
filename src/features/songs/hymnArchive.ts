/**
 * Feature: songs — the downloadable public domain hymn archive.
 * (Separate from hymns.ts, the small hymn pack bundled with the app
 * and seeded into the library on first run.)
 *
 * 25,716 hymns with full verses, every one public domain: the
 * Hymnary.org public domain export (hymnal instances from 1930 or
 * earlier, via Open Christian Data) plus the Open Hymnal Project,
 * keeping only hymns its own copyright line marks public domain.
 * No CCLI or modern worship material is in the pack. The full source
 * and verification record lives in packs/README.md in this repo.
 * Hymnary.org asks users of its dataset to link to hymnary.org:
 * https://hymnary.org
 *
 * The pack ships in this repo under packs/ as nine JSON chunks. The
 * first time the hymn section is opened, the chunks are downloaded
 * once and kept on this computer (IndexedDB, database "tw-hymns"),
 * so hymn search works offline after that. A hymn only enters the
 * song library when the user adds it, with source 'public-domain'.
 */

import type { Song } from '../../shared/lib/types'

export type Hymn = {
  title: string
  author: string
  year: number | null
  verses: string[]
  chorus: string | null
}

const BASE =
  'https://raw.githubusercontent.com/toluwanibakare/true-worship/main/packs/'
const CHUNKS = 9

/** Hymns in the pack, in pack order. The index is the hymn's stable id. */
let cache: Hymn[] | null = null

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('tw-hymns', 1)
    request.onupgradeneeded = () => request.result.createObjectStore('pack')
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error ?? new Error('Could not open storage.'))
  })
}

async function readStored(): Promise<Hymn[] | null> {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const request = db.transaction('pack', 'readonly').objectStore('pack').get('all')
    request.onsuccess = () => {
      db.close()
      resolve(Array.isArray(request.result) ? (request.result as Hymn[]) : null)
    }
    request.onerror = () => {
      db.close()
      reject(request.error ?? new Error('Storage failed.'))
    }
  })
}

async function saveStored(hymns: Hymn[]): Promise<void> {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('pack', 'readwrite')
    transaction.objectStore('pack').put(hymns, 'all')
    transaction.oncomplete = () => {
      db.close()
      resolve()
    }
    transaction.onerror = () => {
      db.close()
      reject(transaction.error ?? new Error('Storage failed.'))
    }
  })
}

function asHymn(entry: unknown): Hymn | null {
  const item = entry as Record<string, unknown>
  if (typeof item.title !== 'string' || !Array.isArray(item.verses)) return null
  const verses = item.verses.filter(
    (verse): verse is string => typeof verse === 'string' && verse.trim().length > 0,
  )
  if (verses.length === 0) return null
  return {
    title: item.title,
    author: typeof item.author === 'string' ? item.author : '',
    year: typeof item.year === 'number' ? item.year : null,
    verses,
    chorus: typeof item.chorus === 'string' && item.chorus.trim() ? item.chorus : null,
  }
}

/**
 * The whole pack, from this computer when it has been downloaded
 * before, otherwise downloaded chunk by chunk (onProgress gets 0 to
 * 1) and stored. Throws a plain message when the download fails.
 */
export async function loadHymnPack(
  onProgress?: (fraction: number) => void,
): Promise<Hymn[]> {
  if (cache) return cache
  const stored = await readStored().catch(() => null)
  if (stored && stored.length > 0) {
    cache = stored
    return cache
  }
  const hymns: Hymn[] = []
  for (let chunk = 1; chunk <= CHUNKS; chunk += 1) {
    const name = `hymns-${String(chunk).padStart(2, '0')}.json`
    let res: Response
    try {
      res = await fetch(`${BASE}${name}`)
    } catch {
      throw new Error('Could not download the hymn pack. Check the connection and try again.')
    }
    if (!res.ok) {
      throw new Error(`Could not download the hymn pack (the server said ${res.status}).`)
    }
    const data: unknown = await res.json()
    if (!Array.isArray(data)) {
      throw new Error('The hymn pack arrived in a shape I do not recognise.')
    }
    for (const entry of data) {
      const hymn = asHymn(entry)
      if (hymn) hymns.push(hymn)
    }
    onProgress?.(chunk / CHUNKS)
  }
  if (hymns.length === 0) {
    throw new Error('The hymn pack arrived empty.')
  }
  cache = hymns
  await saveStored(hymns).catch(() => undefined)
  return hymns
}

/** Whether the pack is already on this computer, without downloading it. */
export async function hymnPackReady(): Promise<boolean> {
  if (cache) return true
  const stored = await readStored().catch(() => null)
  return stored !== null && stored.length > 0
}

export type HymnHit = { index: number; hymn: Hymn }

/**
 * Search the loaded pack by title, author or words in the verses.
 * Title matches come first, then author matches, then lyric matches.
 * At most 50 hits, so the panel stays quick with 25,716 hymns.
 */
export function searchHymns(hymns: Hymn[], query: string): HymnHit[] {
  const text = query.trim().toLowerCase()
  if (!text) return []
  const titled: HymnHit[] = []
  const authored: HymnHit[] = []
  const worded: HymnHit[] = []
  hymns.forEach((hymn, index) => {
    if (hymn.title.toLowerCase().includes(text)) titled.push({ index, hymn })
    else if ((hymn.author ?? '').toLowerCase().includes(text)) authored.push({ index, hymn })
    else if (hymn.verses.some((verse) => verse.toLowerCase().includes(text)))
      worded.push({ index, hymn })
  })
  return [...titled, ...authored, ...worded].slice(0, 50)
}

/**
 * A hymn as a True Worship song: each stanza becomes a verse, the
 * chorus (when the hymn has one) becomes a Chorus section at the end.
 * Source is 'public-domain', and the copyright line says so.
 */
export function hymnToSong({ index, hymn }: HymnHit): Song {
  const toLines = (text: string) =>
    text
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0)
  const verses = hymn.verses
    .map((verse, verseIndex) => ({
      label: `Verse ${verseIndex + 1}`,
      lines: toLines(verse),
    }))
    .filter((verse) => verse.lines.length > 0)
  if (hymn.chorus) {
    const lines = toLines(hymn.chorus)
    if (lines.length > 0) verses.push({ label: 'Chorus', lines })
  }
  return {
    id: `hymn-${index}`,
    title: hymn.title,
    author: hymn.author,
    copyright: 'Public Domain',
    source: 'public-domain',
    verses,
  }
}
