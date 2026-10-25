# NDI setup for True Worship

True Worship can publish its live output as an NDI source on the local
network, so OBS Studio, vMix, NDI Studio Monitor or any NDI receiver can
pick it up as if it were a camera. The source appears under the name set
in the NDI tab (default "True Worship").

## How it works

- The sender runs in the Electron main process only, never in the
  renderer. It uses Grandi, modern N-API bindings for the NDI 6 SDK.
- The live window is captured with `webContents.capturePage()` and sent
  as BGRA video at the frame rate set in the NDI tab. Whatever the
  congregation sees is what the stream sees.
- Audio is not sent yet. The sender clocks video only.

## Install

Grandi is a production dependency, and its platform package
(`@grandi/win32-x64`, `@grandi/linux-x64`, `@grandi/darwin-arm64`, ...)
is an optional dependency that carries the native addon and the NDI
shared library together. Keep both:

```sh
npm install   # do not use --omit=optional
```

On Linux, NDI discovery needs Avahi running on the machine, or receivers
may not see the source. On Windows and macOS no extra runtime install is
needed, the library ships inside the platform package.

## Packaging

When installers are built, the Grandi packages must stay outside any
ASAR archive, with `grandi.node` beside its NDI shared library. For
electron-builder:

```yaml
asar: true
asarUnpack:
  - "node_modules/grandi/**"
  - "node_modules/@grandi/**"
```

## Receiving it

- OBS Studio: add an NDI source (via the DistroAV NDI plugin) and pick
  "True Worship".
- vMix: Add Input, NDI, pick "True Worship".
- NDI Studio Monitor (free from ndi.video): pick it from the source list
  to confirm the stream before going live.

## Troubleshooting

- Panel says "NDI library not installed": the grandi package or its
  platform package is missing, usually because optional dependencies were
  omitted at install or packaging time.
- Source does not appear on Linux: check Avahi is installed and running.
- Colours look swapped on a HiDPI screen: the capture path recovers the
  real pixel size from the buffer, but if a platform reports an
  unexpected bitmap layout, that is the first place to check
  (`electron/ndi.cjs`, frame capture section).
- NDI sending needs a real display and GPU capture; it cannot be tested
  in a headless environment, only on a machine with a screen.
