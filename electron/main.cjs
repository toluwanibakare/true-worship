const {
  app,
  BrowserWindow,
  Menu,
  dialog,
  ipcMain,
  net,
  protocol,
  screen,
  shell,
} = require('electron')
const fs = require('node:fs')
const path = require('node:path')
const { pathToFileURL } = require('node:url')
const ndi = require('./ndi.cjs')

const isDev = process.env.TW_DEV === '1'

let operatorWindow = null
let liveWindow = null
/** The display settings the live window was last given, re-applied when screens change. */
let liveSettings = { displayId: 'auto', fullscreen: true, alwaysOnTop: false }
/** True while the live window is a normal window because no projector is connected. */
let liveWindowed = false

// Backgrounds the user adds live in userData and are served to both
// windows through this scheme, so a path never has to leave the folder.
protocol.registerSchemesAsPrivileged([
  {
    scheme: 'tw-media',
    privileges: { standard: true, secure: true, supportFetchAPI: true, stream: true },
  },
])

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

/**
 * With no projector connected the only screen is the operator's own,
 * and filling it would cover the app. So unless the user picked this
 * exact display on purpose, a live output that would land on the
 * primary screen opens as a normal window instead.
 */
function shouldBeWindowed(settings) {
  const primary = screen.getPrimaryDisplay()
  const display = resolveDisplay(settings.displayId)
  return display.id === primary.id && settings.displayId !== primary.id
}

function applyToLiveWindow(settings) {
  if (!liveWindow || liveWindow.isDestroyed()) return
  liveSettings = { ...liveSettings, ...settings }
  const display = resolveDisplay(liveSettings.displayId)

  if (shouldBeWindowed(liveSettings)) {
    liveWindow.setAlwaysOnTop(false)
    liveWindow.setFullScreen(false)
    // Place it once; after that the operator can move and resize it.
    if (!liveWindowed) {
      const area = display.workArea
      const width = 960
      const height = 540
      liveWindow.setBounds({
        x: Math.round(area.x + (area.width - width) / 2),
        y: Math.round(area.y + (area.height - height) / 2),
        width,
        height,
      })
    }
    liveWindowed = true
    return
  }

  liveWindowed = false
  liveWindow.setBounds({
    x: display.bounds.x,
    y: display.bounds.y,
    width: display.bounds.width,
    height: display.bounds.height,
  })
  liveWindow.setFullScreen(Boolean(liveSettings.fullscreen))
  liveWindow.setAlwaysOnTop(Boolean(liveSettings.alwaysOnTop), 'screen-saver')
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
  const wanted = {
    displayId: settings.displayId ?? 'auto',
    fullscreen: settings.fullscreen ?? true,
    alwaysOnTop: settings.alwaysOnTop ?? false,
  }
  if (liveWindow && !liveWindow.isDestroyed()) {
    applyToLiveWindow(wanted)
    // Bring it forward without taking the keyboard from the operator.
    if (liveWindow.isMinimized()) liveWindow.restore()
    liveWindow.showInactive()
    return liveWindow
  }
  liveSettings = wanted
  liveWindowed = false
  liveWindow = new BrowserWindow({
    width: 960,
    height: 540,
    show: false,
    backgroundColor: '#000000',
    title: 'True Worship — Live Output',
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
    },
  })
  loadLive(liveWindow)
  liveWindow.once('ready-to-show', () => {
    applyToLiveWindow(wanted)
    // Showing it must not steal focus, or the operator's shortcuts stop working.
    liveWindow.showInactive()
  })
  liveWindow.on('closed', () => {
    liveWindow = null
    liveWindowed = false
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

const IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp']
const VIDEO_EXTENSIONS = ['mp4', 'webm', 'm4v', 'mov']

function backgroundsDir() {
  const dir = path.join(app.getPath('userData'), 'backgrounds')
  fs.mkdirSync(dir, { recursive: true })
  return dir
}

function describeBackground(file) {
  const extension = path.extname(file).slice(1).toLowerCase()
  return {
    file,
    // Stored as <time>-<n>-<original name>; show the original name.
    name: path.basename(file, path.extname(file)).replace(/^\d+-\d+-/, ''),
    kind: VIDEO_EXTENSIONS.includes(extension) ? 'video' : 'still',
    url: `tw-media://bg/${encodeURIComponent(file)}`,
  }
}

ipcMain.handle('backgrounds-list', () =>
  fs
    .readdirSync(backgroundsDir())
    .filter((file) =>
      [...IMAGE_EXTENSIONS, ...VIDEO_EXTENSIONS].includes(path.extname(file).slice(1).toLowerCase()),
    )
    .sort()
    .map(describeBackground),
)

ipcMain.handle('backgrounds-import', async (event) => {
  const window = BrowserWindow.fromWebContents(event.sender)
  const result = await dialog.showOpenDialog(window, {
    title: 'Add backgrounds',
    properties: ['openFile', 'multiSelect'],
    filters: [
      { name: 'Images and videos', extensions: [...IMAGE_EXTENSIONS, ...VIDEO_EXTENSIONS] },
    ],
  })
  if (result.canceled) return []
  const stamp = Date.now()
  return result.filePaths.map((source, index) => {
    const safeName = path.basename(source).replace(/[^\w.\- ]+/g, '_')
    const file = `${stamp}-${index}-${safeName}`
    fs.copyFileSync(source, path.join(backgroundsDir(), file))
    return describeBackground(file)
  })
})

ipcMain.handle('backgrounds-remove', (_event, file) => {
  const target = path.join(backgroundsDir(), path.basename(String(file)))
  if (fs.existsSync(target)) fs.unlinkSync(target)
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

  // Re-place the live window when a screen is plugged in or removed: a
  // projector that appears takes the output, and one that disappears
  // drops it back to a window instead of covering the operator. The
  // screen module can only be used once the app is ready.
  screen.on('display-added', () => applyToLiveWindow(liveSettings))
  screen.on('display-removed', () => applyToLiveWindow(liveSettings))

  // Serve user-added backgrounds from userData (see backgroundsDir).
  protocol.handle('tw-media', (request) => {
    const file = path.basename(decodeURIComponent(new URL(request.url).pathname))
    return net.fetch(pathToFileURL(path.join(backgroundsDir(), file)).toString(), {
      headers: request.headers,
    })
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
