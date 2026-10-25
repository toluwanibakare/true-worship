import type { Song } from '../../shared/lib/types'
import {
  makeSong,
  orderSections,
  parseTaggedSections,
  sectionsToVerses,
} from './songText'

/**
 * OpenSong song files. Format, as used by OpenSong and documented on
 * opensong.org: an XML <song> with <title>, <author>, <copyright>,
 * <presentation> (for example "V1 C V2") and <lyrics> text where [V1],
 * [C], [B] open sections, lyric lines start with a space, and lines
 * starting with a dot are chords.
 */

function extractTag(xml: string, tag: string): string | null {
  const match = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i').exec(xml)
  if (!match) return null
  return decodeEntities(match[1].replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')).trim()
}

function decodeEntities(text: string): string {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
}

export function parseOpenSongXml(
  xml: string,
  fallbackTitle: string,
): { song: Song | null; warnings: string[] } {
  const warnings: string[] = []
  const title = extractTag(xml, 'title') || fallbackTitle
  const author = extractTag(xml, 'author') || ''
  const copyright = extractTag(xml, 'copyright') || undefined
  const ccli = extractTag(xml, 'ccli') || undefined
  const lyricsText = extractTag(xml, 'lyrics')
  if (!lyricsText) {
    return { song: null, warnings: ['No <lyrics> section found in this OpenSong file.'] }
  }
  const sections = parseTaggedSections(lyricsText)
  if (sections.length === 0) {
    return { song: null, warnings: ['The <lyrics> section holds no singable lines.'] }
  }
  const presentation = extractTag(xml, 'presentation')
  let verses
  if (presentation) {
    const ordered = orderSections(sections, presentation.split(/\s+/).filter(Boolean))
    verses = ordered.verses
    warnings.push(...ordered.warnings)
  } else {
    verses = sectionsToVerses(sections)
  }
  return {
    song: makeSong(title, verses, { author, copyright, ccli }),
    warnings,
  }
}
