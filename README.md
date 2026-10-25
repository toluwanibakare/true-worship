# True Worship

![True Worship logo](assets/logo/true-worship-icon-512.png)

Free, open worship presentation software for churches, on Windows, Linux
and macOS. A clean-room rebuild in the spirit of EasyWorship: same
workflow, own code, own design.

Licensed under GPL-3.0 (see `LICENSE`). Contributions are welcome, see
`CONTRIBUTING.md`, and the community rules are in `CODE_OF_CONDUCT.md`.

## Features (so far, scaffold stage)

- **Schedule** — the ordered service list.
- **Songs** — searchable song library with verse structure.
- **Bible** — scripture lookup by reference.
- **Media** — images, videos, audio.
- **Themes** — backgrounds, text colour and size for the output.
- **Live** — preview, Go Live, Logo, Black, Clear, arranged the way
  EasyWorship arranges its main window: schedule down the left,
  preview in the centre, live output up the right, resources as a
  strip across the bottom, with a menu bar and toolbar on top.
  Light, dark and system themes.
- **Shortcuts** — EasyWorship 7's keyboard shortcuts exactly: Page
  Down goes live, Ctrl + B black, Ctrl + L logo, Ctrl + C toggles
  the live text, arrows move slides and schedule items, V/C/number
  + Enter jumps to a verse, chorus or slide. Press ? for the list.
  See `docs/keyboard-shortcuts.md`.
- **Alerts** — short messages over the live output.
- **Community Songbook** — shared lyrics churches improve together,
  with version history, review and sync (sync service arrives in Phase 3).
- **Import** — move churches off EasyWorship (.ews schedules, Songs.db
  library), OpenSong and OpenLP, plus True Worship's own `.tworship`
  format for moving services between computers. See
  `docs/file-formats.md`.
- **Backgrounds** — pre-installed still looks built into the app, plus
  looping motion backgrounds. See `docs/backgrounds.md`.
- **Layouts** — pre-installed slide layouts: Full Screen, Lower Third,
  Upper Third, Left Panel, Centre Card. The preview and the projector
  always match.
- **Alerts** — a scrolling marquee across the top of the live output,
  with speed control, until you hide it.
- **Display** — pick the output monitor (auto picks the projector when
  connected), fullscreen and always-on-top. If the projector is
  unplugged mid-service, the live window moves back to the main display.
- **NDI** — publish the live output as a named NDI source for OBS,
  vMix or Studio Monitor. See `docs/ndi-setup.md`.

See `PROJECT_BRIEF.md` for the full plan, including the content and
licensing approach for Bibles and songs.

## Structure

Folders are arranged by feature, not by generic component type. Each
feature owns its UI and logic under `src/features/<name>/`, and only UI
or types used by two or more features live in `src/shared/`. The rules
are written down in `AGENTS.md`.

```
src/
  app/            App shell: layout and wiring
  features/       schedule, songs, bible, media, themes, live,
                  alerts, songbook, importer
  shared/         components and lib used by 2+ features
```

## Run it

```sh
npm install
npm run electron:dev   # full desktop app, operator + projector windows
npm run dev            # frontend in a browser, for UI work only
npm run build          # typecheck + production build
npm run electron       # run the built desktop app
```

This machine has no display, so the Electron GUI itself is launched and
tested on a machine with a screen; the build and the main process files
are verified here. Packaging installers (Windows, macOS, Linux) is a
later milestone and is not wired up yet.

## Status

Version 0.3.2. The UI flow works with demo content (public domain:
Amazing Grace, John 3:16 KJV). The main window now follows
EasyWorship's layout, studied from the EasyWorship 7 screenshots:
menu bar and toolbar on top, schedule down the left, preview in the
centre with a slide selector and a big GO LIVE button, live output up
the right, resources tabbed under it. Light, dark and system themes
are in. What still needs a real file to finish is full-fidelity
.ews schedule parsing and non-SQLite Songs.db reading (see
`docs/file-formats.md`). Next milestones: SQLite storage, then the
songbook sync service.
