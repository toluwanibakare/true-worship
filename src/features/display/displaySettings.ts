import type { DisplaySettings } from '../../shared/lib/types'

const KEY = 'tw-display-settings'

export const defaultDisplaySettings: DisplaySettings = {
  displayId: 'auto',
  fullscreen: true,
  alwaysOnTop: false,
}

export function loadDisplaySettings(): DisplaySettings {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return defaultDisplaySettings
    return { ...defaultDisplaySettings, ...JSON.parse(raw) }
  } catch {
    return defaultDisplaySettings
  }
}

export function saveDisplaySettings(settings: DisplaySettings): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(settings))
  } catch {
    // Private browsing or blocked storage: settings just don't persist.
  }
}
