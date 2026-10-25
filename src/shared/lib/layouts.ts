/**
 * Shared layout definitions (used by the Layouts picker and by the
 * live output window, which is why they live in shared, not in the
 * layouts feature folder).
 * Pre-installed slide layouts for the live output: where the words
 * sit on screen. The same layout renders in the operator preview and
 * on the projector, so what the operator sees is what the room gets.
 * Classes are literal strings so Tailwind picks them up.
 */

export type LayoutPreset = {
  id: string
  name: string
  hint: string
  /** Classes for the full-height wrapper that positions the text. */
  wrapper: string
  /** Classes for the band behind the text, or '' for bare fullscreen text. */
  band: string
  /**
   * Caption style: centred words with no band, two lines at a time, a
   * smaller font that shrinks further to fit, and only a soft fade at
   * the screen edge for contrast.
   */
  subtitle?: 'bottom' | 'top'
  /** Share of the theme's font size used by this layout (default 1). */
  fontScale?: number
  /**
   * The room the words have, in the 1280 x 720 slide: the width and height of
   * the area they must fit inside. Long text is sized down until it fits.
   */
  box?: { width: number; height: number }
}

export const LAYOUTS: LayoutPreset[] = [
  {
    id: 'fullscreen',
    name: 'Full Screen',
    hint: 'Big centred words over the whole background.',
    wrapper: 'flex h-full flex-col items-center justify-center px-8 py-6 text-center',
    band: '',
    box: { width: 1160, height: 620 },
  },
  {
    id: 'lower-third',
    name: 'Lower Third',
    hint: 'Subtitle-style words, centred along the bottom, two lines at a time.',
    wrapper: 'flex h-full flex-col justify-end px-24 pb-14 text-center',
    band: '',
    subtitle: 'bottom',
    fontScale: 0.72,
  },
  {
    id: 'upper-third',
    name: 'Upper Third',
    hint: 'Subtitle-style words, centred along the top, two lines at a time.',
    wrapper: 'flex h-full flex-col justify-start px-24 pt-14 text-center',
    band: '',
    subtitle: 'top',
    fontScale: 0.72,
  },
  {
    id: 'left-panel',
    name: 'Left Panel',
    hint: 'Words in a panel down the left side.',
    wrapper: 'flex h-full items-stretch justify-start',
    band: 'flex w-[45%] flex-col justify-center bg-black/60 px-8 text-left',
    box: { width: 490, height: 600 },
  },
  {
    id: 'center-card',
    name: 'Centre Card',
    hint: 'Words on a floating card in the middle.',
    wrapper: 'flex h-full items-center justify-center p-10',
    band: 'max-w-2xl rounded-2xl bg-black/60 px-10 py-8 text-center',
    box: { width: 570, height: 500 },
  },
]

export function layoutById(id: string | undefined): LayoutPreset {
  return LAYOUTS.find((layout) => layout.id === id) ?? LAYOUTS[0]
}
