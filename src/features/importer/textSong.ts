import type { Song, Verse } from '../../shared/lib/types'
import {
  labelForTag,
  makeSong,
  parseTaggedSections,
  sectionsToVerses,
} from './songText'

/**
 * Plain text songs. Accepts, in order of preference:
 * 1. Leading "Title: / Author: / Copyright: / CCLI:" lines, then a body.
 * 2. Tagged sections ([V1], [C], [B] ...) in the body.
 * 3. Named headers ("Verse 1:", "Chorus:") in the body.
 * 4. Anything else: blank lines split the body into verses.
 * The file name is the fallback title.
 */

const HEADER_LINES = /^(Verse|Chorus|Bridge|Pre-Chorus|Tag|Intro|Ending)\s*\d*\s*:?\s*$/i

function headerTag(line: string): string {
  const match = /^(Verse|Chorus|Bridge|Pre-Chorus|Tag|Intro|Ending)\s*(\d*)/i.exec(line)
  if (!match) return 'V1'
  const word = match[1].toLowerCase()
  const num = match[2]
  const base =
    word === 'verse'
      ? 'V'
      : word === 'chorus'
        ? 'C'
        : word === 'bridge'
          ? 'B'
          : word === 'pre-chorus'
            ? 'P'
            : word === 'tag'
              ? 'T'
              : word === 'intro'
                ? 'I'
                : 'E'
  return base + num
}

export function parseTextSong(
  text: string,
  fallbackTitle: string,
): { song: Song | null; warnings: string[] } {
  const warnings: string[] = []
  const lines = text.replace(/\r\n/g, '\n').split('\n')
  let title = fallbackTitle
  let author = ''
  let copyright: string | undefined
  let ccli: string | undefined
  let bodyStart = 0
  for (let i = 0; i < lines.length; i++) {
    const meta = /^(Title|Author|Copyright|CCLI)\s*:\s*(.+)$/i.exec(lines[i].trim())
    if (!meta) break
    bodyStart = i + 1
    const key = meta[1].toLowerCase()
    if (key === 'title') title = meta[2].trim()
    if (key === 'author') author = meta[2].trim()
    if (key === 'copyright') copyright = meta[2].trim()
    if (key === 'ccli') ccli = meta[2].trim()
  }
  const body = lines.slice(bodyStart).join('\n').trim()
  if (!body) {
    return { song: null, warnings: ['This text file holds no lyrics.'] }
  }
  let verses: Verse[]
  if (/^\s*\[[A-Za-z]+\d*\]\s*$/m.test(body)) {
    const sections = parseTaggedSections(body)
    verses = sectionsToVerses(sections)
  } else if (HEADER_LINES.test(body.split('\n').find((line) => line.trim()) ?? '')) {
    const sections: { tag: string; lines: string[] }[] = []
    let current: { tag: string; lines: string[] } | null = null
    for (const raw of body.split('\n')) {
      if (HEADER_LINES.test(raw.trim())) {
        current = { tag: headerTag(raw.trim()), lines: [] }
        sections.push(current)
        continue
      }
      if (!raw.trim()) continue
      if (!current) {
        current = { tag: 'V1', lines: [] }
        sections.push(current)
      }
      current.lines.push(raw.trimEnd())
    }
    verses = sections
      .filter((section) => section.lines.length > 0)
      .map((section) => ({ label: labelForTag(section.tag), lines: section.lines }))
  } else {
    verses = body
      .split(/\n\s*\n/)
      .map((chunk) => chunk.split('\n').map((line) => line.trim()).filter(Boolean))
      .filter((chunkLines) => chunkLines.length > 0)
      .map((chunkLines, index) => ({ label: `Verse ${index + 1}`, lines: chunkLines }))
  }
  if (verses.length === 0) {
    return { song: null, warnings: ['No verses could be read from this text file.'] }
  }
  return { song: makeSong(title, verses, { author, copyright, ccli }), warnings }
}
