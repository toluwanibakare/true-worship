import { useEffect, useState } from 'react'
import type { LiveUpdatePayload } from '../../electron'
import { layoutById } from '../../shared/lib/layouts'
import { Marquee } from '../../shared/components/Marquee'

/**
 * Feature: live — the second window.
 * Rendered when the app opens with ?live=1, which is what the Electron
 * main process loads into the projector window. It only displays what
 * the operator window sends it over the live-update channel, so it
 * stays blank until something goes live. Layout and marquee come with
 * the payload, so the room sees exactly what the operator previewed.
 */
export function LiveWindow() {
  const [slide, setSlide] = useState<LiveUpdatePayload | null>(null)

  useEffect(() => {
    window.electronAPI?.onLiveUpdate((payload) => setSlide(payload))
  }, [])

  if (!slide) {
    return (
      <div className="flex h-full items-center justify-center bg-black text-slate-500">
        <p className="text-lg">Waiting for the operator to go live…</p>
      </div>
    )
  }

  const layout = layoutById(slide.layout)

  return (
    <div
      className="relative h-full overflow-hidden"
      style={{ background: slide.backgroundCss ?? slide.background, color: slide.textColor, fontFamily: slide.fontFamily }}
    >
      {slide.backgroundVideo && (
        <video
          src={slide.backgroundVideo}
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 h-full w-full object-cover"
        />
      )}
      {slide.alert && (
        <div className="absolute inset-x-0 top-0 z-20">
          <Marquee alert={slide.alert} />
        </div>
      )}
      <div className={`relative z-10 ${layout.wrapper}`}>
        {layout.band ? (
          <div className={layout.band}>
            {slide.lines.map((line) => (
              <p key={line} className="leading-snug" style={{ fontSize: slide.fontSize }}>
                {line}
              </p>
            ))}
          </div>
        ) : (
          slide.lines.map((line) => (
            <p key={line} className="leading-snug" style={{ fontSize: slide.fontSize }}>
              {line}
            </p>
          ))
        )}
      </div>
    </div>
  )
}
