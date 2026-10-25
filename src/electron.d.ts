export type LiveUpdatePayload = {
  title: string
  lines: string[]
  background: string
  textColor: string
  fontSize: number
}

export type ElectronAPI = {
  isElectron: true
  openLiveWindow: () => void
  sendLiveUpdate: (payload: LiveUpdatePayload) => void
  onLiveUpdate: (callback: (payload: LiveUpdatePayload) => void) => void
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI
  }
}

export {}
