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
}

export const LAYOUTS: LayoutPreset[] = [
  {
    id: 'fullscreen',
    name: 'Full Screen',
    hint: 'Big centred words over the whole background.',
    wrapper: 'flex h-full flex-col items-center justify-center p-10 text-center',
    band: '',
  },
  {
    id: 'lower-third',
    name: 'Lower Third',
    hint: 'Words in a band across the bottom, background stays visible.',
    wrapper: 'flex h-full flex-col justify-end',
    band: 'w-full bg-black/60 px-8 py-6 text-left',
  },
  {
    id: 'upper-third',
    name: 'Upper Third',
    hint: 'Words in a band across the top.',
    wrapper: 'flex h-full flex-col justify-start',
    band: 'w-full bg-black/60 px-8 py-6 text-left',
  },
  {
    id: 'left-panel',
    name: 'Left Panel',
    hint: 'Words in a panel down the left side.',
    wrapper: 'flex h-full items-stretch justify-start',
    band: 'flex w-[45%] flex-col justify-center bg-black/60 px-8 text-left',
  },
  {
    id: 'center-card',
    name: 'Centre Card',
    hint: 'Words on a floating card in the middle.',
    wrapper: 'flex h-full items-center justify-center p-10',
    band: 'max-w-2xl rounded-2xl bg-black/60 px-10 py-8 text-center',
  },
]

export function layoutById(id: string | undefined): LayoutPreset {
  return LAYOUTS.find((layout) => layout.id === id) ?? LAYOUTS[0]
}
