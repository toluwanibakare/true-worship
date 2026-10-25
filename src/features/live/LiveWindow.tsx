import { useEffect, useRef, useState } from 'react'
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
 * When the operator shows the web browser, it draws that page's frames
 * instead, full screen, until something else goes live.
 *
 * Changes fade instead of cutting. When the background (or layout or
 * font) changes, the new slide is laid over the old one and fades in,
 * which also gives a fade to Black or Logo and a fade in from nothing.
 * When only the words change, the words fade out and the new ones fade
 * in on the same background, so a moving background carries on without
 * restarting, and Clear fades the words away. How long the fade takes
 * comes with each update (transitionMs); 0 is a straight cut.
 */
type Layer = { key: number; payload: LiveUpdatePayload; fadeIn: boolean }

/** Everything except the words: when this changes, the whole picture crossfades. */
const lookOf = (p: LiveUpdatePayload) =>
  JSON.stringify([p.background, p.backgroundCss, p.backgroundVideo, p.layout, p.fontFamily, p.fontSize, p.bold, p.textColor])
const wordsOf = (p: LiveUpdatePayload) => JSON.stringify([p.lines, p.reference])

export function LiveWindow() {
  const [layers, setLayers] = useState<Layer[]>([])
  // True while the words on the top layer are faded out between two slides.
  const [wordsHidden, setWordsHidden] = useState(false)
  // The latest picture of the web browser, while it is being shown.
  const [webFrame, setWebFrame] = useState<string | null>(null)
  const shown = useRef<LiveUpdatePayload | null>(null)
  const nextKey = useRef(0)
  // Pending word swaps; a newer slide cancels them. Layer clean-up timers
  // are never cancelled (each only drops layers older than its own).
  const timers = useRef<number[]>([])

  useEffect(() => {
    const api = window.electronAPI
    const drop = () =>
      setWebFrame((current) => {
        if (current) URL.revokeObjectURL(current)
        return null
      })
    const later = (action: () => void, ms: number) => {
      timers.current.push(window.setTimeout(action, ms))
    }
    const dropLayersBefore = (key: number, ms: number) => {
      window.setTimeout(() => setLayers((current) => current.filter((layer) => layer.key >= key)), ms)
    }
    const replaceTop = (payload: LiveUpdatePayload) =>
      setLayers((current) =>
        current.length === 0
          ? current
          : [...current.slice(0, -1), { ...current[current.length - 1], payload }],
      )

    const show = (payload: LiveUpdatePayload) => {
      drop()
      // The same slide again (a repeated message, or a listener that was
      // registered twice) must not restart a fade that is already running.
      if (shown.current && JSON.stringify(shown.current) === JSON.stringify(payload)) return
      timers.current.forEach(window.clearTimeout)
      timers.current = []
      const previous = shown.current
      const ms = payload.transitionMs ?? 0
      shown.current = payload

      // A straight cut: no fade requested.
      if (ms <= 0) {
        setWordsHidden(false)
        setLayers([{ key: nextKey.current++, payload, fadeIn: false }])
        return
      }
      // First slide, or a new look: lay the new slide over the old one and fade it in.
      if (!previous || lookOf(previous) !== lookOf(payload)) {
        setWordsHidden(false)
        const key = nextKey.current++
        setLayers((current) => [...current.slice(-1), { key, payload, fadeIn: true }])
        dropLayersBefore(key, ms + 60)
        return
      }
      // Same look, same words (an alert came or went, or a fade was
      // already under way for these words): show them now.
      if (wordsOf(previous) === wordsOf(payload)) {
        replaceTop(payload)
        setWordsHidden(false)
        return
      }
      // Same look, new words: fade the words out, swap them, fade them in.
      setWordsHidden(true)
      later(() => {
        replaceTop(payload)
        setWordsHidden(false)
      }, ms / 2)
    }

    // Words, Black or Logo replace the web page.
    api?.onLiveUpdate(show)
    // A slide sent while this window was still loading is waiting in the main process.
    void api?.getLastLive().then((payload) => {
      if (payload && !shown.current) show(payload)
    })
    api?.onWebFrame((jpeg) => {
      const next = URL.createObjectURL(new Blob([jpeg as BlobPart], { type: 'image/jpeg' }))
      setWebFrame((current) => {
        if (current) URL.revokeObjectURL(current)
        return next
      })
    })
    api?.onWebFrameEnd(drop)
  }, [])

  if (webFrame) {
    return (
      <div className="flex h-full items-center justify-center bg-black">
        <img src={webFrame} alt="" className="h-full w-full object-contain" />
      </div>
    )
  }

  if (layers.length === 0) {
    return (
      <div className="flex h-full items-center justify-center bg-black text-slate-500">
        <p className="text-lg">Waiting for the operator to go live…</p>
      </div>
    )
  }

  // The projector draws with the same renderer as the operator's
  // monitors, scaled to fit the screen, so what the room sees is exactly
  // what the operator previewed.
  return (
    <div className="relative h-full bg-black">
      {layers.map((layer, index) => {
        const slide = layer.payload
        const ms = slide.transitionMs ?? 0
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
          <div
            key={layer.key}
            className="absolute inset-0 flex items-center justify-center"
            style={layer.fadeIn ? { animation: `tw-fade-in ${ms}ms ease-out both` } : undefined}
          >
            <SlideView
              lines={slide.lines}
              theme={theme}
              backgroundCss={slide.backgroundCss}
              backgroundVideo={slide.backgroundVideo}
              layoutId={slide.layout}
              reference={slide.reference}
              alert={slide.alert ?? null}
              textOpacity={index === layers.length - 1 && wordsHidden ? 0 : 1}
              textFadeMs={ms / 2}
              className="w-[min(100vw,calc(100vh*16/9))]"
            />
          </div>
        )
      })}
    </div>
  )
}
