const { contextBridge, ipcRenderer } = require('electron')

/**
 * The only bridge between the renderer and the main process. Features
 * never touch Electron APIs directly; they use this typed surface
 * (see src/electron.d.ts) so the UI also runs in a plain browser.
 */
contextBridge.exposeInMainWorld('electronAPI', {
  isElectron: true,
  openLiveWindow: () => ipcRenderer.send('open-live-window'),
  sendLiveUpdate: (payload) => ipcRenderer.send('live-update', payload),
  onLiveUpdate: (callback) =>
    ipcRenderer.on('live-update', (_event, payload) => callback(payload)),
})
