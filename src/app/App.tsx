import { useMemo, useState } from 'react'
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
import { Button, Panel } from '../shared/components/ui'
import { demoPassage, demoSchedule, demoSongs, demoThemes } from '../shared/lib/demo'
import type { ScheduleItem, Song } from '../shared/lib/types'

type Tab = 'songs' | 'bible' | 'media' | 'themes' | 'songbook' | 'import' | 'alerts'

type Preview = {
  title: string
  /** Slides: each entry is one slide's lines. */
  slides: string[][]
}

function previewForSchedule(item: ScheduleItem | undefined): Preview {
  if (!item) return { title: 'Nothing selected', slides: [['Select an item from the schedule.']] }
  if (item.type === 'song') {
    const song = demoSongs.find((entry) => entry.id === item.ref)
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
  const [selectedId, setSelectedId] = useState<string | null>(demoSchedule[0]?.id ?? null)
  const [tab, setTab] = useState<Tab>('songs')
  const [themeId, setThemeId] = useState(demoThemes[0].id)
  const [slideIndex, setSlideIndex] = useState(0)
  const [live, setLive] = useState<{ title: string; lines: string[] } | null>(null)
  const [black, setBlack] = useState(false)
  const [logo, setLogo] = useState(false)
  const [customPreview, setCustomPreview] = useState<Preview | null>(null)

  const selected = schedule.find((item) => item.id === selectedId)
  const preview = useMemo(
    () => customPreview ?? previewForSchedule(selected),
    [customPreview, selected],
  )
  const slide = preview.slides[Math.min(slideIndex, preview.slides.length - 1)] ?? []
  const theme = demoThemes.find((entry) => entry.id === themeId) ?? demoThemes[0]

  // The Electron main process loads the projector window with ?live=1.
  // That window only renders what the operator window sends it.
  const isLiveWindow =
    new URLSearchParams(window.location.search).get('live') === '1'
  const sendLive = (title: string, lines: string[], background?: string) => {
    window.electronAPI?.sendLiveUpdate({
      title,
      lines,
      background: background ?? theme.background,
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

  const liveLines = black ? [] : logo ? ['True Worship'] : (live?.lines ?? [])
  const liveTitle = black ? 'Black' : logo ? 'True Worship' : (live?.title ?? 'Nothing live')

  const tabs: { id: Tab; label: string }[] = [    { id: 'songs', label: 'Songs' },
    { id: 'bible', label: 'Bible' },
    { id: 'media', label: 'Media' },
    { id: 'themes', label: 'Themes' },
    { id: 'songbook', label: 'Songbook' },
    { id: 'import', label: 'Import' },
    { id: 'alerts', label: 'Alerts' },
  ]

  if (isLiveWindow) {
    return (
      <div className="h-full bg-black">
        <LiveWindow />
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col bg-slate-950 text-slate-100">
      <header className="flex items-center justify-between border-b border-slate-800 px-4 py-2">
        <h1 className="text-lg font-bold">True Worship</h1>
        <span className="text-xs text-slate-400">
          {live ? '● LIVE' : '○ Not live'} · Free worship presentation
        </span>
      </header>

      <main className="grid min-h-0 flex-1 grid-cols-[240px_1fr_320px] gap-3 p-3">
        <SchedulePanel
          items={schedule}
          selectedId={selectedId}
          onSelect={(id) => {
            setSelectedId(id)
            setCustomPreview(null)
            setSlideIndex(0)
          }}
          onAdd={() =>
            setSchedule((current) => [
              ...current,
              { id: `s${current.length + 1}`, type: 'custom', title: 'New item', ref: '' },
            ])
          }
        />

        <div className="flex min-h-0 flex-col gap-3">
          <Panel title={`Preview — ${preview.title}`} className="flex-1">
            <div
              className="flex h-full flex-col items-center justify-center rounded-md p-6 text-center"
              style={{ background: theme.background, color: theme.textColor }}
            >
              {slide.map((line) => (
                <p key={line} className="leading-snug" style={{ fontSize: theme.fontSize * 0.6 }}>
                  {line}
                </p>
              ))}
            </div>
            {preview.slides.length > 1 && (
              <div className="mt-3 flex gap-2">
                {preview.slides.map((_, index) => (
                  <Button
                    key={index}
                    active={index === slideIndex}
                    onClick={() => setSlideIndex(index)}
                  >
                    Slide {index + 1}
                  </Button>
                ))}
              </div>
            )}
          </Panel>

          <LivePanel
            title={liveTitle}
            lines={liveLines}
            theme={theme}
            live={live !== null && !black && !logo}
            onGoLive={() => {
              setLive({ title: preview.title, lines: slide })
              setBlack(false)
              setLogo(false)
              window.electronAPI?.openLiveWindow()
              sendLive(preview.title, slide)
            }}
            onBlack={() => {
              setBlack(true)
              sendLive('Black', [], '#000000')
            }}
            onLogo={() => {
              setLogo(true)
              sendLive('True Worship', ['True Worship'])
            }}
            onClear={() => {
              setLive(null)
              setBlack(false)
              setLogo(false)
              sendLive('', [])
            }}
          />
        </div>

        <div className="flex min-h-0 flex-col gap-3">
          <div className="flex flex-wrap gap-1">
            {tabs.map((entry) => (
              <Button key={entry.id} active={tab === entry.id} onClick={() => setTab(entry.id)}>
                {entry.label}
              </Button>
            ))}
          </div>
          <div className="min-h-0 flex-1">
            {tab === 'songs' && <SongLibrary songs={demoSongs} onOpen={openSong} />}
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
            {tab === 'songbook' && <SongbookPanel songs={demoSongs} />}
            {tab === 'import' && <ImporterPanel />}
            {tab === 'alerts' && <AlertBar />}
          </div>
        </div>
      </main>
    </div>
  )
}
