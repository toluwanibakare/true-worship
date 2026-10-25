import type { Theme } from '../../shared/lib/types'
import { Panel } from '../../shared/components/ui'

/**
 * Feature: themes.
 * Owns the look of the output: background, text colour, size and
 * display font. A theme applies to whatever is live, so this panel
 * picks the theme and its display font, and the live feature does
 * the rendering. The font travels to the projector with the live
 * slide, so the theme font decides what the room sees.
 */

/**
 * Display font choices. Calibri and Arial lead the list, followed by
 * the usual Windows presentation fonts churches pick from. Calibri and Segoe UI are Microsoft fonts, so they are
 * named here, never bundled; on machines without them the stack
 * falls back to the next font in line.
 */
export const DISPLAY_FONTS = [
  { label: 'Calibri', value: "'Calibri', 'Carlito', Arial, sans-serif" },
  { label: 'Arial', value: 'Arial, sans-serif' },
  { label: 'Segoe UI', value: "'Segoe UI', system-ui, sans-serif" },
  { label: 'Verdana', value: 'Verdana, sans-serif' },
  { label: 'Tahoma', value: 'Tahoma, sans-serif' },
  { label: 'Trebuchet MS', value: "'Trebuchet MS', sans-serif" },
  { label: 'Georgia', value: 'Georgia, serif' },
  { label: 'Times New Roman', value: "'Times New Roman', serif" },
]

export function ThemePicker({
  themes,
  activeId,
  onPick,
  onFontChange,
  onBoldChange,
}: {
  themes: Theme[]
  activeId: string
  onPick: (id: string) => void
  onFontChange: (id: string, fontFamily: string) => void
  onBoldChange: (id: string, bold: boolean) => void
}) {
  const active = themes.find((entry) => entry.id === activeId) ?? themes[0]

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
                ? 'border-blue-500 bg-slate-200 dark:bg-slate-800'
                : 'border-slate-300 dark:border-slate-700 hover:bg-slate-300 dark:hover:bg-slate-800'
            }`}
            style={{ background: theme.background, color: theme.textColor }}
          >
            {theme.name}
          </button>
        ))}
      </div>
      {active && (
        <div className="mt-3">
          <label className="mb-1 block text-sm font-medium" htmlFor="display-font">
            Display font for {active.name}
          </label>
          <select
            id="display-font"
            value={active.fontFamily}
            onChange={(event) => onFontChange(active.id, event.target.value)}
            className="w-full rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-900"
          >
            {DISPLAY_FONTS.map((font) => (
              <option key={font.value} value={font.value}>
                {font.label}
              </option>
            ))}
          </select>
          <label className="mt-2 flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={active.bold}
              onChange={(event) => onBoldChange(active.id, event.target.checked)}
            />
            Bold text
          </label>
          <div
            className="mt-2 rounded-md p-3 text-center text-lg"
            style={{
              background: active.background,
              color: active.textColor,
              fontFamily: active.fontFamily,
              fontWeight: active.bold ? 700 : 400,
            }}
          >
            Amazing grace, how sweet the sound
          </div>
        </div>
      )}
      <p className="mt-3 text-xs text-slate-500">
        The display font travels to the projector with the live slide,
        and the preview always matches it.
      </p>
    </Panel>
  )
}
