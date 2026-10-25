# Roadmap: what a full worship presenter has, and where True Worship is

A feature audit against the screens of mainstream worship presentation
software. Status is what the code does today. Slices are ordered by how
much a Sunday depends on them, and each is small enough to build and
check on its own.

## Where we are

| Area | Status |
| --- | --- |
| Window layout: schedule, preview, live, outputs, resource tabs, draggable panes | Done |
| Toolbar: New and Open menus, Save only when something changed, Go Live, Alerts, Logo, Black, Clear, Live, Web | Done |
| Songs tab: search with field menu, table, New / Edit / Delete, online lyrics | Done (basic) |
| Scriptures tab: versions you add and download (public-domain Bibles, full text offline), search across every verse, reference jump, sortable table | Done (English public-domain Bibles) |
| Media: images, videos, audio library, preview, live | Done |
| Backgrounds, layouts (full screen, subtitle lower and upper third, left panel, centre card) | Done |
| Web browser with live mirroring | Done |
| Import: .ews schedules (partial), Songs.db (SQLite), OpenSong, OpenLyrics, text, .twp | Done / partial |
| Live Settings: display choice, NDI output | Done |
| Alerts (marquee), logo, black, clear | Done |

## What is missing, in the order to build it

1. **Settings dialog.** One dialog with Main Output, Alternate Output
   (NDI), Foldback, Service Intervals and Advanced, and per-content tabs
   (General, Song, Scripture, Presentation, Transitions, Alerts): screen
   margins, a default font, slide transitions (fade, cut), and a preview
   of the output. Today only display choice and NDI exist, in Live
   Settings.
2. **Themes.** A theme editor and a Themes tab with Song, Scripture and
   Presentation sources: pick a background (photo, video, colour), text
   style, where the reference and the song title and author go, then
   drag a theme onto a schedule item. Today there are two themes with a
   font and a Bold switch.
3. **Song editor, full.** The Words and Slides tabs, per-slide labels
   and ordering, per-slide formatting, insert scripture and media, an
   inspector, spell check and print. Today: title, author, copyright and
   words.
4. **Schedule editing.** Edit Item, Edit Title, Edit Note, a list and
   grid view toggle, Add Item (blank presentation, media file), update
   items after a song changes, and drag from a resource onto the list.
5. **Collections.** Rule-based collections ("title contains love") and
   My Collections for songs, media and scriptures, with the side panel
   groups that go with them. They were removed from the side panels
   until they do something.
6. **Presentations.** Import PowerPoint or PDF decks as slide items;
   blank presentation editor.
7. **Profiles.** Named setups (display, NDI, theme, font) you can switch
   between from a Profiles menu.
8. **Output polish.** Live volume and playback controls for video and
   audio items, the View menu layouts (Preview and Live Combined, Live
   with Resource Preview), interface colour, and a nursery-style alert
   set.
9. **Media extras.** Feeds, DVD and capture sources, edit properties,
   "copy to theme", "set as logo background".
10. **Remote.** A phone or tablet remote for next, previous, Black, Logo,
    and the schedule.
11. **Store and online sources.** CCLI SongSelect for licensed churches,
    more Bible packs (Nigerian languages in particular), and a media
    store of licensed backgrounds.

Everything above that touches content follows the licensing rules in
`CONTRIBUTING.md`: public domain, owned, licensed, or imported by the
user, never bundled without permission.
