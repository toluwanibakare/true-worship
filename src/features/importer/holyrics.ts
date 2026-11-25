import type { ScheduleItem, Song, Verse } from '../../shared/lib/types'
import { parseTextSong } from './textSong'

type HolyricsParagraph = {
  text?: string
  description?: string
  title?: string
  label?: string
}

type HolyricsJson = {
  title?: string
  name?: string
  music_title?: string
  artist?: string
  author?: string
  lyrics_author?: string
  copyright?: string
  ccli?: string
  lyrics?: string | HolyricsParagraph[]
  paragraphs?: HolyricsParagraph[]
  verses?: HolyricsParagraph[]
  items?: unknown[]
  playlist?: unknown[]
  schedule?: unknown[]
}

function makeId(prefix: string, title: string): string {
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
  return `${prefix}-${slug || 'item'}-${Math.random().toString(36).slice(2, 7)}`
}

function versesFromParagraphs(list: HolyricsParagraph[]): Verse[] {
  const verses: Verse[] = []
  list.forEach((p, idx) => {
    const raw = String(p.text ?? '').trim()
    if (!raw) return
    const lines = raw.split(/\r?\n/).map((l) => l.trim()).filter(Boolean)
    if (lines.length === 0) return
    const label = String(p.description ?? p.title ?? p.label ?? '').trim() || `Verse ${idx + 1}`
    verses.push({ label, lines })
  })
  return verses
}

function songFromHolyricsObject(data: HolyricsJson, fallbackTitle: string): Song | null {
  const title = String(data.title ?? data.music_title ?? data.name ?? fallbackTitle).trim()
  if (!title) return null
  const author = String(data.artist ?? data.author ?? data.lyrics_author ?? '').trim()
  let verses: Verse[] = []

  if (Array.isArray(data.paragraphs)) {
    verses = versesFromParagraphs(data.paragraphs)
  } else if (Array.isArray(data.verses)) {
    verses = versesFromParagraphs(data.verses)
  } else if (Array.isArray(data.lyrics)) {
    verses = versesFromParagraphs(data.lyrics)
  } else if (typeof data.lyrics === 'string' && data.lyrics.trim()) {
    const parsed = parseTextSong(data.lyrics, title)
    if (parsed.song) verses = parsed.song.verses
  }

  if (verses.length === 0) return null
  return {
    id: makeId('holyrics', title),
    title,
    author,
    verses,
    ...(data.ccli ? { ccli: String(data.ccli).trim() } : {}),
    ...(data.copyright ? { copyright: String(data.copyright).trim() } : {}),
    source: 'owned',
  }
}

/**
 * Parse a Holyrics export (.hly, .hlp, or .json).
 * Handles both single-song exports and playlist/schedule exports.
 */
export function parseHolyricsFile(
  rawText: string,
  fallbackTitle: string,
): { songs: Song[]; schedule: ScheduleItem[]; warnings: string[] } {
  const warnings: string[] = []
  const cleaned = rawText.replace(/^\uFEFF/, '').trim()
  if (!cleaned) {
    return { songs: [], schedule: [], warnings: ['The Holyrics file was empty.'] }
  }

  // Some Holyrics exports are JSON; older plain-text exports fall back to textSong.
  if (!cleaned.startsWith('{') && !cleaned.startsWith('[')) {
    const parsed = parseTextSong(cleaned, fallbackTitle)
    return {
      songs: parsed.song ? [parsed.song] : [],
      schedule: [],
      warnings: parsed.warnings,
    }
  }

  let json: unknown
  try {
    json = JSON.parse(cleaned)
  } catch {
    return { songs: [], schedule: [], warnings: ['Could not parse Holyrics JSON.'] }
  }

  const songs: Song[] = []
  const schedule: ScheduleItem[] = []

  const processEntry = (entry: unknown, index: number) => {
    if (!entry || typeof entry !== 'object') return
    const obj = entry as HolyricsJson
    const song = songFromHolyricsObject(obj, `${fallbackTitle} ${index + 1}`)
    if (song) {
      songs.push(song)
      schedule.push({
        id: makeId('sched', song.title),
        type: 'song',
        title: song.title,
        ref: song.id,
      })
    }
  }

  if (Array.isArray(json)) {
    json.forEach((entry, i) => processEntry(entry, i))
  } else if (json && typeof json === 'object') {
    const obj = json as HolyricsJson
    const list = obj.items ?? obj.playlist ?? obj.schedule
    if (Array.isArray(list)) {
      list.forEach((entry, i) => processEntry(entry, i))
    } else {
      const song = songFromHolyricsObject(obj, fallbackTitle)
      if (song) songs.push(song)
    }
  }

  if (songs.length === 0 && schedule.length === 0) {
    warnings.push('No songs or schedule items were found in this Holyrics file.')
  }
  return { songs, schedule, warnings }
}
