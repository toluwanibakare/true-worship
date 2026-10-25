# Changelog

All notable changes to True Worship are recorded here. The format follows
Keep a Changelog, and versioning is exploratory while the project is 0.x.

## [Unreleased]

### Added

- `web/`: a static website for True Worship in its own theme, with
  features, screenshots of the real app, how a service runs, moving
  over from other tools, the Community Songbook, content licensing,
  and run instructions. Screenshots are embedded in `index.html`.

## [0.15.0] - 2026-10-25

### Added

- Whole Bibles on the computer. "More Available…" now offers twelve
  public-domain Bibles (King James, American King James, American
  Standard, Berean Standard, Open English, Webster, Darby, Young's
  Literal, Geneva, Tyndale, Wycliffe, Douay-Rheims) to download. Only
  the ones you add are downloaded, once each, and kept for offline use.
  A downloaded version lists every verse (31,102 for the standard
  Bible) and the search box searches all of them; typing a reference
  such as Psalm 23:1-3 and pressing Enter jumps straight to it. The
  other versions on the list stay online lookups. See
  `docs/content-api.md`.
- Left and Right arrows step through the verses on the screen while
  something is live (as long as you are not typing in a field or have a
  dialog open); with nothing live they still move through the
  schedule.
- Sortable columns in the Songs and Scriptures tables: click a header
  to sort, click again to reverse, once more to clear.

### Changed

- The Songs and Scriptures tables are one shared table: compact
  single-line rows, a blue selected row, and only the visible rows
  drawn, so a whole Bible scrolls smoothly.
- The online lyrics search in the Songs tab starts folded away under
  the table.

### Fixed

- The Bible download and the list of downloaded versions leaked database
  connections; they are now closed after each use.
- Web browser address bar: a page finishing loading while you type no
  longer overwrites what you typed, a search entered before the page is
  ready is kept and run as soon as it is, and a page that fails to load
  now says so (for example no internet) instead of staying silent.

## [0.14.0] - 2026-10-25

### Added

- Transitions on the live output. A new background, layout or font
  (including Black and Logo) fades in over the old one; when only the
  words change, the old words fade out and the new ones fade in on the
  same background, so a moving background carries on without restarting;
  Clear fades the words away. Live Settings has a Transition choice:
  Off (cut), Fast (150 ms), Normal (300 ms, the default) or Slow
  (600 ms).

### Changed

- A scripture's reference now sits under the verse on the right, with
  the version in brackets: "John 3:16 (KJV)". It uses the version the
  verse was read from, so a World English Bible verse says (WEB).

### Fixed

- The reference and version were missing from the display for verses
  from the Scriptures table.
- The first slide sent after the live window opened could be lost, so
  the projector sat on "Waiting for the operator to go live" until the
  next click. The main process now remembers the last slide and the
  live window collects it as it starts.
- Every Go Live re-applied the live window's size, fullscreen and
  always-on-top settings even when nothing had changed, which is slow
  on some systems and delayed switching. They are now applied only
  when the settings change.

## [0.13.0] - 2026-10-25

### Added

- Web browser: the Web button opens a built-in browser (back, forward,
  home, reload, an address bar that also searches). Go Live sends the
  page, exactly as it moves, to the live output until Stop Live, Clear
  or anything else goes live. See `docs/web-browser.md`.
- New and Open are menus. New: New Schedule, New Song…. Open: Open
  Schedule…, Import Songs and Files…. Save is greyed out until the
  schedule or library has changed since it was last saved or opened.
- Song editor: New Song… and Edit Song… (also from a right-click or the
  gear menu in the Songs side panel), with title, author, copyright and
  words, where a blank line starts a slide and a line like "Chorus"
  names it. Delete from the same menus.
- Search box with a field menu in the Songs (Any Field, Title, Author,
  Lyrics) and Scriptures (Any Field, Reference, Scripture) side panels,
  with a clear button. In Scriptures, typing a reference such as
  John 3:16 and pressing Enter looks it up and adds its verses as rows.
- `docs/roadmap.md`: a feature audit with the missing pieces ranked.

### Changed

- The Scriptures side panel lists only the versions you have added
  (King James to begin with), plus "More Available…", which fetches the
  list of versions only when opened and adds the ones you pick. The
  separate look-up bar is gone.
- Songs table gains a Copyright column. Collections and My Collections
  are removed from the Songs and Scriptures side panels until they do
  something.

## [0.12.0] - 2026-10-25

### Added

