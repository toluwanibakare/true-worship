import type { Theme } from '../../shared/lib/types'
import { Panel } from '../../shared/components/ui'

/**
 * Feature: themes.
 * Owns the look of the output: background, text colour and size. A theme
 * applies to whatever is live, so this panel only picks the theme and
 * the live feature does the rendering.
 */
export function ThemePicker({
  themes,
  activeId,
  onPick,
}: {
  themes: Theme[]
  activeId: string
  onPick: (id: string) => void
}) {
  return (
    <Panel title="Themes" className="h-full">
      <div className="grid grid-cols-2 gap-2">
        {themes.map((theme) => (
          <button
            key={theme.id}
            type="button"
            onClick={() => onPick(theme.id)}
            className={`rounded-md border p-3 text-left text-sm ${
              theme.id === activeId
                ? 'border-blue-500 bg-slate-800'
                : 'border-slate-700 hover:bg-slate-800'
            }`}
            style={{ background: theme.background, color: theme.textColor }}
          >
            {theme.name}
          </button>
        ))}
      </div>
      <p className="mt-3 text-xs text-slate-500">
        Custom themes, fonts and per-slide backgrounds come next.
      </p>
    </Panel>
  )
}
