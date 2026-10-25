import { useEffect, useState } from 'react'
import {
  CLASSIC_BACKGROUNDS,
  MOTION_BACKGROUNDS,
  PHOTO_BACKGROUNDS,
  userBackground,
  type BackgroundPreset,
} from './backgrounds'
import { Button, Panel } from '../../shared/components/ui'

/**
 * Feature: backgrounds.
 * Pick a look for slides from small thumbnail grids: generated photos,
 * looping motion backgrounds, built-in classics, and the photos and
 * videos the user adds. Added files are copied into the desktop app's
 * data folder and served to the projector window from there; in a
 * plain browser they last until the page is closed.
 */
function Tile({
  preset,
  active,
  onPick,
  onRemove,
}: {
  preset: BackgroundPreset
  active: boolean
  onPick: () => void
  onRemove?: () => void
}) {
  return (
    <div className="group relative">
      <button
        type="button"
        onClick={onPick}
        title={preset.name}
        className={`relative block aspect-video w-full overflow-hidden rounded border-2 ${
          active ? 'border-blue-500' : 'border-transparent hover:border-slate-400'
        }`}
        style={{ background: preset.css }}
      >
        {preset.kind === 'video' && preset.css === '#000000' && preset.video && (
          <video
            src={preset.video}
            muted
            preload="metadata"
            className="absolute inset-0 h-full w-full object-cover"
          />
        )}
        {preset.kind === 'video' && (
          <span className="absolute right-0.5 top-0.5 rounded bg-black/60 px-1 text-[9px] leading-4 text-white">
            ▶
          </span>
        )}
      </button>
      <span className="mt-0.5 block truncate text-[11px] leading-tight text-slate-600 dark:text-slate-300">
        {preset.name}
      </span>
      {onRemove && (
        <button
          type="button"
          aria-label={`Remove ${preset.name}`}
          onClick={onRemove}
          className="absolute left-0.5 top-0.5 hidden h-4 w-4 items-center justify-center rounded-full bg-black/70 text-[10px] leading-none text-white group-hover:flex"
        >
          ×
        </button>
      )}
    </div>
  )
}

const GRID = 'grid grid-cols-[repeat(auto-fill,minmax(104px,1fr))] gap-x-2 gap-y-1.5'

export function BackgroundPicker({
  activeId,
  onPick,
}: {
  activeId: string | null
  onPick: (preset: BackgroundPreset | null) => void
}) {
  const [mine, setMine] = useState<BackgroundPreset[]>([])
  const api = window.electronAPI

  useEffect(() => {
    api?.listBackgrounds().then((files) => setMine(files.map(userBackground)))
  }, [api])

  const add = async () => {
    if (!api) return
    const added = await api.importBackgrounds()
    if (added.length > 0) setMine((current) => [...current, ...added.map(userBackground)])
  }

  // Plain browser: no data folder, so keep the picked files for this session.
  const addInBrowser = (files: FileList | null) => {
    if (!files) return
    const added = [...files].map((file) =>
      userBackground({
        file: `${file.name}-${file.size}`,
        name: file.name.replace(/\.[^.]+$/, ''),
        kind: file.type.startsWith('video/') ? 'video' : 'still',
        url: URL.createObjectURL(file),
      }),
    )
    setMine((current) => [...current, ...added])
  }

  const remove = (preset: BackgroundPreset) => {
    if (api) void api.removeBackground(preset.id.replace(/^mine:/, ''))
    if (activeId === preset.id) onPick(null)
    setMine((current) => current.filter((entry) => entry.id !== preset.id))
  }

  const section = (title: string, list: BackgroundPreset[], removable = false) => (
    <section className="mb-3">
      <h3 className="mb-1.5 text-[11px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
        {title}
      </h3>
      <div className={GRID}>
        {list.map((preset) => (
          <Tile
            key={preset.id}
            preset={preset}
            active={activeId === preset.id}
            onPick={() => onPick(preset)}
            onRemove={removable ? () => remove(preset) : undefined}
          />
        ))}
      </div>
    </section>
  )

  return (
    <Panel title="Backgrounds" className="h-full">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        {api ? (
          <Button onClick={() => void add()}>Add photos or videos…</Button>
        ) : (
          <label className="cursor-pointer rounded-md bg-slate-200 px-3 py-1.5 text-sm font-medium text-slate-800 hover:bg-slate-300 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700">
            Add photos or videos…
            <input
              type="file"
              accept="image/*,video/*"
              multiple
              className="hidden"
              onChange={(event) => addInBrowser(event.target.files)}
            />
          </label>
        )}
        <Button onClick={() => onPick(null)} active={activeId === null}>
          Plain theme colour
        </Button>
      </div>
      {mine.length > 0 && section('My Backgrounds', mine, true)}
      {section('Photos', PHOTO_BACKGROUNDS)}
      {section('Motion', MOTION_BACKGROUNDS)}
      {section('Classic', CLASSIC_BACKGROUNDS)}
    </Panel>
  )
}
