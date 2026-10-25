/**
 * Feature: bible — content API.
 *
 * Live source: bible-api.com (Tim Morgan), free, no key, and its
 * catalogue is public-domain translations only. Versions come from
 * GET /data; a passage comes from GET /{reference}?translation={id}
 * and returns { reference, verses: [{ book_name, chapter, verse,
 * text }], text, translation_id, translation_name }.
 *
 * Limits to respect: 15 requests per 30 seconds per IP, and the
 * service asks clients not to download whole Bibles through it, so
 * lookups run on an explicit button press, never per keystroke, and
 * passages are cached for the session. The service is a hobby server
 * and may go down, so every call falls back: the static version list
 * when /data fails, and the bundled demo passage when a lookup fails.
 *
 * What this is not, yet: Nigerian-language translations (Yoruba,
 * Hausa, Igbo, Pidgin) are not in this catalogue. Those arrive as
 * downloadable eBible / SWORD packs held in SQLite, and copyrighted
 * translations (NIV, ESV, NKJV, NLT, NASB) only ever arrive through
 * a licensed route such as API.Bible with a key. See
 * docs/content-api.md.
 */

export type BibleVersion = {
  id: string
  name: string
  language: string
  languageCode: string
  license: string
}

export type BibleVerse = {
  book: string
  chapter: number
  verse: number
  text: string
}

export type BiblePassage = {
  reference: string
  translationId: string
  translationName: string
  verses: BibleVerse[]
  /** Whole passage text, verses joined with spaces. */
  text: string
}

const BASE = 'https://bible-api.com'

/** Used when the live version list cannot be reached. */
export const FALLBACK_VERSIONS: BibleVersion[] = [
  {
    id: 'kjv',
    name: 'King James Version',
    language: 'English',
    languageCode: 'eng',
    license: 'Public Domain',
  },
  {
    id: 'web',
    name: 'World English Bible',
    language: 'English',
    languageCode: 'eng',
    license: 'Public Domain',
  },
]

/** Passages fetched this session, keyed by translation + reference. */
const passageCache = new Map<string, BiblePassage>()

function asVersion(entry: unknown): BibleVersion | null {
  const item = entry as Record<string, unknown>
  if (typeof item.identifier !== 'string' || typeof item.name !== 'string') {
    return null
  }
  return {
    id: item.identifier,
    name: item.name,
    language: typeof item.language === 'string' ? item.language : '',
    languageCode:
      typeof item.language_code === 'string' ? item.language_code : '',
    license: typeof item.license === 'string' ? item.license : '',
  }
}

/**
 * The live version list. Returns the static fallback list (the same
 * array reference, so callers can tell) when the service is down.
 */
export async function fetchVersions(): Promise<BibleVersion[]> {
  try {
    const res = await fetch(`${BASE}/data`)
    if (!res.ok) return FALLBACK_VERSIONS
    const data = (await res.json()) as { translations?: unknown }
    if (!Array.isArray(data.translations)) return FALLBACK_VERSIONS
    const versions = data.translations.flatMap((entry) => {
      const version = asVersion(entry)
      return version ? [version] : []
    })
    return versions.length > 0 ? versions : FALLBACK_VERSIONS
  } catch {
    return FALLBACK_VERSIONS
  }
}

/**
 * One passage in one translation. Throws a plain-language error when
 * the reference is empty, the service cannot be reached, or the
 * translation has no such passage.
 */
export async function fetchPassage(
  reference: string,
  translationId: string,
): Promise<BiblePassage> {
  const ref = reference.trim()
  if (!ref) {
    throw new Error('Type a reference first, for example John 3:16.')
  }
  const key = `${translationId}:${ref.toLowerCase()}`
  const cached = passageCache.get(key)
  if (cached) return cached

  let res: Response
  try {
    res = await fetch(
      `${BASE}/${encodeURIComponent(ref)}?translation=${encodeURIComponent(translationId)}`,
    )
  } catch {
    throw new Error(
      'Could not reach the Bible service. Check the connection and try again.',
    )
  }
  if (!res.ok) {
    throw new Error(`No passage found for "${ref}" in this translation.`)
  }
  const data = (await res.json()) as {
    reference?: unknown
    verses?: unknown
    text?: unknown
    translation_name?: unknown
  }
  const verses: BibleVerse[] = Array.isArray(data.verses)
    ? data.verses.flatMap((entry) => {
        const item = entry as Record<string, unknown>
        if (typeof item.text !== 'string') return []
        return [
          {
            book: typeof item.book_name === 'string' ? item.book_name : '',
            chapter: typeof item.chapter === 'number' ? item.chapter : 0,
            verse: typeof item.verse === 'number' ? item.verse : 0,
            text: item.text.trim(),
          },
        ]
      })
    : []
  if (verses.length === 0) {
    throw new Error(`No passage found for "${ref}" in this translation.`)
  }
  const passage: BiblePassage = {
    reference: typeof data.reference === 'string' ? data.reference : ref,
    translationId,
    translationName:
      typeof data.translation_name === 'string' ? data.translation_name : '',
    verses,
    text:
      typeof data.text === 'string' && data.text.trim().length > 0
        ? data.text.trim()
        : verses.map((verse) => verse.text).join(' '),
  }
  passageCache.set(key, passage)
  return passage
}

/** One slide per verse, each headed with its own reference. */
export function passageToSlides(passage: BiblePassage): string[][] {
  return passage.verses.map((verse) => [
    `${verse.book} ${verse.chapter}:${verse.verse}`,
    verse.text,
  ])
}
