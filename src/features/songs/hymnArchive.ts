/**
 * Feature: songs — the public domain hymn archive.
 *
 * 25,716 hymns with full verses, every one public domain: the
 * Hymnary.org public domain export (hymnal instances from 1930 or
 * earlier, via Open Christian Data) plus the Open Hymnal Project,
 * keeping only hymns its own copyright line marks public domain.
 * No CCLI or modern worship material is in the pack. The source and
 * verification record lives in packs/README.md.
 * Hymnary.org asks users of its dataset to link to hymnary.org:
 * https://hymnary.org
 *
 * The pack ships inside the app (packs/, nine JSON chunks, built into
 * the app by Vite), so the Hymns list works offline with no download.
 * A hymn only enters the song library when the user adds it, with
 * source 'public-domain'.
 */

import type { Song } from '../../shared/lib/types'

export type Hymn = {
  title: string
  author: string
  year: number | null
  verses: string[]
  chorus: string | null
}

/** Hymns in the pack, in pack order. The index is the hymn's stable id. */
let cache: Hymn[] | null = null

const chunks = import.meta.glob<unknown>('../../../packs/hymns-*.json', { import: 'default' })

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

/** The whole pack, read from the app's own files (onProgress gets 0 to 1). */
export async function loadHymnPack(onProgress?: (fraction: number) => void): Promise<Hymn[]> {
  if (cache) return cache
  const loaders = Object.keys(chunks)
    .sort()
    .map((name) => chunks[name])
  const hymns: Hymn[] = []
  for (let chunk = 0; chunk < loaders.length; chunk += 1) {
    const data = await loaders[chunk]()
    if (!Array.isArray(data)) throw new Error('The hymn pack is not in the shape the app expects.')
    for (const entry of data) {
      const hymn = asHymn(entry)
      if (hymn) hymns.push(hymn)
    }
    onProgress?.((chunk + 1) / loaders.length)
  }
  if (hymns.length === 0) throw new Error('The hymn pack is empty.')
  cache = hymns
  return hymns
}

export type HymnHit = { index: number; hymn: Hymn }

/**
 * Search the loaded pack by title, author or words in the verses.
 * Punctuation is ignored. Title matches come first, then author matches, then lyric matches.
 * At most 200 hits, so the panel stays quick with 25,716 hymns.
 */
export function searchHymns(hymns: Hymn[], query: string): HymnHit[] {
  const text = plain(query)
  if (!text) return []
  const titled: HymnHit[] = []
  const authored: HymnHit[] = []
  const worded: HymnHit[] = []
  hymns.forEach((hymn, index) => {
    const found = plainOf(hymn)
    if (found.title.includes(text)) titled.push({ index, hymn })
    else if (found.author.includes(text)) authored.push({ index, hymn })
    else if (found.words.includes(text)) worded.push({ index, hymn })
  })
  return [...titled, ...authored, ...worded].slice(0, 200)
}

/** Lower case, with punctuation as plain spaces, so "holy holy" finds "Holy, Holy, Holy". */
const plain = (text: string) =>
  text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim()

const plainCache = new WeakMap<Hymn, { title: string; author: string; words: string }>()
function plainOf(hymn: Hymn) {
  let found = plainCache.get(hymn)
  if (!found) {
    found = {
      title: plain(hymn.title),
      author: plain(hymn.author ?? ''),
      words: plain(hymn.verses.join(' ')),
    }
    plainCache.set(hymn, found)
  }
  return found
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
