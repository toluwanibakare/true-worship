# True Worship website

A small static site that presents True Worship the way a product site
should: what it does, screenshots of the real app, how a service runs,
how churches move over, the Community Songbook, content licensing, and
how to run it.

## View it

Open `index.html` in a browser, or serve this folder:

```sh
python3 -m http.server 8000
```

then visit http://localhost:8000/.

## Notes

- The screenshots are embedded in `index.html` as data URIs, so the
  page is a single self contained file plus `style.css` and the logo.
  The screenshots were captured from version 0.12.0 running in a
  browser.
- Copy is original to True Worship. Nothing here is copied from any
  other product's site.
- The logo is the repo's SVG master, copied to `assets/logo.svg`.
