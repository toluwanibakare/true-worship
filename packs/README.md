# Public domain hymn pack

`hymns-01.json` to `hymns-09.json` in this folder are one pack of 25,716
public domain hymns, split into chunks so each file stays small. The
Songs tab downloads the chunks once, keeps them on the computer
(IndexedDB, database `tw-hymns`), and searches them offline after
that. Code: `src/features/songs/hymns.ts`.

Hymnary.org asks users of its dataset to link to https://hymnary.org;
this file and the Songs panel both do.

Prepared 2026-11-02 for True Worship (free worship presentation software).

## The pack

- File: `hymns-public-domain.json` (32,367,005 bytes)
- Format: a JSON array of objects
  `{title, author, year, verses: [string], chorus: string|null, source: "public-domain", sourceDetail}`
- **Total verified hymns with full verses: 25,716**
  - from Hymnary.org PD export: 25,451
  - from the Open Hymnal Project: 265
  - hymns with a separate chorus/refrain field: 12,701
- Verses per hymn: median 4. The longest entry is a 110-verse metrical psalm
  paraphrase from the Hymnary export, kept as the source gives it.

Text handling: wording and punctuation are kept exactly as each source gives
them; nothing was modernised or rewritten. The only changes are structural:
stanza numbers and `Refrain:`/`Chorus:` labels were converted into the
`verses`/`chorus` fields, and a trailing `[Refrain]`/`[Chorus]` repeat cue at
the end of a verse was removed. Known source typos are preserved as-is
(for example, 7 Hymnary entries contain a stray `<` character in the source
text itself).

## Source 1: Hymnary.org public domain export, via Open Christian Data

- Where it came from: Hymnary.org (Calvin University) provided an
  "oldest-PD-instances" export to the Open Christian Data project.
  Downloaded from https://github.com/OpenChristianData/open-christian-data
  (file `data/hymns/hymnary-pd/collection.json`, 50,245,920 bytes; raw copy in
  `sources/hymnary-pd-collection.json`, with the provider README kept as
  `sources/hymnary-pd-README-from-open-christian-data.md`).
- Hymnary.org itself: https://hymnary.org
- How public domain status was verified: the export is explicitly designated
  public domain by Hymnary.org itself; every record is the oldest known
  public-domain hymnal instance of that text (provider statement in the
  retained README, collection `meta.license` = "public-domain", source hash
  sha256:727bb1bee930547352b5fcdd3d9800f158ee156a168c866c2ee50b2472bac475).
  Hymnary asks users to link to hymnary.org when using the dataset.
  As an extra safety filter on top of the provider designation, this pack
  only kept records whose hymnal instance was published in 1930 or earlier
  (pre-1931 publication is public domain in the US), and English texts only.
- Counts: 34,904 records in the export;
  25,647 passed the filters;
  25,451 remain in the final pack after dedupe.
- Excluded from this source, and why:
  - 4,815 records not labelled English
    (the export also contains German, Norwegian, Danish, Polish, Arabic and
    mixed-language texts; this pack is English only).
  - 1,917 English records whose hymnal
    instance year is after 1930 or unknown. The provider designation covers
    them, but they were left out so every hymn in this pack also has an
    independent pre-1931 publication behind it.
  - 2,525 records with no numbered verse stanza, under 30
    words, or no title (fragments and refrain-only entries are not complete
    hymns).

## Source 2: The Open Hymnal Project, Edition 2014.06

- Where it came from: http://openhymnal.org/ — ThML (SWORD) source file
  http://openhymnal.org/openhymnal.201406.xml (1,766,778 bytes; raw copy in
  `sources/openhymnal.201406.xml`). Copyright/licence explanation:
  http://openhymnal.org/copying.html
- How public domain status was verified: the Open Hymnal Project states
  that most of its hymns are public domain in all four parts (words,
  translation, music, setting) and prints the specific copyright terms in
  every hymn's source entry. This pack only kept entries whose own
  copyright line in the file begins "copyright: public domain". The
  project's own compilation and data files are also placed into the public
  domain by the project.
- Counts: 298 hymn entries in the file;
  274 passed the filter;
  265 remain in the final pack after dedupe.
- Excluded from this source, and why:
  - 22 entries whose copyright line does not begin
    "public domain" (for example hymns whose words are public domain but
    whose music/setting is under a 1998 copyright, and hymns under a
    "freely reproducible for Christian worship" notice, which is a licence,
    not public domain). Left out to keep this pack strictly public domain.
  - 2 entries with no extractable lyric verses.
- Note: author and year for Open Hymnal entries were parsed from the
  source's own "Words:" credit line (best effort; a small number of entries
  have no author or year in the pack because the credit line is composite or
  anonymous).

## Merging and dedupe

- Sources were merged and deduped by normalised title + first line of
  verse 1. 205 duplicate entries were removed (the same hymn text
  appearing in both sources, or twice within the Open Hymnal file under
  different tunes). Different translations or versions of a hymn have
  different first lines and are kept as separate entries, as the sources
  give them.

## Sources checked and NOT used

- The Cyber Hymnal (https://www.hymntime.com/tch/): states that the vast
  majority of its material is public domain and that copyrighted entries
  are clearly marked (http://www.hymntime.com/tch/misc/copyrite.htm), but
  it offers no bulk download, only individual hymn pages (16,700+ entries).
  It was not scraped page by page. Documented here instead of working
  around that.
- Hymnary.org website direct: the general site mixes public domain and
  rights-reserved material (https://hymnary.org/copyright). Only its
  dedicated public domain export (Source 1) was used.
- Public Domain Hymnal Project 2018 (https://www.pdhymns.com/): a public
  domain hymnal, but distributed only as PDF and PowerPoint files, with no
  structured text to convert reliably. Not used.
- github.com/h1rdr3v2/open-hymnal-json (300+ Watchman hymns, JSON): the
  repo's MIT licence covers the repository code; there is no per-hymn
  public domain verification for the hymn texts. Excluded for safety.
- github.com/nathan-stewart/nashville-numbers-hymnal: its texts are
  offered under CC BY-NC 4.0, which is not public domain. Excluded.
- The Seventh-day Adventist Hymnal corpus circulating in worship software
  repos: its own attribution states the 1985 hymnal compilation is
  copyrighted and individual texts are mixed PD and not PD. Excluded.
- No CCLI or modern worship material is included anywhere in this pack.

## Download notes / blockers

- openhymnal.org did not answer over HTTPS from this machine (empty
  reply); the same files downloaded fine over the site's own HTTP
  addresses, which is how the ThML file above was obtained. No block was
  worked around: the site publishes both.
- The Hymnary PD export is a 50 MB JSON file in the Open Christian Data
  repo; it was obtained by a sparse git checkout of just that folder.
