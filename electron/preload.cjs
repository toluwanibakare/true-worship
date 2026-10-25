const { contextBridge, ipcRenderer } = require('electron')

/**
 * The only bridge between the renderer and the main process. Features
 * never touch Electron APIs directly; they use this typed surface
 * (see src/electron.d.ts) so the UI also runs in a plain browser.
 */
contextBridge.exposeInMainWorld('electronAPI', {
  isElectron: true,
  openLiveWindow: (settings) => ipcRenderer.send('open-live-window', settings),
  toggleLiveWindow: (settings) => ipcRenderer.invoke('toggle-live-window', settings),
  applyDisplaySettings: (settings) =>
    ipcRenderer.send('apply-display-settings', settings),
  minimizeWindow: () => ipcRenderer.send('window-minimize'),
  toggleMaximizeWindow: () => ipcRenderer.send('window-toggle-maximize'),
  closeWindow: () => ipcRenderer.send('window-close'),
  listBackgrounds: () => ipcRenderer.invoke('backgrounds-list'),
  importBackgrounds: () => ipcRenderer.invoke('backgrounds-import'),
  removeBackground: (file) => ipcRenderer.invoke('backgrounds-remove', file),
  startWebLive: (id) => ipcRenderer.send('web-live-start', id),
  stopWebLive: () => ipcRenderer.send('web-live-stop'),
  onWebFrame: (callback) => ipcRenderer.on('web-frame', (_event, data) => callback(data)),
  onWebFrameEnd: (callback) => ipcRenderer.on('web-frame-end', () => callback()),
  onWebLiveEnded: (callback) => ipcRenderer.on('web-live-ended', () => callback()),
  listMedia: () => ipcRenderer.invoke('media-list'),
  importMedia: () => ipcRenderer.invoke('media-import'),
  removeMedia: (file) => ipcRenderer.invoke('media-remove', file),
  getDisplays: () => ipcRenderer.invoke('get-displays'),
  sendLiveUpdate: (payload) => ipcRenderer.send('live-update', payload),
  getLastLive: () => ipcRenderer.invoke('live-last'),
  onLiveUpdate: (callback) =>
    ipcRenderer.on('live-update', (_event, payload) => callback(payload)),
  ndiStatus: () => ipcRenderer.invoke('ndi-status'),
  setNdi: (options) => ipcRenderer.invoke('ndi-set', options),
})
