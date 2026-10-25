# True Worship

![True Worship logo](assets/logo/object-logo.png)

Free, open worship presentation software for churches, on Windows, Linux
and macOS. Own code, own design, with the familiar workflow churches
already know.

Licensed under GPL-3.0 (see `LICENSE`). Contributions are welcome, see
`CONTRIBUTING.md`, and the community rules are in `CODE_OF_CONDUCT.md`.

## Features (so far, scaffold stage)

- **Schedule** — the ordered service list:
  thumbnail, title and notes line per item, songs expand to show
  their slides, double-click a row to send it live.
- **Songs** — searchable song library with verse structure.
- **Bible** — scripture lookup by reference.
- **Media** — your own images, videos and audio, filtered by kind;
  preview, go live, or play. See `docs/media.md`.
- **Themes** — backgrounds, text colour and size for the output.
- **Live** — preview, Go Live, Logo, Black, Clear, arranged in
  the conventional way: schedule down the left, preview and live
  side by side with their output monitors, resources as a strip
  across the bottom, with a title bar and toolbar on top.
  Light, dark and system themes.
- **Shortcuts** — the keyboard shortcuts operators already know: Page
  Down goes live, Ctrl + B black, Ctrl + L logo, Ctrl + C toggles
  the live text, arrows move slides and schedule items, V/C/number
  + Enter jumps to a verse, chorus or slide. Press ? for the list.
  See `docs/keyboard-shortcuts.md`.
- **Backgrounds** — photos, looping motion backgrounds and your own
  photos and videos, with text kept readable over all of them. Run
  `npm run backgrounds` once after cloning to generate the built-in set.
- **Alerts** — short messages over the live output.
- **Community Songbook** — shared lyrics churches improve together,
  with version history, review and sync (sync service arrives in Phase 3).
- **Import** — move churches off EasyWorship (.ews schedules, Songs.db
  library), OpenSong and OpenLP, plus True Worship's own `.twp`
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

Version 0.11.0. The UI flow works with demo content (public domain:
Amazing Grace, John 3:16 KJV). The main window uses
the conventional worship-software layout: one title bar with the menus, a toolbar under it, the schedule down the
left, the preview's slide list and the live slide grid side by side, the
preview and live output monitors beneath them, and the resources as a
tab strip along the bottom. Every divider can be dragged. Light, dark
and system themes are in. What still needs a real file to finish is full-fidelity
.ews schedule parsing and non-SQLite Songs.db reading (see
`docs/file-formats.md`). Next milestones: SQLite storage, then the
songbook sync service.
