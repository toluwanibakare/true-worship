import { useEffect, useRef, useState } from 'react'
import type { UserMedia } from '../../electron'
import { Button } from '../../shared/components/ui'
import { ResourceView } from '../../shared/components/ResourceView'
import { SOURCE_ICONS } from '../../shared/components/sourceIcons'

/**
 * Feature: media.
 * The media library: images, videos and audio the user adds. The side
 * panel filters by kind (All, Videos, Images, Audio). Click an image or
 * video to preview it, double-click to put it live; click an audio
 * track to play it and click again to stop. The desktop app copies
 * added files into its data folder so they stay available; in a plain
 * browser they last until the page is closed.
 */
const SOURCES = ['All', 'Videos', 'Images', 'Audio']
const KIND_OF: Record<string, UserMedia['kind']> = {
  Videos: 'video',
  Images: 'still',
  Audio: 'audio',
}

export function MediaLibrary({
  onPreview,
  onGoLive,
}: {
  onPreview: (item: UserMedia) => void
  onGoLive: (item: UserMedia) => void
}) {
  const [items, setItems] = useState<UserMedia[]>([])
  const [source, setSource] = useState('All')
  const [query, setQuery] = useState('')
  const [pickedFile, setPickedFile] = useState<string | null>(null)
  const [playing, setPlaying] = useState<string | null>(null)
  const player = useRef<HTMLAudioElement | null>(null)
  const api = window.electronAPI

  useEffect(() => {
    api?.listMedia().then(setItems)
  }, [api])

  // Stop any audio when the tab closes.
  useEffect(() => () => player.current?.pause(), [])

  const add = async () => {
    if (!api) return
    const added = await api.importMedia()
    if (added.length > 0) setItems((current) => [...current, ...added])
  }

  const addInBrowser = (files: FileList | null) => {
    if (!files) return
    const added = [...files].map<UserMedia>((file) => ({
      file: `${file.name}-${file.size}`,
      name: file.name.replace(/\.[^.]+$/, ''),
      kind: file.type.startsWith('video/') ? 'video' : file.type.startsWith('audio/') ? 'audio' : 'still',
      url: URL.createObjectURL(file),
    }))
    setItems((current) => [...current, ...added])
  }

  const remove = (item: UserMedia) => {
    if (api) void api.removeMedia(item.file)
    if (playing === item.file) {
      player.current?.pause()
      setPlaying(null)
    }
    setItems((current) => current.filter((entry) => entry.file !== item.file))
  }

  const pick = (item: UserMedia) => {
    setPickedFile(item.file)
    if (item.kind !== 'audio') {
      onPreview(item)
      return
    }
    if (playing === item.file) {
      player.current?.pause()
      setPlaying(null)
      return
    }
    player.current?.pause()
    player.current = new Audio(item.url)
    player.current.onended = () => setPlaying(null)
    void player.current.play()
    setPlaying(item.file)
  }

  const lower = query.trim().toLowerCase()
  const visible = items
    .filter((item) => source === 'All' || item.kind === KIND_OF[source])
    .filter((item) => !lower || item.name.toLowerCase().includes(lower))

  return (
    <ResourceView
      query={query}
      onQuery={setQuery}
      placeholder="Search media"
      sourcesTitle="Media"
      sources={SOURCES}
      activeSource={source}
      onSelectSource={setSource}
      footer={`${visible.length} of ${items.length} ${items.length === 1 ? 'file' : 'files'}`}
    >
      <div className="p-3">
        <div className="mb-3">
          {api ? (
            <Button onClick={() => void add()}>Add media…</Button>
          ) : (
            <label className="cursor-pointer rounded-md bg-slate-200 px-3 py-1.5 text-sm font-medium text-slate-800 hover:bg-slate-300 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700">
              Add media…
              <input
                type="file"
                accept="image/*,video/*,audio/*"
                multiple
                className="hidden"
                onChange={(event) => addInBrowser(event.target.files)}
              />
            </label>
          )}
        </div>
        <div className="grid grid-cols-[repeat(auto-fill,minmax(104px,1fr))] gap-x-2 gap-y-1.5">
          {visible.map((item) => (
            <div key={item.file} className="group relative">
              <button
                type="button"
                onClick={() => pick(item)}
                onDoubleClick={() => item.kind !== 'audio' && onGoLive(item)}
                title={
                  item.kind === 'audio'
                    ? `${item.name} — click to ${playing === item.file ? 'stop' : 'play'}`
                    : `${item.name} — double-click to go live`
                }
                className={`relative flex aspect-video w-full items-center justify-center overflow-hidden rounded border-2 bg-slate-200 dark:bg-slate-800 ${
                  pickedFile === item.file ? 'border-blue-500' : 'border-transparent hover:border-slate-400'
                }`}
                style={
                  item.kind === 'still'
                    ? { background: `url("${item.url}") center / cover no-repeat` }
                    : undefined
                }
              >
                {item.kind === 'video' && (
                  <video
                    src={item.url}
                    muted
                    preload="metadata"
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                )}
                {item.kind === 'audio' && (
                  <span className="scale-[2] text-slate-500 dark:text-slate-300">
                    {playing === item.file ? '■' : SOURCE_ICONS.Audio}
                  </span>
                )}
              </button>
              <span className="mt-0.5 block truncate text-[11px] leading-tight text-slate-600 dark:text-slate-300">
                {item.name}
              </span>
              <button
                type="button"
                aria-label={`Remove ${item.name}`}
                onClick={() => remove(item)}
                className="absolute left-0.5 top-0.5 hidden h-4 w-4 items-center justify-center rounded-full bg-black/70 text-[10px] leading-none text-white group-hover:flex"
              >
                ×
              </button>
            </div>
          ))}
        </div>
        {visible.length === 0 && (
          <p className="py-4 text-sm text-slate-500">
            {items.length === 0
              ? 'No media yet. Use "Add media…" to bring in images, videos and audio.'
              : 'No media matches.'}
          </p>
        )}
      </div>
    </ResourceView>
  )
}
