import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
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
import { Splitter } from '../shared/components/Splitter'
import { usePaneSize } from '../shared/lib/usePaneSize'
import { demoPassage, demoSchedule, demoSongs, demoThemes } from '../shared/lib/demo'
import type { ScheduleItem, Song } from '../shared/lib/types'

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

type Preview = {
  title: string
  /** Slides: each entry is one slide's lines. */
  slides: string[][]
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
  const theme = themes.find((entry) => entry.id === themeId) ?? themes[0]

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
      fontFamily: theme.fontFamily,
      bold: theme.bold,
    })
  }

  const showPreview = (next: Preview) => {
    setCustomPreview(next)
    setSlideIndex(0)
  }

  const openSong = (song: Song) => {
    showPreview({ title: song.title, slides: song.verses.map((verse) => verse.lines) })
  }

  // Send an item live, starting at the given slide. Double-clicking a
  // slide in the Preview pane, or a row in the Scriptures table, uses
  // this to go live straight away.
  const goLiveWith = (target: Preview, labels: string[], index: number) => {
    const lines = target.slides[index] ?? []
    setLive({ title: target.title, lines })
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

  const goLiveSong = (song: Song) => {
    const next = { title: song.title, slides: song.verses.map((verse) => verse.lines) }
    showPreview(next)
    goLiveWith(next, song.verses.map((verse) => verse.label), 0)
  }

  const goLiveScripture = (reference: string, text: string) => {
    const next = { title: reference, slides: [[text]] }
    showPreview(next)
    goLiveWith(next, ['Slide 1'], 0)
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
    setLive(null)
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
    return ['Slide 1']
  }

  // Double-clicking a schedule row sends that item live from its
  // first slide, the fastest path from plan to screen.
  const selectAndGoLive = (id: string) => {
    const item = schedule.find((entry) => entry.id === id)
    if (!item) return
    const itemPreview = previewForSchedule(item, songs)
    const first = itemPreview.slides[0] ?? []
    setSelectedId(id)
    setCustomPreview(null)
    setSlideIndex(0)
    setLive({ title: itemPreview.title, lines: first })
    setLiveSlides(itemPreview.slides)
    setLiveSlideLabels(slideLabelsForItem(item))
    setLiveSlideIndex(0)
    setBlack(false)
    setLogo(false)
    clearedLiveRef.current = null
    window.electronAPI?.openLiveWindow(loadDisplaySettings())
    sendLive(itemPreview.title, first)
  }

  const stepSlide = (direction: -1 | 1) =>
    setSlideIndex((current) =>
      Math.min(Math.max(current + direction, 0), preview.slides.length - 1),
    )

  const goToSlide = (index: number) =>
    setSlideIndex(Math.min(Math.max(index, 0), preview.slides.length - 1))

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
    goToSlide,
    nextItem: () => stepSchedule(1),
    prevItem: () => stepSchedule(-1),
    removeSelected,
    openService: () => fileInputRef.current?.click(),
    saveService: () =>
      downloadTworship({ title: 'Sunday Service', kind: 'schedule', songs, schedule }),
    showAlerts: () => setDialog('alerts'),
    setShowShortcuts,
    showShortcuts,
    dialogOpen: dialog !== null,
    closeDialog: () => setDialog(null),
    labels: slideLabels,
    slideCount: preview.slides.length,
  })
  actionsRef.current = {
    goLive: handleGoLive,
    toggleBlack,
    toggleLogo,
    toggleText,
    stepSlide,
    goToSlide,
    nextItem: () => stepSchedule(1),
    prevItem: () => stepSchedule(-1),
    removeSelected,
    openService: () => fileInputRef.current?.click(),
    saveService: () =>
      downloadTworship({ title: 'Sunday Service', kind: 'schedule', songs, schedule }),
    showAlerts: () => setDialog('alerts'),
    setShowShortcuts,
    showShortcuts,
    dialogOpen: dialog !== null,
    closeDialog: () => setDialog(null),
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
          a.stepSlide(1)
          break
        case 'ArrowUp':
        case 'p':
        case 'P':
        case 'Backspace':
          event.preventDefault()
          a.stepSlide(-1)
          break
        case 'ArrowRight':
          event.preventDefault()
          a.nextItem()
          break
        case 'ArrowLeft':
          event.preventDefault()
          a.prevItem()
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
  }

  // On air: something is live, or the output is held on Black or Logo.
  const onAir = live !== null || black || logo
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
            <ToolButton
              label="New"
              icon={IconNew}
              onClick={() => {
                setSchedule([])
                setSelectedId(null)
                setCustomPreview(null)
              }}
            />
            <ToolButton label="Open" icon={IconOpen} onClick={() => fileInputRef.current?.click()} />
            <ToolButton
              label="Save"
              icon={IconSave}
              onClick={() =>
                downloadTworship({ title: 'Sunday Service', kind: 'schedule', songs, schedule })
              }
            />
            <ToolDivider />
            <ToolButton label="Store" icon={IconStore} disabled title="Coming soon" onClick={() => {}} />
            <ToolButton label="Web" icon={IconWeb} disabled title="Coming soon" onClick={() => {}} />
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
              title="Open the live output window"
              onClick={() => window.electronAPI?.openLiveWindow(loadDisplaySettings())}
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
              onSelect={(id) => {
                setSelectedId(id)
                setCustomPreview(null)
                setSlideIndex(0)
              }}
              onSelectSlide={(id, index) => {
                setSelectedId(id)
                setCustomPreview(null)
                setSlideIndex(index)
              }}
              onGoLiveItem={selectAndGoLive}
              onAdd={addItem}
              onMoveUp={() => moveSelected(-1)}
              onMoveDown={() => moveSelected(1)}
              onRemove={removeSelected}
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
                    backgroundCss={background?.css}
                    backgroundVideo={background?.video}
                    layoutId={layoutId}
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
                  backgroundCss={background?.css}
                  layoutId={layoutId}
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
                    backgroundCss={live === null || black ? '#000000' : background?.css}
                    backgroundVideo={live === null || black ? undefined : background?.video}
                    layoutId={layoutId}
                    alert={live !== null && !black && !logo ? alert : null}
                    className="h-full max-w-full"
                  />
                </OutputPanel>
              </div>
            </div>
          </div>
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
          <div className="flex shrink-0 items-end gap-0.5 overflow-x-auto" role="tablist">
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
          <div className="min-h-0 flex-1 rounded-b-md rounded-tr-md border border-slate-300 bg-white p-2 dark:border-slate-700 dark:bg-slate-900">
            {tab === 'songs' && (
              <SongLibrary songs={songs} onOpen={openSong} onGoLive={goLiveSong} />
            )}
            {tab === 'bible' && (
              <BibleLookup
                passages={demoPassage}
                onOpen={(reference, text) =>
                  showPreview({ title: reference, slides: [[text]] })
                }
                onGoLive={goLiveScripture}
              />
            )}
            {tab === 'media' && <MediaLibrary />}
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
              <LayoutPicker activeId={layoutId} onPick={setLayoutId} />
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
      <ShortcutsDialog open={showShortcuts} onClose={() => setShowShortcuts(false)} />
    </div>
  )
}
