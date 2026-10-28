import { useLayoutEffect, useRef, useState } from 'react'
import type { SlideStyle, Theme } from '../lib/types'
import { defaultTextBox, layoutById } from '../lib/layouts'
import { Marquee, type MarqueeAlert } from './Marquee'

/**
 * One slide drawn the way the projector draws it: theme background,
 * optional looping video, layout, words and the marquee. It is laid
 * out at a fixed 1280 x 720 and scaled to whatever box it is given, so
 * the preview output, the live output and the slide thumbnails all
 * show the same picture at different sizes. Give it a width or a
 * height through className; it keeps 16:9.
 *
 * A scripture's reference (book, chapter, verse and version in
 * brackets) sits under the words, on the right, in a smaller size.
 *
 * Words stay readable on any background: over a photo, video or
 * gradient the text is forced to white, a soft dark scrim sits between
 * the background and the words, and the words carry a shadow. Plain
 * theme colours keep the theme's own text colour.
 *
 * Subtitle layouts (Lower and Upper Third) draw centred caption text
 * with no band and a smaller font, shrunk further when the words would
 * run past two or three lines, so long passages still fit.
 */
const BASE_WIDTH = 1280
const BASE_HEIGHT = 720

/** Words per line in Calibri-style bold, as a share of the font size. */
const CHAR_WIDTH = 0.5
const CAPTION_WIDTH = BASE_WIDTH - 2 * 96

/**
 * The largest font size, no bigger than `start`, at which `lines` wrap
 * to at most `maxLines` rows across the caption width. Estimated from
 * character count, so it errs a little small rather than overflowing.
 */
function captionFontSize(lines: string[], start: number, maxLines: number) {
  const floor = start * 0.55
  let size = start
  while (size > floor) {
    const rows = lines.reduce(
      (total, line) => total + Math.max(1, Math.ceil((line.length * CHAR_WIDTH * size) / CAPTION_WIDTH)),
      0,
    )
    if (rows <= maxLines) break
    size -= 2
  }
  return Math.max(size, floor)
}

const LINE_HEIGHT = 1.25

/**
 * The size words are shown at in a full-slide layout. A scripture grows past
 * the theme's size when it is short and shrinks when it is long, so a one-line
 * verse fills the screen and the longest verse in the Bible (Esther 8:9, about
 * 90 words) still fits; it stops shrinking at 40% of the theme's size. Other
 * text (songs, notices) keeps the theme's size, and only shrinks if it would
 * run off the slide, so the size does not jump from one verse of a song to
 * the next. Estimated from character counts, so it errs a little small.
 */
function fitFontSize(
  lines: string[],
  base: number,
  box: { width: number; height: number },
  grows: boolean,
  hasReference: boolean,
) {
  const start = grows ? base * 1.35 : base
  const floor = base * 0.4
  let size = start
  while (size > floor) {
    let rows = 0
    for (const line of lines) {
      // Words break at spaces, so a line needs a little more room than its characters alone.
      rows += Math.max(1, Math.ceil((line.length * CHAR_WIDTH * 1.07 * size) / box.width))
    }
    let total = rows * size * LINE_HEIGHT
    if (hasReference) total += size * 0.62 * LINE_HEIGHT + 12
    if (total <= box.height) break
    size -= 2
  }
  return Math.max(size, floor)
}

/** True when a hex colour is closer to white than to black. */
function isLight(colour: string) {
  const hex = colour.replace('#', '')
  if (!/^[0-9a-f]{6}$/i.test(hex)) return true
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(hex.slice(i, i + 2), 16))
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.55
}

/**
 * How the words of a slide are drawn: the font size, colour and the box
 * they sit in. Shared by the slide itself and by the preview's text
 * editor, so a text box sits exactly over the words it edits.
 */
export function textMetrics({
  lines,
  theme,
  layoutId,
  reference,
  hasBackdrop,
  style,
}: {
  lines: string[]
  theme: Theme
  layoutId?: string
  reference?: string
  hasBackdrop: boolean
  style?: SlideStyle
}) {
  const layout = layoutById(layoutId)
  const caption = layout.subtitle !== undefined
  // Subtitle layouts size and place their own words; a slide's style does not apply there.
  const custom = caption ? undefined : style
  const box = custom?.box ?? defaultTextBox(layout)
  const fontSize = caption
    ? captionFontSize(
        lines,
        theme.fontSize * (layout.fontScale ?? 1),
        lines.filter((line) => line.trim() !== '').length > 1 ? 2 : 3,
      )
    : (custom?.fontSize ??
      fitFontSize(
        lines,
        theme.fontSize * (layout.fontScale ?? 1),
        box,
        // A scripture (it has a reference) grows when it is short.
        Boolean(reference),
        Boolean(reference),
      ))
  return {
    caption,
    custom,
    box,
    fontSize,
    colour: custom?.color ?? (hasBackdrop ? '#ffffff' : theme.textColor),
    bold: custom?.bold ?? theme.bold,
    fontFamily: custom?.fontFamily ?? theme.fontFamily,
  }
}

