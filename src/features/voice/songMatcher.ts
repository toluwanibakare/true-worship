import type { Song } from '../../shared/lib/types'

/**
 * Feature: voice — which song is being sung, and where in it.
 * What the speech engine hears of singing is rough, so a phrase is compared
 * with each slide by the word pairs they share rather than by exact lines.
 * A phrase that includes the last line of a slide means the next slide is
 * about to be sung, so the matcher says so ("atEnd") and the screen can move
 * on a line ahead of the singers instead of a line behind them.
 */
type Grams = Set<string>

type IndexedSlide = { verse: number; words: number; grams: Grams; lastGrams: Grams }
export type SongEntry = { id: string; title: string; slides: IndexedSlide[] }
export type SongIndex = SongEntry[]

export type SongMatch = {
  songId: string
  /** Index of the slide (verse block) in the song. */
  verse: number
  /** Share of the phrase's word pairs found in that slide, 0 to 1. */
  score: number
  /** The phrase reached the end of that slide. */
  atEnd: boolean
}

const wordsOf = (text: string) =>
  text
    .toLowerCase()
    .replace(/[’']/g, '')
    .replace(/[^\p{L}\p{N} ]+/gu, ' ')
    .split(/\s+/)
    .filter(Boolean)

function pairs(words: string[]): Grams {
  const out: Grams = new Set()
  for (let i = 0; i + 1 < words.length; i += 1) out.add(`${words[i]} ${words[i + 1]}`)
  // A single word still counts, so a one-line chorus can be matched.
  if (words.length === 1) out.add(words[0])
  return out
}

export function buildSongIndex(songs: Song[]): SongIndex {
  return songs
    .map((song) => ({
      id: song.id,
      title: song.title,
      slides: song.verses
        .map((verse, index) => {
          const lines = verse.lines.filter((line) => line.trim() !== '')
          const all = lines.flatMap(wordsOf)
          const last = lines.length > 0 ? wordsOf(lines[lines.length - 1]) : []
          return { verse: index, words: all.length, grams: pairs(all), lastGrams: pairs(last) }
        })
        .filter((slide) => slide.words >= 2),
    }))
    .filter((entry) => entry.slides.length > 0)
}

const overlap = (phrase: Grams, slide: Grams) => {
  if (phrase.size === 0) return 0
  let shared = 0
  for (const gram of phrase) if (slide.has(gram)) shared += 1
  return shared / phrase.size
}

/** The best slide for what was just heard, in one song or in all of them; null when it is too short. */
export function matchPhrase(index: SongIndex, text: string, onlySong?: string): SongMatch | null {
  const words = wordsOf(text)
  // Too short to tell songs apart; inside a known song a short phrase is enough.
  if (words.length < (onlySong ? 3 : 4)) return null
  const phrase = pairs(words)
  let best: SongMatch | null = null
  for (const song of index) {
    if (onlySong && song.id !== onlySong) continue
    for (const slide of song.slides) {
      const score = overlap(phrase, slide.grams)
      if (score <= 0 || (best && score <= best.score)) continue
      const endShare = slide.lastGrams.size > 0 ? overlap(slide.lastGrams, phrase) : 0
      best = { songId: song.id, verse: slide.verse, score, atEnd: endShare >= 0.5 }
    }
  }
  return best
}

/** The slide to show after hearing a phrase in the song being followed, or null to stay. */
export function nextVerse(index: SongIndex, current: SongMatch['verse'], songId: string, match: SongMatch): number | null {
  if (match.songId !== songId || match.score < 0.5) return null
  const song = index.find((entry) => entry.id === songId)
  if (!song) return null
  if (match.verse === current) {
    if (!match.atEnd) return null
    const later = song.slides.find((slide) => slide.verse > current)
    return later ? later.verse : null
  }
  return match.verse
}
