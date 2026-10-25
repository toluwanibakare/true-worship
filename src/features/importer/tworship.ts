import JSZip from 'jszip'
import type { ScheduleItem, Song, Theme } from '../../shared/lib/types'

/**
 * True Worship's own file format: .tworship
 *
 * Why a new format: .trw is already taken (TrailerWIN vehicle data, and
 * Trimble RealWorks), and a search found no existing .tworship format,
 * so .tworship is free to claim. The file is a ZIP archive, the same
 * shape as .ews and .osz, so any unzip tool can look inside it:
 *
 *   manifest.json   { format: "true-worship", version: 1, kind, title,
 *                     created, app, appVersion }
 *   content.json    { songs: Song[], schedule: ScheduleItem[], theme? }
 *   media/          reserved for a later version, which will bundle the
 *                   media files a schedule references.
 *
 * kinds: "schedule" (a whole service, with its songs embedded),
 * "song" (one song), "library" (many songs, no schedule).
 * Readers must accept version 1 and warn, not fail, on a newer version.
 */

export const TWORSHIP_FORMAT = 'true-worship'
export const TWORSHIP_VERSION = 1
export const TWORSHIP_EXTENSION = '.tworship'

export type TworshipKind = 'schedule' | 'song' | 'library'

export type TworshipContent = {
  songs: Song[]
  schedule: ScheduleItem[]
  theme?: Theme
}

export type TworshipFile = {
  kind: TworshipKind
  title: string
  content: TworshipContent
  warnings: string[]
}

const SCHEDULE_TYPES = new Set(['song', 'scripture', 'media', 'custom'])

function normalizeSong(raw: unknown): Song | null {
  if (!raw || typeof raw !== 'object') return null
  const song = raw as Partial<Song>
  if (typeof song.title !== 'string' || !Array.isArray(song.verses)) return null
  return {
    id: typeof song.id === 'string' ? song.id : `imp-${Math.random().toString(36).slice(2, 7)}`,
    title: song.title,
    author: typeof song.author === 'string' ? song.author : '',
    verses: song.verses.filter(
      (verse): verse is Song['verses'][number] =>
        !!verse && typeof verse.label === 'string' && Array.isArray(verse.lines),
    ),
    ccli: typeof song.ccli === 'string' ? song.ccli : undefined,
    copyright: typeof song.copyright === 'string' ? song.copyright : undefined,
    source:
      song.source === 'public-domain' ||
      song.source === 'owned' ||
      song.source === 'licensed' ||
      song.source === 'community'
        ? song.source
        : 'community',
  }
}

function normalizeScheduleItem(raw: unknown): ScheduleItem | null {
  if (!raw || typeof raw !== 'object') return null
  const item = raw as Partial<ScheduleItem>
  if (typeof item.title !== 'string') return null
  return {
    id: typeof item.id === 'string' ? item.id : `imp-${Math.random().toString(36).slice(2, 7)}`,
    type: SCHEDULE_TYPES.has(item.type as string)
      ? (item.type as ScheduleItem['type'])
      : 'custom',
    title: item.title,
    ref: typeof item.ref === 'string' ? item.ref : '',
  }
}

export async function buildTworshipFile(options: {
  title: string
  kind: TworshipKind
  songs: Song[]
  schedule: ScheduleItem[]
  theme?: Theme
}): Promise<Blob> {
  const zip = new JSZip()
  zip.file(
    'manifest.json',
    JSON.stringify(
      {
        format: TWORSHIP_FORMAT,
        version: TWORSHIP_VERSION,
        kind: options.kind,
        title: options.title,
        created: new Date().toISOString(),
        app: 'True Worship',
        appVersion: '0.5.0',
      },
      null,
      2,
    ),
  )
  zip.file(
    'content.json',
    JSON.stringify(
      {
        songs: options.songs,
        schedule: options.schedule,
        theme: options.theme,
      },
      null,
      2,
    ),
  )
  return zip.generateAsync({ type: 'blob', mimeType: 'application/zip' })
}

export async function parseTworshipFile(
  data: Blob | ArrayBuffer,
): Promise<TworshipFile> {
  const warnings: string[] = []
  const zip = await JSZip.loadAsync(data)
  const manifestText = await zip.file('manifest.json')?.async('text')
  if (!manifestText) {
    throw new Error('This is not a .tworship file: manifest.json is missing.')
  }
  const manifest = JSON.parse(manifestText) as {
    format?: string
    version?: number
    kind?: string
    title?: string
  }
  if (manifest.format !== TWORSHIP_FORMAT) {
    throw new Error('This is not a True Worship file: the manifest format does not match.')
  }
  if (typeof manifest.version === 'number' && manifest.version > TWORSHIP_VERSION) {
    warnings.push(
      `This file was made by a newer True Worship (format version ${manifest.version}); some things may not load.`,
    )
  }
  const contentText = await zip.file('content.json')?.async('text')
  if (!contentText) {
    throw new Error('This .tworship file has no content.json.')
  }
  const content = JSON.parse(contentText) as {
    songs?: unknown[]
    schedule?: unknown[]
    theme?: Theme
  }
  const songs = (content.songs ?? []).map(normalizeSong).filter((song): song is Song => song !== null)
  const schedule = (content.schedule ?? [])
    .map(normalizeScheduleItem)
    .filter((item): item is ScheduleItem => item !== null)
  const mediaItems = schedule.filter((item) => item.type === 'media')
  if (mediaItems.length > 0) {
    warnings.push(
      `${mediaItems.length} media item(s) point at files by name only; version 1 of the format does not bundle media files yet, so re-link them after import.`,
    )
  }
  const kind: TworshipKind =
    manifest.kind === 'song' || manifest.kind === 'library' ? manifest.kind : 'schedule'
  return {
    kind,
    title: manifest.title ?? 'Untitled',
    content: { songs, schedule, theme: content.theme },
    warnings,
  }
}
