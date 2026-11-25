import type { Song, Verse } from '../../shared/lib/types'
import { parseOpenSongXml } from './opensong'
import { parseTextSong } from './textSong'

function makeId(title: string): string {
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
  return `bibleshow-${slug || 'song'}-${Math.random().toString(36).slice(2, 7)}`
}

/**
 * Parse a BibleShow song export (.bs, .bss, .bsong, or XML/text).
 * Supports XML song files, JSON exports, and structured text blocks.
 */
export function parseBibleShowFile(
  rawText: string,
  fallbackTitle: string,
): { songs: Song[]; warnings: string[] } {
  const cleaned = rawText.replace(/^\uFEFF/, '').trim()
  if (!cleaned) {
    return { songs: [], warnings: ['The BibleShow file was empty.'] }
  }

  // XML format (<song> / <bsong>)
  if (cleaned.startsWith('<')) {
    const doc = new DOMParser().parseFromString(cleaned, 'text/xml')
    if (!doc.querySelector('parsererror')) {
      const title =
        doc.querySelector('title')?.textContent?.trim() ||
        doc.querySelector('name')?.textContent?.trim() ||
        fallbackTitle
      const author = doc.querySelector('author')?.textContent?.trim() ?? ''
      const verseNodes = Array.from(doc.querySelectorAll('verse, stanza, slide'))
      if (verseNodes.length > 0) {
        const verses: Verse[] = []
        verseNodes.forEach((node, idx) => {
          const text = node.textContent?.trim() ?? ''
          if (!text) return
          const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean)
          if (lines.length === 0) return
          const label =
            node.getAttribute('name') ||
            node.getAttribute('label') ||
            `Verse ${idx + 1}`
          verses.push({ label, lines })
        })
        if (verses.length > 0) {
          return {
            songs: [{ id: makeId(title), title, author, verses, source: 'owned' }],
            warnings: [],
          }
        }
      }
      const fallback = parseOpenSongXml(cleaned, fallbackTitle)
      return {
        songs: fallback.song ? [fallback.song] : [],
        warnings: fallback.warnings,
      }
    }
  }

  // JSON format
  if (cleaned.startsWith('{') || cleaned.startsWith('[')) {
    try {
      const parsed = JSON.parse(cleaned) as unknown
      const items = Array.isArray(parsed) ? parsed : [parsed]
      const songs: Song[] = []
      for (const item of items) {
        if (!item || typeof item !== 'object') continue
        const obj = item as { title?: string; author?: string; lyrics?: string; verses?: { label?: string; text?: string }[] }
        const title = String(obj.title ?? fallbackTitle).trim()
        if (!title) continue
        if (Array.isArray(obj.verses)) {
          const verses: Verse[] = obj.verses
            .map((v, i) => ({
              label: String(v.label ?? `Verse ${i + 1}`).trim(),
              lines: String(v.text ?? '').split(/\r?\n/).map((l) => l.trim()).filter(Boolean),
            }))
            .filter((v) => v.lines.length > 0)
          if (verses.length > 0) {
            songs.push({ id: makeId(title), title, author: String(obj.author ?? '').trim(), verses, source: 'owned' })
          }
        } else if (typeof obj.lyrics === 'string') {
          const textSong = parseTextSong(obj.lyrics, title)
          if (textSong.song) {
            songs.push({ ...textSong.song, author: String(obj.author ?? textSong.song.author).trim() })
          }
        }
      }
      if (songs.length > 0) return { songs, warnings: [] }
    } catch {
      // Fall through to plain-text parsing.
    }
  }

  // Structured plain-text (.bss / .bs / .bsong)
  const textParsed = parseTextSong(cleaned, fallbackTitle)
  return {
    songs: textParsed.song ? [textParsed.song] : [],
    warnings: textParsed.warnings,
  }
}
