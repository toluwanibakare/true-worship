/**
 * Feature: bible — downloadable Bibles ("packs").
 *
 * A pack is a whole translation, stored on this computer once the user
 * adds it, so every verse is listed and searchable offline. Only the
 * versions the user picks are downloaded, one at a time.
 *
 * Source: the scrollmapper/bible_databases project on GitHub, which
 * publishes each translation as one JSON file for exactly this use
 * (https://github.com/scrollmapper/bible_databases, MIT-licensed
 * project). Its catalogue mixes licences, so this list is an allowlist
 * of translations that are public domain or dedicated to it: the user
 * is never offered a copyrighted translation here. Each file was
 * checked for the full verse count and for clean text. Copyrighted
 * translations still only arrive through a licensed route (see
 * docs/content-api.md).
 *
 * Packs live in IndexedDB (a whole Bible is several megabytes, too much
 * for localStorage), under the "tw-bibles" database.
 */

const BASE =
  'https://raw.githubusercontent.com/scrollmapper/bible_databases/master/formats/json/'

export type PackInfo = {
  id: string
  name: string
  language: string
  /** Short name shown with a verse, e.g. KJV. */
  abbr: string
  /** File name on the source, without .json. */
  file: string
}

export const PACKS: PackInfo[] = [
  { id: 'kjv', abbr: 'KJV', name: 'King James Version', language: 'English', file: 'KJV' },
  { id: 'akjv', abbr: 'AKJV', name: 'American King James Version', language: 'English', file: 'AKJV' },
  { id: 'asv', abbr: 'ASV', name: 'American Standard Version (1901)', language: 'English', file: 'ASV' },
  { id: 'bsb', abbr: 'BSB', name: 'Berean Standard Bible', language: 'English', file: 'BSB' },
  { id: 'oeb', abbr: 'OEB', name: 'Open English Bible', language: 'English', file: 'OEB' },
  { id: 'webster', abbr: 'Webster', name: "Webster's Bible", language: 'English', file: 'Webster' },
  { id: 'darby', abbr: 'Darby', name: 'Darby Bible (1889)', language: 'English', file: 'Darby' },
  { id: 'ylt', abbr: 'YLT', name: "Young's Literal Translation (1898)", language: 'English', file: 'YLT' },
  { id: 'geneva1599', abbr: 'Geneva', name: 'Geneva Bible (1599)', language: 'English', file: 'Geneva1599' },
  { id: 'tyndale', abbr: 'Tyndale', name: 'Tyndale Bible (1525/1530)', language: 'English', file: 'Tyndale' },
  { id: 'wycliffe', abbr: 'Wycliffe', name: 'Wycliffe Bible (c. 1395)', language: 'English', file: 'Wycliffe' },
  { id: 'drc', abbr: 'DRC', name: 'Douay-Rheims (Challoner)', language: 'English', file: 'DRC' },
]

/** What is kept for one downloaded Bible: book names, and a row per verse. */
export type StoredPack = {
  id: string
  name: string
  books: string[]
  /** [book index, chapter, verse, text] */
  rows: [number, number, number, string][]
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('tw-bibles', 1)
    request.onupgradeneeded = () => request.result.createObjectStore('packs')
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error ?? new Error('Could not open storage.'))
  })
}

async function withStore<T>(
  mode: IDBTransactionMode,
  run: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('packs', mode)
    const request = run(transaction.objectStore('packs'))
    // Resolve once the transaction has committed (so a write is durable),
    // then release the connection; leaving connections open blocks later
    // upgrades and deletes.
    transaction.oncomplete = () => {
      db.close()
      resolve(request.result)
    }
    transaction.onerror = () => {
      db.close()
      reject(transaction.error ?? request.error ?? new Error('Storage failed.'))
    }
    transaction.onabort = transaction.onerror
  })
}

export const savePack = (pack: StoredPack) => withStore('readwrite', (store) => store.put(pack, pack.id))
export const readPack = (id: string) =>
  withStore<StoredPack | undefined>('readonly', (store) => store.get(id))
