# Speech engine (voice)

Voice listening runs offline. Two parts, both MIT-licensed upstream
(whisper.cpp and the ggml Whisper models by ggml-org / OpenAI):

1. **The engine**, `whisper-server`, built from whisper.cpp for each platform by
   `.github/workflows/whisper-engine.yml` (Actions > Speech engine > Run
   workflow; the whisper.cpp tag is an input, default `v1.9.5`). It produces
   one `whisper-<platform>.tar.gz` artifact per platform: `linux-x64`,
   `win32-x64`, `darwin-arm64`, `darwin-x64`.
2. **The model**, `ggml-base.bin` (148 MB). It is not in the installer. The
   first time Voice is used, the Listen bar offers a one-time Download, which
   fetches it from Hugging Face into the app's data folder
   (`<userData>/whisper-models/`) and checks its size and SHA-1 before keeping it.
   `electron/voice.cjs` holds the URL, size and checksum.

## Where the app looks for the engine

In order (first one that exists wins), see `findServer` in `electron/voice.cjs`:

1. `TW_WHISPER_SERVER` (an explicit path, for testing).
2. `<userData>/whisper/<platform>-<arch>/whisper-server[.exe]`, so a newer engine
   can be dropped in without a new installer.
3. `resources/whisper/<platform>-<arch>/` inside the installed app.
4. Running from source only: `whisper/<platform>-<arch>/` in the repo, then an
   OpenWhispr install if one is on the machine.

## Bundling it in the installer

When installers are wired up (electron-builder, a later milestone), extract each
artifact into `whisper/<platform>-<arch>/` (that folder is git-ignored) and ship
it as an extra resource, per platform:

```json
"extraResources": [{ "from": "whisper/${os}-${arch}", "to": "whisper/${os}-${arch}" }]
```

Keep the executable bit on Linux and macOS (the artifacts are `.tar.gz` for
that reason), and sign the binary like the rest of the app on macOS and Windows.
The engine is only ever started on 127.0.0.1 and only while Listen is on.

## Notes

- Windows and Linux builds use ggml's runtime CPU selection
  (`GGML_BACKEND_DL` and `GGML_CPU_ALL_VARIANTS`), so one build uses AVX2 or
  AVX-512 where the processor has them and still runs on older ones.
- Apple Silicon uses Metal; the Intel Mac build assumes AVX2.
- Models are looked up the same way: an installed copy at
  `resources/whisper/ggml-<name>.bin` is used if present (for an offline
  installer), otherwise the downloaded one.
