# True Worship — Project Brief

Free, open worship presentation software for churches everywhere.
A clean-room rebuild in the spirit of EasyWorship: same workflow, own code,
own design, nothing lifted from EasyWorship.

## Identity

- **Name:** True Worship
- **Platforms:** Windows, Linux, macOS, one codebase
- **Price:** Free, forever. Open source from day one.
- **Principle:** Churches own their data. Songs, schedules and Bibles export
  to open formats, never locked inside the app.

## Recommended stack

- **Electron + React + TypeScript + Vite + Tailwind.** TMB already works
  in this stack, Electron ships real desktop apps on Windows, Linux and
  macOS from one codebase, and its two-window model fits this app
  exactly: the operator window on the laptop, the live output window on
  the projector, talking over IPC.
- **Local database:** SQLite. Songs, Bibles, schedules and themes live on
  disk, so Sunday service works with no internet.
- **Sync service (later, for the songbook):** a small API with Postgres.
  The desktop app stays fully usable offline and syncs when it can.

## MVP: the core that runs a Sunday service

1. **Schedule** — ordered service list, drag to rearrange, save and reopen.
2. **Preview and Live** — see a slide before it goes out, send it live to
   the second screen.
3. **Songs library** — lyrics with verse/chorus/bridge structure, slide
   splitting, search by title, author or lyric line.
4. **Scriptures** — look up a passage by reference, split across slides.
5. **Media** — images, videos and backgrounds behind lyrics or verses.
6. **Themes** — backgrounds plus text styling, saved and reusable.
7. **Logo, Black and Clear** — one-click blanking and logo display.
8. **Alerts** — short messages over the live output.

## Later features

PowerPoint import, Bible translations manager, stage display, remote app
for phones, multi-language interface.

## Already in the scaffold

- **Display settings** — choose the output monitor, fullscreen and
  always-on-top, with automatic fallback to the main display if the
  projector is unplugged.
- **NDI output** — publish the live output as a named NDI source for
  OBS, vMix and Studio Monitor, via Grandi (NDI 6 SDK bindings) in the
  main process.

## Content plan

### Bibles

- **Bundled offline:** King James Version and World English Bible
  (public domain, no licence issues).
- **Downloadable packs:** eBible.org translations, including Yoruba, Hausa
  Contemporary, Igbo, Nigerian Pidgin, Fulfulde and other Nigerian
  languages. Each translation ships with its own licence note; some are
  free to read but not free to redistribute, so the app shows the licence
  and only bundles what the licence allows.
- **Import:** CrossWire SWORD modules, so churches can bring translations
  they already own.
- **Optional live lookup:** API.Bible or bible-api.com with the user's own
  key, for copyrighted versions (NIV, ESV, NKJV, NLT, NASB) under those
  services' non-commercial terms. Never bundled, never redistributed.

### Hymns

- **Seed library:** public domain hymns from Hymnary.org (each text states
  its public domain status). Classic hymns, carols and old choruses.
- **Rule:** copyright expires generally 70 years after the writer's death.
  Anything newer needs permission or a licence.

### Community Songbook (the differentiator)

Churches contribute and correct lyrics, and updates sync to everyone.
This is the feature no free tool owns yet, especially for Nigerian songs.

- **How it works:** a church edits a song in the app (fix a line, add a
  verse, add a translation). On sync, the edit goes to the shared library
  as a new version. Every song keeps full version history, so a bad edit
  can be rolled back in one click.
- **Moderation:** new songs and edits from new contributors sit in a
  review queue until trusted editors approve them. Churches earn trusted
  status by contributing good edits. Users can report a wrong or
  copyrighted lyric from inside the app.
- **Copyright guardrails:** contributors confirm they own the lyric, it
  is public domain, or they have permission to share it. A CCLI number
  field lets licensed churches record the licence. Modern commercial
  songs without permission are refused, and the app always offers the
  legal routes instead: paste your own lyrics, or import through a CCLI
  SongSelect licence.
- **Offline first:** every church keeps a full local copy. Sync happens
  when there is internet, and a service never depends on it.
- **Credit:** every song shows its contributors and source church, so the
  community, not an anonymous database, gets the credit.

## Transition: moving churches off EasyWorship

This is the adoption engine. A church should move a whole Sunday over in
one afternoon.

1. **Import .ews schedules.** EasyWorship schedule files are ZIP archives,
   so the importer unzips them and reads the schedule structure directly.
2. **Import the song library.** Older EasyWorship used Songs.DB, newer
   versions use Songs.db plus SongWords.dat. OpenLP's open source
   EasyWorship importer already documents this format and is the reference
   implementation to study.
3. **Import OpenSong and OpenLP song files** as well, so churches coming
   from any free tool are covered too.
4. **Export everything to open JSON.** Songs, schedules and themes leave
   the app in a documented format, so nobody is ever locked in again.
5. **Transition checklist in the app:** import songs, import last Sunday's
   schedule, check fonts and backgrounds, run a test service. A church
   should be able to verify the move before Sunday, not during it.

## Roadmap

- **Phase 0 — Setup:** repo, Electron scaffold, design system, this brief.
- **Phase 1 — MVP:** schedule, preview/live, songs, scriptures, media,
  themes, blanking. Usable for a real service.
- **Phase 2 — Importers:** .ews schedules, Songs.db library, OpenSong,
  OpenLP, SWORD Bibles, downloadable eBible packs.
- **Phase 3 — Community Songbook:** sync service, version history,
  review queue, reporting, contributor credit.
- **Phase 4 — Release:** installers for Windows, Linux and macOS,
  website, docs, first public launch to Nigerian churches.

## Open questions

- Hosting for the songbook sync service (start cheap, scale later).
- Domain and GitHub org name for True Worship.
- First seed content: which hymnals and which Nigerian songs to launch
  with, and which churches to invite as founding contributors.

## Decided

- Licence: GPL-3.0, decided 2026-10-25 (same family as OpenLP, keeps
  the app and its forks free). Contributions are accepted under GPL-3.0.
