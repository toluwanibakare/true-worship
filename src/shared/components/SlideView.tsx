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
 */
const BASE_WIDTH = 1280
const BASE_HEIGHT = 720

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
  const words = lines.map((line, index) => (
    <p key={index} className="leading-snug" style={{ fontSize: theme.fontSize }}>
      {line}
    </p>
  ))

  return (
    <div
      ref={frame}
      className={`relative aspect-video overflow-hidden ring-1 ring-inset ring-slate-500/40 ${className}`}
      style={{
        background: backgroundCss ?? theme.background,
        color: theme.textColor,
        fontFamily: theme.fontFamily,
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
