/**
 * Feature: songs — lyrics API.
 *
 * Live source: LRCLIB (lrclib.net), free, no key for reads.
 * GET /api/search?q={query} searches tracks; GET /api/get/{id}
 * returns one track. Each track carries trackName, artistName,
 * albumName, instrumental, plainLyrics and syncedLyrics (LRC).
 *
 * Licensing warning, stated in the panel wherever results appear:
 * LRCLIB lyrics are community-contributed and NOT rights-cleared.
 * Finding a lyric here does not licence projecting it in church;
 * a copyrighted lyric still needs a licence, and CCLI SongSelect is
 * the legal route for licensed churches. Results therefore enter
 * the library with source 'community', never as public domain, and
 * public-domain hymns stay the only lyrics the app itself vouches
 * for. See docs/content-api.md.
 */

import type { Song } from '../../shared/lib/types'

export type LyricResult = {
  id: number
  title: string
  artist: string
  album: string | null
  instrumental: boolean
  plainLyrics: string | null
  syncedLyrics: string | null
}

/** Shown under every online lyrics result. */
export const LYRICS_RIGHTS_NOTE =
  'Online results are community-contributed and not rights-cleared. ' +
  'Projecting a copyrighted lyric needs a licence (CCLI SongSelect is ' +
  'the legal route for licensed churches).'

const BASE = 'https://lrclib.net/api'

function asResult(entry: unknown): LyricResult | null {
  const item = entry as Record<string, unknown>
  if (
    typeof item.id !== 'number' ||
    typeof item.trackName !== 'string' ||
    typeof item.artistName !== 'string'
  ) {
    return null
  }
  return {
    id: item.id,
    title: item.trackName,
    artist: item.artistName,
    album: typeof item.albumName === 'string' ? item.albumName : null,
    instrumental: item.instrumental === true,
    plainLyrics: typeof item.plainLyrics === 'string' ? item.plainLyrics : null,
    syncedLyrics:
      typeof item.syncedLyrics === 'string' ? item.syncedLyrics : null,
  }
}

/** Search tracks by title, artist or words. Instrumentals and tracks
 *  with no lyric text are left out, since there is nothing to sing. */
export async function searchLyrics(query: string): Promise<LyricResult[]> {
  const text = query.trim()
  if (!text) return []
  let res: Response
  try {
    res = await fetch(`${BASE}/search?q=${encodeURIComponent(text)}`)
  } catch {
    throw new Error(
      'Could not reach the lyrics service. Check the connection and try again.',
    )
  }
  if (!res.ok) {
    throw new Error('Lyrics search failed. Try again in a moment.')
  }
  const data: unknown = await res.json()
  if (!Array.isArray(data)) return []
  return data.flatMap((entry) => {
    const result = asResult(entry)
    if (!result || result.instrumental) return []
    if (!result.plainLyrics && !result.syncedLyrics) return []
    return [result]
  })
}

/** One track by LRCLIB id. */
export async function fetchLyrics(id: number): Promise<LyricResult> {
  const res = await fetch(`${BASE}/get/${id}`)
  if (!res.ok) {
    throw new Error('That lyric could not be loaded. Try again.')
  }
  const result = asResult(await res.json())
  if (!result) {
    throw new Error('That lyric could not be loaded. Try again.')
  }
  return result
}

/** Drop LRC timestamps, keeping the words in order. */
export function stripLrc(lrc: string): string {
  return lrc
    .split('\n')
    .map((line) => line.replace(/^\[\d+:\d+(?:\.\d+)?\]/, '').trim())
    .join('\n')
}

/**
 * A lyric result as a True Worship song: blank-line stanzas become
 * verses, each labelled Verse 1, Verse 2, and so on. Source is
 * 'community' on purpose, never public domain.
 */
export function lyricsToSong(result: LyricResult): Song {
  const raw = (result.plainLyrics ?? '').trim() || stripLrc(result.syncedLyrics ?? '')
  const verses = raw
    .split(/\n\s*\n/)
    .map((stanza) => stanza.trim())
    .filter((stanza) => stanza.length > 0)
    .map((stanza, index) => ({
      label: `Verse ${index + 1}`,
      lines: stanza
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => line.length > 0),
    }))
    .filter((verse) => verse.lines.length > 0)
  return {
    id: `lrclib-${result.id}`,
    title: result.title,
    author: result.artist,
    source: 'community',
    verses,
  }
}
