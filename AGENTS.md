# AGENTS.md — True Worship

How this repo is organised, and the rules every contributor (human or agent)
follows here. Read this before adding or moving code.

## What this is

True Worship is free, open worship presentation software for churches.
It is a clean-room rebuild in the spirit of EasyWorship: same workflow,
own code, own design. Nothing from EasyWorship's program, assets, or
artwork is ever copied into this repo. The EasyWorship screenshots in the
project docs are reference for what screens need to do, not material to
reuse. Interoperability (reading a user's own .ews files and song
database) is the goal, imitation of their code is not.

## Folder structure: features first

Folders are arranged by **feature**, not by generic component type.
Everything about one feature lives together, so you can find it without
hunting across the repo.

```
src/
  app/            App shell only: layout, top-level state, wiring.
                  No feature UI lives here.
  features/
    schedule/     The ordered service list.
    songs/        The song library: search, list, open.
    bible/        Scripture lookup by reference.
    media/        Images, videos, audio.
    themes/       Look of the output: background, text, size.
    backgrounds/  Pre-installed still and motion backgrounds.
    layouts/      Pre-installed slide layouts (picker only; the
                  definitions live in shared/lib/layouts.ts because
                  the live window renders them too).
    live/         What the congregation sees: output, Go Live,
                  Logo, Black, Clear.
    alerts/       Marquee alerts over the live output (the Marquee
                  component itself lives in shared/components/
                  because the live window renders it too).
    display/      Output monitor choice, fullscreen, always-on-top.
    ndi/          NDI output: source name, switch, status.
    songbook/     The community songbook: shared lyrics, versions,
                  review, sync.
    importer/     Moving churches in: .tworship, .ews schedules,
                  Songs.db/SQLite, OpenSong, OpenLyrics, plain text.
  shared/
    components/   Only UI used by two or more features
                  (Panel, Button, SearchInput, Marquee).
    lib/          Types and helpers used by two or more features.
```

## Rules

1. **A feature owns its UI, hooks, and logic.** Put new code for a
   feature inside that feature's folder, not in a shared folder.
2. **Shared is earned, not default.** A component moves to `shared/` only
   when a second feature actually uses it. Never pre-emptively share.
3. **Features do not import from each other.** A feature may import from
   `shared/` and from `app/` types only. If two features need the same
   thing, that thing belongs in `shared/`. Cross-feature wiring happens
   in `app/App.tsx`, which passes data down as props.
4. **One panel per feature, named after the feature** (SchedulePanel,
   SongLibrary, BibleLookup...). Keep panels focused; a panel that does
   three jobs wants to be split.
5. **Types live with their feature first.** Only types used by two or more
   features move to `shared/lib/types.ts`.
7. **The shell follows EasyWorship's arrangement.** Menu bar and
   toolbar on top, schedule left, preview centre, live output right
   as three full-height columns, resources as a strip across the
   bottom (studied from the EasyWorship 7 screenshots; own code and
   styling, never copied artwork). The live column carries its own
   slide list for stepping through the live item. Light, dark and
   system themes: Tailwind v4 class-based dark mode (`@custom-variant`
   in `index.css`), `.dark` toggled on `<html>`, panels use light
   classes with `dark:` variants.
8. **Shortcuts are EasyWorship's, exactly.** The list lives in
   `features/shortcuts/shortcuts.ts` (source: EasyWorship's own
   support article), the dialog in `ShortcutsDialog.tsx`, and one
   window keydown listener in `app/App.tsx` reads its actions
   through a ref so handlers never go stale. Shortcuts never fire
   while typing, and Ctrl + C never hijacks Copy.
6. **Demo data is clearly marked.** Anything in `shared/lib/demo.ts` is
   placeholder content (public domain only: KJV text, Amazing Grace).
   Demo data never ships as if it were a real library.
7. **Content licensing is part of the code.** Songs and Bibles carry a
   source field (public-domain, owned, licensed, community). Never bundle
   a copyrighted lyric or translation without permission or a licence.
   The legal routes are user import, CCLI SongSelect for licensed
   churches, and public domain material.

## Stack

- Electron + React + TypeScript + Vite + Tailwind (desktop app for
  Windows, Linux and macOS).
- SQLite for local storage: songs, Bibles, schedules, themes.
- The main process lives in `electron/` (operator window plus the
  projector window). Features never touch Electron APIs directly; they
  go through the typed bridge in `electron/preload.cjs`, declared in
  `src/electron.d.ts`, so the UI also runs in a plain browser.
- NDI sending lives in `electron/ndi.cjs` in the main process only, via
  Grandi (NDI 6 SDK bindings). Grandi stays a production dependency with
  its optional platform packages kept, and outside any ASAR archive when
  packaging. See `docs/ndi-setup.md`.
- `npm run dev` runs the same frontend in a browser for UI work; the
  projector window only exists in the Electron build.

## Commands

- `npm install` — install dependencies.
- `npm run dev` — frontend in a browser, for UI work.
- `npm run electron:dev` — full desktop app (Vite + Electron, with the
  projector window).
- `npm run build` — typecheck and production build.
- `npm run electron` — run the built desktop app.
- Packaging installers (electron-builder, Windows NSIS, macOS DMG, Linux
  AppImage) is a later milestone; it is not wired up yet.

## Adding a feature

1. Create `src/features/<name>/` with its panel and logic.
2. Wire it into `app/App.tsx` (tab, panel, or schedule item type).
3. If it needs shared types or UI, add only what it needs to `shared/`.
4. Update README.md's feature list and this file if a rule changes.
