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
    preview/      The preview pane: the selected item's slides as
                  labelled blocks.
    live/         What the congregation sees: the live slide grid
                  and the projector window.
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
                  (Panel, Button, SearchInput, Marquee, SlideView,
                  OutputPanel, ResourceView, Splitter, Modal).
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
7. **The shell follows EasyWorship's arrangement.** One title bar
   (window controls, menus, app name, GitHub) and the toolbar on
   top (New, Open, Save, Store, Web, Remote on the left; Go Live,
   Alerts, Logo, Black, Clear, Live on the right). Below: the
   schedule down the left; beside it the Preview pane (slides as
   labelled blocks) and the Live pane (slides as a thumbnail grid)
   side by side, with Preview Output and Live Output monitors
   under them; resources as a tab strip across the bottom. This is
   EasyWorship 7's default "Preview and Live" view, studied from
   its screenshots; own code and styling, never copied artwork.
   Every divider is draggable and its size is remembered. Light,
   dark and system themes: Tailwind v4 class-based dark mode
   (`@custom-variant` in `index.css`), `.dark` toggled on `<html>`,
   panels use light classes with `dark:` variants. The title bar is
   inverted: black in light mode, white in dark mode.
8. **Shortcuts are EasyWorship's, exactly.** The list lives in
   `features/shortcuts/shortcuts.ts` (source: EasyWorship's own
   support article), the dialog in `ShortcutsDialog.tsx`, and one
   window keydown listener in `app/App.tsx` reads its actions
   through a ref so handlers never go stale. Shortcuts never fire
   while typing, and Ctrl + C never hijacks Copy.
9. **Fonts are EasyWorship's, too.** Interface: Segoe UI stack in
   `index.css`. Slides: Calibri stack on every theme
   (`fontFamily` on `Theme`, carried in the live payload), because
   Calibri is EasyWorship's default song theme font and Arial is
   its global font (both from their support forum). Schedule rows
   are thumbnail + title + italic notes line, with expandable song
   slides and double-click to go live. The toolbar splits left
   (file) and right (live controls), icon above label.
10. **Resource lists are tables.** Songs: Title, Author, Source.
    Scripture: Translation, Reference, Scripture. Click a row to
    preview it. The live column header names the live item and its
    current slide, Prev/Next steppers sit under the live controls,
    and live slide rows show label plus first line.
11. **Display font is per theme, picked in the Themes tab.**
    EasyWorship's rule is song font, then theme font, then global
    font; True Worship's display follows the theme font, and the
    picker leads with EW's own defaults (Calibri, Arial). The
    font travels in the live payload, so preview, live monitor
    and projector always match.
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
