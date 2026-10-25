import type {
  DisplayInfo,
  DisplaySettings,
  NdiOptions,
  NdiStatus,
} from './shared/lib/types'
import type { MarqueeAlert } from './shared/components/Marquee'

export type LiveUpdatePayload = {
  title: string
  lines: string[]
  background: string
  /** CSS background for the slide; falls back to background. */
  backgroundCss?: string
  /** Relative path to a looping video background, when one is picked. */
  backgroundVideo?: string
  /** Layout id from features/layouts, default fullscreen. */
  layout?: string
  /** Scrolling alert at the top of the output, or null. */
  alert?: MarqueeAlert | null
  textColor: string
  fontSize: number
  /** Slide font stack (Calibri first, with open fallbacks). */
  fontFamily: string
  /** Bold slide text. */
  bold: boolean
}

/** A background the user added: a photo or a video kept in the app's data folder. */
export type UserBackground = {
  file: string
  name: string
  kind: 'still' | 'video'
  url: string
}

/** A file in the Media library: an image, a video or an audio track. */
export type UserMedia = {
  file: string
  name: string
  kind: 'still' | 'video' | 'audio'
  url: string
}

export type ElectronAPI = {
  isElectron: true
  openLiveWindow: (settings?: DisplaySettings) => void
  applyDisplaySettings: (settings: DisplaySettings) => void
  minimizeWindow: () => void
  toggleMaximizeWindow: () => void
  closeWindow: () => void
  listBackgrounds: () => Promise<UserBackground[]>
  importBackgrounds: () => Promise<UserBackground[]>
  removeBackground: (file: string) => Promise<void>
  listMedia: () => Promise<UserMedia[]>
  importMedia: () => Promise<UserMedia[]>
  removeMedia: (file: string) => Promise<void>
  getDisplays: () => Promise<DisplayInfo[]>
  sendLiveUpdate: (payload: LiveUpdatePayload) => void
  onLiveUpdate: (callback: (payload: LiveUpdatePayload) => void) => void
  ndiStatus: () => Promise<NdiStatus>
  setNdi: (options: NdiOptions) => Promise<NdiStatus>
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI
  }
}

export {}
