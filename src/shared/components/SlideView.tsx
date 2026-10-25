import { useLayoutEffect, useRef, useState } from 'react'
import type { Theme } from '../lib/types'
import { layoutById } from '../lib/layouts'
import { Marquee, type MarqueeAlert } from './Marquee'

/**
 * One slide drawn the way the projector draws it: theme background,
 * optional looping video, layout, words and the marquee. It is laid
 * out at a fixed 1280 x 720 and scaled to whatever box it is given, so
 * the preview output, the live output and the slide thumbnails all
 * show the same picture at different sizes. Give it a width or a
 * height through className; it keeps 16:9.
 *
 * Words stay readable on any background: over a photo, video or
 * gradient the text is forced to white, a soft dark scrim sits between
 * the background and the words, and the words carry a shadow. Plain
 * theme colours keep the theme's own text colour.
 */
const BASE_WIDTH = 1280
const BASE_HEIGHT = 720

/** True when a hex colour is closer to white than to black. */
function isLight(colour: string) {
  const hex = colour.replace('#', '')
  if (!/^[0-9a-f]{6}$/i.test(hex)) return true
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(hex.slice(i, i + 2), 16))
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.55
}

export function SlideView({
  lines,
  theme,
  backgroundCss,
  backgroundVideo,
  layoutId,
  alert = null,
  className = 'w-full',
}: {
  lines: string[]
  theme: Theme
  backgroundCss?: string
  backgroundVideo?: string
  layoutId?: string
  alert?: MarqueeAlert | null
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
  const textColour = hasBackdrop ? '#ffffff' : theme.textColor
  const lightText = hasBackdrop || isLight(theme.textColor)
  const words = lines.map((line, index) => (
    <p
      key={index}
      className="leading-tight"
      style={{
        fontSize: theme.fontSize,
        // Bold plus a hairline stroke makes the words heavier than the font's own bold.
        WebkitTextStroke: theme.bold ? '0.02em currentColor' : undefined,
        textShadow: lightText
          ? '0 2px 10px rgba(0,0,0,0.85), 0 0 3px rgba(0,0,0,0.9)'
          : undefined,
      }}
    >
      {line}
    </p>
  ))

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
        {hasBackdrop && <div className="absolute inset-0 z-[5] bg-black/30" />}
        {alert && (
          <div className="absolute inset-x-0 top-0 z-20">
            <Marquee alert={alert} />
          </div>
        )}
        <div className={`relative z-10 ${layout.wrapper}`}>
          {layout.band ? <div className={layout.band}>{words}</div> : words}
        </div>
      </div>
    </div>
  )
}
