import JSZip from 'jszip'
import type { ScheduleItem, Song } from '../../shared/lib/types'
import { parseEwsFile } from './ews'
import { parseOpenLyricsXml } from './openlyrics'
import { parseOpenSongXml } from './opensong'
import { parseSqliteSongs } from './sqlite'
import { parseTextSong } from './textSong'
import {
  buildTworshipFile,
  parseTworshipFile,
  type TworshipKind,
} from './tworship'

/**
 * One front door for every import. Each file type is detected by
 * extension, and SQLite by its magic header, then handed to its own
 * module. A file that cannot be read produces warnings, never a crash,
 * and never a half-imported song.
 */

export type ImportResult = {
  songs: Song[]
  schedule: ScheduleItem[]
  warnings: string[]
  source: string
}

export type ImportOptions = {
  /** Bundled sql.js wasm URL; omit outside the browser build. */
  wasmUrl?: string
}

function baseName(fileName: string): string {
  return fileName.split(/[\\/]/).pop() ?? fileName
}

function extensionOf(fileName: string): string {
  const match = /\.([^.]+)$/.exec(fileName)
  return match ? match[1].toLowerCase() : ''
}

function empty(source: string, warnings: string[]): ImportResult {
  return { songs: [], schedule: [], warnings, source }
}

async function importXmlText(
  text: string,
  fileName: string,
): Promise<ImportResult> {
  const fallbackTitle = baseName(fileName).replace(/\.[^.]+$/, '')
  const looksOpenLyrics = /<lyrics>\s*<verse/i.test(text)
  const parsed = looksOpenLyrics
    ? parseOpenLyricsXml(text, fallbackTitle)
    : parseOpenSongXml(text, fallbackTitle)
  if (!parsed.song) {
    return empty(fileName, parsed.warnings)
  }
  return { songs: [parsed.song], schedule: [], warnings: parsed.warnings, source: fileName }
}

async function importZipFile(
  data: Blob | ArrayBuffer,
  fileName: string,
): Promise<ImportResult> {
  const zip = await JSZip.loadAsync(data)
  const manifest = zip.file('manifest.json')
  if (manifest) {
    try {
      const manifestText = await manifest.async('text')
      if (JSON.parse(manifestText).format === 'true-worship') {
        const parsed = await parseTworshipFile(data)
        return {
          songs: parsed.content.songs,
          schedule: parsed.content.schedule,
          warnings: parsed.warnings,
          source: fileName,
        }
      }
    } catch {
      // Not a True Worship file after all; fall through to XML scanning.
    }
  }
  const songs: Song[] = []
  const warnings: string[] = []
  for (const entry of Object.keys(zip.files)) {
    if (zip.files[entry].dir || !/\.xml$/i.test(entry)) continue
    const text = await zip.files[entry].async('text')
    const result = await importXmlText(text, entry)
    songs.push(...result.songs)
    warnings.push(...result.warnings)
  }
  if (songs.length === 0) {
    warnings.push('No song files were found inside this zip.')
  }
  return { songs, schedule: [], warnings, source: fileName }
}

export async function importFile(
  file: File,
  options: ImportOptions = {},
): Promise<ImportResult> {
  const ext = extensionOf(file.name)
  try {
    switch (ext) {
      case 'tworship': {
        const parsed = await parseTworshipFile(file)
        return {
          songs: parsed.content.songs,
          schedule: parsed.content.schedule,
          warnings: parsed.warnings,
          source: file.name,
        }
      }
      case 'ews':
      case 'ewsx': {
        const parsed = await parseEwsFile(file)
        return {
          songs: [],
          schedule: parsed.schedule,
          warnings: parsed.warnings,
          source: file.name,
        }
      }
      case 'xml': {
        return importXmlText(await file.text(), file.name)
      }
      case 'txt': {
        const parsed = parseTextSong(
          await file.text(),
          baseName(file.name).replace(/\.txt$/i, ''),
        )
        if (!parsed.song) return empty(file.name, parsed.warnings)
        return {
          songs: [parsed.song],
          schedule: [],
          warnings: parsed.warnings,
          source: file.name,
        }
      }
      case 'db':
      case 'sqlite':
      case 'sqlite3': {
        const buffer = new Uint8Array(await file.arrayBuffer())
        const parsed = await parseSqliteSongs(buffer, options.wasmUrl)
        return {
          songs: parsed.songs,
          schedule: [],
          warnings: parsed.warnings,
          source: file.name,
        }
      }
      case 'zip': {
        return importZipFile(file, file.name)
      }
      default:
        return empty(
          file.name,
          [`Files ending .${ext || '(none)'} are not supported yet.`],
        )
    }
  } catch (error) {
    return empty(file.name, [
      `Could not read ${file.name}: ${error instanceof Error ? error.message : 'unknown error'}`,
    ])
  }
}

export async function downloadTworship(options: {
  title: string
  kind: TworshipKind
  songs: Song[]
  schedule: ScheduleItem[]
}): Promise<void> {
  const blob = await buildTworshipFile(options)
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = `${options.title.replace(/[^a-z0-9]+/gi, '-').replace(/^-+|-+$/g, '') || 'true-worship'}.tworship`
  anchor.click()
  URL.revokeObjectURL(url)
}
