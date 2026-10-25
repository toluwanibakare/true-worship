# Backgrounds in True Worship

## Pre-installed stills

Eight still looks ship inside the app as pure CSS (gradients and conic
rays), so they work on every machine with no files to lose: Deep Rays,
Midnight, Golden Hour, Forest Calm, Ember, Ocean Depth, Purple Dawn,
and Charcoal Stage. Pick one in the Backgrounds tab; the operator
preview and the projector always match.

## Motion backgrounds

Three looping videos: Rays Drift (deep blue rays turning slowly, a
seamless loop), Golden Zoom (a slow zoom over a warm gradient), and
Ember Rise (soft embers drifting upward, also seamless). They live in
`public/backgrounds/` as `.mp4` files and are referenced by relative
paths, so they work both from the Vite dev server and from the
packaged app loading over `file://`.

## Generating the videos

Video and still files are not stored in git by the GitHub connector
used here (it only takes text files), so they are generated, not
committed. The generator and its stills are the source of truth:

```sh
python3 assets/backgrounds/generate.py
```

It draws the stills with Pillow, renders the animation frames, and
encodes the loops with ffmpeg (H.264, 1280x720). It writes into
`public/backgrounds/`, which Vite serves automatically. Run it once
after a fresh clone and the motion presets light up.

## Missing files

If a motion video is missing, its preset falls back to its CSS still
look instead of showing a broken slide. That is deliberate: a fresh
clone never breaks a service, it just looks still until the videos are
generated.