- Content API: Bible versions and passages from bible-api.com
  (public-domain translations, one slide per verse), and online
  lyrics search from LRCLIB, with results marked as community
  contributions, not rights-cleared lyrics. See
  `docs/content-api.md`.
- Scriptures tab: a + button at the bottom of the side panel adds a
  scripture by hand (translation, reference, text), and search now
  matches by words, so every typed word must appear in the reference
  or the text.

## [0.11.0] - 2026-10-25

### Added

- Scriptures show their reference under the words: book, chapter,
  verse and version, for example "John 3:16 · KJV". It appears on the
  preview, the live monitor, the slide thumbnails and the projector,
  and goes away with Black, Logo or Clear.
- Lower Third and Upper Third are subtitle layouts: centred words with
  no band, a smaller font, and only a soft fade at the screen edge for
  contrast. Songs split automatically into two-line slides, each piece
  keeping its verse name ("Verse 1", "Verse 1 · 2"), so the verse
  shortcuts still work. Scriptures stay in one piece and the font
  shrinks only as far as needed to fit three lines.

### Changed

- Switching layout returns the preview to the first slide, and
  clicking a verse in the schedule lands on its first two-line piece.

## [0.10.0] - 2026-10-25

### Added

- A real Media library. The side panel filters by All, Videos, Images
  and Audio; "Add media…" copies files into the app's data folder.
  Click an image or video to preview it and double-click to put it
  live; click an audio track to play it. See `docs/media.md`.
- Icons beside every entry in the Media and Backgrounds side panels
  (Songs and Scriptures stay plain).
- Backgrounds side panel: All, Photos, Motion, Classic and Added, with
  a search box and a count, the same frame as Songs and Scriptures.

### Changed

- Layouts are small thumbnails like Backgrounds, each drawn with the
  real slide renderer in your current theme and background.

### Fixed

- Slide labels in the Preview pane follow what is being previewed: a
  library song keeps its verse names, and a passage or media file is
  numbered, instead of borrowing the labels of the selected schedule
  song.

## [0.9.0] - 2026-10-25

### Added

- Backgrounds: eight generated photos (Sunrise Peaks, Ocean Dusk,
  Calvary Sunset and more), nine seamless motion loops (Drifting
  Clouds, Aurora, Rising Lights and more) and "Add photos or
  videos…" for your own, shown as small thumbnail grids. Run
  `npm run backgrounds` once after cloning to generate the built-in
  set; everything in it is drawn by the script, so it is original work.
- Slide text stays readable on any background: forced to white over a
  photo, video or gradient, with a soft scrim and a shadow behind the
  words.
- Bold switch in the Themes tab. Slide text is bold by default.
- Double-click a song row to go live, as with a Scriptures row.

### Changed

- Deep Rays is the default background, and slide text is bigger (64
  against 44) and heavier, with less empty margin around it.
- The projector window draws with the same renderer as the monitors,
  scaled to fit, so the room sees exactly what the preview shows.
- True Worship's own file format is now `.twp` (True Worship Package),
  shorter than `.tworship`. Older `.tworship` files still import.
- The window icon and favicon are the object logo.

### Fixed

- With no projector connected, the live output covered the operator's
  screen. It now opens as a normal window, and moves to a projector
  when one is plugged in. Opening or updating it no longer takes
  keyboard focus away from the operator window.

## [0.8.0] - 2026-10-25

### Added

- Drag a schedule item up or down to reorder it; a blue line shows
  where it will land.
- Double-click a slide in the Preview pane to send it live on that
  slide.
- The toolbar's Live button turns red and blinks while something is
  on air (live, or held on Black or Logo), and Clear is muted when
  there is nothing to clear.
- Preview and Live each have their own height divider, so the two
  output monitors can be sized independently.

### Changed

- Alerts opens as a dialog from the Alerts button (and its
  shortcut). Display and NDI moved into Live Settings in the Live
  menu, and Import into the File menu, each in its own dialog. The
  resource strip now holds only Songs, Scriptures, Media, Themes,
  Backgrounds, Layouts and Songbook.
- The title bar no longer shows the live status; the footer shows
  who built the app instead of the theme and live state.

## [0.7.0] - 2026-10-25

### Added

- Splash screen on launch: the True Worship logo, tagline, version
  and licence, shown while the main window loads. The app then opens
  maximized.
- One title bar across the top, replacing the native title bar and
  menu: window controls, menus (File, Edit, Live, View, Help), the
  app name centred, then Shortcuts, a sliding Light / Dark / System
  switch, the live status and a GitHub link. Black in light mode,
  white in dark mode.
