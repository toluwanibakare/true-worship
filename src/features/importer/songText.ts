import type { Song, Verse } from '../../shared/lib/types'

/**
 * Shared helpers for song importers. Every importer ends up here: text
 * split into tagged sections ([V1], [C], [B] ...), then sections into
 * the app's Verse model. Pure string work, no DOM, so it is testable
 * outside the browser.
 */

export type ParsedSection = {
  tag: string
  lines: string[]
}

/** Human label for a section tag: V1 -> Verse 1, C -> Chorus, B -> Bridge. */
export function labelForTag(tag: string): string {
  const match = /^([A-Za-z]+)(\d*)$/.exec(tag.trim())
  if (!match) return tag
  const base = match[1].toUpperCase()
  const num = match[2]
  switch (base) {
    case 'V':
      return num ? `Verse ${num}` : 'Verse'
    case 'C':
      return 'Chorus'
    case 'B':
      return 'Bridge'
    case 'P':
      return 'Pre-Chorus'
    case 'T':
      return 'Tag'
    case 'I':
      return 'Intro'
    case 'O':
      return 'Other'
    case 'E':
      return 'Ending'
    default:
      return num ? `${base} ${num}` : base
  }
}

/**
 * Split tagged lyric text into sections. A line like [V1] opens a section.
 * Lines starting with a dot are chord lines and are skipped. Lyric lines
 * in OpenSong files start with a space, which is stripped.
 */
export function parseTaggedSections(text: string): ParsedSection[] {
  const sections: ParsedSection[] = []
  let current: ParsedSection | null = null
  for (const raw of text.split(/\r?\n/)) {
    const header = /^\s*\[([A-Za-z]+\d*)\]\s*$/.exec(raw)
    if (header) {
      current = { tag: header[1].toUpperCase(), lines: [] }
      sections.push(current)
      continue
    }
    const line = raw.replace(/^\s/, '')
    if (!line.trim()) continue
    if (line.startsWith('.')) continue
    if (!current) {
      current = { tag: 'V1', lines: [] }
      sections.push(current)
    }
    current.lines.push(line.trimEnd())
  }
  return sections.filter((section) => section.lines.length > 0)
}

/** Order sections by an order list (for example an OpenSong presentation). */
export function orderSections(
  sections: ParsedSection[],
  order: string[],
): { verses: Verse[]; warnings: string[] } {
  const warnings: string[] = []
  const byTag = new Map(sections.map((section) => [section.tag, section]))
  const used = new Set<string>()
  const verses: Verse[] = []
  for (const token of order) {
    const tag = token.toUpperCase()
    const section = byTag.get(tag)
    if (!section) {
      warnings.push(`Presentation order names ${tag}, which is not in the lyrics, so it was skipped.`)
      continue
    }
    used.add(tag)
    verses.push({ label: labelForTag(tag), lines: section.lines })
  }
  for (const section of sections) {
    if (!used.has(section.tag)) {
      verses.push({ label: labelForTag(section.tag), lines: section.lines })
    }
  }
  return { verses, warnings }
}

export function sectionsToVerses(sections: ParsedSection[]): Verse[] {
  return sections.map((section) => ({
    label: labelForTag(section.tag),
    lines: section.lines,
  }))
}

export function slugId(title: string): string {
  const slug =
    title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 40) || 'song'
  return `imp-${slug}-${Math.random().toString(36).slice(2, 7)}`
}

export function makeSong(
  title: string,
  verses: Verse[],
  extra?: Partial<Song>,
): Song {
  return {
    id: slugId(title),
    title,
    author: '',
    verses,
    source: 'community',
    ...extra,
  }
}
