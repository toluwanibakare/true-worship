# True Worship Handover

Written 2026-11-09 from a read-only audit. Nothing was run or built. Anything marked "unknown" was not found in the files.

## 1. What this is
Free worship presentation software for churches (songs, scripture, media on a projector, Sunday service schedule), for Windows, Linux and macOS. It follows conventions familiar from other worship software, with its own code and design. Version 0.19.0, desktop installers not yet built. A static marketing site lives in `web/`. Live domain: unknown, not in the files. Repo: https://github.com/toluwanibakare/true-worship.

## 2. Stack and repo map
Electron 32 + React 19 + TypeScript + Vite 6 + Tailwind 4. SQLite via sql.js, NDI output via grandi, jszip for imports. The UI also runs in a plain browser.
- `src/app/` shell only (App.tsx wires everything). `src/features/<name>/` one folder per feature: schedule, songs, bible, media, themes, backgrounds, layouts, preview, live, alerts, display, ndi, songbook, voice, importer, shortcuts, web. `src/shared/{components,lib}` for anything used by two or more features.
- `electron/`: `main.cjs`, `preload.cjs` (typed bridge, declared in `src/electron.d.ts`), `ndi.cjs`, `voice.cjs` (offline Whisper), `splash.html`.
- `packs/` 9 hymn archive JSON files (25,716 public domain hymns), `samples/`, `assets/` (logo, background generator), `web/` marketing site (static, no build), `docs/` (roadmap, speech-engine, content-api, ndi-setup, file-formats, media, keyboard-shortcuts, web-browser, backgrounds), `PROJECT_BRIEF.md`, `CHANGELOG.md` (616 lines, read the Unreleased section first), `CONTRIBUTING.md`, `NOTICE.md`.
- `.github/workflows/whisper-engine.yml` manual workflow that builds the whisper.cpp speech engine per platform.

## 3. Commands
`npm install`; `npm run dev` (browser UI); `npm run electron:dev` (full desktop app); `npm run build` (`tsc -b && vite build`, this is the typecheck); `npm run electron` (run built app); `npm run backgrounds` (python3, generates `public/backgrounds/`, run once after cloning). Website: `python3 -m http.server 8000` inside `web/`. No test script (`scripts/test-importers.ts` is a manual importer check).

## 4. Git state and release flow
Branch `main`, origin https://github.com/toluwanibakare/true-worship. Uncommitted: `src/features/voice/VoiceBar.tsx`, `src/features/voice/scriptureParser.ts` (fuzzy book name matching, "other books it might have been" suggestions after an unclear scripture, tap to switch) and `AGENTS.md` (84 added lines, owner standing rules). The voice change is unfinished or unreviewed; do not discard it. Only `main` exists, no `staging`. Last commit 2026-11-02.
Flow: push to `staging` (create from current branch if missing), PR staging into main with `gh pr create`, never push main directly, merge only when the owner says so, no AI attribution.

## 5. Current state
Recent: Voice (offline Whisper Listen button, spoken scriptures go live in Auto or wait for Go Live in Manual, song following), speech model downloads on first use with checksum, engine CI workflow, licensed Bibles via API.Bible with the user's own key, 114 public domain Bible packs, hymn archive (parts 1 to 10), songs sidebar, song and slide editors, website walkthrough video.
Unfinished (from `docs/roadmap.md`, in order): Settings dialog, theme editor, full song editor, schedule editing, collections, presentations (PowerPoint/PDF), profiles, output polish, media extras, phone remote, store and online sources (CCLI SongSelect).
Verified problems:
- Installers are not wired: no electron-builder config in package.json; the speech engine bundling step (`extraResources`) is documented in `docs/speech-engine.md` but not done.
- AGENTS.md has two rules numbered 7 and says installers are later; README still says "scaffold stage".
- `easyworship-7-screenshots/` and its zip sit in the folder (git ignored on purpose; never commit). `dist/` and `/whisper/` are ignored.

## 6. Env vars and services
Env: TW_DEV, TW_WHISPER_SERVER, TW_WHISPER_MODEL (dev and testing only). Features use config in the app: the user's own API.Bible key (kept on their computer, never in the repo). External services: bible-api.com, API.Bible, Hymnary.org and Open Hymnal data, Hugging Face (Whisper `ggml-base.bin` download), GitHub Actions. Songbook sync service (Postgres API) is planned, not built. Hosting for `web/`: unknown.

## 7. Conventions (summary of AGENTS.md and CONTRIBUTING.md)
Feature-first folders; shared only when a second feature uses it; features never import each other (wiring happens in `app/App.tsx` via props); one panel per feature; types live with the feature; features reach Electron only through the preload bridge. Demo data in `shared/lib/demo.ts` is public domain only. Content licensing is part of the code: songs and Bibles carry a source field, never bundle copyrighted lyrics or translations without a licence. Nothing from any other worship program's code, assets or text may be copied. Shortcuts live in `features/shortcuts/shortcuts.ts`. Update README feature list and AGENTS.md when a rule changes.

## 8. Next steps
1. Review, finish and commit the uncommitted voice work (run `npm run build` first).
2. Create `staging`, PR into main.
3. Wire electron-builder installers (Windows NSIS, macOS DMG, Linux AppImage) and bundle the whisper engine, with signing.
4. Roadmap items 1 to 4 (settings, themes, song editor, schedule editing).
5. Update README and the AGENTS.md numbering.

## 9. Open questions for the owner
- Live domain and host for `web/`?
- Is there a release target or first church pilot date?
- Who owns the API.Bible and Hugging Face usage, and code signing certificates?
- Licence choice: wording moved away from "open source" but the LICENSE file is present, confirm intent.
