import type { Song } from './types'

/**
 * The small line at the bottom-left of a song's first slide: title, author,
 * the copyright holder (or "Public Domain") and the CCLI number when the
 * church holds a licence. Empty parts are left out.
 */
export function songCredit(song: Song): string {
  const rights = song.copyright?.trim() || (song.source === 'public-domain' ? 'Public Domain' : '')
  return [`“${song.title}”`, song.author.trim(), rights, song.ccli ? `CCLI Song # ${song.ccli}` : '']
    .filter((part) => part !== '')
    .join(' · ')
}
