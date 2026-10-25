import JSZip from 'jszip'
import type { ScheduleItem } from '../../shared/lib/types'

/**
 * EasyWorship schedule files (.ews, and .ewsx for packed schedules).
 * Confirmed shape: a ZIP archive, usually with a media directory inside
 * when "Pack files in schedule" was checked. The schedule payload inside
 * is not a published format, so this importer does not pretend to read
 * it byte for byte. Instead it:
 *  - lists every entry, so nothing hides,
 *  - turns packed media files into media schedule items,
 *  - harvests titles from any XML or JSON text parts it finds,
 *  - reports exactly what it could not understand.
 * A real .ews file from a church is what turns this from a careful
 * harvest into a full-fidelity import; see docs/file-formats.md.
 */

const MEDIA_EXTENSIONS = new Set([
  'jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp',
  'mp4', 'mov', 'avi', 'mkv', 'webm',
  'mp3', 'wav', 'ogg', 'm4a',
  'ppt', 'pptx', 'pdf',
])

function baseName(path: string): string {
  return path.split('/').pop() ?? path
}

function extensionOf(path: string): string {
  const match = /\.([^.]+)$/.exec(path)
  return match ? match[1].toLowerCase() : ''
}

function harvestTitlesFromXml(text: string): string[] {
  const titles: string[] = []
  for (const match of text.matchAll(/<(?:title|name)>([^<]+)<\/(?:title|name)>/gi)) {
    const title = match[1].trim()
    if (title && !titles.includes(title)) titles.push(title)
  }
  return titles
}

function harvestTitlesFromJson(text: string): string[] {
  try {
    const parsed: unknown = JSON.parse(text)
    const titles: string[] = []
    const walk = (value: unknown) => {
      if (Array.isArray(value)) {
        value.forEach(walk)
        return
      }
      if (value && typeof value === 'object') {
        const record = value as Record<string, unknown>
        if (typeof record.title === 'string' && record.title.trim()) {
          titles.push(record.title.trim())
        } else if (typeof record.name === 'string' && record.name.trim()) {
          titles.push(record.name.trim())
        }
        Object.values(record).forEach(walk)
      }
    }
    walk(parsed)
    return [...new Set(titles)]
  } catch {
    return []
  }
}

export type EwsResult = {
  schedule: ScheduleItem[]
  entries: string[]
  warnings: string[]
}

export async function parseEwsFile(data: Blob | ArrayBuffer): Promise<EwsResult> {
  const zip = await JSZip.loadAsync(data)
  const entries = Object.keys(zip.files).filter((name) => !zip.files[name].dir)
  const schedule: ScheduleItem[] = []
  const warnings: string[] = []
  let understood = 0

  for (const entry of entries) {
    const ext = extensionOf(entry)
    if (MEDIA_EXTENSIONS.has(ext)) {
      schedule.push({
        id: `imp-${Math.random().toString(36).slice(2, 7)}`,
        type: 'media',
        title: baseName(entry),
        ref: entry,
      })
      understood++
      continue
    }
    if (ext === 'xml' || ext === 'json' || ext === 'txt') {
      const text = await zip.files[entry].async('text')
      const titles =
        ext === 'json' ? harvestTitlesFromJson(text) : harvestTitlesFromXml(text)
      for (const title of titles) {
        schedule.push({
          id: `imp-${Math.random().toString(36).slice(2, 7)}`,
          type: 'custom',
          title,
          ref: '',
        })
      }
      if (titles.length > 0) understood++
      else warnings.push(`No titles could be read from ${entry}.`)
      continue
    }
    warnings.push(`Entry ${entry} was not understood and was skipped.`)
  }

  if (schedule.length === 0) {
    warnings.push(
      'No schedule items could be read from this file. EasyWorship schedule payloads are not a published format; a sample file is needed for full-fidelity import (see docs/file-formats.md).',
    )
  } else if (understood < entries.length) {
    warnings.push(
      'Some entries were skipped. Song lyrics live in the EasyWorship song database, not in the schedule file, so import Songs.db as well to get the words.',
    )
  }
  return { schedule, entries, warnings }
}
