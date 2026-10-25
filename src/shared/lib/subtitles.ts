/**
 * Subtitle-style layouts (Lower Third, Upper Third) show two lines at a
 * time, like captions. This splits each slide's lines into pieces of at
 * most `perSlide` lines so a four-line verse becomes two slides. The
 * first piece keeps the slide's own label (so jumping to "Verse 2"
 * still lands on it) and later pieces are numbered "Verse 2 · 2".
 * `starts[i]` is where original slide i begins in the new list, for
 * clicks that name an original slide.
 */
export type SplitSlides = {
  slides: string[][]
  labels: string[]
  starts: number[]
}

export function splitIntoSubtitles(
  slides: string[][],
  labels: string[],
  perSlide = 2,
): SplitSlides {
  const out: SplitSlides = { slides: [], labels: [], starts: [] }
  slides.forEach((lines, index) => {
    const label = labels[index] ?? `Slide ${index + 1}`
    out.starts.push(out.slides.length)
    // Blank lines carry no words; keep the slide itself even if it is empty.
    const words = lines.filter((line) => line.trim() !== '')
    if (words.length <= perSlide) {
      out.slides.push(lines)
      out.labels.push(label)
      return
    }
    for (let at = 0, piece = 1; at < words.length; at += perSlide, piece += 1) {
      out.slides.push(words.slice(at, at + perSlide))
      out.labels.push(piece === 1 ? label : `${label} · ${piece}`)
    }
  })
  return out
}
