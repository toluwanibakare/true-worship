/**
 * Feature: bible — licensed versions through API.Bible.
 *
 * API.Bible (American Bible Society, https://api.bible) is the one
 * licensed route to the copyrighted translations people ask for:
 * NLT, NKJV, AMP, The Message, NIV and the Good News Translation.
 * Its licence is live-fetch only, and this client is built around
 * that from the start:
 *
 * - The API key is the user's own, from their own API.Bible account.
 *   It is kept only on this computer and is never sent anywhere but
 *   api.scripture.api.bible. Nobody should ever paste a key into a
 *   chat or a repo.
 * - Nothing is bundled and no whole Bible is ever downloaded.
 *   Passages are fetched one at a time, when the user looks them up.
 * - A fetched passage may be cached on this computer for at most
 *   14 days (the licence requires the cache to be cleared at least
 *   every 14 days), and the cache is dropped at once if the API
 *   refuses the key. If access is revoked, cached copies must be
 *   removed; removing the key here does exactly that.
 * - Every API response carries the translation's copyright notice;
 *   it is carried through to the panel and shown with the passage.
 * - FUMS (Fair Use Management System): the licence requires usage
 *   reporting, so ABS's own fums script is loaded before the first
 *   call and reports the calls this client makes.
 *
 * AMPC, TPT and ERV are not offered here: API.Bible's public lists
 * do not include them, so there is no licensed route for them in
 * this client. See docs/content-api.md.
 */

import type { BiblePassage, BibleVerse } from './api'
import { bookKey, matchesBook } from './packs'

const BASE = 'https://api.scripture.api.bible/v1'
const KEY_STORE = 'tw-apibible-key'
const CACHE_STORE = 'tw-apibible-cache'
const BOOKS_STORE = 'tw-apibible-books'
/** The licence requires cached content to be cleared at least every 14 days. */
const CACHE_MAX_AGE = 14 * 24 * 60 * 60 * 1000
const CACHE_MAX_ENTRIES = 200

/** The translations this client looks for on the user's account. */
export const LICENSED_TARGETS = [
  { abbr: 'NLT', name: 'New Living Translation' },
  { abbr: 'NKJV', name: 'New King James Version' },
  { abbr: 'AMP', name: 'Amplified Bible' },
  { abbr: 'MSG', name: 'The Message' },
  { abbr: 'NIV', name: 'New International Version' },
  { abbr: 'GNT', name: 'Good News Translation' },
] as const

export type LicensedVersion = {
  /** The id this version gets in the panel's installed list. */
  id: string
  /** API.Bible's own Bible id, needed for every call. */
  bibleId: string
  abbr: string
  name: string
  language: string
  /** The copyright notice API.Bible carries for this translation. */
  copyright: string
}

export function loadApiBibleKey(): string {
  try {
    return localStorage.getItem(KEY_STORE) ?? ''
  } catch {
    return ''
  }
}

export function saveApiBibleKey(key: string): void {
  try {
    if (key.trim()) localStorage.setItem(KEY_STORE, key.trim())
    else localStorage.removeItem(KEY_STORE)
  } catch {
    // Storage unavailable: the key is simply not kept.
  }
}

/** Removing the key also removes every cached licensed passage, as the licence requires. */
export function clearApiBible(): void {
  saveApiBibleKey('')
  try {
    localStorage.removeItem(CACHE_STORE)
    localStorage.removeItem(BOOKS_STORE)
  } catch {
    // Nothing to clear.
  }
}

let fumsLoaded = false
/** Load ABS's FUMS reporting script once, before licensed calls are made. */
export function loadFums(): void {
  if (fumsLoaded || typeof document === 'undefined') return
  fumsLoaded = true
  const script = document.createElement('script')
  script.src = 'https://cdn.scripture.api.bible/fums.cjs'
  script.async = true
  document.head.appendChild(script)
}

async function call(key: string, path: string): Promise<unknown> {
  loadFums()
  let res: Response
  try {
    res = await fetch(`${BASE}${path}`, { headers: { 'api-key': key } })
  } catch {
    throw new Error('Could not reach API.Bible. Check the connection and try again.')
  }
  if (res.status === 401 || res.status === 403) {
    // A refused key can mean revoked access: cached copies must go.
    try {
      localStorage.removeItem(CACHE_STORE)
    } catch {
      // Nothing to clear.
    }
    throw new Error(
      'API.Bible refused that key or this account has no access to that Bible. Check the key and the Bibles chosen on your API.Bible account.',
    )
  }
  if (!res.ok) {
    throw new Error(`API.Bible could not answer that (it said ${res.status}). Try again in a moment.`)
  }
  return res.json()
}

