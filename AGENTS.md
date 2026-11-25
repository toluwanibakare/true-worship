# AGENTS.md — True Worship

How this repo is organised, and the rules every contributor (human or agent)
follows here. Read this before adding or moving code.

## What this is

True Worship is free, open worship presentation software for churches.
Own code, own design. The workflow follows conventions common to worship
presentation software, so operators moving over from other tools feel at
home. Nothing from any other program's code, assets, artwork or text is
ever copied into this repo, and third-party reference material
(screenshots, support articles) is never committed. Interoperability
(reading a user's own .ews files and song database) is the goal;
imitating anyone's code is not.

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
    voice/        Voice: listens through the microphone, understands a
                  spoken scripture or "next verse", recognises a song
                  being sung and moves its slides, and puts it live
                  (Auto) or holds it for Go Live (Manual). The speech
                  engine itself is offline Whisper in electron/voice.cjs.
    importer/     Moving churches in: .twp, .ews schedules,
                  Songs.db/SQLite, OpenSong, OpenLyrics, plain text.
  shared/
    components/   Only UI used by two or more features
                  (Panel, Button, SearchInput, Marquee, SlideView,
                  SlideEditor, OutputPanel, ResourceView, Splitter,
                  Modal).
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
7. **The shell follows the conventional worship-software arrangement.** One title bar
   (window controls, menus, app name, GitHub) and the toolbar on
   top (New, Open, Save, Store, Web, Remote on the left; Go Live,
   Alerts, Logo, Black, Clear, Live on the right). Below: the
   schedule down the left; beside it the Preview pane (slides as
   labelled blocks) and the Live pane (slides as a thumbnail grid)
   side by side, with Preview Output and Live Output monitors
   under them; resources as a tab strip across the bottom. Own code
   and own styling. Every divider is draggable and its size is remembered. Light,
   dark and system themes: Tailwind v4 class-based dark mode
   (`@custom-variant` in `index.css`), `.dark` toggled on `<html>`,
   panels use light classes with `dark:` variants. The title bar is
   inverted: black in light mode, white in dark mode.
8. **Shortcuts follow the key set operators already know.** The list lives in
   `features/shortcuts/shortcuts.ts`, the dialog in `ShortcutsDialog.tsx`, and one
   window keydown listener in `app/App.tsx` reads its actions
   through a ref so handlers never go stale. Shortcuts never fire
   while typing, and Ctrl + C never hijacks Copy.
9. **Fonts are widely installed defaults.** Interface: Segoe UI stack in
   `index.css`. Slides: Calibri stack on every theme
   (`fontFamily` on `Theme`, carried in the live payload), because
   Calibri and Arial are what operators expect to see. Neither is
   bundled; Carlito is the open, metric-compatible fallback. Schedule rows
   are thumbnail + title + italic notes line, with expandable song
   slides and double-click to go live. The toolbar splits left
   (file) and right (live controls), icon above label.
10. **Resource lists are tables.** Songs: Title, Author, Source.
    Scripture: Translation, Reference, Scripture. Click a row to
    preview it. The live column header names the live item and its
    current slide, Prev/Next steppers sit under the live controls,
    and live slide rows show label plus first line.
11. **Display font is per theme, picked in the Themes tab.**
    The display follows the theme font, and the picker leads with
    Calibri and Arial. The
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

<!-- standing-rules:start -->
## Standing rules (all projects)

General rules for every project and every agent (Claude, Codex, others). Read fully before changing anything. If this project's own rules above conflict with these, the project's own rules win. Qorelly projects follow the Qorelly org rules at the end of this file, which win over everything.

### How we work
- We discuss a problem, an agent executes one small verifiable slice, we review the report. Keep chat replies short and direct. Give honest rankings and clear reasoning, not hedged advice.
- One slice at a time with explicit scope. No changes to unrelated surfaces.
- Audit read-only before implementing.
- Never guess column or file names. Show table DDL and the first 10 lines of any file over 50 lines before writing code against it.
- Stop and report contradictions. Do not build past them.
- Browser or visual claims need screenshots. Never claim a visual result you did not see.
- Keep `HANDOVER.md` current when the state of the project changes.

### Writing style
- Never use em dashes, in code, comments, copy, commits, or replies. Use a comma, colon, period or " - ".
- No generic AI output: no boilerplate structures, filler comments, or template-looking designs.

### Code
- Write the most concise code that gives the exact same result. No dead code, no speculative abstractions.
- Keep code organized: one clear job per file, predictable names, no sprawling files.
- Do not touch unrelated files. Never guess file or column names; look them up.
- Report outcomes faithfully: what was done, verified, skipped, or failed.

### Structure (feature-first)
- Organize by feature, not by type. Each feature lives in its own folder with everything it owns (components, hooks, api, types, utils).
  ```
  src/features/<feature>/{components,hooks,api,types,utils}
  ```
- Features never import from each other's internals.
- Anything used by more than one feature moves to a shared layer (`src/shared/...`) and every feature imports from there.
- Easy to locate beats clever. A new dev should find any component by knowing its feature name.

### Design
- Premium at all times. Considered spacing, typography, and motion. No generic AI look.
- Password fields:
  - Always an eye toggle (`type="button"`, with `aria-label` and `aria-pressed`).
  - Hidden: show the open eye (click to reveal). Revealed: show the closed eye (click to hide).
  - The masked dots must be visibly large. Keep the field itself normal size; raise the input font size and letter spacing so the dots read big.
- Buttons:
  - Every action button has a loading state: disabled, spinner, no double submit.
  - Every submit generates a UUID idempotency key (see Idempotency).

### Idempotency (buttons and mutating requests)
- Generate one UUID per user action when the button is pressed. Send it as the `Idempotency-Key` header.
- On network failure or timeout, retry with the same UUID. Only generate a new UUID after a success or when the form data changes.
- Backend stores key + request hash + response (unique constraint on key per user). A replay returns the stored response and never creates a second entry. Same key with a different payload returns 422.
- Expire stored keys after a defined window (e.g. 24h).

### Security
- Auth uses HttpOnly cookies carrying an opaque server-side session ID. Not JWTs in cookies, never tokens in localStorage or sessionStorage.
- Cookie flags: `HttpOnly; Secure; SameSite=Lax` (or `Strict`), scoped `Path` and `Domain`, with a sensible expiry. Rotate the session ID on login and privilege change. Invalidate on logout server-side.
- CSRF protection on every state-changing request (SameSite plus a CSRF token or origin check).
- Hash passwords with argon2id or bcrypt. Never log, return, or store plaintext passwords or tokens.
- Rate limit login, signup, password reset, OTP, and any expensive endpoint. Lock out or slow down repeated failures.
- No secrets in code, git, logs, or client bundles. Secrets only via env or a secret manager. Never commit `.env`.
- Validate and sanitize all input. Escape output. No `dangerouslySetInnerHTML` or raw HTML injection without sanitizing.
- Set security headers: CSP, HSTS, X-Content-Type-Options, Referrer-Policy, frame protections. Strict CORS allowlist, never `*` with credentials.
- Least privilege everywhere: database roles, API keys, IAM, and user roles.
- Keep dependencies updated and audited. Do not add packages without a reason.
- File uploads: check type and size server-side, store outside the web root, randomize names.

### Fingerprint and Device Authentication
- All authentication flows mandate device and browser fingerprint tracking:
  - Signup flow always requires standard OTP verification before account activation.
  - Login flow records client device and browser attributes (user agent, browser name, platform/OS, screen resolution, language, time zone) and derives a deterministic fingerprint token (`fp_<browser>_<hash>`).
  - When logging in from the same browser and device with a matching fingerprint token, authenticate immediately using the session token.
  - If a login attempt presents a mismatched or unrecognized fingerprint token (such as a different browser or device), the backend must challenge the request with an OTP requirement (`requiresOtp: true`). Only after successful OTP verification is the new fingerprint registered as a trusted device session and the auth session granted.

### Backend
- Validate every request body, query, and param server-side with a schema (e.g. zod). Never trust the client, including prices, roles, and ids.
- Authenticate and authorize on every route, and check resource ownership (no IDOR). Deny by default.
- Parameterized queries only. Never string-build SQL.
- Wrap multi-step writes in transactions. Use unique constraints and indexes for integrity, not just app checks.
- One consistent response and error shape. Correct HTTP status codes. No stack traces or internals in responses.
- Mutating endpoints are idempotent via the `Idempotency-Key` rule above.
- Paginate every list endpoint. Set timeouts on outbound calls.
- Structured logs with a request id. No PII, passwords, or tokens in logs.
- Schema changes go through migration files, never ad hoc edits. Applied migrations are frozen.
- Keep handlers thin: routing and validation in the handler, logic in services, data access in a repository layer.

### Git
- No Claude or AI attribution in commits or PRs: no `Co-Authored-By` trailers, no "Generated with" lines.
- Commit or push only when asked. Small focused commits.
- Pushes go to `staging`, never straight to `main`. If `staging` does not exist, create it from the current branch and say so. If on a feature branch, push it, then bring it into `staging`.
- After pushing to `staging`, open a pull request from `staging` into `main` with `gh pr create`. If one is already open, reuse it and say so. Short title, and a body that says what changed and how it was verified.
- Never merge or close a pull request without being asked. When told "merge", "close" or "ship it", merge that PR, then confirm the result and that `staging` and `main` match.
- Never push to `main`, force-push `main` or `staging`, or delete either branch unless explicitly told for that action.
- Before opening or merging a PR, run the project's tests and build and report the real result. If they fail, say so and do not open the PR as ready.
<!-- standing-rules:end -->
