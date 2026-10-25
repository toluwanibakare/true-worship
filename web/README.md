# True Worship website

A static site that presents True Worship: what it does, screenshots of the
real app, how a service runs, how churches move over, the Community Songbook,
content licensing, and how to run it. It is light and editorial, in two colours (deep
blue and cyan), with a real-app walkthrough video, full-width screenshots,
motion backgrounds that play on scroll and an animated FAQ. It needs no build step.

## View it

Open `index.html` in a browser, or serve this folder:

```sh
python3 -m http.server 8000
```

then visit http://localhost:8000/.

## Files

- `index.html`: the page. It includes an inline SVG sprite of the Solar icons it
  uses (outline at rest, bold on hover), so there is no icon request.
- `style.css`: the design. Rounded-full buttons, no box shadows (depth comes from
  hairlines and flat tints), blue and cyan only, and a serif for marketing headings.
- `site.js`: small, dependency-free enhancements: scroll reveals, videos that play
  only while on screen, a pausable walkthrough, copy buttons, the FAQ and the mobile
  menu. The page reads and works without it, and motion is skipped for visitors who
  ask for reduced motion.
- `assets/shots/`: WebP screenshots captured from the real app (version 0.18.0).
  Recapture them when the interface changes.
- `assets/media/`: the real-app walkthrough (`demo.webm`), its poster, and the
  motion loops and photo stills copied from `public/backgrounds/`.
- `assets/logo.svg`: the repo's SVG master.

## Notes

- The heading font is Ciscela when it is installed (it leads the font stack),
  and falls back to a system serif. The font is not bundled; to ship it, add the
  licensed files under `assets/fonts/` and point the `@font-face` at them.
- Icons are Solar by 480 Design, CC BY 4.0, credited in the footer.
- Copy is original to True Worship. Nothing here is copied from any other
  product's site, and the screenshots are of True Worship itself.
