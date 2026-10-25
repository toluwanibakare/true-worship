# True Worship

Free, open worship presentation software for churches, on Windows, Linux
and macOS. A clean-room rebuild in the spirit of EasyWorship: same
workflow, own code, own design.

## Features (so far, scaffold stage)

- **Schedule** — the ordered service list.
- **Songs** — searchable song library with verse structure.
- **Bible** — scripture lookup by reference.
- **Media** — images, videos, audio.
- **Themes** — backgrounds, text colour and size for the output.
- **Live** — preview, Go Live, Logo, Black, Clear.
- **Alerts** — short messages over the live output.
- **Community Songbook** — shared lyrics churches improve together,
  with version history, review and sync (sync service arrives in Phase 3).
- **Import** — move churches off EasyWorship (.ews schedules, Songs.db
  library), OpenSong and OpenLP.
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

Scaffold stage, version 0.1.0. The UI flow works with demo content
(public domain: Amazing Grace, John 3:16 KJV). Next milestones: SQLite
storage, then the EasyWorship importers, then the songbook sync service.
