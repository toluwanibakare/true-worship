import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { SchedulePanel } from '../features/schedule/SchedulePanel'
import { SongLibrary } from '../features/songs/SongLibrary'
import { loadSongs, saveSongs } from '../shared/lib/songStore'
import { ItemEditor } from '../features/schedule/ItemEditor'
import { SongEditor } from '../features/songs/SongEditor'
import { BibleLookup } from '../features/bible/BibleLookup'
import { MediaLibrary } from '../features/media/MediaLibrary'
import { WebBrowser } from '../features/web/WebBrowser'
import type { UserMedia } from '../electron'
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
import { BACKGROUNDS, type BackgroundPreset } from '../features/backgrounds/backgrounds'
import { LayoutPicker } from '../features/layouts/LayoutPicker'
import type { MarqueeAlert } from '../shared/components/Marquee'
import { ShortcutsDialog } from '../features/shortcuts/ShortcutsDialog'
import {
  isTypingTarget,
  resolveJumpSequence,
} from '../features/shortcuts/shortcuts'
import { MenuBar, type ThemeMode } from './MenuBar'
import { TitleBar } from './TitleBar'
import { PreviewPanel } from '../features/preview/PreviewPanel'
import { OutputPanel } from '../shared/components/OutputPanel'
import { Modal } from '../shared/components/Modal'
import { SlideView } from '../shared/components/SlideView'
import { layoutById } from '../shared/lib/layouts'
import { splitIntoSubtitles } from '../shared/lib/subtitles'
import type { ResourceDrag } from '../shared/lib/resourceDrag'
import { Splitter } from '../shared/components/Splitter'
import { usePaneSize } from '../shared/lib/usePaneSize'
import {
  SCRIPTURE_VERSION,
  demoPassage,
  demoSchedule,
  demoSongs,
  demoThemes,
} from '../shared/lib/demo'
import type { ScheduleItem, Song, Verse } from '../shared/lib/types'

/**
 * Toolbar button: an icon above a short label. The toolbar splits
 * in two: file commands on the left, Go Live, Alerts, Logo, Black,
 * Clear and Live on the right.
 */
function ToolButton({
  label,
  onClick,
  icon,
  accent,
  blinking,
  disabled,
  title,
}: {
  label: string
  onClick: () => void
  icon: ReactNode
  accent?: boolean
  /** On air: the icon turns red and blinks. */
  blinking?: boolean
  disabled?: boolean
  title?: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className="flex flex-col items-center gap-0.5 rounded-md px-2 py-1 hover:bg-slate-200 disabled:opacity-40 disabled:hover:bg-transparent dark:hover:bg-slate-800"
    >
      <span
        className={
          blinking
            ? 'tw-blink text-red-500'
            : accent
              ? 'text-green-600 dark:text-green-400'
              : undefined
        }
      >
        {icon}
      </span>
      <span className="text-[11px] leading-none">{label}</span>
    </button>
  )
}

/** Thin rule between toolbar groups. */
function ToolDivider() {
  return <span className="mx-1 h-8 w-px bg-slate-300 dark:bg-slate-700" aria-hidden="true" />
}

/**
 * A toolbar button that opens a small menu under it (New, Open), with a
 * caret beside the label. Items that cannot run are greyed out.
 */
