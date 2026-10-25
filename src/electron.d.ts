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
  /** Slide font stack (EasyWorship's default song theme font is Calibri). */
  fontFamily: string
}

export type ElectronAPI = {
  isElectron: true
  openLiveWindow: (settings?: DisplaySettings) => void
  applyDisplaySettings: (settings: DisplaySettings) => void
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
