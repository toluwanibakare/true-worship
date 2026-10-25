import type { Theme } from '../../shared/lib/types'
import { Panel } from '../../shared/components/ui'
import { SlideView } from '../../shared/components/SlideView'

/**
 * Feature: live — the slide grid.
 * The Live pane shows the live item's slides as a grid of
 * thumbnails, each with a blue label bar underneath; the slide on
 * screen has a bright outline. Click a thumbnail to put that slide on
 * the output. Thumbnails stay still (no video, no marquee) so a grid
 * of them is not playing at once. The Go Live, Logo, Black and Clear
 * controls are in the toolbar, so this pane only
 * steps through slides.
 */
export function LivePanel({
  title,
  theme,
  slides,
  slideLabels,
  liveSlideIndex,
  live,
  backgroundCss,
  layoutId,
  onSelectLiveSlide,
}: {
  title: string
  theme: Theme
  slides: string[][]
  slideLabels: string[]
  liveSlideIndex: number
  live: boolean
  backgroundCss?: string
  layoutId?: string
  onSelectLiveSlide: (index: number) => void
}) {
  return (
    <Panel title={`Live — ${title}`} className="h-full">
      {slides.length > 0 ? (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(140px,168px))] gap-3">
          {slides.map((lines, index) => {
            const label = slideLabels[index] ?? `Slide ${index + 1}`
            const onScreen = live && index === liveSlideIndex
            return (
              <button
                key={`${label}-${index}`}
                type="button"
                onClick={() => onSelectLiveSlide(index)}
                className={`overflow-hidden rounded-md border-2 text-left ${
                  onScreen ? 'border-blue-500' : 'border-transparent hover:border-slate-400'
                }`}
              >
                <SlideView
                  lines={lines}
                  theme={theme}
                  backgroundCss={backgroundCss}
                  layoutId={layoutId}
                />
                <span className="block truncate bg-blue-600 px-2 py-0.5 text-xs text-white">
                  {index + 1} · {label}
                </span>
              </button>
            )
          })}
        </div>
      ) : (
        <p className="text-sm text-slate-500">
          Nothing is live. Select an item and press Go Live, then step through
          its slides from here.
        </p>
      )}
    </Panel>
  )
}
