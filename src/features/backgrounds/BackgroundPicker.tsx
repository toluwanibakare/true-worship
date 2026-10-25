import { BACKGROUNDS, type BackgroundPreset } from './backgrounds'
import { Button, Panel } from '../../shared/components/ui'

/**
 * Feature: backgrounds.
 * Pick a pre-installed look for slides. Stills work everywhere at
 * once; motion presets play their looping video when the file is
 * present and fall back to the same still look when it is not (fresh
 * clones need one run of assets/backgrounds/generate.py first).
 */
export function BackgroundPicker({
  activeId,
  onPick,
}: {
  activeId: string | null
  onPick: (preset: BackgroundPreset | null) => void
}) {
  return (
    <Panel title="Backgrounds" className="h-full">
      <p className="text-sm text-slate-500 dark:text-slate-400">
        Stills are built into the app. Motion backgrounds loop quietly
        behind the words.
      </p>
      <div className="mt-3 grid grid-cols-2 gap-2">
        {BACKGROUNDS.map((preset) => (
          <button
            key={preset.id}
            type="button"
            onClick={() => onPick(preset)}
            className={`relative aspect-video overflow-hidden rounded-md border text-left ${
              activeId === preset.id ? 'border-cyan-400' : 'border-slate-300 dark:border-slate-700'
            }`}
            style={{ background: preset.css }}
          >
            <span className="absolute bottom-1 left-1 rounded bg-black/60 px-1.5 py-0.5 text-xs text-white">
              {preset.name}
            </span>
            {preset.kind === 'video' && (
              <span className="absolute right-1 top-1 rounded bg-black/60 px-1.5 py-0.5 text-xs text-white">
                Motion
              </span>
            )}
          </button>
        ))}
      </div>
      <div className="mt-3">
        <Button onClick={() => onPick(null)}>Use plain theme colour</Button>
      </div>
      <p className="mt-3 text-xs text-slate-500">
        Motion files live in public/backgrounds/. If a motion background
        shows its still look instead, run python3
        assets/backgrounds/generate.py to rebuild the videos.
      </p>
    </Panel>
  )
}
