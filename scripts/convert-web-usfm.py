#!/usr/bin/env python3
"""Convert the World English Bible (WEB) from eBible USFM into the
scrollmapper-shaped JSON the True Worship pack downloader expects:
{"books": [{"name", "chapters": [{"chapter", "verses": [{"verse", "text"}]}]}]}.

Source: https://ebible.org/Scriptures/engwebp_usfm.zip
(66-book Protestant edition, 2020 stable text). WEB is public domain:
see copr.htm in the same zip ("The World English Bible is in the
Public Domain... You may copy, publish, proclaim, distribute...").

Usage:
    python3 convert-web-usfm.py <unzipped-usfm-dir> <output.json>

The output is written to packs/WEB.json in the repo and fetched by the
app from raw.githubusercontent.com (see PackInfo.url in
src/features/bible/packs.ts), because scrollmapper's catalogue has no
WEB file.
"""

import json
import re
import sys
from pathlib import Path

# USFM book code -> display name, in canonical order.
BOOKS = [
    ("GEN", "Genesis"), ("EXO", "Exodus"), ("LEV", "Leviticus"),
    ("NUM", "Numbers"), ("DEU", "Deuteronomy"), ("JOS", "Joshua"),
    ("JDG", "Judges"), ("RUT", "Ruth"), ("1SA", "1 Samuel"),
    ("2SA", "2 Samuel"), ("1KI", "1 Kings"), ("2KI", "2 Kings"),
    ("1CH", "1 Chronicles"), ("2CH", "2 Chronicles"), ("EZR", "Ezra"),
    ("NEH", "Nehemiah"), ("EST", "Esther"), ("JOB", "Job"),
    ("PSA", "Psalms"), ("PRO", "Proverbs"), ("ECC", "Ecclesiastes"),
    ("SNG", "Song of Solomon"), ("ISA", "Isaiah"), ("JER", "Jeremiah"),
    ("LAM", "Lamentations"), ("EZK", "Ezekiel"), ("DAN", "Daniel"),
    ("HOS", "Hosea"), ("JOL", "Joel"), ("AMO", "Amos"),
    ("OBA", "Obadiah"), ("JON", "Jonah"), ("MIC", "Micah"),
    ("NAM", "Nahum"), ("HAB", "Habakkuk"), ("ZEP", "Zephaniah"),
    ("HAG", "Haggai"), ("ZEC", "Zechariah"), ("MAL", "Malachi"),
    ("MAT", "Matthew"), ("MRK", "Mark"), ("LUK", "Luke"),
    ("JHN", "John"), ("ACT", "Acts"), ("ROM", "Romans"),
    ("1CO", "1 Corinthians"), ("2CO", "2 Corinthians"),
    ("GAL", "Galatians"), ("EPH", "Ephesians"), ("PHP", "Philippians"),
    ("COL", "Colossians"), ("1TH", "1 Thessalonians"),
    ("2TH", "2 Thessalonians"), ("1TI", "1 Timothy"),
    ("2TI", "2 Timothy"), ("TIT", "Titus"), ("PHM", "Philemon"),
    ("HEB", "Hebrews"), ("JAS", "James"), ("1PE", "1 Peter"),
    ("2PE", "2 Peter"), ("1JN", "1 John"), ("2JN", "2 John"),
    ("3JN", "3 John"), ("JUD", "Jude"), ("REV", "Revelation"),
]
NAMES = dict(BOOKS)


def clean_verse(raw: str) -> str:
    """Strip USFM markup from one verse's raw text, keeping the words."""
    text = raw
    # Footnotes and cross references: drop marker and content entirely.
    text = re.sub(r"\\f\b.*?\\f\*", "", text, flags=re.DOTALL)
    text = re.sub(r"\\x\b.*?\\x\*", "", text, flags=re.DOTALL)
    # Word markers carry Strong's numbers: \w word|strong="H123"\w*
    text = re.sub(r"\\\+?w\s+([^|\\]+)\|[^\\]*?\\\+?w\*", r"\1", text)
    # Character markers keep their inner text: \add ... \add*,
    # \nd, \wj, \it, \bd, \em, \bk, \+wh, \qt, \qs, \qac, \sig, \sls...
    # The [0-9]* matters: poetry markers \q1 and \q2 must lose their
    # level number too, or stray digits end up in the verse text.
    text = re.sub(r"\\\+?[a-z]+[0-9]*\*?", "", text)
    # Anything left that still looks like a marker is a bug; flag it.
    text = text.replace("~", " ")
    text = re.sub(r"\s+", " ", text).strip()
    return text


