const { app, BrowserWindow, Menu, ipcMain, screen, shell } = require('electron')
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

const appIcon = path.join(__dirname, '..', 'assets', 'logo', 'object-logo.png')

/** Shortest time the splash stays up, so it reads instead of flashing. */
const SPLASH_MIN_MS = 2500
/** If the operator window never reports ready, show it anyway after this. */
const SPLASH_MAX_MS = 15000

function createSplashWindow() {
  const splash = new BrowserWindow({
    width: 640,
    height: 360,
    frame: false,
    resizable: false,
    movable: true,
    center: true,
    show: false,
    skipTaskbar: true,
    alwaysOnTop: true,
    title: 'True Worship',
    icon: appIcon,
    webPreferences: { contextIsolation: true },
  })
  splash.loadFile(path.join(__dirname, 'splash.html'), {
    query: { version: app.getVersion() },
  })
  splash.once('ready-to-show', () => splash.show())
  return splash
}

/**
 * Show the splash, load the operator window hidden behind it, then swap:
 * close the splash and open the operator window maximized.
 */
function createOperatorWindow() {
  const splash = createSplashWindow()
  const splashShownAt = Date.now()

  operatorWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    show: false,
    // The React title bar draws the window controls, menus and title.
    frame: false,
    title: 'True Worship',
    icon: appIcon,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
    },
  })
  // Links in the operator window (the GitHub repo) open in the browser,
  // never in a new Electron window.
  operatorWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https://github.com/toluwanibakare/')) {
      void shell.openExternal(url)
    }
    return { action: 'deny' }
  })
  loadOperator(operatorWindow)

  let revealed = false
  const reveal = () => {
    if (revealed) return
    revealed = true
    if (!splash.isDestroyed()) splash.close()
    if (operatorWindow && !operatorWindow.isDestroyed()) {
      operatorWindow.maximize()
      operatorWindow.show()
    }
  }
  operatorWindow.once('ready-to-show', () => {
    const wait = Math.max(0, SPLASH_MIN_MS - (Date.now() - splashShownAt))
    setTimeout(reveal, wait)
  })
  setTimeout(reveal, SPLASH_MAX_MS)

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

ipcMain.on('window-minimize', (event) => {
  BrowserWindow.fromWebContents(event.sender)?.minimize()
})

ipcMain.on('window-toggle-maximize', (event) => {
  const window = BrowserWindow.fromWebContents(event.sender)
  if (!window) return
  if (window.isMaximized()) window.unmaximize()
  else window.maximize()
})

ipcMain.on('window-close', (event) => {
  BrowserWindow.fromWebContents(event.sender)?.close()
})

ipcMain.handle('get-displays', () => listDisplays())
ipcMain.handle('ndi-status', () => ndi.getStatus())
ipcMain.handle('ndi-set', (_event, options) =>
  ndi.setNdi(options, () => liveWindow),
)

app.whenReady().then(() => {
  // The in-app title bar carries the menus, so drop the default native
  // menu (File Edit View Window Help). macOS keeps its own, which it
  // needs for the Edit shortcuts.
  if (process.platform !== 'darwin') Menu.setApplicationMenu(null)

  // If the projector is unplugged, move the live window back to the main
  // display instead of leaving it on a screen that no longer exists. The
  // screen module can only be used once the app is ready.
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