- Preview and Live arranged side by side:
  the Preview pane lists the item's slides as labelled blocks
  (Chorus in purple, Verse in blue), the Live pane shows the live
  item's slides as a thumbnail grid with the on-screen slide
  outlined, and Preview Output and Live Output monitors with slide
  counters and Prev / Next sit underneath.
- Draggable dividers between the schedule, the preview and live
  panes, the output monitors and the resources strip. Sizes are
  remembered; double-click a divider to reset it, or focus it and
  use the arrow keys.
- Toolbar order: New, Open, Save, Store, Web,
  Remote on the left; Go Live, Alerts, Logo, Black, Clear and Live
  on the right. Live opens the output window. Store, Web and Remote
  are greyed out until those features exist.
- Resources as a tab strip (Songs, Scriptures, Media and the rest)
  with a search box and source list beside each table and a count
  along the bottom.
- Schedule rows with larger thumbnails and a gear menu for Add,
  Move Up, Move Down and Remove.
- Version number now has one source, package.json: the footer, the
  .tworship manifest and the splash all read it.

### Changed

- The Bible tab is now called Scriptures. The Schedule menu is now
  Edit, with the same items.
- Window icon and README logo use the new object logo.

### Fixed

- The desktop app crashed on launch ("screen module can't be used
  before the app ready event"); the display-removed listener now
  registers after the app is ready.

## [0.6.0] - 2026-10-25

### Added

- Display font picker in the Themes tab. Each theme now carries
  its own display font, picked from a list led by Calibri and
  Arial, with a live preview line in the theme's
  colours. The chosen font flows to the preview, the live monitor
  and the projector window, so the theme font decides what the
  room sees.

## [0.5.0] - 2026-10-25

### Changed

- Schedule controls tidied into one toolbar row: Add item, move
  up, move down, Remove, with the arrows and Remove greyed out
  when nothing is selected, and the item count moved to the panel
  footer. Buttons no longer wrap their labels.
- Song list and Bible list are tables now: songs show Title, Author, Source; scripture
  shows Translation, Reference, Scripture. Click a row to preview
  it; the search box filters the table, and Bible keeps its Show
  button for an exact reference.
- Live column arranged: the header names the live item and its
  current slide, Prev slide and Next slide buttons sit under the
  Go Live, Logo, Black and Clear row (greyed out at the ends or
  when nothing is live), and each slide in the live list shows its
  label plus its first line.

## [0.4.0] - 2026-10-25

### Changed

- Schedule panel reworked: each row has
  a thumbnail, the title, and a notes line underneath (type and
  reference, in the small italic notes style), songs expand with an
  arrow to show their slides, clicking a slide selects it in the
  preview, and double-clicking a row sends that item live from its
  first slide. The toolbar above the list also shows the item count,
  and an empty schedule explains how to fill it.
- Toolbar now splits in two: New, Open, Save
  and Add Item on the left, Go Live, Alerts, Logo, Black and Clear
  on the right, each as an icon above a short label. The Go Live
  button that sat under the preview is gone, so the live controls
  live on the right only: the toolbar's right group and the live
  column.
- Pane titles are filled bars now, and the header carries the
  subtle gradient.

### Added

- Fonts: the interface uses Segoe UI (the Windows system font),
  and slide text uses Calibri, with Arial as the fallback in the
  stack. Themes carry a font family now, and it travels with the
  live payload, so the projector shows the same font as the
  preview.

## [0.3.2] - 2026-10-25

### Added

- Keyboard shortcuts for worship operators: Page Down goes live,
  Ctrl + B toggles black, Ctrl + L toggles logo, Ctrl + C toggles
  the live text (a second press restores it), Up/Down move slides,
  Left/Right move schedule items, Home/End jump to the first/last
  slide, Ctrl + O opens, Ctrl + S saves, Ctrl + Del deletes the
  selected schedule item, Ctrl + F/M/N open the Alerts tab, and
  V/C/number + Enter jumps to a verse, chorus or slide number.
  N, P, Space, Backspace and Page Up also step slides. See
  `docs/keyboard-shortcuts.md`.
- Keyboard Shortcuts dialog (Help menu, header button, or `?`),
  with the full grouped list; menu items show their shortcut on
  the right. Shortcuts never fire while typing in a field, and
  Ctrl + C never hijacks Copy when text is selected.

## [0.3.1] - 2026-10-25

### Fixed

- Main window arrangement fixed: schedule, preview and live output
  are three full-height columns, and the resources live as a strip
  across the bottom. The previous 0.3.0 layout put
  the resources in the right column and squeezed live into a small
  box above them; live is no longer smaller than it should be.
- Live column is a full workstation now: a 16:9 output monitor at
  the column's full width, GO LIVE and Logo, Black, Clear under it,
  and the live item's slides below, so the operator can step
  through the service from the live column itself. Clicking a live
  slide sends it out at once.

## [0.3.0] - 2026-10-25

### Changed

- Main window rebuilt on the conventional worship-software layout:
  menu bar (File, Schedule, Live, View)
  and toolbar (New, Open, Save, Add Item, Go Live, Alerts, Logo,
  Black, Clear) on top, schedule down the left with type marks and
  move/remove controls, preview in the centre with a slide selector
  (song verses keep their names) and a big GO LIVE button, live
  output up the right with a LIVE badge, resources tabbed under it,
  and a status bar at the bottom. Own code and styling throughout.
- File menu and toolbar Open now open a service or library file
  (.tworship, .ews, .ewsx, .xml, .txt, .db, .zip); Save writes the
  current service as .tworship; File also exports the song library.

### Added

- Light, dark and system themes. System follows the operating system and keeps following it
  when the OS setting changes; the choice is remembered between runs.

## [0.2.0] - 2026-10-25

### Added

- File format importation: OpenSong XML, OpenLyrics XML, plain text
  songs, zips of song files, SQLite song databases (OpenLP songs.sqlite
  and friends, read heuristically without assuming one schema), and
  EasyWorship .ews/.ewsx schedule harvesting (packed media plus titles
  from XML/JSON parts). See `docs/file-formats.md`.
- True Worship's own format, `.tworship`: a zip with a manifest and
  songs plus schedule as JSON, in schedule, song, and library kinds.
  `.trw` was checked and is already taken (TrailerWIN, Trimble
  RealWorks); `.tworship` is free, so it is the extension.
- Pre-installed backgrounds: eight CSS still looks built into the app
  and three looping motion backgrounds (Rays Drift, Golden Zoom, Ember
  Rise), generated by `assets/backgrounds/generate.py` with Pillow and
  ffmpeg. See `docs/backgrounds.md`.
- Pre-installed slide layouts: Full Screen, Lower Third, Upper Third,
  Left Panel, Centre Card. Preview and projector always match.
- Marquee alert: a scrolling announcement strip across the top of the
  live output, with slow, normal, and fast speeds, until hidden.
- Importer smoke tests (`scripts/test-importers.ts`) covering OpenSong,
  OpenLyrics, text, .tworship round trip, fake .ews, and SQLite.
- Sample files in `samples/` (Amazing Grace in OpenSong, OpenLyrics,
  and text forms).

### Known gaps

- No saved storage yet: songs and schedules do not persist between runs.
  SQLite storage is the next milestone.
- Full-fidelity .ews schedule parsing and non-SQLite Songs.db reading
  need real sample files to finish (see `docs/file-formats.md`).
- The community songbook sync service is not built yet.
- Installer packaging (Windows, macOS, Linux) is not wired up yet.
- NDI capture colours on real hardware still need a first live run to
  confirm.

### Added

- Electron app scaffold: operator window plus a projector live window
  over IPC, with a typed preload bridge.
- Feature-based UI: schedule, songs, Bible lookup, media, themes, live
  output with Go Live, Logo, Black and Clear, alerts, community songbook
  panel, and EasyWorship import panel.
- Display settings: output monitor picker (auto prefers the projector),
  fullscreen, always-on-top, and fallback to the main display if the
  projector is unplugged.
- NDI output: named NDI source for OBS, vMix and Studio Monitor via
  Grandi (NDI 6 SDK bindings), with source name and frame rate settings.
- Project logo: cross and rising light on deep blue, with icon sizes,
  transparent mark, and light and dark wordmark lockups.
- Repository hygiene: GPL-3.0 license, Contributor Covenant code of
  conduct, contributing guide, security policy, notices, and issue and
  pull request templates.
- Demo content only (public domain): "Amazing Grace" and John 3:16 (KJV).

### Known gaps

- No saved storage yet: songs and schedules do not persist between runs.
  SQLite storage is the next milestone.
- EasyWorship importers are panels, not working parsers yet.
- The community songbook sync service is not built yet.
- Installer packaging (Windows, macOS, Linux) is not wired up yet.
- NDI capture colours on real hardware still need a first live run to
  confirm.
