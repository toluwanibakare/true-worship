import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import type { SlideStyle, Theme } from '../lib/types'
import type { MarqueeAlert } from './Marquee'
import { SlideView, textMetrics } from './SlideView'
import { DISPLAY_FONTS } from '../lib/fonts'

/**
 * Edit a slide's words where they sit (shared: the Preview Output and the song
 * editor's preview both use it).
 * The Preview Output shows the selected slide. Click its words and a
 * box appears around them: drag the box to move it, drag a handle to
 * resize it, press the arrow keys to nudge it, double-click to type in
 * it (double-click a word inside to select it). A formatting bar above
 * the slide changes the font, size, colour, bold, italic, underline,
 * alignment and vertical alignment, applies the look to every slide,
 * or resets it. Changes apply to the whole text box, not to a part of
 * it. Moves and resizes are saved when the mouse is released.
 *
 * Subtitle layouts place and size their own words, so the editor is
 * off there.
 */
type Box = NonNullable<SlideStyle['box']>
type Handle = 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw'
const HANDLES: Handle[] = ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w']
const SIZES = [24, 32, 40, 48, 56, 64, 72, 80, 96, 112, 128]
const MIN_W = 120
const MIN_H = 60

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max)

const button =
  'flex h-6 min-w-6 items-center justify-center rounded px-1.5 text-xs font-semibold disabled:opacity-40'
const tone = (on: boolean) =>
  on
    ? 'bg-blue-600 text-white'
    : 'bg-slate-200 text-slate-800 hover:bg-slate-300 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700'

