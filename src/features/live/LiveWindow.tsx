import { useEffect, useState } from 'react'
import type { LiveUpdatePayload } from '../../electron'

/**
 * Feature: live — the second window.
 * Rendered when the app opens with ?live=1, which is what the Electron
 * main process loads into the projector window. It only displays what
 * the operator window sends it over the live-update channel, so it
 * stays blank until something goes live.
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

  return (
    <div
      className="flex h-full flex-col items-center justify-center p-10 text-center"
      style={{ background: slide.background, color: slide.textColor }}
    >
      {slide.lines.map((line) => (
        <p key={line} className="leading-snug" style={{ fontSize: slide.fontSize }}>
          {line}
        </p>
      ))}
    </div>
  )
}
