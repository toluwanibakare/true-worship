import type { Song } from '../../shared/lib/types'
import {
  makeSong,
  parseTaggedSections,
  sectionsToVerses,
} from './songText'

/**
 * Song libraries stored as SQLite databases: OpenLP's songs.sqlite and
 * any EasyWorship-era database that turns out to be SQLite (checked by
 * the SQLite magic header, never by extension alone).
 *
 * No single schema is assumed. The importer inspects the database,
 * then reads it heuristically:
 *  - a table with a title-like column plus a lyrics-like column gives
 *    one song per row, lyrics split on blank lines or [V1] tags;
 *  - a verse table (song id column plus text column, optional tag
 *    column) gives one song per id, verses grouped in row order;
 *  - an author-like column in the same row is picked up when present.
 * Tables and columns it cannot map are reported, not silently dropped.
 */

const SQLITE_MAGIC = 'SQLite format 3\0'

type TableInfo = {
  name: string
  columns: string[]
}

function isTitleColumn(column: string): boolean {
  return /^(title|name|song_title|songname)$/i.test(column)
}

function isTextColumn(column: string): boolean {
  return /(lyric|word|text|content|body)/i.test(column) && !/search/i.test(column)
}

function isSongIdColumn(column: string): boolean {
  return /^(song_id|songid|song)$/i.test(column) || /song.?id/i.test(column)
}

function isTagColumn(column: string): boolean {
  return /^(tag|verse_tag|verse|section)$/i.test(column)
}

function isAuthorColumn(column: string): boolean {
  return /(author|writer|composer)/i.test(column)
}

function textToVerses(text: string): Song['verses'] {
  if (/^\s*\[[A-Za-z]+\d*\]\s*$/m.test(text)) {
    return sectionsToVerses(parseTaggedSections(text))
  }
  return text
    .split(/\n\s*\n/)
    .map((chunk) => chunk.split('\n').map((line) => line.trim()).filter(Boolean))
    .filter((lines) => lines.length > 0)
    .map((lines, index) => ({ label: `Verse ${index + 1}`, lines }))
}

function asString(value: unknown): string {
  if (typeof value === 'string') return value
  if (typeof value === 'number') return String(value)
  return ''
}

export type SqliteResult = {
  songs: Song[]
  tables: string[]
  warnings: string[]
}

export async function parseSqliteSongs(
  data: Uint8Array,
  wasmUrl?: string,
): Promise<SqliteResult> {
  const warnings: string[] = []
  const header = new TextDecoder().decode(data.slice(0, 16))
  if (header !== SQLITE_MAGIC) {
    throw new Error(
      'This file is not a SQLite database. Older EasyWorship databases use other formats; export them through OpenLP first, then import the resulting songs.sqlite.',
    )
  }
  // sql.js is loaded lazily so the main bundle stays small until an
  // actual database import happens.
  const initSqlJs = (await import('sql.js')).default
  const SQL = await initSqlJs(
    wasmUrl ? { locateFile: () => wasmUrl } : undefined,
  )
  const db = new SQL.Database(data)
  try {
    const tableRows = db.exec(
      "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'",
    )[0]?.values ?? []
    const tables: TableInfo[] = []
    for (const row of tableRows) {
      const name = String(row[0])
      const columns = (db.exec(`PRAGMA table_info("${name}")`)[0]?.values ?? []).map(
        (columnRow) => String(columnRow[1]),
      )
      tables.push({ name, columns })
    }
    const songs: Song[] = []
    const seenTitles = new Set<string>()

    // Verse tables first: they carry the richest structure.
    for (const table of tables) {
      const idColumn = table.columns.find(isSongIdColumn)
      const textColumn = table.columns.find(isTextColumn)
      const tagColumn = table.columns.find(isTagColumn)
      if (!idColumn || !textColumn) continue
      const titleTable = tables.find((candidate) =>
        candidate.columns.some(isTitleColumn),
      )
      const titleColumn = titleTable?.columns.find(isTitleColumn)
      const rows = db.exec(
        `SELECT * FROM "${table.name}" ORDER BY rowid`,
      )[0]
      if (!rows) continue
      const columnIndex = new Map(table.columns.map((column, index) => [column, index]))
      const grouped = new Map<string, { tag: string; lines: string[] }[]>()
      const order: string[] = []
      for (const row of rows.values) {
        const songId = asString(row[columnIndex.get(idColumn)!])
        const text = asString(row[columnIndex.get(textColumn)!])
        if (!songId || !text.trim()) continue
        const tag = tagColumn ? asString(row[columnIndex.get(tagColumn)!]) : ''
        if (!grouped.has(songId)) {
          grouped.set(songId, [])
          order.push(songId)
        }
        grouped.get(songId)!.push({
          tag: tag || `V${grouped.get(songId)!.length + 1}`,
          lines: text.split('\n').map((line) => line.trim()).filter(Boolean),
        })
      }
      for (const songId of order) {
        let title = songId
        let author = ''
        if (titleTable && titleColumn) {
          const idColumnInTitle = titleTable.columns.find(
            (column) => column === 'id' || isSongIdColumn(column),
          )
          const query = idColumnInTitle
            ? `SELECT * FROM "${titleTable.name}" WHERE "${idColumnInTitle}" = ? LIMIT 1`
            : `SELECT * FROM "${titleTable.name}" LIMIT 1`
          const result = idColumnInTitle
            ? db.exec(query, [songId])[0]
            : db.exec(query)[0]
          if (result?.values[0]) {
            const titleIndex = titleTable.columns.indexOf(titleColumn)
            title = asString(result.values[0][titleIndex]) || songId
            const authorColumn = titleTable.columns.find(isAuthorColumn)
            if (authorColumn) {
              author = asString(result.values[0][titleTable.columns.indexOf(authorColumn)])
            }
          }
        }
        if (seenTitles.has(title.toLowerCase())) continue
        seenTitles.add(title.toLowerCase())
        songs.push(
          makeSong(
            title,
            grouped.get(songId)!.map((verse, index) => ({
              label: verse.tag.match(/^[A-Za-z]+\d*$/)
                ? verse.tag
                : `Verse ${index + 1}`,
              lines: verse.lines,
            })),
            { author },
          ),
        )
      }
    }

    // Row-per-song tables: title plus lyrics in the same row.
    for (const table of tables) {
      const titleColumn = table.columns.find(isTitleColumn)
      const textColumn = table.columns.find(isTextColumn)
      if (!titleColumn || !textColumn) continue
      const authorColumn = table.columns.find(isAuthorColumn)
      const result = db.exec(`SELECT * FROM "${table.name}"`)[0]
      if (!result) continue
      for (const row of result.values) {
        const title = asString(row[table.columns.indexOf(titleColumn)])
        const text = asString(row[table.columns.indexOf(textColumn)])
        if (!title.trim() || !text.trim()) continue
        if (seenTitles.has(title.toLowerCase())) continue
        seenTitles.add(title.toLowerCase())
        songs.push(
          makeSong(title, textToVerses(text), {
            author: authorColumn
              ? asString(row[table.columns.indexOf(authorColumn)])
              : '',
          }),
        )
      }
    }

    if (songs.length === 0) {
      warnings.push(
        `No songs could be mapped from this database. Tables found: ${tables
          .map((table) => `${table.name} (${table.columns.join(', ')})`)
          .join('; ')}. If you know this schema, open an issue with the table list and it gets added.`,
      )
    }
    return { songs, tables: tables.map((table) => table.name), warnings }
  } finally {
    db.close()
  }
}
