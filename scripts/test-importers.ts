/**
 * Importer smoke tests, run in plain Node (no browser, no test runner).
 *
 *   npx tsc scripts/test-importers.ts src/features/importer/songText.ts \
 *     src/features/importer/opensong.ts src/features/importer/openlyrics.ts \
 *     src/features/importer/textSong.ts src/features/importer/tworship.ts \
 *     src/features/importer/ews.ts src/features/importer/sqlite.ts \
 *     --module commonjs --target es2020 --lib es2020,dom \
 *     --esModuleInterop --skipLibCheck --moduleResolution node \
 *     --outDir /tmp/tw-import-test
 *   node /tmp/tw-import-test/test-importers.js
 */
import * as assert from 'node:assert'
import * as fs from 'node:fs'
import * as path from 'node:path'
import * as os from 'node:os'

import { parseOpenSongXml } from '../src/features/importer/opensong'
import { parseOpenLyricsXml } from '../src/features/importer/openlyrics'
import { parseTextSong } from '../src/features/importer/textSong'
import { buildTworshipFile, parseTworshipFile } from '../src/features/importer/tworship'
import { parseEwsFile } from '../src/features/importer/ews'
import { parseSqliteSongs } from '../src/features/importer/sqlite'

const samples = fs.existsSync(path.join(process.cwd(), 'samples'))
  ? path.join(process.cwd(), 'samples')
  : path.join(__dirname, '..', 'samples')

async function main() {
  // OpenSong: presentation order V1 V2 C, chord lines skipped.
  const opensong = fs.readFileSync(path.join(samples, 'amazing-grace.opensong.xml'), 'utf8')
  const osParsed = parseOpenSongXml(opensong, 'fallback')
  assert.ok(osParsed.song, 'OpenSong song parsed')
  assert.equal(osParsed.song!.title, 'Amazing Grace')
  assert.equal(osParsed.song!.author, 'John Newton')
  assert.deepEqual(
    osParsed.song!.verses.map((verse) => verse.label),
    ['Verse 1', 'Verse 2', 'Chorus'],
  )
  assert.equal(osParsed.song!.verses[0].lines[1], 'That saved a wretch like me')

  // OpenLyrics: verseOrder v1 v2 c, <br/> line splits.
  const openlyrics = fs.readFileSync(path.join(samples, 'amazing-grace.openlyrics.xml'), 'utf8')
  const olParsed = parseOpenLyricsXml(openlyrics, 'fallback')
  assert.ok(olParsed.song, 'OpenLyrics song parsed')
  assert.deepEqual(
    olParsed.song!.verses.map((verse) => verse.label),
    ['Verse 1', 'Verse 2', 'Chorus'],
  )
  assert.equal(olParsed.song!.verses[0].lines.length, 4)

  // Plain text: Title/Author headers plus [V1]/[V2] sections.
  const text = fs.readFileSync(path.join(samples, 'amazing-grace.txt'), 'utf8')
  const txtParsed = parseTextSong(text, 'fallback')
  assert.ok(txtParsed.song, 'text song parsed')
  assert.equal(txtParsed.song!.title, 'Amazing Grace')
  assert.equal(txtParsed.song!.verses.length, 2)

  // .tworship round trip: build, then parse back.
  const blob = await buildTworshipFile({
    title: 'Sunday Service',
    kind: 'schedule',
    songs: [osParsed.song!],
    schedule: [{ id: 's1', type: 'song', title: 'Amazing Grace', ref: osParsed.song!.id }],
  })
  const roundTripped = await parseTworshipFile(blob)
  assert.equal(roundTripped.title, 'Sunday Service')
  assert.equal(roundTripped.content.songs[0].title, 'Amazing Grace')
  assert.equal(roundTripped.content.schedule[0].title, 'Amazing Grace')

  // Fake .ews: a zip with a media file and an XML part with a title.
  const JSZip = (await import('jszip')).default
  const fakeEws = await new JSZip()
    .file('media/background.jpg', Buffer.from('not a real jpeg'))
    .file('schedule.xml', '<schedule><title>Welcome Slides</title></schedule>')
    .generateAsync({ type: 'nodebuffer' })
  const ews = await parseEwsFile(fakeEws as unknown as Blob)
  assert.ok(ews.entries.includes('media/background.jpg'))
  assert.ok(ews.schedule.some((item) => item.type === 'media'))
  assert.ok(ews.schedule.some((item) => item.title === 'Welcome Slides'))

  // SQLite: a small songs.sqlite-style database made for the test.
  const dbPath = path.join(os.tmpdir(), 'tw-test-songs.sqlite')
  const { execFileSync } = await import('node:child_process')
  execFileSync(
    'python3',
    [
      '-c',
      `
import sqlite3
db = sqlite3.connect(${JSON.stringify(dbPath)})
db.execute('CREATE TABLE songs (id INTEGER PRIMARY KEY, title TEXT, author TEXT)')
db.execute('CREATE TABLE verses (id INTEGER PRIMARY KEY, song_id INTEGER, verse_tag TEXT, verse_text TEXT)')
db.execute("INSERT INTO songs VALUES (1, 'Blessed Assurance', 'Fanny Crosby')")
db.execute("INSERT INTO verses VALUES (1, 1, 'V1', 'Blessed assurance, Jesus is mine')")
db.execute("INSERT INTO verses VALUES (2, 1, 'C', 'This is my story, this is my song')")
db.commit()
`,
    ],
  )
  const sqlite = await parseSqliteSongs(new Uint8Array(fs.readFileSync(dbPath)))
  assert.equal(sqlite.songs.length, 1)
  assert.equal(sqlite.songs[0].title, 'Blessed Assurance')
  assert.equal(sqlite.songs[0].verses.length, 2)
  fs.unlinkSync(dbPath)

  console.log('importer tests: all passed')
}

main().catch((error) => {
  console.error('importer tests FAILED:', error)
  process.exit(1)
})
