import { useEffect, useMemo, useRef, useState } from 'react'
import { SchedulePanel } from '../features/schedule/SchedulePanel'
import { SongLibrary } from '../features/songs/SongLibrary'
import { BibleLookup } from '../features/bible/BibleLookup'
import { MediaLibrary } from '../features/media/MediaLibrary'
import { ThemePicker } from '../features/themes/ThemePicker'
import { LivePanel } from '../features/live/LivePanel'
import { LiveWindow } from '../features/live/LiveWindow'
import { AlertBar } from '../features/alerts/AlertBar'
import { SongbookPanel } from '../features/songbook/SongbookPanel'
import { ImporterPanel } from '../features/importer/ImporterPanel'
import { downloadTworship, importFile } from '../features/importer'
import wasmUrl from '../features/importer/sqlWasmUrl'
import { DisplayPanel } from '../features/display/DisplayPanel'
import { loadDisplaySettings } from '../features/display/displaySettings'
import { NdiPanel } from '../features/ndi/NdiPanel'
import { BackgroundPicker } from '../features/backgrounds/BackgroundPicker'
import type { BackgroundPreset } from '../features/backgrounds/backgrounds'
import { LayoutPicker } from '../features/layouts/LayoutPicker'
import { layoutById } from '../shared/lib/layouts'
import { Marquee, type MarqueeAlert } from '../shared/components/Marquee'
import { MenuBar, type ThemeMode } from './MenuBar'
import { Button, Panel } from '../shared/components/ui'
import { demoPassage, demoSchedule, demoSongs, demoThemes } from '../shared/lib/demo'
import type { ScheduleItem, Song } from '../shared/lib/types'

/**
 * App shell, laid out the way EasyWorship lays its main window out,
 * from the EasyWorship 7 screenshots: a menu bar and toolbar on top,
 * then three full-height columns — the schedule down the left, the
 * preview in the centre, the live output down the right — and the
 * resources (songs, Bible, media, themes, and the rest) as a strip
 * across the bottom. Light, dark and system themes, the same choice
 * EasyWorship itself offers.
 */

type Tab = 'songs' | 'bible' | 'media' | 'themes' | 'backgrounds' | 'layouts' | 'songbook' | 'import' | 'alerts' | 'display' | 'ndi'

type Preview = {
  title: string
  /** Slides: each entry is one slide's lines. */
  slides: string[][]
}

function previewForSchedule(item: ScheduleItem | undefined, songs: Song[]): Preview {
  if (!item) return { title: 'Nothing selected', slides: [['Select an item from the schedule.']] }
  if (item.type === 'song') {
    const song = songs.find((entry) => entry.id === item.ref)
    if (!song) return { title: item.title, slides: [['Song not found.']] }
    return {
      title: song.title,
      slides: song.verses.map((verse) => verse.lines),
    }
  }
  if (item.type === 'scripture') {
    const text = demoPassage[item.ref]
    return { title: item.ref, slides: text ? [[text]] : [['Passage not in the demo library.']] }
  }
  return { title: item.title, slides: [[item.title]] }
}

