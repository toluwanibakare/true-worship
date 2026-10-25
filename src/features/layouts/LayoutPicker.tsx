import { LAYOUTS } from '../../shared/lib/layouts'
import { Panel } from '../../shared/components/ui'

/**
 * Feature: layouts.
 * Pick a pre-installed slide layout. Each card shows a small diagram
 * of where the words sit: full screen, bottom band, top band, left
 * panel, or centre card.
 */
export function LayoutPicker({
  activeId,
  onPick,
}: {
  activeId: string
  onPick: (id: string) => void
}) {
  return (
    <Panel title="Layouts" className="h-full">
      <p className="text-sm text-slate-400">
        Where the words sit on screen. The preview and the projector
        always match.
      </p>
      <div className="mt-3 grid grid-cols-2 gap-2">
        {LAYOUTS.map((layout) => (
          <button
            key={layout.id}
            type="button"
            onClick={() => onPick(layout.id)}
            className={`rounded-md border p-2 text-left ${
              activeId === layout.id ? 'border-cyan-400' : 'border-slate-700'
            }`}
          >
            <span className="relative block aspect-video overflow-hidden rounded bg-slate-800">
              {layout.id === 'fullscreen' && (
                <span className="absolute left-1/2 top-1/2 h-2 w-10 -translate-x-1/2 -translate-y-1/2 rounded bg-slate-200" />
              )}
              {layout.id === 'lower-third' && (
                <span className="absolute bottom-0 left-0 right-0 h-1/3 bg-slate-200/80" />
              )}
              {layout.id === 'upper-third' && (
                <span className="absolute left-0 right-0 top-0 h-1/3 bg-slate-200/80" />
              )}
              {layout.id === 'left-panel' && (
                <span className="absolute bottom-0 left-0 top-0 w-1/2 bg-slate-200/80" />
              )}
              {layout.id === 'center-card' && (
                <span className="absolute left-1/2 top-1/2 h-1/2 w-1/2 -translate-x-1/2 -translate-y-1/2 rounded bg-slate-200/80" />
              )}
            </span>
            <span className="mt-2 block text-sm font-medium text-slate-100">
              {layout.name}
            </span>
            <span className="block text-xs text-slate-400">{layout.hint}</span>
          </button>
        ))}
      </div>
    </Panel>
  )
}
