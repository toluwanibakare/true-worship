import { useEffect, useState } from 'react'
import type { LiveUpdatePayload } from '../../electron'
import type { Theme } from '../../shared/lib/types'
import { SlideView } from '../../shared/components/SlideView'

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

  // The projector draws with the same renderer as the operator's
  // monitors, scaled to fit the screen, so what the room sees is exactly
  // what the operator previewed.
  const theme: Theme = {
    id: 'live',
    name: 'Live',
    background: slide.background,
    textColor: slide.textColor,
    fontSize: slide.fontSize,
    fontFamily: slide.fontFamily,
    bold: slide.bold,
  }

  return (
    <div className="flex h-full items-center justify-center bg-black">
      <SlideView
        lines={slide.lines}
        theme={theme}
        backgroundCss={slide.backgroundCss}
        backgroundVideo={slide.backgroundVideo}
        layoutId={slide.layout}
        alert={slide.alert ?? null}
        className="w-[min(100vw,calc(100vh*16/9))]"
      />
    </div>
  )
}
