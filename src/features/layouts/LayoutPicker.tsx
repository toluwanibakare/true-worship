import { LAYOUTS } from '../../shared/lib/layouts'
import type { Theme } from '../../shared/lib/types'
import { Panel } from '../../shared/components/ui'
import { SlideView } from '../../shared/components/SlideView'

/**
 * Feature: layouts.
 * Pick a pre-installed slide layout from small thumbnails. Each one is
 * drawn with the same renderer as the preview and the projector, using
 * the current theme and background, so it shows exactly where the words
 * will sit: full screen, bottom band, top band, left panel or centre
 * card.
 */
const SAMPLE = ['Amazing grace, how sweet', 'the sound']

export function LayoutPicker({
  activeId,
  theme,
  backgroundCss,
  onPick,
}: {
  activeId: string
  theme: Theme
  backgroundCss?: string
  onPick: (id: string) => void
}) {
  return (
    <Panel title="Layouts" className="h-full">
      <div className="grid grid-cols-[repeat(auto-fill,minmax(104px,1fr))] gap-x-2 gap-y-1.5">
        {LAYOUTS.map((layout) => (
          <div key={layout.id}>
            <button
              type="button"
              onClick={() => onPick(layout.id)}
              title={layout.hint}
              className={`block w-full overflow-hidden rounded border-2 ${
                activeId === layout.id
                  ? 'border-blue-500'
                  : 'border-transparent hover:border-slate-400'
              }`}
            >
              <SlideView
                lines={SAMPLE}
                theme={theme}
                backgroundCss={backgroundCss}
                layoutId={layout.id}
              />
            </button>
            <span className="mt-0.5 block truncate text-[11px] leading-tight text-slate-600 dark:text-slate-300">
              {layout.name}
            </span>
          </div>
        ))}
      </div>
    </Panel>
  )
}
