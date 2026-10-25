const { app, BrowserWindow, ipcMain, screen } = require('electron')
const path = require('node:path')
const ndi = require('./ndi.cjs')

const isDev = process.env.TW_DEV === '1'

let operatorWindow = null
let liveWindow = null
/** Display id the live window is currently on, for display-removed handling. */
let liveDisplayId = null

function loadOperator(window) {
  if (isDev) {
    window.loadURL('http://localhost:5173')
  } else {
    window.loadFile(path.join(__dirname, '..', 'dist', 'index.html'))
  }
}

function loadLive(window) {
  if (isDev) {
    window.loadURL('http://localhost:5173/?live=1')
  } else {
    window.loadFile(path.join(__dirname, '..', 'dist', 'index.html'), {
      query: { live: '1' },
    })
  }
}

function listDisplays() {
  return screen.getAllDisplays().map((display) => ({
    id: display.id,
    label: display.label || `Display ${display.id}`,
    x: display.bounds.x,
    y: display.bounds.y,
    width: display.bounds.width,
    height: display.bounds.height,
    scaleFactor: display.scaleFactor,
    primary: display.id === screen.getPrimaryDisplay().id,
  }))
}

/**
 * Resolve the target display: 'auto' prefers an external display and
 * falls back to the primary; a numeric id picks that display, falling
 * back to primary when it is unplugged.
 */
function resolveDisplay(displayId) {
  const displays = screen.getAllDisplays()
  const primary = screen.getPrimaryDisplay()
  if (displayId !== 'auto') {
    return displays.find((display) => display.id === displayId) ?? primary
  }
  return displays.find((display) => display.id !== primary.id) ?? primary
}

function applyToLiveWindow(settings) {
  if (!liveWindow || liveWindow.isDestroyed()) return
  const display = resolveDisplay(settings.displayId)
  liveDisplayId = display.id
  liveWindow.setBounds({
    x: display.bounds.x,
    y: display.bounds.y,
    width: display.bounds.width,
    height: display.bounds.height,
  })
  liveWindow.setFullScreen(Boolean(settings.fullscreen))
  liveWindow.setAlwaysOnTop(Boolean(settings.alwaysOnTop), 'screen-saver')
}

function createOperatorWindow() {
  operatorWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    title: 'True Worship',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
    },
  })
  loadOperator(operatorWindow)
  operatorWindow.on('closed', () => {
    operatorWindow = null
  })
}

function createLiveWindow(settings = {}) {
  if (liveWindow && !liveWindow.isDestroyed()) {
    liveWindow.focus()
    applyToLiveWindow({
      displayId: settings.displayId ?? 'auto',
      fullscreen: settings.fullscreen ?? true,
      alwaysOnTop: settings.alwaysOnTop ?? false,
    })
    return liveWindow
  }
  const display = resolveDisplay(settings.displayId ?? 'auto')
  liveDisplayId = display.id
  liveWindow = new BrowserWindow({
    x: display.bounds.x,
    y: display.bounds.y,
    width: display.bounds.width,
    height: display.bounds.height,
    title: 'True Worship — Live Output',
    fullscreen: settings.fullscreen ?? true,
    alwaysOnTop: settings.alwaysOnTop ?? false,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
    },
  })
  loadLive(liveWindow)
  liveWindow.on('closed', () => {
    liveWindow = null
    liveDisplayId = null
  })
  return liveWindow
}

ipcMain.on('open-live-window', (_event, settings) => {
  createLiveWindow(settings ?? {})
})

ipcMain.on('apply-display-settings', (_event, settings) => {
  applyToLiveWindow(settings)
})

ipcMain.on('live-update', (_event, payload) => {
  if (liveWindow && !liveWindow.isDestroyed()) {
    liveWindow.webContents.send('live-update', payload)
  }
})

ipcMain.handle('get-displays', () => listDisplays())
ipcMain.handle('ndi-status', () => ndi.getStatus())
ipcMain.handle('ndi-set', (_event, options) =>
  ndi.setNdi(options, () => liveWindow),
)

// If the projector is unplugged, move the live window back to the main
// display instead of leaving it on a screen that no longer exists.
screen.on('display-removed', () => {
  if (!liveWindow || liveWindow.isDestroyed()) return
  const stillThere = screen
    .getAllDisplays()
    .some((display) => display.id === liveDisplayId)
  if (!stillThere) {
    const primary = screen.getPrimaryDisplay()
    liveDisplayId = primary.id
    liveWindow.setBounds({ ...primary.bounds })
  }
})

app.whenReady().then(() => {
  createOperatorWindow()
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createOperatorWindow()
  })
})

app.on('before-quit', () => {
  void ndi.destroyAll()
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
