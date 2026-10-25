# Changelog

All notable changes to True Worship are recorded here. The format follows
Keep a Changelog, and versioning is exploratory while the project is 0.x.

## [0.6.0] - 2026-10-25

### Added

- Display font picker in the Themes tab. Each theme now carries
  its own display font, picked from a list led by EasyWorship's
  own defaults (Calibri, its default song theme font, and Arial,
  its global font), with a live preview line in the theme's
  colours. The chosen font flows to the preview, the live monitor
  and the projector window, the way EasyWorship's theme font
  decides what the room sees.

## [0.5.0] - 2026-10-25

### Changed

- Schedule controls tidied into one toolbar row: Add item, move
  up, move down, Remove, with the arrows and Remove greyed out
  when nothing is selected, and the item count moved to the panel
  footer. Buttons no longer wrap their labels.
- Song list and Bible list are tables now, the way EasyWorship's
  resource lists are: songs show Title, Author, Source; scripture
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

- Schedule panel reworked to EasyWorship's arrangement: each row has
  a thumbnail, the title, and a notes line underneath (type and
  reference, in the small italic notes style), songs expand with an
  arrow to show their slides, clicking a slide selects it in the
  preview, and double-clicking a row sends that item live from its
  first slide. The toolbar above the list also shows the item count,
  and an empty schedule explains how to fill it.
- Toolbar now splits the way EasyWorship's does: New, Open, Save
  and Add Item on the left, Go Live, Alerts, Logo, Black and Clear
  on the right, each as an icon above a short label. The Go Live
  button that sat under the preview is gone, so the live controls
  live on the right only: the toolbar's right group and the live
  column.
- Pane titles are filled bars now, and the header carries the
  subtle gradient EasyWorship's toolbar has.

### Added

- EasyWorship's fonts: the interface uses Segoe UI (the font
  Windows draws EasyWorship's interface in), and slide text uses
  Calibri, EasyWorship's default song theme font (per their support
  forum; their global font is Arial, which is the fallback in the
  stack). Themes carry a font family now, and it travels with the
  live payload, so the projector shows the same font as the
  preview.

## [0.3.2] - 2026-10-25

### Added

- EasyWorship 7's keyboard shortcuts, exactly as listed in
  EasyWorship's own support article: Page Down goes live,
  Ctrl + B toggles black, Ctrl + L toggles logo, Ctrl + C toggles
  the live text (a second press restores it), Up/Down move slides,
  Left/Right move schedule items, Home/End jump to the first/last
  slide, Ctrl + O opens, Ctrl + S saves, Ctrl + Del deletes the
  selected schedule item, Ctrl + F/M/N open the Alerts tab, and
  V/C/number + Enter jumps to a verse, chorus or slide number.
  N, P, Space, Backspace and Page Up also step slides, as in
  EasyWorship's default hotkey set. See
  `docs/keyboard-shortcuts.md`.
- Keyboard Shortcuts dialog (Help menu, header button, or `?`),
  with the full grouped list; menu items show their shortcut on
  the right. Shortcuts never fire while typing in a field, and
  Ctrl + C never hijacks Copy when text is selected.

## [0.3.1] - 2026-10-25

### Fixed

- Main window arrangement now matches EasyWorship's for real:
  schedule, preview and live output are three full-height columns,
  and the resources live as a strip across the bottom, the way the
  EasyWorship 7 overview shows them. The previous 0.3.0 layout put
  the resources in the right column and squeezed live into a small
  box above them; live is no longer smaller than it should be.
- Live column is a full workstation now: a 16:9 output monitor at
  the column's full width, GO LIVE and Logo, Black, Clear under it,
  and the live item's slides below, so the operator can step
  through the service from the live column itself. Clicking a live
  slide sends it out at once.

## [0.3.0] - 2026-10-25

### Changed

- Main window rebuilt on EasyWorship's layout, studied from the
  EasyWorship 7 screenshots: menu bar (File, Schedule, Live, View)
  and toolbar (New, Open, Save, Add Item, Go Live, Alerts, Logo,
  Black, Clear) on top, schedule down the left with type marks and
  move/remove controls, preview in the centre with a slide selector
  (song verses keep their names) and a big GO LIVE button, live
  output up the right with a LIVE badge, resources tabbed under it,
  and a status bar at the bottom. Own code and styling throughout;
  the screenshots were reference for the arrangement, not material
  to copy.
- File menu and toolbar Open now open a service or library file
  (.tworship, .ews, .ewsx, .xml, .txt, .db, .zip); Save writes the
  current service as .tworship; File also exports the song library.

### Added

- Light, dark and system themes, the same choice EasyWorship itself
  offers. System follows the operating system and keeps following it
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