type CacheEntry = { at: number; passage: BiblePassage & { copyright: string } }
type Cache = Record<string, CacheEntry>

function readCache(): Cache {
  try {
    const raw = JSON.parse(localStorage.getItem(CACHE_STORE) ?? '{}') as Cache
    const now = Date.now()
    const fresh: Cache = {}
    for (const [id, entry] of Object.entries(raw)) {
      if (entry && typeof entry.at === 'number' && now - entry.at < CACHE_MAX_AGE) {
        fresh[id] = entry
      }
    }
    return fresh
  } catch {
    return {}
  }
}

function writeCache(cache: Cache): void {
  try {
    const entries = Object.entries(cache)
      .sort((a, b) => b[1].at - a[1].at)
      .slice(0, CACHE_MAX_ENTRIES)
    localStorage.setItem(CACHE_STORE, JSON.stringify(Object.fromEntries(entries)))
  } catch {
    // Quota or storage trouble: passages simply are not cached.
  }
}

type ApiBook = { id: string; name: string }

const booksCache = new Map<string, ApiBook[]>()

async function fetchBooks(key: string, bibleId: string): Promise<ApiBook[]> {
  const hit = booksCache.get(bibleId)
  if (hit) return hit
  try {
    const raw = JSON.parse(localStorage.getItem(BOOKS_STORE) ?? '{}') as Record<
      string,
      { at: number; books: ApiBook[] }
    >
    const stored = raw[bibleId]
    if (stored && Date.now() - stored.at < CACHE_MAX_AGE && Array.isArray(stored.books)) {
      booksCache.set(bibleId, stored.books)
      return stored.books
    }
  } catch {
    // Unreadable store: fetch fresh.
  }
  const data = (await call(key, `/bibles/${bibleId}/books`)) as { data?: unknown }
  const books: ApiBook[] = Array.isArray(data.data)
    ? data.data.flatMap((entry) => {
        const item = entry as Record<string, unknown>
        return typeof item.id === 'string' && typeof item.name === 'string'
          ? [{ id: item.id, name: item.name }]
          : []
      })
    : []
  if (books.length === 0) throw new Error('API.Bible returned no books for that Bible.')
  booksCache.set(bibleId, books)
  try {
    const raw = JSON.parse(localStorage.getItem(BOOKS_STORE) ?? '{}') as Record<string, unknown>
    raw[bibleId] = { at: Date.now(), books }
    localStorage.setItem(BOOKS_STORE, JSON.stringify(raw))
  } catch {
    // Books just will not be cached.
  }
  return books
}

/**
 * Which of the target translations this account can actually use.
 * The full catalogue is keyed, so discovery asks the API for its
 * English Bibles and matches the targets by abbreviation and name.
 * Targets the account has not been granted are reported as missing,
 * never invented.
 */
export async function discoverLicensedVersions(key: string): Promise<
  { found: LicensedVersion[]; missing: string[] }
> {
  const data = (await call(key, '/bibles?language=eng&include-full-details=true')) as {
    data?: unknown
  }
  const list = Array.isArray(data.data) ? data.data : []
  const found: LicensedVersion[] = []
  const missing: string[] = []
  for (const target of LICENSED_TARGETS) {
    const match = list
      .map((entry) => entry as Record<string, unknown>)
      .find((item) => {
        const abbr = typeof item.abbreviation === 'string' ? item.abbreviation : ''
        const name = typeof item.name === 'string' ? item.name : ''
        return (
          abbr.toUpperCase() === target.abbr ||
          name.toLowerCase().includes(target.name.toLowerCase())
        )
      })
    if (!match || typeof match.id !== 'string') {
      missing.push(target.abbr)
      continue
    }
    const language = match.language as Record<string, unknown> | undefined
    found.push({
      id: `apibible:${match.id}`,
      bibleId: match.id,
      abbr: target.abbr,
      name: typeof match.name === 'string' ? match.name : target.name,
      language: typeof language?.name === 'string' ? language.name : 'English',
      copyright: typeof match.copyright === 'string' ? match.copyright : '',
    })
  }
  return { found, missing }
}

