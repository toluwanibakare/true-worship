const { contextBridge, ipcRenderer } = require('electron')

/**
 * The only bridge between the renderer and the main process. Features
 * never touch Electron APIs directly; they use this typed surface
 * (see src/electron.d.ts) so the UI also runs in a plain browser.
 */
contextBridge.exposeInMainWorld('electronAPI', {
  isElectron: true,
  openLiveWindow: (settings) => ipcRenderer.send('open-live-window', settings),
  applyDisplaySettings: (settings) =>
    ipcRenderer.send('apply-display-settings', settings),
  getDisplays: () => ipcRenderer.invoke('get-displays'),
  sendLiveUpdate: (payload) => ipcRenderer.send('live-update', payload),
  onLiveUpdate: (callback) =>
    ipcRenderer.on('live-update', (_event, payload) => callback(payload)),
  ndiStatus: () => ipcRenderer.invoke('ndi-status'),
  setNdi: (options) => ipcRenderer.invoke('ndi-set', options),
})