def parse_book(path: Path) -> dict:
    text = path.read_text(encoding="utf-8-sig")
    m = re.search(r"^\\id\s+(\S+)", text, flags=re.MULTILINE)
    code = m.group(1) if m else path.stem
    name = NAMES.get(code)
    if name is None:
        raise ValueError(f"{path.name}: unknown book code {code!r}")
    chapters: dict[int, list[dict]] = {}
    current_chapter = None
    current_verse = None
    buf: list[str] = []

    skipped: list[str] = []

    def flush_verse() -> None:
        nonlocal current_verse, buf
        if current_chapter is not None and current_verse is not None:
            cleaned = clean_verse(" ".join(buf))
            if cleaned:
                chapters.setdefault(current_chapter, []).append(
                    {"verse": current_verse, "text": cleaned}
                )
            else:
                # A verse the WEB text omits (e.g. Luke 17:36, kept
                # only as a footnote about other manuscripts): leave
                # it out of the pack, the way books with no text are
                # left out, and record it instead of failing.
                skipped.append(f"{name} {current_chapter}:{current_verse}")
        buf = []

    for line in text.splitlines():
        line = line.strip()
        if not line:
            continue
        cm = re.match(r"^\\c\s+(\d+)", line)
        if cm:
            flush_verse()
            current_chapter = int(cm.group(1))
            current_verse = None
            continue
        vm = re.match(r"^\\v\s+(\d+)(?:\s+(.*))?$", line)
        if vm:
            flush_verse()
            current_verse = int(vm.group(1))
            buf = [vm.group(2) or ""]
            continue
        if line.startswith("\\"):
            # A line starting with a marker. Headings, speaker labels
            # and introductions (\d, \sp, \ip, \is, \ms, \mt, \r, \cl)
            # are not verse text, so drop the whole line. Footnotes and
            # cross references (\f, \x) are appended whole so the span
            # removal in clean_verse can take them out. Every other
            # marker (\q1, \q2, \p, \m, \mi, \li1, \ili, \nb, \b) only
            # opens a verse line, so strip the marker and keep the text.
            mm = re.match(r"^\\\+?([a-z]+)[0-9]*\*?\s?(.*)$", line)
            marker, rest = mm.group(1), mm.group(2)
            if marker in {"d", "sp", "ip", "is", "ms", "mt", "mr", "r",
                          "cl", "toc", "h", "ide", "id"}:
                continue
            if marker in {"f", "x"}:
                if current_verse is not None:
                    buf.append(line)
                continue
            if current_verse is not None and rest:
                buf.append(rest)
            continue
        if current_verse is not None:
            buf.append(line)
    flush_verse()

    ordered = [
        {"chapter": n, "verses": chapters[n]} for n in sorted(chapters)
    ]
    return {"name": name, "chapters": ordered}, skipped


def main() -> None:
    src_dir, out_path = Path(sys.argv[1]), Path(sys.argv[2])
    files = sorted(src_dir.glob("*engwebp.usfm"))
    by_code = {}
    for f in files:
        m = re.search(r"^(\d+)-([A-Z0-9]+)engwebp\.usfm$", f.name)
        if not m:
            continue
        by_code[m.group(2)] = f
    missing = [c for c, _ in BOOKS if c not in by_code]
    if missing:
        raise SystemExit(f"missing books in source: {missing}")
    books = []
    all_skipped: list[str] = []
    for c, _ in BOOKS:
        book, skipped = parse_book(by_code[c])
        books.append(book)
        all_skipped.extend(skipped)
    total = sum(len(v["verses"]) for b in books for v in b["chapters"])
    print(f"books: {len(books)}, verses: {total}")
    if all_skipped:
        print(f"verses omitted in WEB text (left out): {', '.join(all_skipped)}")
    for b in books:
        n = sum(len(v["verses"]) for v in b["chapters"])
        if n == 0:
            raise SystemExit(f"empty book: {b['name']}")
    out_path.write_text(
        json.dumps({"books": books}, ensure_ascii=False), encoding="utf-8"
    )
    print(f"wrote {out_path} ({out_path.stat().st_size} bytes)")


if __name__ == "__main__":
    main()
