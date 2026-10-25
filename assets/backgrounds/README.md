# Background assets

`generate.py` draws the pre-installed photos and motion loops. Run it
from the repo root after a fresh clone:

```sh
npm run backgrounds
```

It needs Pillow, NumPy (`pip install pillow numpy`) and ffmpeg with the
`libvpx-vp9` encoder on PATH. Outputs go to `public/backgrounds/` and
are served automatically by Vite. See `docs/backgrounds.md` for how the
app uses them.
