import { useEffect, useRef, useState } from 'react'
import type { UserMedia } from '../../electron'
import { Button } from '../../shared/components/ui'
import { Modal } from '../../shared/components/Modal'
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
  onCopyToTheme,
  onSetLogoBackground,
}: {
  onPreview: (item: UserMedia) => void
  onGoLive: (item: UserMedia) => void
  onCopyToTheme?: (item: UserMedia, category: 'song' | 'scripture' | 'presentation') => void
  onSetLogoBackground?: (item: UserMedia) => void
}) {
  const [items, setItems] = useState<UserMedia[]>([])
  const [source, setSource] = useState('All')
  const [query, setQuery] = useState('')
  const [pickedFile, setPickedFile] = useState<string | null>(null)
  const [playing, setPlaying] = useState<string | null>(null)
  const [context, setContext] = useState<{ x: number; y: number; item: UserMedia } | null>(null)
  const [themeSubOpen, setThemeSubOpen] = useState(false)
  const [editing, setEditing] = useState<UserMedia | null>(null)
  const [editName, setEditName] = useState('')
  const [fileDragOver, setFileDragOver] = useState(false)
  const player = useRef<HTMLAudioElement | null>(null)
  const browserFileRef = useRef<HTMLInputElement | null>(null)
  const api = window.electronAPI

  useEffect(() => {
    if (!context) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setContext(null)
        setThemeSubOpen(false)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [context])

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
    const mediaFiles = [...files].filter(
      (file) =>
        file.type.startsWith('image/') ||
        file.type.startsWith('video/') ||
        file.type.startsWith('audio/') ||
        /\.(png|jpe?g|webp|gif|bmp|svg|mp4|webm|mov|mkv|avi|mp3|wav|ogg|m4a)$/i.test(file.name),
    )
    if (mediaFiles.length === 0) return
    const added = mediaFiles.map<UserMedia>((file) => ({
      file: `${file.name}-${file.size}-${Date.now()}`,
      name: file.name.replace(/\.[^.]+$/, ''),
      kind:
        file.type.startsWith('video/') || /\.(mp4|webm|mov|mkv|avi)$/i.test(file.name)
          ? 'video'
          : file.type.startsWith('audio/') || /\.(mp3|wav|ogg|m4a)$/i.test(file.name)
            ? 'audio'
            : 'still',
      url: URL.createObjectURL(file),
    }))
    setItems((current) => [...current, ...added])
  }

  const triggerImport = () => {
    if (api) void add()
    else browserFileRef.current?.click()
  }

  const saveEdit = () => {
    if (!editing) return
    const nextName = editName.trim()
    if (!nextName) return
    setItems((current) =>
      current.map((entry) => (entry.file === editing.file ? { ...entry, name: nextName } : entry)),
    )
    setEditing(null)
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
      <div
        className={`h-full p-3 transition-colors ${fileDragOver ? 'bg-blue-50/60 ring-2 ring-inset ring-blue-500 dark:bg-blue-950/30' : ''}`}
        onDragOver={(event) => {
          if (event.dataTransfer.types.includes('Files')) {
            event.preventDefault()
            event.dataTransfer.dropEffect = 'copy'
            if (!fileDragOver) setFileDragOver(true)
          }
        }}
        onDragLeave={() => setFileDragOver(false)}
        onDrop={(event) => {
          setFileDragOver(false)
          if (event.dataTransfer.files?.length > 0) {
            event.preventDefault()
            addInBrowser(event.dataTransfer.files)
          }
        }}
      >
        <div className="mb-3">
          {api ? (
            <Button onClick={() => void add()}>Add media…</Button>
          ) : (
            <Button onClick={triggerImport}>Add media…</Button>
          )}
          <input
            ref={browserFileRef}
            type="file"
            accept="image/*,video/*,audio/*"
            multiple
            className="hidden"
            onChange={(event) => {
              addInBrowser(event.target.files)
              event.target.value = ''
            }}
          />
        </div>
        <div className="grid grid-cols-[repeat(auto-fill,minmax(104px,1fr))] gap-x-2 gap-y-1.5">
          {visible.map((item) => (
            <div key={item.file} className="group relative">
              <button
                type="button"
                onClick={() => pick(item)}
                onDoubleClick={() => item.kind !== 'audio' && onGoLive(item)}
                onContextMenu={(event) => {
                  event.preventDefault()
                  setPickedFile(item.file)
                  setThemeSubOpen(false)
                  setContext({ x: event.clientX, y: event.clientY, item })
                }}
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
              ? 'No media yet. Use "Add media…" or drag and drop images, videos and audio here.'
              : 'No media matches.'}
          </p>
        )}
      </div>
      {context && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => {
              setContext(null)
              setThemeSubOpen(false)
            }}
            onContextMenu={(event) => {
              event.preventDefault()
              setContext(null)
              setThemeSubOpen(false)
            }}
          />
          <div
            className="fixed z-50 w-56 rounded-md border border-slate-300 bg-white py-1 text-slate-900 shadow-lg dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            style={{ left: Math.min(context.x, window.innerWidth - 240), top: Math.min(context.y, window.innerHeight - 220) }}
          >
            <button
              type="button"
              onClick={() => {
                setContext(null)
                triggerImport()
              }}
              className="block w-full px-3 py-1.5 text-left text-sm hover:bg-slate-200 dark:hover:bg-slate-800"
            >
              {context.item.kind === 'video'
                ? 'Import New Video File…'
                : context.item.kind === 'audio'
                  ? 'Import New Audio File…'
                  : 'Import New Image File…'}
            </button>
            <button
              type="button"
              onClick={() => {
                setEditing(context.item)
                setEditName(context.item.name)
                setContext(null)
              }}
              className="block w-full px-3 py-1.5 text-left text-sm hover:bg-slate-200 dark:hover:bg-slate-800"
            >
              {context.item.kind === 'video'
                ? 'Edit Video Properties…'
                : context.item.kind === 'audio'
                  ? 'Edit Audio Properties…'
                  : 'Edit Image Properties…'}
            </button>
            {context.item.kind !== 'audio' && (
              <>
                <div
                  className="relative"
                  onMouseEnter={() => setThemeSubOpen(true)}
                  onMouseLeave={() => setThemeSubOpen(false)}
                >
                  <button
                    type="button"
                    onClick={() => setThemeSubOpen((value) => !value)}
                    className="flex w-full items-center justify-between px-3 py-1.5 text-left text-sm hover:bg-slate-200 dark:hover:bg-slate-800"
                  >
                    <span>Copy to Theme</span>
                    <span className="text-xs opacity-70">›</span>
                  </button>
                  {themeSubOpen && (
                    <div className="absolute left-full top-0 z-50 ml-0.5 w-48 rounded-md border border-slate-300 bg-white py-1 text-slate-900 shadow-lg dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100">
                      {(
                        [
                          ['song', 'Song Theme'],
                          ['scripture', 'Scripture Theme'],
                          ['presentation', 'Presentation Theme'],
                        ] as const
                      ).map(([category, label]) => (
                        <button
                          key={category}
                          type="button"
                          onClick={() => {
                            onCopyToTheme?.(context.item, category)
                            setContext(null)
                            setThemeSubOpen(false)
                          }}
                          className="block w-full px-3 py-1.5 text-left text-sm hover:bg-slate-200 dark:hover:bg-slate-800"
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    onSetLogoBackground?.(context.item)
                    setContext(null)
                  }}
                  className="block w-full px-3 py-1.5 text-left text-sm hover:bg-slate-200 dark:hover:bg-slate-800"
                >
                  Set As Logo Background
                </button>
              </>
            )}
            <div className="my-1 border-t border-slate-200 dark:border-slate-700" />
            <button
              type="button"
              onClick={() => {
                remove(context.item)
                setContext(null)
              }}
              className="block w-full px-3 py-1.5 text-left text-sm text-red-600 hover:bg-slate-200 dark:text-red-400 dark:hover:bg-slate-800"
            >
              Delete
            </button>
          </div>
        </>
      )}
      {editing && (
        <Modal
          title={editing.kind === 'video' ? 'Video Properties' : editing.kind === 'audio' ? 'Audio Properties' : 'Image Properties'}
          onClose={() => setEditing(null)}
        >
          <div className="flex flex-col gap-3 text-sm">
            <label className="flex flex-col gap-1">
              <span className="font-medium">Title</span>
              <input
                autoFocus
                value={editName}
                onChange={(event) => setEditName(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') saveEdit()
                }}
                className="rounded border border-slate-300 bg-white px-2.5 py-1.5 dark:border-slate-700 dark:bg-slate-900"
              />
            </label>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Type: {editing.kind === 'still' ? 'Image' : editing.kind === 'video' ? 'Video' : 'Audio'} · File: {editing.file}
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditing(null)}
                className="rounded bg-slate-200 px-3 py-1.5 font-medium text-slate-800 dark:bg-slate-800 dark:text-slate-200"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!editName.trim()}
                onClick={saveEdit}
                className="rounded bg-slate-800 px-3 py-1.5 text-white disabled:opacity-50 dark:bg-slate-100 dark:text-slate-900"
              >
                Save
              </button>
            </div>
          </div>
        </Modal>
      )}
    </ResourceView>
  )
}