export const removePack = (id: string) => withStore('readwrite', (store) => store.delete(id))
export const listPackIds = () => withStore<IDBValidKey[]>('readonly', (store) => store.getAllKeys())

/**
 * Download one translation and turn it into a StoredPack. `onProgress`
 * gets 0 to 1 when the server says how big the file is. Throws a plain
 * message when the download or the shape of the file is not what was
 * expected.
 */
export async function downloadPack(
  info: PackInfo,
  onProgress?: (fraction: number) => void,
): Promise<StoredPack> {
  const response = await fetch(`${BASE}${info.file}.json`)
  if (!response.ok) {
    throw new Error(`Could not download ${info.name} (the server said ${response.status}).`)
  }
  const total = Number(response.headers.get('content-length')) || 0
  const reader = response.body?.getReader()
  let text: string
  if (reader) {
    const chunks: Uint8Array[] = []
    let received = 0
    for (;;) {
      const { done, value } = await reader.read()
      if (done) break
      chunks.push(value)
      received += value.length
      if (total > 0) onProgress?.(Math.min(received / total, 1))
    }
    const joined = new Uint8Array(received)
    let at = 0
    for (const chunk of chunks) {
      joined.set(chunk, at)
      at += chunk.length
    }
    text = new TextDecoder().decode(joined)
  } else {
    text = await response.text()
  }

  const data = JSON.parse(text) as {
    books?: { name?: string; chapters?: { chapter?: number; verses?: { verse?: number; text?: string }[] }[] }[]
  }
  if (!Array.isArray(data.books)) throw new Error(`${info.name} arrived in a shape I do not recognise.`)
  const books: string[] = []
  const rows: StoredPack['rows'] = []
  data.books.forEach((book, bookIndex) => {
    books.push(String(book.name ?? `Book ${bookIndex + 1}`))
    for (const chapter of book.chapters ?? []) {
      for (const verse of chapter.verses ?? []) {
        const clean = String(verse.text ?? '')
          .replace(/<[^>]*>/g, '')
          .replace(/\s+/g, ' ')
          .trim()
        if (clean) rows.push([bookIndex, Number(chapter.chapter), Number(verse.verse), clean])
      }
    }
  })
  if (rows.length < 1000) throw new Error(`${info.name} arrived incomplete (${rows.length} verses).`)
  return { id: info.id, name: info.name, books, rows }
}

/** Canonical order of the 66 books, for sorting verses that did not come from a pack. */
export const BOOK_ORDER = [
  'Genesis', 'Exodus', 'Leviticus', 'Numbers', 'Deuteronomy', 'Joshua', 'Judges', 'Ruth',
  '1 Samuel', '2 Samuel', '1 Kings', '2 Kings', '1 Chronicles', '2 Chronicles', 'Ezra',
  'Nehemiah', 'Esther', 'Job', 'Psalms', 'Proverbs', 'Ecclesiastes', 'Song of Solomon',
  'Isaiah', 'Jeremiah', 'Lamentations', 'Ezekiel', 'Daniel', 'Hosea', 'Joel', 'Amos',
  'Obadiah', 'Jonah', 'Micah', 'Nahum', 'Habakkuk', 'Zephaniah', 'Haggai', 'Zechariah',
  'Malachi', 'Matthew', 'Mark', 'Luke', 'John', 'Acts', 'Romans', '1 Corinthians',
  '2 Corinthians', 'Galatians', 'Ephesians', 'Philippians', 'Colossians', '1 Thessalonians',
  '2 Thessalonians', '1 Timothy', '2 Timothy', 'Titus', 'Philemon', 'Hebrews', 'James',
  '1 Peter', '2 Peter', '1 John', '2 John', '3 John', 'Jude', 'Revelation',
]

/** A book name as typed ("1 Cor", "jn.") reduced to letters and digits, for matching. */
export const bookKey = (name: string) => name.toLowerCase().replace(/[^a-z0-9]/g, '')