/** "John 3:16", "1 Cor 13:4-7" and friends, as the panel types them. */
function parseReference(text: string) {
  const match =
    /^((?:[1-3]\s*)?[a-z][a-z .]*?)(?:\s*(\d+)(?:\s*[:.,\s]\s*(\d+)(?:\s*-\s*(\d+))?)?)?$/i.exec(
      text.trim(),
    )
  if (!match) return null
  return {
    book: match[1].trim(),
    chapter: match[2] ? Number(match[2]) : 1,
    from: match[3] ? Number(match[3]) : null,
    to: match[4] ? Number(match[4]) : null,
  }
}

type ContentItem = {
  name?: string
  text?: string
  attrs?: { number?: string; verseId?: string }
  items?: ContentItem[]
}

/** API.Bible's JSON content tree into verses: verse markers open a verse, text follows it. */
function versesFromContent(content: ContentItem[], bookName: string): BibleVerse[] {
  const verses: BibleVerse[] = []
  let current: BibleVerse | null = null
  const walk = (items: ContentItem[]) => {
    for (const item of items) {
      if (item.name === 'verse' && item.attrs?.verseId) {
        const parts = item.attrs.verseId.split('.')
        current = {
          book: bookName,
          chapter: Number(parts[1]) || 0,
          verse: Number(parts[2]) || 0,
          text: '',
        }
        verses.push(current)
      } else if (typeof item.text === 'string' && current) {
        current.text += item.text
      }
      if (Array.isArray(item.items)) walk(item.items)
    }
  }
  walk(content)
  return verses
    .map((verse) => ({ ...verse, text: verse.text.replace(/\s+/g, ' ').trim() }))
    .filter((verse) => verse.text.length > 0)
}

/**
 * One passage from a licensed version, by reference. Fetched live;
 * the only copy kept is the 14-day passage cache above. The
 * returned passage carries the translation's copyright notice.
 */
export async function fetchLicensedPassage(
  key: string,
  version: LicensedVersion,
  reference: string,
): Promise<BiblePassage & { copyright: string }> {
  const ref = reference.trim()
  if (!ref) throw new Error('Type a reference first, for example John 3:16.')
  const cacheId = `${version.bibleId}:${ref.toLowerCase()}`
  const cache = readCache()
  const cached = cache[cacheId]
  if (cached) return cached.passage

  const parsed = parseReference(ref)
  if (!parsed) throw new Error(`"${ref}" is not a reference I can follow.`)
  const books = await fetchBooks(key, version.bibleId)
  const wanted = bookKey(parsed.book)
  const book =
    books.find((item) => matchesBook(bookKey(item.name), wanted)) ??
    books.find((item) => bookKey(item.name).startsWith(wanted) && wanted.length >= 3)
  if (!book) throw new Error(`${version.name} has no book called "${parsed.book}".`)

  const from = parsed.from ?? 1
  const start = `${book.id}.${parsed.chapter}.${from}`
  const passageId =
    parsed.to && parsed.to > from ? `${start}-${book.id}.${parsed.chapter}.${parsed.to}` : start
  const data = (await call(
    key,
    `/bibles/${version.bibleId}/passages/${passageId}?content-type=json&include-notes=false&include-titles=false&include-chapter-numbers=false&include-verse-numbers=true&include-verse-spans=true`,
  )) as { data?: { content?: ContentItem[]; reference?: string; copyright?: string } }
  const content = Array.isArray(data.data?.content) ? data.data.content : []
  let verses = versesFromContent(content, book.name)
  if (parsed.from === null) verses = verses.filter((verse) => verse.verse >= 1)
  if (verses.length === 0) {
    throw new Error(`No passage found for "${ref}" in ${version.name}.`)
  }
  const passage: BiblePassage & { copyright: string } = {
    reference: typeof data.data?.reference === 'string' ? data.data.reference : ref,
    translationId: version.id,
    translationName: version.name,
    verses,
    text: verses.map((verse) => verse.text).join(' '),
    copyright:
      typeof data.data?.copyright === 'string' ? data.data.copyright : version.copyright,
  }
  cache[cacheId] = { at: Date.now(), passage }
  writeCache(cache)
  return passage
}
