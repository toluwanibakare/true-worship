# File formats in True Worship

## True Worship's own format: .twp

`.twp` (True Worship Package) is True Worship's native file. It is a ZIP archive, so any
unzip tool can look inside it:

```
manifest.json   { format: "true-worship", version: 1, kind, title,
                  created, app, appVersion }
content.json    { songs: Song[], schedule: ScheduleItem[], theme? }
media/          reserved for a later version
```

Kinds: `schedule` (a whole service, with its songs embedded so the file
is self-contained), `song` (one song), `library` (many songs, no
schedule). Readers accept version 1 and warn, never fail, on a newer
version. Version 1 does not bundle media files yet: media schedule items
keep their file names, and the importer warns to re-link them.

Why `.twp` and not `.trw`: `.trw` is already taken, mainly by
TrailerWIN vehicle data files and Trimble RealWorks, and `.tws`, `.twf`
and `.twx` are taken too (TextPad, Casio and ESRI, IBM and ThingWorx). A
search found nothing using `.twp`, and it is short. Files saved by
earlier versions use `.tworship`; those still import, and everything new
is saved as `.twp`. This is a search, not a registry check, so if a real
clash turns up the extension can change without touching the format
inside.

## Import matrix

| Source | Status | Notes |
| --- | --- | --- |
| .twp (and older .tworship) | Full | Round-trips through Export and Import. |
| OpenSong .xml | Full | Title, author, copyright, presentation order, [V1]/[C]/[B] sections. Chord lines (starting with a dot) are skipped. |
| OpenLyrics .xml (0.8) | Full | Titles, authors, copyright, verseOrder, verses with `<br/>` lines. Chord names are dropped; instrumental parts are skipped with a warning. |
| Plain .txt songs | Full | `Title:`/`Author:`/`Copyright:`/`CCLI:` headers, [V1] tags, named headers, or blank-line verses. |
| .zip of song files | Full | A .twp file, or a zip of OpenSong/OpenLyrics .xml files. |
| EasyWorship .ews / .ewsx | Partial | The file is a ZIP, and packed media plus titles from XML/JSON parts are harvested. The schedule payload inside is not a published format, so full-fidelity import waits on a real sample file: open an issue and attach one (with permission to share it) and the parser gets finished against it. Song lyrics live in the song database, not the schedule, so import Songs.db too. |
| SQLite song databases (.db, .sqlite) | Heuristic | OpenLP's songs.sqlite and any SQLite-based library. The importer inspects tables and reads title-plus-lyrics rows and verse tables (song id, text, tag) without assuming one schema, and reports tables it cannot map. |
| EasyWorship Songs.db (non-SQLite) | Not yet | Older databases use other formats. Export them through OpenLP first, then import the resulting songs.sqlite. SongWords.dat is the lyrics companion file in newer versions; its format is undocumented, which is why the OpenLP route is the documented path for now. |

## How imports behave

- A file that cannot be read produces warnings, never a crash, and
  never a half-imported song.
- Imported songs are merged by title: a song already in the library is
  not duplicated. Schedule items are appended, with fresh ids on
  collision.
- Nothing here copies EasyWorship's, OpenLP's, or OpenSong's code.
  Only the user's own files are read, which is interoperability, not
  copying. Song licensing rules from CONTRIBUTING.md still apply:
  only bundle lyrics the church owns, that are public domain, or that
  it has permission to share.
