# Changelog

All notable changes to True Worship are recorded here. The format follows
Keep a Changelog, and versioning is exploratory while the project is 0.x.

## [0.1.0] - 2026-10-25

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