export function SlideEditor({
  lines,
  theme,
  backgroundCss,
  backgroundVideo,
  layoutId,
  reference,
  alert,
  style,
  canEdit,
  toolbarHost,
  fill = false,
  onStyle,
  onLines,
}: {
  lines: string[]
  theme: Theme
  backgroundCss?: string
  backgroundVideo?: string
  layoutId?: string
  reference?: string
  alert?: MarqueeAlert | null
  style?: SlideStyle
  /** False for media, an empty slide, or a subtitle layout. */
  canEdit: boolean
  /** Where the formatting bar is drawn (the Preview Output's title bar); above the slide when absent. */
  toolbarHost?: HTMLElement | null
  /** Size by width (a slide as wide as its container) rather than by the height it is given. */
  fill?: boolean
  /** A new style for this slide (null resets it); `all` applies it to every slide. */
  onStyle: (style: SlideStyle | null, all?: boolean) => void
  onLines: (lines: string[]) => void
}) {
  const root = useRef<HTMLDivElement>(null)
  const stage = useRef<HTMLDivElement>(null)
  const area = useRef<HTMLTextAreaElement>(null)
  const [selected, setSelected] = useState(false)
  const [editing, setEditing] = useState(false)
  // The style while a drag is in progress; saved on release.
  const [draft, setDraft] = useState<SlideStyle | null>(null)
  const [scale, setScale] = useState(0.3)

  useLayoutEffect(() => {
    const element = stage.current
    if (!element) return
    const update = () => setScale(element.clientWidth / 1280)
    update()
    const observer = new ResizeObserver(update)
    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  const shown = draft ?? style
  const hasBackdrop =
    Boolean(backgroundVideo) || (backgroundCss !== undefined && backgroundCss !== theme.background)
  const metrics = textMetrics({ lines, theme, layoutId, reference, hasBackdrop, style: shown })
  const active = canEdit && !metrics.caption
  const box = metrics.box

  // Changing slide, or turning editing off, closes the box.
  const slideKey = lines.join('\n')
  useEffect(() => {
    setSelected(false)
    setEditing(false)
    setDraft(null)
  }, [layoutId, canEdit])
  useEffect(() => {
    setEditing(false)
  }, [slideKey])

  // A click anywhere outside the editor puts the box away.
  useEffect(() => {
    if (!selected) return
    const away = (event: PointerEvent) => {
      const inToolbar = (event.target as HTMLElement).closest?.('[data-slide-toolbar]')
      if (root.current && !root.current.contains(event.target as Node) && !inToolbar) {
        setSelected(false)
        setEditing(false)
      }
    }
    window.addEventListener('pointerdown', away)
    return () => window.removeEventListener('pointerdown', away)
  }, [selected])

  useEffect(() => {
    if (editing) {
      area.current?.focus()
      area.current?.setSelectionRange(area.current.value.length, area.current.value.length)
    }
  }, [editing])

  const commitText = () => {
    const next = (area.current?.value ?? '')
      .split('\n')
      .map((line) => line.trimEnd())
      .filter((line, index, all) => line.trim() !== '' || (index > 0 && index < all.length - 1))
    setEditing(false)
    if (next.some((line) => line.trim() !== '') && next.join('\n') !== lines.join('\n')) onLines(next)
  }

  /** Starts a drag that moves or resizes the box, saving it on release. */
  const drag = (event: React.PointerEvent, handle: Handle | 'move') => {
    if (editing) return
    event.preventDefault()
    event.stopPropagation()
    setSelected(true)
    const start = { x: event.clientX, y: event.clientY, box: { ...box } }
    const base: SlideStyle = { ...(style ?? {}) }
    let latest: Box = start.box
    let moved = false
    const move = (e: PointerEvent) => {
      const dx = (e.clientX - start.x) / scale
      const dy = (e.clientY - start.y) / scale
      if (!moved && Math.abs(dx) + Math.abs(dy) < 3 / scale) return
      moved = true
      let { x, y, width, height } = start.box
      if (handle === 'move') {
        x = clamp(x + dx, 0, 1280 - width)
        y = clamp(y + dy, 0, 720 - height)
      } else {
        if (handle.includes('e')) width = clamp(start.box.width + dx, MIN_W, 1280 - x)
        if (handle.includes('s')) height = clamp(start.box.height + dy, MIN_H, 720 - y)
        if (handle.includes('w')) {
          const right = x + width
          x = clamp(x + dx, 0, right - MIN_W)
          width = right - x
        }
        if (handle.includes('n')) {
          const bottom = y + height
          y = clamp(y + dy, 0, bottom - MIN_H)
          height = bottom - y
        }
      }
      latest = { x: Math.round(x), y: Math.round(y), width: Math.round(width), height: Math.round(height) }
      setDraft({ ...base, box: latest })
    }
    const up = () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
      setDraft(null)
      if (moved) onStyle({ ...base, box: latest })
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
  }

  const nudge = (event: React.KeyboardEvent) => {
    if (editing || !selected) return
    const step = event.shiftKey ? 10 : 1
    const delta: Record<string, [number, number]> = {
      ArrowLeft: [-step, 0],
      ArrowRight: [step, 0],
      ArrowUp: [0, -step],
      ArrowDown: [0, step],
    }
    const move = delta[event.key]
    if (!move) {
      if (event.key === 'Escape') setSelected(false)
      return
    }
    event.preventDefault()
    event.stopPropagation()
    onStyle({
      ...(style ?? {}),
      box: {
        ...box,
        x: clamp(box.x + move[0], 0, 1280 - box.width),
        y: clamp(box.y + move[1], 0, 720 - box.height),
      },
    })
  }

  const change = (patch: Partial<SlideStyle>) => {
    const next = { ...(style ?? {}), ...patch }
    onStyle(next)
  }
  // Alignment needs the words to sit in a box of their own.
  const arrange = (patch: Pick<SlideStyle, 'align' | 'valign'>) => change({ box: style?.box ?? { ...box }, ...patch })

  const current = {
    bold: metrics.bold,
    italic: Boolean(shown?.italic),
    underline: Boolean(shown?.underline),
    align: shown?.align ?? 'center',
    valign: shown?.valign ?? 'middle',
  }
  const fontValue = DISPLAY_FONTS.find((font) => font.value === shown?.fontFamily)?.value ?? ''
  const fieldClass =
    'h-6 rounded border border-slate-300 bg-white px-1 text-xs dark:border-slate-700 dark:bg-slate-900'

  const toolbar = (
    <div className="flex min-h-6 min-w-0 flex-wrap items-center justify-end gap-1" data-slide-toolbar>
            {selected ? (
              <>
                <select
                  aria-label="Font"
                  value={fontValue}
                  onChange={(event) => change({ fontFamily: event.target.value || undefined })}
                  className={`${fieldClass} w-24`}
                >
                  <option value="">Theme font</option>
                  {DISPLAY_FONTS.map((font) => (
                    <option key={font.label} value={font.value}>
                      {font.label}
                    </option>
                  ))}
                </select>
                <select
                  aria-label="Size"
                  value={shown?.fontSize ?? ''}
                  onChange={(event) => change({ fontSize: event.target.value ? Number(event.target.value) : undefined })}
                  className={`${fieldClass} w-16`}
                >
                  <option value="">Auto</option>
                  {SIZES.map((size) => (
                    <option key={size} value={size}>
                      {size}
                    </option>
                  ))}
                </select>
                <input
                  type="color"
                  aria-label="Text colour"
                  value={/^#[0-9a-f]{6}$/i.test(metrics.colour) ? metrics.colour : '#ffffff'}
                  onChange={(event) => change({ color: event.target.value })}
                  className="h-6 w-7 cursor-pointer rounded border border-slate-300 bg-white p-0.5 dark:border-slate-700"
                />
                <button type="button" aria-label="Bold" title="Bold" className={`${button} ${tone(current.bold)}`} onClick={() => change({ bold: !current.bold })}>
                  B
                </button>
                <button type="button" aria-label="Italic" title="Italic" className={`${button} italic ${tone(current.italic)}`} onClick={() => change({ italic: !current.italic })}>
                  I
                </button>
                <button type="button" aria-label="Underline" title="Underline" className={`${button} underline ${tone(current.underline)}`} onClick={() => change({ underline: !current.underline })}>
                  U
                </button>
                <span className="mx-0.5 h-4 w-px bg-slate-300 dark:bg-slate-700" />
                {(['left', 'center', 'right'] as const).map((align) => (
                  <button key={align} type="button" aria-label={`Align ${align}`} title={`Align ${align}`} className={`${button} ${tone(current.align === align)}`} onClick={() => arrange({ align })}>
                    {align === 'left' ? '⇤' : align === 'center' ? '↔' : '⇥'}
                  </button>
                ))}
                {(['top', 'middle', 'bottom'] as const).map((valign) => (
                  <button key={valign} type="button" aria-label={`Align ${valign}`} title={`Align ${valign}`} className={`${button} ${tone(current.valign === valign)}`} onClick={() => arrange({ valign })}>
                    {valign === 'top' ? '⤒' : valign === 'middle' ? '↕' : '⤓'}
                  </button>
                ))}
                <span className="mx-0.5 h-4 w-px bg-slate-300 dark:bg-slate-700" />
                <button type="button" className={`${button} ${tone(false)}`} title="Give every slide this look" onClick={() => onStyle(style ?? {}, true)}>
                  All slides
                </button>
                <button type="button" className={`${button} ${tone(false)}`} disabled={!style} onClick={() => onStyle(null)}>
                  Reset Styles
                </button>
              </>
            ) : (
              <span className="text-xs text-slate-500 dark:text-slate-400">
                Click the words to move, resize and format them.
              </span>
            )}
          </div>
  )

  return (
    <div ref={root} className={`flex w-full flex-col items-center gap-1 ${fill ? '' : 'h-full'}`} tabIndex={-1} onKeyDown={nudge}>
      {toolbarHost ? (active ? createPortal(toolbar, toolbarHost) : null) : active ? toolbar : null}

      <div className={`flex w-full items-center justify-center ${fill ? '' : 'min-h-0 flex-1'}`}>
        <div ref={stage} className={`relative aspect-video ${fill ? 'w-full' : 'h-full max-w-full'}`}>
          <SlideView
            lines={lines}
            theme={theme}
            backgroundCss={backgroundCss}
            backgroundVideo={backgroundVideo}
            layoutId={layoutId}
            reference={reference}
            alert={alert}
            style={shown}
            hideWords={editing}
            className="absolute inset-0 h-full w-full"
          />
          {active && (
            <div
              data-slide-box
              onDoubleClick={() => {
                setSelected(true)
                setEditing(true)
              }}
              onPointerDownCapture={editing ? undefined : (event) => {
                // Pressing the words selects the box; dragging moves it.
                if ((event.target as HTMLElement).dataset.handle) return
                drag(event, 'move')
              }}
              className={`absolute ${selected ? 'cursor-move' : 'cursor-pointer'} ${
                selected ? 'border border-dashed border-blue-500' : 'hover:outline hover:outline-1 hover:outline-dashed hover:outline-blue-400'
              }`}
              style={{
                left: box.x * scale,
                top: box.y * scale,
                width: box.width * scale,
                height: box.height * scale,
              }}
            >
              {selected &&
                !editing &&
                HANDLES.map((handle) => (
                  <span
                    key={handle}
                    data-handle={handle}
                    onPointerDown={(event) => drag(event, handle)}
                    className="absolute h-2.5 w-2.5 rounded-sm border border-blue-600 bg-white"
                    style={{
                      left: handle.includes('w') ? -5 : handle.includes('e') ? undefined : '50%',
                      right: handle.includes('e') ? -5 : undefined,
                      top: handle.includes('n') ? -5 : handle.includes('s') ? undefined : '50%',
                      bottom: handle.includes('s') ? -5 : undefined,
                      marginLeft: !handle.includes('w') && !handle.includes('e') ? -5 : undefined,
                      marginTop: !handle.includes('n') && !handle.includes('s') ? -5 : undefined,
                      cursor:
                        handle === 'n' || handle === 's'
                          ? 'ns-resize'
                          : handle === 'e' || handle === 'w'
                            ? 'ew-resize'
                            : handle === 'nw' || handle === 'se'
                              ? 'nwse-resize'
                              : 'nesw-resize',
                    }}
                  />
                ))}
              {editing && (
                <div
                  className="absolute inset-0 flex flex-col overflow-hidden bg-black/35"
                  style={{
                    justifyContent:
                      current.valign === 'top' ? 'flex-start' : current.valign === 'bottom' ? 'flex-end' : 'center',
                  }}
                >
                  <textarea
                    ref={area}
                    defaultValue={lines.join('\n')}
                    rows={lines.length}
                    onBlur={commitText}
                    onKeyDown={(event) => {
                      event.stopPropagation()
                      if (event.key === 'Escape') {
                        event.preventDefault()
                        commitText()
                      }
                    }}
                    spellCheck={false}
                    className="block w-full shrink-0 resize-none overflow-hidden bg-transparent outline-none"
                    style={{
                      fontSize: metrics.fontSize * scale,
                      lineHeight: 1.25,
                      color: metrics.colour,
                      fontFamily: metrics.fontFamily,
                      fontWeight: metrics.bold ? 700 : 400,
                      fontStyle: current.italic ? 'italic' : undefined,
                      textDecoration: current.underline ? 'underline' : undefined,
                      textAlign: shown?.box ? (shown.align ?? 'center') : 'center',
                      // Grows with the words it holds.
                      fieldSizing: 'content',
                    } as React.CSSProperties}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

