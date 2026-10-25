# Background assets

`generate.py` draws the pre-installed backgrounds and encodes the
motion loops. Run it from the repo root after a fresh clone:

```sh
python3 assets/backgrounds/generate.py
```

It needs Pillow (`pip install pillow`) and ffmpeg on PATH. Outputs go
to `public/backgrounds/` and are served automatically by Vite. See
`docs/backgrounds.md` for how the app uses them.