function ToolMenuButton({
  label,
  icon,
  items,
}: {
  label: string
  icon: ReactNode
  items: { label: string; onClick: () => void }[]
}) {
  const [open, setOpen] = useState(false)
  return (
    <div className="relative">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
        className={`flex flex-col items-center gap-0.5 rounded-md px-2 py-1 ${
          open ? 'bg-slate-200 dark:bg-slate-800' : 'hover:bg-slate-200 dark:hover:bg-slate-800'
        }`}
      >
        <span>{icon}</span>
        <span className="text-[11px] leading-none">
          {label} <span className="text-[8px] opacity-70">▼</span>
        </span>
      </button>
      {open && (
        <>
          <button
            type="button"
            aria-label="Close menu"
            className="fixed inset-0 z-40 cursor-default"
            onClick={() => setOpen(false)}
          />
          <div
            role="menu"
            className="absolute left-0 top-full z-50 mt-1 w-52 rounded-md border border-slate-300 bg-white py-1 text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
          >
            {items.map((item) => (
              <button
                key={item.label}
                type="button"
                role="menuitem"
                onClick={() => {
                  setOpen(false)
                  item.onClick()
                }}
                className="block w-full px-3 py-1.5 text-left text-sm hover:bg-slate-200 dark:hover:bg-slate-800"
              >
                {item.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

const iconProps = {
  width: 22,
  height: 22,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
}

const IconNew = (
  <svg {...iconProps}>
    <rect x="4" y="3" width="16" height="18" rx="2" />
    <path d="M12 8v8M8 12h8" />
  </svg>
)
const IconOpen = (
  <svg {...iconProps}>
    <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
  </svg>
)
const IconSave = (
  <svg {...iconProps}>
    <rect x="4" y="3" width="16" height="18" rx="2" />
    <rect x="7" y="3" width="8" height="5" />
    <path d="M7 21v-6h10v6" />
  </svg>
)
const IconPlay = (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
    <path d="M7 4l13 8-13 8z" />
  </svg>
)
const IconBell = (
  <svg {...iconProps}>
    <path d="M18 9a6 6 0 1 0-12 0c0 6-2 7-2 7h16s-2-1-2-7" />
    <path d="M10 20a2 2 0 0 0 4 0" />
  </svg>
)
const IconImage = (
  <svg {...iconProps}>
    <rect x="3" y="4" width="18" height="16" rx="2" />
    <circle cx="9" cy="10" r="1.5" />
    <path d="M21 17l-5-5-4 4-3-3-6 6" />
  </svg>
)
const IconBlack = (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
    <rect x="5" y="5" width="14" height="14" rx="2" />
  </svg>
)
const IconStore = (
  <svg {...iconProps}>
    <path d="M5 8h14l-1 12H6z" />
    <path d="M9 8a3 3 0 0 1 6 0" />
  </svg>
)
const IconWeb = (
  <svg {...iconProps}>
    <circle cx="12" cy="12" r="9" />
    <path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18" />
  </svg>
)
const IconRemote = (
  <svg {...iconProps}>
    <circle cx="12" cy="12" r="2" />
    <path d="M7.5 7.5a6 6 0 0 0 0 9M16.5 7.5a6 6 0 0 1 0 9M4.5 4.5a10 10 0 0 0 0 15M19.5 4.5a10 10 0 0 1 0 15" />
  </svg>
)
const IconLiveOutput = (
  <svg {...iconProps}>
    <rect x="3" y="4" width="18" height="13" rx="2" />
    <path d="M8 4v13M12 4v13M16 4v13M9 21h6" />
  </svg>
)
const IconClear = (
  <svg {...iconProps}>
    <path d="M6 6l12 12M18 6L6 18" />
  </svg>
)

/**
 * App shell, laid out the conventional way for worship software: a
 * title bar and toolbar on top, the schedule down the left, the
 * Preview and Live panes side by side with their output monitors under
 * them, and the resources (songs, Bible, media, themes, and the rest)
 * as a tab strip across the bottom. Every divider is draggable. Light,
 * dark and system themes.
 */

type Tab = 'songs' | 'bible' | 'media' | 'themes' | 'backgrounds' | 'layouts' | 'songbook'

/** Dialogs opened from the toolbar and menus rather than from the resource tabs. */
type Dialog = 'alerts' | 'liveSettings' | 'import'

/** An image or video from the Media library, shown in place of the picked background. */
type MediaLook = { css: string; video?: string }

type Preview = {
  title: string
  /** Slides: each entry is one slide's lines. */
  slides: string[][]
  /** Names for the slides (Verse 1, Chorus); numbered when absent. */
  labels?: string[]
  /** Book, chapter, verse and version under a scripture, e.g. "John 3:16 (KJV)". */
  reference?: string
  /** Set when the previewed item is a media file rather than words. */
  media?: MediaLook
}

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max)

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
    // Added from the Scriptures table: it carries its own verses and version.
    if (item.slides) {
      return {
        title: item.ref,
        slides: item.slides,
        reference: `${item.ref} (${item.version ?? SCRIPTURE_VERSION})`,
      }
    }
    const text = demoPassage[item.ref]
    return {
      title: item.ref,
      slides: text ? [[text]] : [['Passage not in the demo library.']],
      reference: text ? `${item.ref} (${SCRIPTURE_VERSION})` : undefined,
    }
  }
  // A custom item with its own slides (the welcome and notices): each slide is
  // named by its first line.
  if (item.slides && item.slides.length > 0) {
    return {
      title: item.title,
      slides: item.slides,
      labels: item.slides.map((lines, index) => lines[0] ?? `Slide ${index + 1}`),
    }
  }
  return { title: item.title, slides: [[item.title]] }
}

export function App() {
  const [schedule, setSchedule] = useState<ScheduleItem[]>(demoSchedule)
  const [songs, setSongs] = useState<Song[]>(demoSongs)
  // The library is saved on this computer; nothing is written back until
  // the saved copy has been read, so a refresh never replaces it with the demo.
  const [songsLoaded, setSongsLoaded] = useState(false)
  // A song or verse picked in the schedule is shown highlighted in its tab below.
  const [songFocus, setSongFocus] = useState<{ id: string; nonce: number } | null>(null)
  const [scriptureFocus, setScriptureFocus] = useState<{
    reference: string
    version?: string
    nonce: number
    live: boolean
  } | null>(null)
  const focusNonce = useRef(0)
  const [selectedId, setSelectedId] = useState<string | null>(demoSchedule[0]?.id ?? null)
  const [tab, setTab] = useState<Tab>('songs')
  const [themeId, setThemeId] = useState(demoThemes[0].id)
  const [themes, setThemes] = useState(demoThemes)
  const [themeMode, setThemeMode] = useState<ThemeMode>(
    () => (localStorage.getItem('tw-theme') as ThemeMode) || 'system',
  )
  // Deep Rays is the default look; the Backgrounds tab changes it.
  const [background, setBackground] = useState<BackgroundPreset | null>(
    () => BACKGROUNDS.find((entry) => entry.id === 'deep-rays') ?? null,
  )
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
  const [showShortcuts, setShowShortcuts] = useState(false)
  const [dialog, setDialog] = useState<Dialog | null>(null)
  const [itemEditor, setItemEditor] = useState<ScheduleItem | null>(null)
  const [songEditor, setSongEditor] = useState<{ song: Song | null } | null>(null)
  // The built-in web browser replaces the preview and live panes while open.
  const [showWeb, setShowWeb] = useState(false)
  // How long slides fade into each other on the live output (0 = straight cut).
  const [transitionMs, setTransitionMs] = useState(() => {
    try {
      const stored = localStorage.getItem('tw-transition-ms')
      return stored === null ? 300 : Math.max(0, Number(stored) || 0)
    } catch {
      return 300
    }
  })
  const [webLive, setWebLive] = useState(false)
  // The media file on the live output, if any. The ref is read by sendLive in
  // the same tick the state is set, before React has re-rendered.
  const [liveMedia, setLiveMediaState] = useState<MediaLook | null>(null)
  const liveMediaRef = useRef<MediaLook | null>(null)
  // The scripture reference under the live words, kept the same way.
  const [liveReference, setLiveReferenceState] = useState<string | null>(null)
  const liveReferenceRef = useRef<string | null>(null)
  const setLiveReference = (next: string | null) => {
    liveReferenceRef.current = next
    setLiveReferenceState(next)
  }
  const setLiveMedia = (next: MediaLook | null) => {
    liveMediaRef.current = next
    setLiveMediaState(next)
  }
  // Draggable dividers. Sizes persist between launches.
  const [scheduleWidth, setScheduleWidth] = usePaneSize('tw-pane-schedule', 280)
  const [previewPercent, setPreviewPercent] = usePaneSize('tw-pane-preview', 50)
  const [previewOutputHeight, setPreviewOutputHeight] = usePaneSize('tw-pane-preview-output', 220)
  const [liveOutputHeight, setLiveOutputHeight] = usePaneSize('tw-pane-live-output', 220)
  const [stripHeight, setStripHeight] = usePaneSize('tw-pane-strip', 280)
  const centreRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  // What Ctrl + C cleared, so a second Ctrl + C can bring it back.
  const clearedLiveRef = useRef<{ title: string; lines: string[] } | null>(null)

  // Light / dark / system theme. System follows the operating system
  // and keeps following it when the OS setting changes.
  useEffect(() => {
    loadSongs()
      .then((saved) => {
        if (saved) setSongs(saved)
      })
      .catch(() => {})
      .finally(() => setSongsLoaded(true))
  }, [])

  useEffect(() => {
    if (songsLoaded) saveSongs(songs).catch(() => {})
  }, [songs, songsLoaded])

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
  const basePreview = useMemo(
    () => customPreview ?? previewForSchedule(selected, songs),
    [customPreview, selected, songs],
  )
  // Slide labels: song verses keep their names (Verse 1, Chorus),
  // everything else is numbered. A previewed item that did not come from
  // the schedule (a library song, a passage, a media file) brings its own.
  const selectedSong =
    selected?.type === 'song' ? songs.find((entry) => entry.id === selected.ref) : undefined
  const baseLabels =
    basePreview.labels ??
    (selectedSong && !customPreview
      ? selectedSong.verses.map((verse) => verse.label)
      : basePreview.slides.map((_, index) => `Slide ${index + 1}`))

  // Subtitle layouts (Lower and Upper Third) show two lines at a time, so
  // their slides are split into two-line pieces.
  const subtitleLayout = layoutById(layoutId).subtitle !== undefined
  const fitForLayout = (slides: string[][], labels: string[]) =>
    subtitleLayout
      ? splitIntoSubtitles(slides, labels)
      : { slides, labels, starts: slides.map((_, index) => index) }
  const fitted = fitForLayout(basePreview.slides, baseLabels)
  const preview: Preview = { ...basePreview, slides: fitted.slides }
  const slideLabels = fitted.labels
  const slide = preview.slides[Math.min(slideIndex, preview.slides.length - 1)] ?? []
  const theme = themes.find((entry) => entry.id === themeId) ?? themes[0]

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
      backgroundCss: forcedBackground
        ? undefined
        : (liveMediaRef.current?.css ?? background?.css ?? theme.background),
      backgroundVideo: forcedBackground
        ? undefined
        : liveMediaRef.current
          ? liveMediaRef.current.video
          : background?.video,
      // The reference goes only with words: not on Black, Logo or a cleared screen.
      reference: forcedBackground || lines.length === 0 ? undefined : (liveReferenceRef.current ?? undefined),
      layout: layoutId,
      alert: alertArg !== undefined ? alertArg : alert,
      textColor: theme.textColor,
      fontSize: theme.fontSize,
      fontFamily: theme.fontFamily,
      bold: theme.bold,
      transitionMs,
    })
  }

  const showPreview = (next: Preview) => {
    setCustomPreview(next)
    setSlideIndex(0)
  }

  const openSong = (song: Song) => {
    pickedSong.current = song
    showPreview({
      title: song.title,
      slides: song.verses.map((verse) => verse.lines),
      labels: song.verses.map((verse) => verse.label),
    })
  }

  // Send an item live, starting at the given slide. Double-clicking a
  // slide in the Preview pane, or a row in the Scriptures table, uses
  // this to go live straight away.
  const goLiveWith = (target: Preview, labels: string[], index: number) => {
    liveFromScriptures.current = false
    const lines = target.slides[index] ?? []
    setLive({ title: target.title, lines })
    setLiveMedia(target.media ?? null)
    setLiveReference(target.reference ?? null)
    setLiveSlides(target.slides)
    setLiveSlideLabels(labels)
    setLiveSlideIndex(index)
    setBlack(false)
    setLogo(false)
    clearedLiveRef.current = null
    window.electronAPI?.openLiveWindow(loadDisplaySettings())
    sendLive(target.title, lines)
  }

  const goLiveSlide = (index: number) => goLiveWith(preview, slideLabels, index)

  // Media files show as the whole slide: an image fitted to the screen, or a
  // video, with no words over it.
  const mediaLook = (item: UserMedia): MediaLook =>
    item.kind === 'video'
      ? { css: '#000000', video: item.url }
      : { css: `url("${item.url}") center / contain no-repeat, #000000` }

  const previewMedia = (item: UserMedia) =>
    showPreview({ title: item.name, slides: [[]], media: mediaLook(item) })

  const goLiveMedia = (item: UserMedia) => {
    const next = { title: item.name, slides: [[]], media: mediaLook(item) }
    showPreview(next)
    goLiveWith(next, ['Slide 1'], 0)
  }

  // What the "+" and play buttons in the resource strip act on: the song last
  // picked, and the verse highlighted in the Scriptures table (it reports itself).
  const pickedSong = useRef<Song | null>(null)
  const scriptureSelection = useRef<
    (() => { reference: string; slides: string[][]; version: string } | null) | null
  >(null)

  const goLiveScripture = (reference: string, slides: string[][], version: string) => {
    const next = { title: reference, slides, reference: `${reference} (${version})` }
    showPreview(next)
    goLiveWith(
      next,
      slides.map((_, index) => `Slide ${index + 1}`),
      0,
    )
    liveFromScriptures.current = true
  }

  const newItemId = () => `s${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`

  /** Put an item in the schedule: at the given place, or after the selected item, or at the end. */
  const insertScheduleItem = (item: ScheduleItem, at?: number) => {
    setSchedule((current) => {
      const selectedAt = current.findIndex((entry) => entry.id === selectedId)
      const place = at ?? (selectedAt < 0 ? current.length : selectedAt + 1)
      return [...current.slice(0, place), item, ...current.slice(place)]
    })
    setSelectedId(item.id)
    setCustomPreview(null)
    setSlideIndex(0)
  }

  /** A song or a verse dragged from the library, dropped on the schedule. */
  const dropResource = (resource: ResourceDrag, at?: number) => {
    if (resource.kind === 'song') {
      const song = songs.find((entry) => entry.id === resource.id)
      if (song) insertScheduleItem({ id: newItemId(), type: 'song', title: song.title, ref: song.id }, at)
      return
    }
    insertScheduleItem(
      {
        id: newItemId(),
        type: 'scripture',
        title: resource.reference,
        ref: resource.reference,
        slides: resource.slides,
        version: resource.version,
      },
      at,
    )
  }

  /** "+" in the resource strip: put the picked song or verse into the schedule. */
  const addPickedToSchedule = () => {
    if (tab === 'songs' && pickedSong.current && songs.some((song) => song.id === pickedSong.current?.id)) {
      dropResource({ kind: 'song', id: pickedSong.current.id })
    } else if (tab === 'bible') {
      const verse = scriptureSelection.current?.()
      if (verse) {
        dropResource({
          kind: 'scripture',
          reference: verse.reference,
          slides: verse.slides,
          version: verse.version,
        })
      }
    }
  }

  /** The play button in the resource strip: the picked song or verse goes live. */
  const goLivePicked = () => {
    if (tab === 'songs' && pickedSong.current) goLiveSong(pickedSong.current)
    else if (tab === 'bible') {
      const verse = scriptureSelection.current?.()
      if (verse) goLiveScripture(verse.reference, verse.slides, verse.version)
    }
  }

  const goLiveSong = (song: Song) => {
    pickedSong.current = song
    const next = {
      title: song.title,
      slides: song.verses.map((verse) => verse.lines),
      labels: song.verses.map((verse) => verse.label),
    }
    showPreview(next)
    const split = fitForLayout(next.slides, next.labels)
    goLiveWith({ ...next, slides: split.slides }, split.labels, 0)
  }

  const handleGoLive = () => goLiveSlide(slideIndex)

  // Black and Logo are toggles, not one-way buttons:
  // pressing again returns to whatever was live.
  const toggleBlack = () => {
    if (black) {
      setBlack(false)
      sendLive(live?.title ?? '', live?.lines ?? [])
    } else {
      setBlack(true)
      sendLive('Black', [], '#000000')
    }
  }

  const toggleLogo = () => {
    if (logo) {
      setLogo(false)
      sendLive(live?.title ?? '', live?.lines ?? [])
    } else {
      setLogo(true)
      sendLive('True Worship', ['True Worship'])
    }
  }

  const handleBlack = toggleBlack
  const handleLogo = toggleLogo

  const handleClear = () => {
    window.electronAPI?.stopWebLive()
    setWebLive(false)
    setLive(null)
    setLiveMedia(null)
    setLiveReference(null)
    setLiveSlides(null)
    setLiveSlideLabels([])
    setBlack(false)
    setLogo(false)
    clearedLiveRef.current = null
    sendLive('', [])
  }

  // Ctrl + C toggles the live text on and off. The
  // second press brings back exactly what the first press cleared.
  const toggleText = () => {
    if (live) {
      clearedLiveRef.current = live
      setLive(null)
      sendLive('', [])
    } else if (clearedLiveRef.current) {
      const restored = clearedLiveRef.current
      clearedLiveRef.current = null
      setLive(restored)
      setBlack(false)
      setLogo(false)
      sendLive(restored.title, restored.lines)
    }
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

  // The main process ends the web feed when words, Black or Logo go live.
  useEffect(() => {
    window.electronAPI?.onWebLiveEnded(() => setWebLive(false))
  }, [])

  // Save is only live when the schedule or song library differ from what
  // was last saved, opened or started fresh. The snapshot is compared as
  // text; markClean re-reads it after the state it follows has landed.
  const snapshot = JSON.stringify({ schedule, songs })
  const [savedSnapshot, setSavedSnapshot] = useState(snapshot)
  const [cleanTick, setCleanTick] = useState(0)
  const cleanPending = useRef(false)
  const markClean = () => {
    cleanPending.current = true
    setCleanTick((tick) => tick + 1)
  }
  useEffect(() => {
    if (cleanPending.current) {
      cleanPending.current = false
      setSavedSnapshot(snapshot)
    }
  }, [snapshot, cleanTick])
  const dirty = snapshot !== savedSnapshot

  const saveSchedule = () => {
    void downloadTworship({ title: 'Sunday Service', kind: 'schedule', songs, schedule })
    setSavedSnapshot(snapshot)
  }

  const newSchedule = () => {
    setSchedule([])
    setSelectedId(null)
    setCustomPreview(null)
    markClean()
  }

  const saveSongDraft = (draft: { title: string; author: string; copyright: string; verses: Verse[] }) => {
    const editing = songEditor?.song ?? null
    if (editing) {
      setSongs((current) =>
        current.map((song) =>
          song.id === editing.id
            ? { ...song, title: draft.title, author: draft.author, copyright: draft.copyright || undefined, verses: draft.verses }
            : song,
        ),
      )
    } else {
      const slug = draft.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40) || 'song'
      setSongs((current) => [
        ...current,
        {
          id: `my-${slug}-${Math.random().toString(36).slice(2, 7)}`,
          title: draft.title,
          author: draft.author,
          copyright: draft.copyright || undefined,
          verses: draft.verses,
          source: 'owned',
        },
      ])
    }
    setSongEditor(null)
  }

  const deleteSong = (song: Song) => {
    if (window.confirm(`Delete "${song.title}" from the song library?`)) {
      setSongs((current) => current.filter((entry) => entry.id !== song.id))
    }
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

  // Drag and drop: move the item with this id so it lands before the
  // item currently at insertIndex (the list length means "at the end").
  const reorderSchedule = (id: string, insertIndex: number) => {
    setSchedule((current) => {
      const from = current.findIndex((item) => item.id === id)
      if (from < 0) return current
      const to = insertIndex > from ? insertIndex - 1 : insertIndex
      if (to === from) return current
      const next = [...current]
      const [moved] = next.splice(from, 1)
      next.splice(to, 0, moved)
      return next
    })
  }

  /** Right-click Edit: a song opens the song editor, anything else the item editor. */
  const editScheduleItem = (id: string) => {
    const item = schedule.find((entry) => entry.id === id)
    if (!item) return
    const song = item.type === 'song' ? songs.find((entry) => entry.id === item.ref) : undefined
    if (song) setSongEditor({ song })
    else setItemEditor(item)
  }

  const duplicateScheduleItem = (id: string) => {
    const at = schedule.findIndex((entry) => entry.id === id)
    if (at < 0) return
    insertScheduleItem({ ...schedule[at], id: newItemId() }, at + 1)
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

  const slideLabelsForItem = (item: ScheduleItem) => {
    if (item.type === 'song') {
      const song = songs.find((entry) => entry.id === item.ref)
      return song ? song.verses.map((verse) => verse.label) : []
    }
    if (item.slides) {
      return item.type === 'custom'
        ? item.slides.map((lines, index) => lines[0] ?? `Slide ${index + 1}`)
        : item.slides.map((_, index) => `Slide ${index + 1}`)
    }
    return ['Slide 1']
  }

  // Double-clicking a schedule row sends that item live from its
  // first slide, the fastest path from plan to screen.
  /** Shows the schedule item in the Songs or Scriptures tab, highlighted, ready to step on from. */
  const focusInResources = (id: string, index: number, live: boolean) => {
    const item = schedule.find((entry) => entry.id === id)
    if (!item) return
    focusNonce.current += 1
    if (item.type === 'song') {
      const song = songs.find((entry) => entry.id === item.ref)
      if (!song) return
      pickedSong.current = song
      setTab('songs')
      setSongFocus({ id: song.id, nonce: focusNonce.current })
    } else if (item.type === 'scripture') {
      // A passage of several verses has one slide per verse: land on the one picked.
      const parts = /^(.*\s\d+:)(\d+)/.exec(item.title)
      if (!parts) return
      const offset = (item.slides?.length ?? 0) > 1 ? index : 0
      setTab('bible')
      setScriptureFocus({
        reference: `${parts[1]}${Number(parts[2]) + offset}`,
        version: item.version,
        nonce: focusNonce.current,
        live,
      })
    }
  }

  const selectAndGoLive = (id: string) => {
    const item = schedule.find((entry) => entry.id === id)
    if (!item) return
    const itemPreview = previewForSchedule(item, songs)
    const itemFit = fitForLayout(itemPreview.slides, slideLabelsForItem(item))
    const first = itemFit.slides[0] ?? []
    setSelectedId(id)
    setCustomPreview(null)
    setSlideIndex(0)
    setLive({ title: itemPreview.title, lines: first })
    setLiveMedia(null)
    setLiveReference(itemPreview.reference ?? null)
    setLiveSlides(itemFit.slides)
    setLiveSlideLabels(itemFit.labels)
    setLiveSlideIndex(0)
    setBlack(false)
    setLogo(false)
    clearedLiveRef.current = null
    focusInResources(id, 0, true)
    window.electronAPI?.openLiveWindow(loadDisplaySettings())
    sendLive(itemPreview.title, first)
  }

  const stepSlide = (direction: -1 | 1) =>
    setSlideIndex((current) =>
      Math.min(Math.max(current + direction, 0), preview.slides.length - 1),
    )

  const goToSlide = (index: number) =>
    setSlideIndex(Math.min(Math.max(index, 0), preview.slides.length - 1))

  // While something is live, the left and right arrows step through its
  // verses on the screen; with nothing live they move through the schedule.
  const liveActive = live !== null && liveSlides !== null
  // A verse put live from the Scriptures table: Up and Down then move to the
  // previous and next verse in the Bible. The table registers how to do it.
  const liveFromScriptures = useRef(false)
  const scriptureStepper = useRef<((direction: -1 | 1) => boolean) | null>(null)
  const stepScripture = (direction: -1 | 1) =>
    liveFromScriptures.current && live !== null && scriptureStepper.current
      ? scriptureStepper.current(direction)
      : false
  const stepLive = (direction: -1 | 1) => {
    if (!live || !liveSlides) return
    const next = liveSlideIndex + direction
    if (next < 0 || next >= liveSlides.length) return
    handleLiveSlideSelect(next)
  }

  const stepSchedule = (direction: -1 | 1) => {
    if (!selectedId) return
    const index = schedule.findIndex((item) => item.id === selectedId)
    const target = index + direction
    if (index < 0 || target < 0 || target >= schedule.length) return
    setSelectedId(schedule[target].id)
    setCustomPreview(null)
    setSlideIndex(0)
  }

  // Keyboard shortcuts. The effect mounts once and
  // reads every action through a ref, so the handlers are always the
  // current render's and the listener never goes stale.
  const actionsRef = useRef({
    goLive: handleGoLive,
    toggleBlack,
    toggleLogo,
    toggleText,
    stepSlide,
    stepLive,
    stepScripture,
    liveActive,
    goToSlide,
    nextItem: () => stepSchedule(1),
    prevItem: () => stepSchedule(-1),
    removeSelected,
    openService: () => fileInputRef.current?.click(),
    saveService: () => {
      if (dirty) saveSchedule()
    },
    showAlerts: () => setDialog('alerts'),
    setShowShortcuts,
    showShortcuts,
    dialogOpen: dialog !== null || songEditor !== null || itemEditor !== null,
    closeDialog: () => (itemEditor ? setItemEditor(null) : songEditor ? setSongEditor(null) : setDialog(null)),
    labels: slideLabels,
    slideCount: preview.slides.length,
  })
  actionsRef.current = {
    goLive: handleGoLive,
    toggleBlack,
    toggleLogo,
    toggleText,
    stepSlide,
    stepLive,
    stepScripture,
    liveActive,
    goToSlide,
    nextItem: () => stepSchedule(1),
    prevItem: () => stepSchedule(-1),
    removeSelected,
    openService: () => fileInputRef.current?.click(),
    saveService: () => {
      if (dirty) saveSchedule()
    },
    showAlerts: () => setDialog('alerts'),
    setShowShortcuts,
    showShortcuts,
    dialogOpen: dialog !== null || songEditor !== null || itemEditor !== null,
    closeDialog: () => (itemEditor ? setItemEditor(null) : songEditor ? setSongEditor(null) : setDialog(null)),
    labels: slideLabels,
    slideCount: preview.slides.length,
  }

  useEffect(() => {
    let buffer = ''
    let bufferTimer: ReturnType<typeof setTimeout> | undefined
    const resetBuffer = () => {
      buffer = ''
      if (bufferTimer) clearTimeout(bufferTimer)
    }
    const onKeyDown = (event: KeyboardEvent) => {
      const a = actionsRef.current
      if (event.key === 'Escape') {
        resetBuffer()
        if (a.showShortcuts) {
          event.preventDefault()
          a.setShowShortcuts(false)
        } else if (a.dialogOpen) {
          event.preventDefault()
          a.closeDialog()
        }
        return
      }
      // While the shortcut list or a dialog is open, nothing else fires.
      if (a.showShortcuts || a.dialogOpen) return
      // Typing stays typing: no shortcut fires from a field.
      if (isTypingTarget(event.target)) return
      if (event.metaKey) return
      const key = event.key
      if (event.ctrlKey && !event.shiftKey && !event.altKey) {
        const lower = key.toLowerCase()
        if (lower === 'o') {
          event.preventDefault()
          a.openService()
        } else if (lower === 's') {
          event.preventDefault()
          a.saveService()
        } else if (lower === 'f' || lower === 'm' || lower === 'n') {
          event.preventDefault()
          a.showAlerts()
        } else if (lower === 'b') {
          event.preventDefault()
          a.toggleBlack()
        } else if (lower === 'l') {
          event.preventDefault()
          a.toggleLogo()
        } else if (lower === 'c') {
          // A real selection means Copy, not Clear.
          if (!window.getSelection()?.toString()) {
            event.preventDefault()
            a.toggleText()
          }
        } else if (key === 'Delete') {
          event.preventDefault()
          a.removeSelected()
        }
        resetBuffer()
        return
      }
      if (event.ctrlKey || event.altKey) {
        resetBuffer()
        return
      }
      // Jump-to-slide sequences: V, C and digits build up, Enter fires.
      if (/^[vVcC0-9]$/.test(key)) {
        buffer = (buffer + key.toLowerCase()).slice(0, 4)
        if (bufferTimer) clearTimeout(bufferTimer)
        bufferTimer = setTimeout(resetBuffer, 2000)
        return
      }
      if (key === 'Enter' && buffer) {
        const index = resolveJumpSequence(buffer, a.labels)
        resetBuffer()
        if (index !== null) {
          event.preventDefault()
          a.goToSlide(index)
        }
        return
      }
      resetBuffer()
      switch (key) {
        case 'PageDown':
          event.preventDefault()
          a.goLive()
          break
        case 'PageUp':
          event.preventDefault()
          a.stepSlide(-1)
          break
        case 'Home':
          event.preventDefault()
          a.goToSlide(0)
          break
        case 'End':
          event.preventDefault()
          a.goToSlide(a.slideCount - 1)
          break
        case 'ArrowDown':
        case 'n':
        case 'N':
          event.preventDefault()
          // A scripture live from the table: the next verse, not the next slide.
          if (key === 'ArrowDown' && a.stepScripture(1)) break
          a.stepSlide(1)
          break
        case 'ArrowUp':
        case 'p':
        case 'P':
        case 'Backspace':
          event.preventDefault()
          if (key === 'ArrowUp' && a.stepScripture(-1)) break
          a.stepSlide(-1)
          break
        case 'ArrowRight':
          event.preventDefault()
          if (a.liveActive) a.stepLive(1)
          else a.nextItem()
          break
        case 'ArrowLeft':
          event.preventDefault()
          if (a.liveActive) a.stepLive(-1)
          else a.prevItem()
          break
        case ' ':
          // Only when nothing has focus, so Space still works on buttons.
          if (event.target === document.body) {
            event.preventDefault()
            a.stepSlide(1)
          }
          break
        case '?':
          event.preventDefault()
          a.setShowShortcuts(true)
          break
        default:
          break
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

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
    // What was just opened came from a file, so there is nothing new to save.
    markClean()
  }

  // On air: something is live, or the output is held on Black or Logo.
  const onAir = live !== null || black || logo || webLive
  const liveLines = black ? [] : logo ? ['True Worship'] : (live?.lines ?? [])
  const liveTitle = black ? 'Black' : logo ? 'True Worship' : (live?.title ?? 'Nothing live')

  const tabs: { id: Tab; label: string }[] = [
    { id: 'songs', label: 'Songs' },
    { id: 'bible', label: 'Scriptures' },
    { id: 'media', label: 'Media' },
    { id: 'themes', label: 'Themes' },
    { id: 'backgrounds', label: 'Backgrounds' },
    { id: 'layouts', label: 'Layouts' },
    { id: 'songbook', label: 'Songbook' },
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
      <header className="border-b border-slate-300 bg-gradient-to-b from-white to-slate-200 dark:border-slate-800 dark:from-slate-900 dark:to-slate-800">
        <TitleBar
          theme={themeMode}
          onThemeChange={setThemeMode}
          onShowShortcuts={() => setShowShortcuts(true)}
          menu={
          <MenuBar
            theme={themeMode}
            onThemeChange={setThemeMode}
            onNewSchedule={newSchedule}
            onOpenService={() => fileInputRef.current?.click()}
            onSaveService={saveSchedule}
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
            onImport={() => setDialog('import')}
            onLiveSettings={() => setDialog('liveSettings')}
            onShowLayouts={() => setTab('layouts')}
            onShowBackgrounds={() => setTab('backgrounds')}
            onShowShortcuts={() => setShowShortcuts(true)}
          />
          }
        />

        <div className="flex flex-wrap items-center justify-between gap-2 px-4 pb-2">
          <div className="flex items-center gap-1">
            <ToolMenuButton
              label="New"
              icon={IconNew}
              items={[
                { label: 'New Schedule', onClick: newSchedule },
                { label: 'New Song…', onClick: () => setSongEditor({ song: null }) },
              ]}
            />
            <ToolMenuButton
              label="Open"
              icon={IconOpen}
              items={[
                { label: 'Open Schedule…', onClick: () => fileInputRef.current?.click() },
                { label: 'Import Songs and Files…', onClick: () => setDialog('import') },
              ]}
            />
            <ToolButton
              label="Save"
              icon={IconSave}
              disabled={!dirty}
              title={dirty ? 'Save the schedule' : 'Nothing to save'}
              onClick={saveSchedule}
            />
            <ToolDivider />
            <ToolButton label="Store" icon={IconStore} disabled title="Coming soon" onClick={() => {}} />
            <ToolButton
              label="Web"
              icon={IconWeb}
              disabled={!window.electronAPI}
              title={window.electronAPI ? 'Open the web browser' : 'The web browser needs the desktop app'}
              onClick={() => setShowWeb((open) => !open)}
            />
            <ToolDivider />
            <ToolButton label="Remote" icon={IconRemote} disabled title="Coming soon" onClick={() => {}} />
          </div>
          <div className="flex items-center gap-1">
            <ToolButton label="Go Live" icon={IconPlay} accent onClick={handleGoLive} />
            <ToolDivider />
            <ToolButton label="Alerts" icon={IconBell} onClick={() => setDialog('alerts')} />
            <ToolDivider />
            <ToolButton label="Logo" icon={IconImage} onClick={handleLogo} />
            <ToolButton label="Black" icon={IconBlack} onClick={handleBlack} />
            <ToolButton label="Clear" icon={IconClear} disabled={!onAir} onClick={handleClear} />
            <ToolDivider />
            <ToolButton
              label="Live"
              icon={IconLiveOutput}
              blinking={onAir}
              title="Show or hide the live output window"
              onClick={() => void window.electronAPI?.toggleLiveWindow(loadDisplaySettings())}
            />
          </div>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept=".twp,.tworship,.ews,.ewsx,.xml,.txt,.db,.sqlite,.sqlite3,.zip"
          multiple
          className="hidden"
          onChange={(event) => {
            void handleOpenFiles(event.target.files)
            event.target.value = ''
          }}
        />
      </header>

      <main className="flex min-h-0 flex-1 flex-col">
        <div className="flex min-h-0 flex-1 p-3 pb-0">
          <div className="h-full shrink-0" style={{ width: scheduleWidth }}>
            <SchedulePanel
              items={schedule}
              selectedId={selectedId}
              slideIndex={slideIndex}
              theme={theme}
              backgroundCss={background?.css}
              layoutId={layoutId}
              onDropResource={dropResource}
              previewFor={(item) => previewForSchedule(item, songs)}
              onSelect={(id) => {
                setSelectedId(id)
                setCustomPreview(null)
                setSlideIndex(0)
                focusInResources(id, 0, false)
              }}
              onSelectSlide={(id, index) => {
                const item = schedule.find((entry) => entry.id === id)
                // In subtitle layouts a verse is several pieces; land on its first.
                const start = item
                  ? (fitForLayout(previewForSchedule(item, songs).slides, slideLabelsForItem(item)).starts[
                      index
                    ] ?? index)
                  : index
                setSelectedId(id)
                setCustomPreview(null)
                setSlideIndex(start)
                focusInResources(id, index, false)
              }}
              onGoLiveItem={selectAndGoLive}
              onAdd={addItem}
              onMoveUp={() => moveSelected(-1)}
              onMoveDown={() => moveSelected(1)}
              onRemove={removeSelected}
              onEditItem={editScheduleItem}
              onDuplicateItem={duplicateScheduleItem}
              onReorder={reorderSchedule}
              slideLabelsFor={slideLabelsForItem}
            />
          </div>
          <Splitter
            orientation="vertical"
            label="Resize schedule"
            onDrag={(delta) => setScheduleWidth((width) => clamp(width + delta, 180, 560))}
            onReset={() => setScheduleWidth(280)}
          />

          {showWeb ? (
            <div className="h-full min-w-0 flex-1">
              <WebBrowser live={webLive} onLiveChange={setWebLive} onClose={() => setShowWeb(false)} />
            </div>
          ) : (
          <div ref={centreRef} className="flex min-h-0 min-w-0 flex-1">
            <div className="flex h-full min-w-0 flex-col" style={{ width: `${previewPercent}%` }}>
              <div className="min-h-0 flex-1">
                <PreviewPanel
                  title={preview.title}
                  slides={preview.slides}
                  labels={slideLabels}
                  selectedIndex={slideIndex}
                  onSelect={setSlideIndex}
                  onGoLive={(index) => {
                    setSlideIndex(index)
                    goLiveSlide(index)
                  }}
                />
              </div>
              <Splitter
                orientation="horizontal"
                label="Resize preview output"
                onDrag={(delta) => setPreviewOutputHeight((height) => clamp(height - delta, 150, 480))}
                onReset={() => setPreviewOutputHeight(220)}
              />
              <div className="shrink-0" style={{ height: previewOutputHeight }}>
                <OutputPanel
                  title="Preview Output"
                  counter={`Slide ${Math.min(slideIndex, preview.slides.length - 1) + 1} of ${preview.slides.length}`}
                  canPrev={slideIndex > 0}
                  canNext={slideIndex < preview.slides.length - 1}
                  onPrev={() => stepSlide(-1)}
                  onNext={() => stepSlide(1)}
                >
                  <SlideView
                    lines={slide}
                    theme={theme}
                    backgroundCss={preview.media?.css ?? background?.css}
                    backgroundVideo={preview.media ? preview.media.video : background?.video}
                    layoutId={layoutId}
                    reference={preview.reference}
                    alert={alert}
                    className="h-full max-w-full"
                  />
                </OutputPanel>
              </div>
            </div>

            <Splitter
              orientation="vertical"
              label="Resize preview and live"
              onDrag={(delta) => {
                const width = centreRef.current?.clientWidth ?? 0
                if (width > 0) {
                  setPreviewPercent((percent) => clamp(percent + (delta / width) * 100, 25, 75))
                }
              }}
              onReset={() => setPreviewPercent(50)}
            />

            <div className="flex h-full min-w-0 flex-1 flex-col">
              <div className="min-h-0 flex-1">
                <LivePanel
                  title={liveTitle}
                  theme={theme}
                  slides={liveSlides ?? []}
                  slideLabels={liveSlideLabels}
                  liveSlideIndex={liveSlideIndex}
                  live={live !== null && !black && !logo}
                  backgroundCss={liveMedia?.css ?? background?.css}
                  layoutId={layoutId}
                  reference={liveReference ?? undefined}
                  onSelectLiveSlide={handleLiveSlideSelect}
                />
              </div>
              <Splitter
                orientation="horizontal"
                label="Resize live output"
                onDrag={(delta) => setLiveOutputHeight((height) => clamp(height - delta, 150, 480))}
                onReset={() => setLiveOutputHeight(220)}
              />
              <div className="shrink-0" style={{ height: liveOutputHeight }}>
                <OutputPanel
                  title="Live Output"
                  counter={
                    liveSlides && live
                      ? `Slide ${liveSlideIndex + 1} of ${liveSlides.length}`
                      : 'Not live'
                  }
                  canPrev={live !== null && liveSlideIndex > 0}
                  canNext={live !== null && liveSlides !== null && liveSlideIndex < liveSlides.length - 1}
                  onPrev={() => handleLiveSlideSelect(liveSlideIndex - 1)}
                  onNext={() => handleLiveSlideSelect(liveSlideIndex + 1)}
                >
                  <SlideView
                    lines={liveLines}
                    theme={theme}
                    backgroundCss={live === null || black ? '#000000' : (liveMedia?.css ?? background?.css)}
                    backgroundVideo={
                      live === null || black
                        ? undefined
                        : liveMedia
                          ? liveMedia.video
                          : background?.video
                    }
                    layoutId={layoutId}
                    reference={live !== null && !black && !logo ? (liveReference ?? undefined) : undefined}
                    alert={live !== null && !black && !logo ? alert : null}
                    className="h-full max-w-full"
                  />
                </OutputPanel>
              </div>
            </div>
          </div>
          )}
        </div>

        <Splitter
          orientation="horizontal"
          label="Resize resources"
          onDrag={(delta) =>
            setStripHeight((height) => clamp(height - delta, 160, Math.round(window.innerHeight * 0.6)))
          }
          onReset={() => setStripHeight(280)}
        />

        <div className="flex shrink-0 flex-col px-3 pb-2" style={{ height: stripHeight }}>
          <div className="flex shrink-0 items-end justify-between gap-2">
          <div className="flex min-w-0 items-end gap-0.5 overflow-x-auto" role="tablist">
            {tabs.map((entry) => (
              <button
                key={entry.id}
                type="button"
                role="tab"
                aria-selected={tab === entry.id}
                onClick={() => setTab(entry.id)}
                className={`shrink-0 rounded-t-md border border-b-0 px-4 py-1.5 text-sm ${
                  tab === entry.id
                    ? 'border-slate-300 bg-white font-semibold dark:border-slate-700 dark:bg-slate-900'
                    : 'border-transparent text-slate-600 hover:bg-slate-200 dark:text-slate-400 dark:hover:bg-slate-800'
                }`}
              >
                {entry.label}
              </button>
            ))}
          </div>
            <div className="flex shrink-0 items-center gap-1 pb-1">
              <button
                type="button"
                onClick={addPickedToSchedule}
                disabled={tab !== 'songs' && tab !== 'bible'}
                title={
                  tab === 'songs' || tab === 'bible'
                    ? 'Add the selected item to the schedule'
                    : 'Pick a song or a scripture to add it to the schedule'
                }
                aria-label="Add to schedule"
                className="flex h-7 w-7 items-center justify-center rounded-md bg-slate-200 text-lg font-bold leading-none text-slate-800 hover:bg-slate-300 disabled:opacity-40 disabled:hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700 dark:disabled:hover:bg-slate-800"
              >
                +
              </button>
              <button
                type="button"
                onClick={goLivePicked}
                disabled={tab !== 'songs' && tab !== 'bible'}
                title="Go live with the selected item"
                aria-label="Go live with the selected item"
                className="flex h-7 w-7 items-center justify-center rounded-md bg-slate-200 text-xs leading-none text-slate-800 hover:bg-slate-300 disabled:opacity-40 disabled:hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700 dark:disabled:hover:bg-slate-800"
              >
                ▶
              </button>
            </div>
          </div>
          <div className="min-h-0 flex-1 rounded-b-md rounded-tr-md border border-slate-300 bg-white p-2 dark:border-slate-700 dark:bg-slate-900">
            {tab === 'songs' && (
              <SongLibrary
                songs={songs}
                focus={songFocus}
                onOpen={openSong}
                onGoLive={goLiveSong}
                onNew={() => setSongEditor({ song: null })}
                onEdit={(song) => setSongEditor({ song })}
                onDelete={deleteSong}
                onAdd={(song) =>
                  setSongs((current) =>
                    current.some((entry) => entry.id === song.id)
                      ? current
                      : [...current, song],
                  )
                }
              />
            )}
            {/* Kept mounted (hidden on other tabs) so its verses and the live
                verse survive a tab switch and the arrow keys keep stepping. */}
            <div className={tab === 'bible' ? 'h-full' : 'hidden'}>
              <BibleLookup
                passages={demoPassage}
                focus={scriptureFocus}
                registerStepper={(step) => {
                  scriptureStepper.current = step
                }}
                onOpen={(reference, slides, version) =>
                  showPreview({ title: reference, slides, reference: `${reference} (${version})` })
                }
                onGoLive={goLiveScripture}
                registerSelection={(read) => {
                  scriptureSelection.current = read
                }}
              />
            </div>
            {tab === 'media' && <MediaLibrary onPreview={previewMedia} onGoLive={goLiveMedia} />}
            {tab === 'themes' && (
              <ThemePicker
                themes={themes}
                activeId={themeId}
                onPick={setThemeId}
                onBoldChange={(id, bold) =>
                  setThemes((current) =>
                    current.map((entry) => (entry.id === id ? { ...entry, bold } : entry)),
                  )
                }
                onFontChange={(id, fontFamily) =>
                  setThemes((current) =>
                    current.map((entry) =>
                      entry.id === id ? { ...entry, fontFamily } : entry,
                    ),
                  )
                }
              />
            )}
            {tab === 'backgrounds' && (
              <BackgroundPicker activeId={background?.id ?? null} onPick={setBackground} />
            )}
            {tab === 'layouts' && (
              <LayoutPicker
                activeId={layoutId}
                theme={theme}
                backgroundCss={background?.css}
                onPick={(id) => {
                  setLayoutId(id)
                  setSlideIndex(0)
                }}
              />
            )}
            {tab === 'songbook' && <SongbookPanel songs={songs} />}
          </div>
        </div>
      </main>

      <footer className="flex items-center justify-between border-t border-slate-300 px-4 py-1.5 text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400">
        <span>True Worship {__APP_VERSION__} · GPL-3.0 · {schedule.length} items in schedule</span>
        <span>Built by TMB</span>
      </footer>

      {dialog === 'alerts' && (
        <Modal title="Alerts" onClose={() => setDialog(null)}>
          <AlertBar
            bare
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
        </Modal>
      )}
      {dialog === 'liveSettings' && (
        <Modal title="Live Settings" onClose={() => setDialog(null)}>
          <h3 className="mb-2 text-sm font-semibold">Transition</h3>
          <label className="mb-6 flex items-center gap-3 text-sm">
            Fade between slides and when clearing
            <select
              value={transitionMs}
              onChange={(event) => {
                const next = Number(event.target.value)
                setTransitionMs(next)
                try {
                  localStorage.setItem('tw-transition-ms', String(next))
                } catch {
                  // Storage unavailable: the choice lasts until the app closes.
                }
              }}
              className="rounded-md border border-slate-300 bg-white px-2 py-1 dark:border-slate-700 dark:bg-slate-900"
            >
              <option value={0}>Off (cut)</option>
              <option value={150}>Fast</option>
              <option value={300}>Normal</option>
              <option value={600}>Slow</option>
            </select>
          </label>
          <h3 className="mb-2 text-sm font-semibold">Display</h3>
          <DisplayPanel bare />
          <h3 className="mb-2 mt-6 border-t border-slate-300 pt-4 text-sm font-semibold dark:border-slate-700">
            NDI Output
          </h3>
          <NdiPanel bare />
        </Modal>
      )}
      {dialog === 'import' && (
        <Modal title="Import" onClose={() => setDialog(null)} widthClass="max-w-3xl">
          <ImporterPanel
            bare
            songs={songs}
            schedule={schedule}
            onSongsImported={mergeSongs}
            onScheduleImported={mergeSchedule}
          />
        </Modal>
      )}
      {itemEditor && (
        <ItemEditor
          key={itemEditor.id}
          item={itemEditor}
          slides={previewForSchedule(itemEditor, songs).slides}
          onSave={(title, slides) => {
            setSchedule((current) =>
              current.map((entry) => (entry.id === itemEditor.id ? { ...entry, title, slides } : entry)),
            )
            setCustomPreview(null)
            setItemEditor(null)
          }}
          onClose={() => setItemEditor(null)}
        />
      )}
      {songEditor && (
        <SongEditor
          key={songEditor.song?.id ?? 'new'}
          song={songEditor.song}
          theme={theme}
          backgroundCss={background?.css}
          layoutId={layoutId}
          onSave={saveSongDraft}
          onClose={() => setSongEditor(null)}
        />
      )}
      <ShortcutsDialog open={showShortcuts} onClose={() => setShowShortcuts(false)} />
    </div>
  )
}
