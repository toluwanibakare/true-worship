# Content API

How True Worship gets Bible text and lyrics, and what it will never
do with them. The code lives with its feature: Bible calls in
`src/features/bible/api.ts`, lyrics calls in `src/features/songs/api.ts`.

## Bible: versions and passages

Live source: **bible-api.com** (Tim Morgan). Free, no key, and its
catalogue is public-domain translations only.

| What | Call |
| --- | --- |
| Version list | `GET https://bible-api.com/data` → `{ translations: [{ identifier, name, language, language_code, license }] }` |
| Passage | `GET https://bible-api.com/{reference}?translation={id}` → `{ reference, verses: [{ book_name, chapter, verse, text }], text, translation_name }` |

Rules the code follows:

- Lookups run on an explicit button press, never per keystroke. The
  service allows 15 requests per 30 seconds per IP.
- Search in the Scriptures tab matches by words: every typed word
  must appear somewhere in the reference or the text, so "loved
  world" finds verses containing both words, the way the Scriptures
  search behaves.
- The + button at the bottom of the side panel adds a scripture by
  hand (translation, reference, text). Added scriptures live in the
  session and preview like any other row; saving them into the
  library arrives with SQLite storage.
- Never use it to download a whole Bible; the service asks clients
  not to, and it is a hobby server that goes down. Passages are
  cached for the session, the version list falls back to KJV and WEB,
  and the bundled demo passage stays as the offline fallback.
- A looked-up passage opens one slide per verse, each headed with
  its own reference.

Not in this catalogue, and not pretended otherwise: Nigerian-language
translations (Yoruba, Hausa, Igbo, Pidgin) and copyrighted
translations (NIV, ESV, NKJV, NLT, NASB). Nigerian languages arrive
as downloadable eBible / SWORD packs held in SQLite; copyrighted
translations only ever arrive through a licensed route such as
API.Bible with a key.

## Lyrics: search

Live source: **LRCLIB** (lrclib.net). Free, no key for reads.

| What | Call |
| --- | --- |
| Search tracks | `GET https://lrclib.net/api/search?q={query}` |
| One track | `GET https://lrclib.net/api/get/{id}` |

Each track carries trackName, artistName, albumName, instrumental,
plainLyrics and syncedLyrics (LRC). Plain lyrics are preferred;
synced lyrics have their timestamps stripped. Blank-line stanzas
become verses. Instrumentals and tracks with no lyric text are left
out.

Licensing, stated in the panel wherever results appear: LRCLIB
lyrics are community-contributed and **not rights-cleared**. Finding
a lyric here does not licence projecting it in church. Results enter
the library with source `community`, never as public domain, and a
copyrighted lyric still needs a licence; CCLI SongSelect is the legal
route for licensed churches. Public-domain hymns stay the only lyrics
the app itself vouches for.

## Later

- Bible packs (eBible / SWORD) downloaded into SQLite for offline use.
- API.Bible with a key for copyrighted translations under licence.
- Community songbook sync, which is where churches share corrections
  to lyrics they already hold rights to use.

## Bible: downloadable Bibles (full text, offline)

Adding a Bible from "More Available…" downloads the whole translation
once and keeps it on the computer (IndexedDB, database `tw-bibles`), so
the Scriptures table lists every verse and search covers all of them
without a network. Code: `src/features/bible/packs.ts`.

Source: the `scrollmapper/bible_databases` project on GitHub, which
publishes each translation as one JSON file
(`formats/json/<Name>.json`, about 8 MB, 31,102 verses for the standard
66-book Bible). The project's catalogue mixes licences, so the app only
offers an allowlist of translations that are public domain or dedicated
to it:

King James Version, American King James Version, American Standard
Version (1901), Berean Standard Bible, Open English Bible, Webster's
Bible, Darby Bible (1889), Young's Literal Translation (1898), Geneva
Bible (1599), Tyndale Bible, Wycliffe Bible and Douay-Rheims
(Challoner). Each file was checked for the full verse count and for
clean text.

Rules the code follows:

- Only the versions the user adds are downloaded, one at a time, with a
  progress figure.
- A copyrighted translation is never offered here. It only arrives
  through a licensed route.
- The bible-api.com lookups above stay for versions without a download
  ("Online lookup only" in the same dialog).
- Typing a reference such as John 3:16 or 1 Cor 13:4-7 and pressing
  Enter jumps to it in a downloaded Bible without going online.
