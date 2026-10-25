import type {
  DisplayInfo,
  DisplaySettings,
  NdiOptions,
  NdiStatus,
} from './shared/lib/types'

export type LiveUpdatePayload = {
  title: string
  lines: string[]
  background: string
  textColor: string
  fontSize: number
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
