import { useEffect, useState } from 'react'
import type { DisplayInfo, DisplaySettings } from '../../shared/lib/types'
import { Button, Panel } from '../../shared/components/ui'
import { loadDisplaySettings, saveDisplaySettings } from './displaySettings'

/**
 * Feature: display.
 * Owns where the live output goes: which monitor, fullscreen or
 * windowed, and always-on-top. The Electron main process does the real
 * placement through the screen API; this panel only picks settings and
 * asks main to apply them. In a browser there is no screen API, so the
 * panel explains that and still lets settings be chosen.
 */
export function DisplayPanel() {
  const [displays, setDisplays] = useState<DisplayInfo[]>([])
  const [settings, setSettings] = useState<DisplaySettings>(loadDisplaySettings)
  const [applied, setApplied] = useState(false)
  const isElectron = Boolean(window.electronAPI)

  useEffect(() => {
    window.electronAPI
      ?.getDisplays()
      .then(setDisplays)
      .catch(() => setDisplays([]))
  }, [])

  const update = (next: DisplaySettings) => {
    setSettings(next)
    saveDisplaySettings(next)
    setApplied(false)
  }

  const apply = () => {
    window.electronAPI?.applyDisplaySettings(settings)
    setApplied(true)
  }

  return (
    <Panel title="Display" className="h-full">
      {!isElectron && (
        <p className="mb-3 text-sm text-amber-400">
          Monitor control needs the desktop app. These settings are saved
          and will apply when you run True Worship on a real machine.
        </p>
      )}
      <label className="block text-sm text-slate-300">
        Output display
        <select
          className="mt-1 block w-full rounded-md border border-slate-700 bg-slate-800 px-2 py-1.5 text-sm"
          value={String(settings.displayId)}
          onChange={(event) =>
            update({
              ...settings,
              displayId:
                event.target.value === 'auto'
                  ? 'auto'
                  : Number(event.target.value),
            })
          }
        >
          <option value="auto">Auto (projector if connected, else main)</option>
          {displays.map((display) => (
            <option key={display.id} value={display.id}>
              {display.label} — {display.width}x{display.height}
              {display.primary ? ' (main)' : ''}
            </option>
          ))}
        </select>
      </label>
      {displays.length === 0 && isElectron && (
        <p className="mt-2 text-xs text-slate-500">No displays reported.</p>
      )}
      <label className="mt-3 flex items-center gap-2 text-sm text-slate-300">
        <input
          type="checkbox"
          checked={settings.fullscreen}
          onChange={(event) =>
            update({ ...settings, fullscreen: event.target.checked })
          }
        />
        Fullscreen on the output display
      </label>
      <label className="mt-2 flex items-center gap-2 text-sm text-slate-300">
        <input
          type="checkbox"
          checked={settings.alwaysOnTop}
          onChange={(event) =>
            update({ ...settings, alwaysOnTop: event.target.checked })
          }
        />
        Keep output window always on top
      </label>
      <div className="mt-4">
        <Button primary onClick={apply}>
          Apply to live window
        </Button>
        {applied && (
          <span className="ml-2 text-xs text-slate-400">
            Applied (takes effect on the open live window, or the next one).
          </span>
        )}
      </div>
      <p className="mt-3 text-xs text-slate-500">
        If the projector is unplugged mid-service, the live window moves
        back to the main display instead of vanishing.
      </p>
    </Panel>
  )
}
