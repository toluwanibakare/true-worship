import { useEffect, useState } from 'react'

/**
 * A pane size (pixels or percent) that survives restarts. Used by the
 * main window's draggable dividers. Storage can be unavailable, so
 * every read and write is guarded and the default is the fallback.
 */
export function usePaneSize(key: string, initial: number) {
  const [size, setSize] = useState(() => {
    try {
      const stored = Number(localStorage.getItem(key))
      return Number.isFinite(stored) && stored > 0 ? stored : initial
    } catch {
      return initial
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem(key, String(size))
    } catch {
      // Storage unavailable: the size just resets next launch.
    }
  }, [key, size])

  return [size, setSize] as const
}
