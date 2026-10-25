# Backgrounds in True Worship

Pick a look in the Backgrounds tab. It shows small thumbnail grids in
four groups, and the operator preview, the live monitor and the
projector always match.

## Photos

Eight 1920x1080 stills drawn by `assets/backgrounds/generate.py`:
Sunrise Peaks, Ocean Dusk, Clouds and Light, Night Sky, Calvary
Sunset, Golden Bokeh, Violet Waves and Forest Mist.

## Motion

Nine short looping videos (VP9 WebM, 1280x720): Drifting Clouds,
Aurora, Rising Lights, Light Shafts, Violet Flow, Starfield, Rays
Drift, Golden Glow and Embers. Every motion is periodic over the loop,
so the last frame flows back into the first with no jump. Each one has
a poster still, which is what the thumbnail shows.

## Classic

Eight stills that are pure CSS (gradients and conic rays), so they work
on every machine with no files: Deep Rays, Midnight, Golden Hour,
Forest Calm, Ember, Ocean Depth, Purple Dawn and Charcoal Stage. Deep
Rays is the default look.

## My Backgrounds

"Add photos or videos…" copies your own files (JPG, PNG, WebP, MP4,
WebM, M4V, MOV) into the app's data folder. The desktop app serves them
to both windows through a private `tw-media://` address, so a file never
has to stay where you picked it from. Hover a thumbnail and press x to
remove it. In a plain browser the files only last until the page closes.

Only add photos and videos you have the right to use in church. Free
sources that allow this include Pexels, Pixabay and Unsplash; check the
licence on each file.

## Readable text on any background

Over a photo, video, gradient or your own file, slide text is forced to
white, a soft dark scrim sits between the background and the words, and
the words carry a shadow. Plain theme colours keep the theme's own text
colour. The Themes tab has a Bold switch; bold is on by default and adds
a hairline stroke so words are heavier than the font's own bold.

## Generating the files

The generator draws everything itself (gradients, noise, silhouettes,
light), so every file is original work with no third-party licence. The
output is not committed, so run it once after a fresh clone:

```sh
npm run backgrounds                           # everything
python3 assets/backgrounds/generate.py stills # photos only
python3 assets/backgrounds/generate.py motion # videos only
```

It needs Python 3 with Pillow and NumPy, and ffmpeg with the VP9
encoder (libvpx-vp9; H.264 is not needed). Files go to
`public/backgrounds/`, which Vite serves automatically. The motion loops
take a few minutes to render.

## Missing files

If a photo or video is missing, its preset falls back to a CSS gradient
of the same colours instead of showing a broken slide, so a fresh clone
never breaks a service.