export function App() {
  const [schedule, setSchedule] = useState<ScheduleItem[]>(demoSchedule)
  const [songs, setSongs] = useState<Song[]>(demoSongs)
  const [selectedId, setSelectedId] = useState<string | null>(demoSchedule[0]?.id ?? null)
  const [tab, setTab] = useState<Tab>('songs')
  const [themeId, setThemeId] = useState(demoThemes[0].id)
  const [themeMode, setThemeMode] = useState<ThemeMode>(
    () => (localStorage.getItem('tw-theme') as ThemeMode) || 'system',
  )
  const [background, setBackground] = useState<BackgroundPreset | null>(null)
  const [layoutId, setLayoutId] = useState('fullscreen')
  const [alert, setAlert] = useState<MarqueeAlert | null>(null)
  const [slideIndex, setSlideIndex] = useState(0)
  const [live, setLive] = useState<{ title: string; lines: string[] } | null>(null)
  const [liveSlides, setLiveSlides] = useState<string[][] | null>(null)
  const [liveSlideLabels, setLiveSlideLabels] = useState<string[]>([])
  const [liveSlideIndex, setLiveSlideIndex] = useState(0)
  const [black, setBlack] = useState(false)
  const [logo, setLogo] = useState(false)
  const [customPreview, setCustomPreview] = useState<Preview | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Light / dark / system theme. System follows the operating system
  // and keeps following it when the OS setting changes.
  useEffect(() => {
    localStorage.setItem('tw-theme', themeMode)
    const apply = () => {
      const dark =
        themeMode === 'dark' ||
        (themeMode === 'system' &&
          window.matchMedia('(prefers-color-scheme: dark)').matches)
      document.documentElement.classList.toggle('dark', dark)
    }
    apply()
    if (themeMode === 'system') {
      const query = window.matchMedia('(prefers-color-scheme: dark)')
      query.addEventListener('change', apply)
      return () => query.removeEventListener('change', apply)
    }
  }, [themeMode])

  const selected = schedule.find((item) => item.id === selectedId)
  const preview = useMemo(
    () => customPreview ?? previewForSchedule(selected, songs),
    [customPreview, selected, songs],
  )
  const slide = preview.slides[Math.min(slideIndex, preview.slides.length - 1)] ?? []
  const theme = demoThemes.find((entry) => entry.id === themeId) ?? demoThemes[0]

  // Slide labels: song verses keep their names (Verse 1, Chorus),
  // everything else is numbered.
  const selectedSong =
    selected?.type === 'song' ? songs.find((entry) => entry.id === selected.ref) : undefined
  const slideLabels = selectedSong
    ? selectedSong.verses.map((verse) => verse.label)
    : preview.slides.map((_, index) => `Slide ${index + 1}`)

  // The Electron main process loads the projector window with ?live=1.
  // That window only renders what the operator window sends it.
  const isLiveWindow =
    new URLSearchParams(window.location.search).get('live') === '1'
  const sendLive = (
    title: string,
    lines: string[],
    forcedBackground?: string,
    alertArg?: MarqueeAlert | null,
  ) => {
    window.electronAPI?.sendLiveUpdate({
      title,
      lines,
      background: forcedBackground ?? theme.background,
      // A forced background (Black, Logo) overrides the picked look.
      backgroundCss: forcedBackground ? undefined : (background?.css ?? theme.background),
      backgroundVideo: forcedBackground ? undefined : background?.video,
      layout: layoutId,
      alert: alertArg !== undefined ? alertArg : alert,
      textColor: theme.textColor,
      fontSize: theme.fontSize,
    })
  }

  const showPreview = (next: Preview) => {
    setCustomPreview(next)
    setSlideIndex(0)
  }

  const openSong = (song: Song) => {
    showPreview({ title: song.title, slides: song.verses.map((verse) => verse.lines) })
  }

  const handleGoLive = () => {
    setLive({ title: preview.title, lines: slide })
    setLiveSlides(preview.slides)
    setLiveSlideLabels(slideLabels)
    setLiveSlideIndex(slideIndex)
    setBlack(false)
    setLogo(false)
    window.electronAPI?.openLiveWindow(loadDisplaySettings())
    sendLive(preview.title, slide)
  }

  const handleBlack = () => {
    setBlack(true)
    sendLive('Black', [], '#000000')
  }

  const handleLogo = () => {
    setLogo(true)
    sendLive('True Worship', ['True Worship'])
  }

  const handleClear = () => {
    setLive(null)
    setLiveSlides(null)
    setLiveSlideLabels([])
    setBlack(false)
    setLogo(false)
    sendLive('', [])
  }

  // Stepping through the live item's slides from the live column
  // sends that slide out, clearing any Black or Logo in the way:
  // clicking a slide is the operator saying "show this now".
  const handleLiveSlideSelect = (index: number) => {
    if (!live || !liveSlides) return
    const lines = liveSlides[index] ?? []
    setLiveSlideIndex(index)
    setLive({ title: live.title, lines })
    setBlack(false)
    setLogo(false)
    sendLive(live.title, lines)
  }

  const addItem = () =>
    setSchedule((current) => [
      ...current,
      { id: `s${current.length + 1}`, type: 'custom', title: 'New item', ref: '' },
    ])

  const moveSelected = (direction: -1 | 1) => {
    if (!selectedId) return
    setSchedule((current) => {
      const index = current.findIndex((item) => item.id === selectedId)
      const target = index + direction
      if (index < 0 || target < 0 || target >= current.length) return current
      const next = [...current]
      ;[next[index], next[target]] = [next[target], next[index]]
      return next
    })
  }

  const removeSelected = () => {
    if (!selectedId) return
    setSchedule((current) => {
      const index = current.findIndex((item) => item.id === selectedId)
      const next = current.filter((item) => item.id !== selectedId)
      setSelectedId(next[Math.min(index, next.length - 1)]?.id ?? null)
      setCustomPreview(null)
      return next
    })
  }

  const mergeSongs = (incoming: Song[]) =>
    setSongs((current) => {
      const titles = new Set(current.map((song) => song.title.toLowerCase()))
      const fresh = incoming.filter((song) => {
        if (titles.has(song.title.toLowerCase())) return false
        titles.add(song.title.toLowerCase())
        return true
      })
      return [...current, ...fresh]
    })

  const mergeSchedule = (incoming: ScheduleItem[]) =>
    setSchedule((current) => {
      const ids = new Set(current.map((item) => item.id))
      const fresh = incoming.map((item) =>
        ids.has(item.id)
          ? { ...item, id: `imp-${Math.random().toString(36).slice(2, 7)}` }
          : item,
      )
      return [...current, ...fresh]
    })

  const handleOpenFiles = async (files: FileList | null) => {
    if (!files) return
    for (const file of Array.from(files)) {
      const result = await importFile(file, { wasmUrl })
      mergeSongs(result.songs)
      mergeSchedule(result.schedule)
    }
  }

  const liveLines = black ? [] : logo ? ['True Worship'] : (live?.lines ?? [])
  const liveTitle = black ? 'Black' : logo ? 'True Worship' : (live?.title ?? 'Nothing live')

  const tabs: { id: Tab; label: string }[] = [
    { id: 'songs', label: 'Songs' },
    { id: 'bible', label: 'Bible' },
    { id: 'media', label: 'Media' },
    { id: 'themes', label: 'Themes' },
    { id: 'backgrounds', label: 'Backgrounds' },
    { id: 'layouts', label: 'Layouts' },
    { id: 'songbook', label: 'Songbook' },
    { id: 'import', label: 'Import' },
    { id: 'alerts', label: 'Alerts' },
    { id: 'display', label: 'Display' },
    { id: 'ndi', label: 'NDI' },
  ]

  if (isLiveWindow) {
    return (
      <div className="h-full bg-black">
        <LiveWindow />
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col bg-slate-100 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <header className="border-b border-slate-300 dark:border-slate-800">
        <div className="flex items-center justify-between px-4 py-1">
          <MenuBar
            theme={themeMode}
            onThemeChange={setThemeMode}
            onNewSchedule={() => {
              setSchedule([])
              setSelectedId(null)
              setCustomPreview(null)
            }}
            onOpenService={() => fileInputRef.current?.click()}
            onSaveService={() =>
              downloadTworship({ title: 'Sunday Service', kind: 'schedule', songs, schedule })
            }
            onExportLibrary={() =>
              downloadTworship({ title: 'True Worship Library', kind: 'library', songs, schedule: [] })
            }
            onAddItem={addItem}
            onMoveUp={() => moveSelected(-1)}
            onMoveDown={() => moveSelected(1)}
            onRemoveSelected={removeSelected}
            onGoLive={handleGoLive}
            onLogo={handleLogo}
            onBlack={handleBlack}
            onClear={handleClear}
            onShowLayouts={() => setTab('layouts')}
            onShowBackgrounds={() => setTab('backgrounds')}
          />
          <div className="flex items-center gap-3">
            <div className="flex gap-1" role="group" aria-label="Theme">
              {(['light', 'dark', 'system'] as ThemeMode[]).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setThemeMode(mode)}
                  className={`rounded px-2 py-0.5 text-xs capitalize ${
                    themeMode === mode
                      ? 'bg-blue-600 text-white'
                      : 'hover:bg-slate-200 dark:hover:bg-slate-800'
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {live ? '● LIVE' : '○ Not live'} · Free worship presentation
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-1 px-4 pb-2">
          <Button
            onClick={() => {
              setSchedule([])
              setSelectedId(null)
              setCustomPreview(null)
            }}
          >
            New
          </Button>
          <Button onClick={() => fileInputRef.current?.click()}>Open</Button>
          <Button
            onClick={() =>
              downloadTworship({ title: 'Sunday Service', kind: 'schedule', songs, schedule })
            }
          >
            Save
          </Button>
          <span className="mx-1 h-5 border-l border-slate-300 dark:border-slate-700" />
          <Button onClick={addItem}>Add Item</Button>
          <span className="mx-1 h-5 border-l border-slate-300 dark:border-slate-700" />
          <Button primary onClick={handleGoLive}>
            Go Live
          </Button>
          <Button onClick={() => setTab('alerts')}>Alerts</Button>
          <Button onClick={handleLogo}>Logo</Button>
          <Button onClick={handleBlack}>Black</Button>
          <Button onClick={handleClear}>Clear</Button>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept=".tworship,.ews,.ewsx,.xml,.txt,.db,.sqlite,.sqlite3,.zip"
          multiple
          className="hidden"
          onChange={(event) => {
            void handleOpenFiles(event.target.files)
            event.target.value = ''
          }}
        />
      </header>

      <main className="flex min-h-0 flex-1 flex-col">
        <div className="grid min-h-0 flex-1 grid-cols-[260px_minmax(0,1fr)_430px] gap-3 p-3 pb-0">
          <SchedulePanel
            items={schedule}
            selectedId={selectedId}
            onSelect={(id) => {
              setSelectedId(id)
              setCustomPreview(null)
              setSlideIndex(0)
            }}
            onAdd={addItem}
            onMoveUp={() => moveSelected(-1)}
            onMoveDown={() => moveSelected(1)}
            onRemove={removeSelected}
          />

          <div className="flex min-h-0 flex-col gap-3">
            <Panel title={`Preview — ${preview.title}`} className="flex-1">
              <div
                className="relative h-full overflow-hidden rounded-md"
                style={{ background: background?.css ?? theme.background, color: theme.textColor }}
              >
                {background?.video && (
                  <video
                    src={background.video}
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                )}
                {alert && (
                  <div className="absolute inset-x-0 top-0 z-20">
                    <Marquee alert={alert} />
                  </div>
                )}
                <div className={`relative z-10 ${layoutById(layoutId).wrapper}`}>
                  {layoutById(layoutId).band ? (
                    <div className={layoutById(layoutId).band}>
                      {slide.map((line) => (
                        <p key={line} className="leading-snug" style={{ fontSize: theme.fontSize * 0.6 }}>
                          {line}
                        </p>
                      ))}
                    </div>
                  ) : (
                    slide.map((line) => (
                      <p key={line} className="leading-snug" style={{ fontSize: theme.fontSize * 0.6 }}>
                        {line}
                      </p>
                    ))
                  )}
                </div>
              </div>
            </Panel>

            {preview.slides.length > 1 && (
              <div className="flex flex-wrap gap-1">
                {slideLabels.map((label, index) => (
                  <Button
                    key={`${label}-${index}`}
                    active={index === slideIndex}
                    onClick={() => setSlideIndex(index)}
                  >
                    {label}
                  </Button>
                ))}
              </div>
            )}

            <div>
              <Button primary onClick={handleGoLive}>
                GO LIVE &gt;&gt;&gt;
              </Button>
            </div>
          </div>

          <LivePanel
            title={liveTitle}
            lines={liveLines}
            theme={theme}
            live={live !== null && !black && !logo}
            slides={liveSlides ?? []}
            slideLabels={liveSlideLabels}
            liveSlideIndex={liveSlideIndex}
            onSelectLiveSlide={handleLiveSlideSelect}
            onGoLive={handleGoLive}
            onBlack={handleBlack}
            onLogo={handleLogo}
            onClear={handleClear}
          />
        </div>

        <div className="mt-3 flex h-[300px] shrink-0 flex-col border-t border-slate-300 px-3 py-2 dark:border-slate-800">
          <div className="mb-2 flex flex-wrap gap-1">
            {tabs.map((entry) => (
              <Button key={entry.id} active={tab === entry.id} onClick={() => setTab(entry.id)}>
                {entry.label}
              </Button>
            ))}
          </div>
          <div className="min-h-0 flex-1">
            {tab === 'songs' && <SongLibrary songs={songs} onOpen={openSong} />}
            {tab === 'bible' && (
              <BibleLookup
                passages={demoPassage}
                onOpen={(reference, text) =>
                  showPreview({ title: reference, slides: [[text]] })
                }
              />
            )}
            {tab === 'media' && <MediaLibrary />}
            {tab === 'themes' && (
              <ThemePicker themes={demoThemes} activeId={themeId} onPick={setThemeId} />
            )}
            {tab === 'backgrounds' && (
              <BackgroundPicker activeId={background?.id ?? null} onPick={setBackground} />
            )}
            {tab === 'layouts' && (
              <LayoutPicker activeId={layoutId} onPick={setLayoutId} />
            )}
            {tab === 'songbook' && <SongbookPanel songs={songs} />}
            {tab === 'import' && (
              <ImporterPanel
                songs={songs}
                schedule={schedule}
                onSongsImported={mergeSongs}
                onScheduleImported={mergeSchedule}
              />
            )}
            {tab === 'alerts' && (
              <AlertBar
                alert={alert}
                onShow={(next) => {
                  setAlert(next)
                  if (live && !black && !logo) {
                    sendLive(live.title, live.lines, undefined, next)
                  }
                }}
                onHide={() => {
                  setAlert(null)
                  if (live && !black && !logo) {
                    sendLive(live.title, live.lines, undefined, null)
                  }
                }}
              />
            )}
            {tab === 'display' && <DisplayPanel />}
            {tab === 'ndi' && <NdiPanel />}
          </div>
        </div>
      </main>

      <footer className="flex items-center justify-between border-t border-slate-300 px-4 py-1.5 text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400">
        <span>True Worship 0.3.1 · GPL-3.0 · {schedule.length} items in schedule</span>
        <span>
          Theme: {themeMode} · {live ? 'LIVE' : 'Not live'}
        </span>
      </footer>
    </div>
  )
}