export function SlideView({
  lines,
  theme,
  backgroundCss,
  backgroundVideo,
  layoutId,
  reference,
  alert = null,
  textOpacity,
  textFadeMs,
  wordsKey,
  wordsFadeInMs,
  style,
  hideWords = false,
  className = 'w-full',
}: {
  lines: string[]
  theme: Theme
  backgroundCss?: string
  backgroundVideo?: string
  layoutId?: string
  /** Shown under the words, on the right, e.g. "John 3:16 (KJV)". */
  reference?: string
  alert?: MarqueeAlert | null
  /** Fades just the words (0 to 1), leaving the background as it is. */
  textOpacity?: number
  /** How long the words take to fade when textOpacity changes. */
  textFadeMs?: number
  /** Changing this replays a fade-in of the words (new words appear at once, then fade up). */
  wordsKey?: number
  wordsFadeInMs?: number
  /** How this slide's words are arranged, when the operator changed it. */
  style?: SlideStyle
  /** Hides the words, while a text editor is drawn over them. */
  hideWords?: boolean
  className?: string
}) {
  const frame = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(0.25)

  useLayoutEffect(() => {
    const element = frame.current
    if (!element) return
    const update = () => setScale(element.clientWidth / BASE_WIDTH)
    update()
    const observer = new ResizeObserver(update)
    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  const layout = layoutById(layoutId)
  // A picked photo, video or gradient (anything other than the theme's own colour).
  const hasBackdrop =
    Boolean(backgroundVideo) || (backgroundCss !== undefined && backgroundCss !== theme.background)
  const metrics = textMetrics({ lines, theme, layoutId, reference, hasBackdrop, style })
  const { caption, custom, fontSize, bold } = metrics
  const textColour = metrics.colour
  const lightText = hasBackdrop || isLight(textColour)
  // Words moved or resized by the operator sit in their own box, not the layout's.
  const freeBox = custom?.box
  const words = lines.map((line, index) => (
    <p
      key={index}
      className="leading-tight"
      style={{
        fontSize,
        fontFamily: custom?.fontFamily,
        fontStyle: custom?.italic ? 'italic' : undefined,
        textDecoration: custom?.underline ? 'underline' : undefined,
        fontWeight: bold ? 700 : 400,
        // Bold plus a hairline stroke makes the words heavier than the font's own bold.
        WebkitTextStroke: bold ? '0.02em currentColor' : undefined,
        textShadow: lightText
          ? caption
            ? '0 0 6px rgba(0,0,0,0.95), 0 2px 4px rgba(0,0,0,0.9), 0 0 2px rgba(0,0,0,1)'
            : '0 2px 10px rgba(0,0,0,0.85), 0 0 3px rgba(0,0,0,0.9)'
          : undefined,
      }}
    >
      {line}
    </p>
  ))

  const referenceLine = reference ? (
    <p
      className="mt-3 w-full text-right leading-tight"
      style={{
        fontSize: fontSize * 0.62,
        fontWeight: 600,
        opacity: 0.92,
        textShadow: lightText
          ? '0 0 6px rgba(0,0,0,0.95), 0 2px 4px rgba(0,0,0,0.9)'
          : undefined,
      }}
    >
      {reference}
    </p>
  ) : null

  return (
    <div
      ref={frame}
      className={`relative aspect-video overflow-hidden ring-1 ring-inset ring-slate-500/40 ${className}`}
      style={{
        background: backgroundCss ?? theme.background,
        color: textColour,
        fontFamily: theme.fontFamily,
        fontWeight: theme.bold ? 700 : 400,
      }}
    >
      <div
        className="absolute left-0 top-0 origin-top-left"
        style={{ width: BASE_WIDTH, height: BASE_HEIGHT, transform: `scale(${scale})` }}
      >
        {backgroundVideo && (
          <video
            src={backgroundVideo}
            autoPlay
            loop
            muted
            playsInline
            className="absolute inset-0 h-full w-full object-cover"
          />
        )}
        {hasBackdrop && !caption && <div className="absolute inset-0 z-[5] bg-black/30" />}
        {hasBackdrop && caption && (
          // Captions only fade the screen edge they sit on, so the picture stays bright.
          <div
            className={`absolute inset-x-0 z-[5] h-2/5 ${
              layout.subtitle === 'top'
                ? 'top-0 bg-gradient-to-b from-black/55 to-transparent'
                : 'bottom-0 bg-gradient-to-t from-black/55 to-transparent'
            }`}
          />
        )}
        {alert && (
          <div className="absolute inset-x-0 top-0 z-20">
            <Marquee alert={alert} />
          </div>
        )}
        <div
          key={wordsKey ?? 0}
          className={freeBox ? 'absolute z-10 flex flex-col' : `relative z-10 ${layout.wrapper}`}
          style={{
            ...(freeBox
              ? {
                  left: freeBox.x,
                  top: freeBox.y,
                  width: freeBox.width,
                  height: freeBox.height,
                  textAlign: custom?.align ?? 'center',
                  justifyContent:
                    custom?.valign === 'top' ? 'flex-start' : custom?.valign === 'bottom' ? 'flex-end' : 'center',
                }
              : {}),
            opacity: hideWords ? 0 : (textOpacity ?? 1),
            transition: textFadeMs ? `opacity ${textFadeMs}ms ease` : undefined,
            animation: wordsFadeInMs ? `tw-fade-in ${wordsFadeInMs}ms ease-out both` : undefined,
          }}
        >
          {layout.band && !freeBox ? (
            <div className={layout.band}>
              {words}
              {referenceLine}
            </div>
          ) : (
            <>
              {words}
              {referenceLine}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
