# Contributing to True Worship

Thank you for helping build free worship software for churches. Everyone is
welcome here, and the Code of Conduct in `CODE_OF_CONDUCT.md` applies to all
contributors.

## Ground rules

- **License:** True Worship is GPL-3.0. By contributing, you agree your
  contribution is released under the same license.
- **Clean room:** Never copy code, assets, artwork, or text from
  EasyWorship or any other proprietary program. Interoperability (reading a
  user's own schedule and song files) is welcome; copying their work is not.
- **Content licensing is part of the code:** Songs and Bibles carry a
  source (public-domain, owned, licensed, community). Never bundle a
  copyrighted lyric or translation without permission or a license. The
  legal routes are user import, CCLI SongSelect for licensed churches, and
  public domain material.
- **Feature folders:** New work goes in `src/features/<name>/`. Only UI or
  types used by two or more features live in `src/shared/`. Features never
  import from each other; wiring happens in `src/app/App.tsx`. The full
  rules are in `AGENTS.md`, read it before your first change.

## Setup

```sh
npm install
npm run electron:dev   # full desktop app, operator + projector windows
npm run dev            # frontend in a browser, for UI work only
npm run build          # typecheck + production build
```

This repo has no display on some machines, so the Electron GUI is launched
and tested on a machine with a screen. The build and the main process files
are verified in CI-style checks here.

## Workflow

1. Open an issue first for anything bigger than a typo, so work does not
   collide.
2. Work on a branch named after the feature or fix, for example
   `feature/stage-display` or `fix/song-search`.
3. Keep changes focused: one feature or fix per pull request.
4. Run `npm run build` before opening the pull request. It typechecks and
   builds; a failing build blocks merging.
5. Describe what you changed, why, and how you tested it. Screenshots or
   short clips help a lot for UI changes.
6. If your change touches the live output, display settings, or NDI, say
   which machine and setup you tested on (operating system, one or two
   monitors, OBS or vMix for NDI).

## Good first issues

Look for issues labelled `good first issue`: usually a single panel, a
small importer fix, or a piece of the songbook UI. Ask in the issue if
anything is unclear before starting.

## Songbook contributions

Lyric corrections and new songs for the community songbook follow the same
license rules as code: only contribute lyrics you own, that are public
domain, or that you have permission to share. Every song keeps version
history and contributor credit.
