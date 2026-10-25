import type { Song } from '../../shared/lib/types'
import {
  labelForTag,
  makeSong,
  type ParsedSection,
} from './songText'

/**
 * OpenLyrics song files (openlyrics.org, version 0.8): an XML <song> with
 * <properties> (titles, authors, copyright, verseOrder) and <lyrics>
 * holding <verse name="v1"> elements, each with <lines> separated by
 * <br/> tags. Chord names inside <chord> tags are dropped; only the
 * words are projected.
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

function stripTags(text: string): string {
  return text
    .replace(/<chord[^>]*>[\s\S]*?<\/chord>/gi, '')
    .replace(/<[^>]+>/g, '')
}

export function parseOpenLyricsXml(
  xml: string,
  fallbackTitle: string,
): { song: Song | null; warnings: string[] } {
  const warnings: string[] = []
  const properties = /<properties>([\s\S]*?)<\/properties>/i.exec(xml)?.[1] ?? ''
  const title =
    /<title[^>]*>([\s\S]*?)<\/title>/i.exec(properties)?.[1]?.trim() || fallbackTitle
  const authors = [...properties.matchAll(/<author[^>]*>([\s\S]*?)<\/author>/gi)]
    .map((match) => decodeEntities(match[1]).trim())
    .filter(Boolean)
  const copyright = extractTag(properties, 'copyright') || undefined
  const ccli = extractTag(properties, 'ccli') || undefined
  const verseOrder = extractTag(properties, 'verseOrder')

  const lyricsBlock = /<lyrics>([\s\S]*?)<\/lyrics>/i.exec(xml)?.[1]
  if (!lyricsBlock) {
    return { song: null, warnings: ['No <lyrics> section found in this OpenLyrics file.'] }
  }
  const sections: ParsedSection[] = []
  for (const match of lyricsBlock.matchAll(
    /<verse\s+name="([^"]+)"[^>]*>([\s\S]*?)<\/verse>/gi,
  )) {
    const name = match[1].toLowerCase()
    const lines: string[] = []
    for (const linesMatch of match[2].matchAll(/<lines[^>]*>([\s\S]*?)<\/lines>/gi)) {
      for (const part of linesMatch[1].split(/<br\s*\/?>/i)) {
        const line = decodeEntities(stripTags(part)).trim()
        if (line) lines.push(line)
      }
    }
    if (lines.length > 0) sections.push({ tag: name.toUpperCase(), lines })
  }
  const instruments = (lyricsBlock.match(/<instrument[\s>]/gi) || []).length
  if (instruments > 0) {
    warnings.push(`${instruments} instrumental part(s) were skipped, since they hold no words.`)
  }
  if (sections.length === 0) {
    return { song: null, warnings: ['The <lyrics> section holds no singable lines.'] }
  }
  const byTag = new Map(sections.map((section) => [section.tag, section]))
  let verses
  if (verseOrder) {
    verses = []
    const used = new Set<string>()
    for (const token of verseOrder.split(/\s+/).filter(Boolean)) {
      const section = byTag.get(token.toUpperCase())
      if (!section) {
        warnings.push(`Verse order names ${token}, which is not in the lyrics, so it was skipped.`)
        continue
      }
      used.add(section.tag)
      verses.push({ label: labelForTag(section.tag), lines: section.lines })
    }
    for (const section of sections) {
      if (!used.has(section.tag)) {
        verses.push({ label: labelForTag(section.tag), lines: section.lines })
      }
    }
  } else {
    verses = sections.map((section) => ({
      label: labelForTag(section.tag),
      lines: section.lines,
    }))
  }
  return {
    song: makeSong(decodeEntities(title), verses, {
      author: authors.join(', '),
      copyright,
      ccli,
    }),
    warnings,
  }
}
