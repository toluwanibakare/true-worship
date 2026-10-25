const { app, BrowserWindow, ipcMain } = require('electron')
const path = require('node:path')

const isDev = process.env.TW_DEV === '1'

let operatorWindow = null
let liveWindow = null

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

function createLiveWindow() {
  if (liveWindow && !liveWindow.isDestroyed()) {
    liveWindow.focus()
    return liveWindow
  }
  liveWindow = new BrowserWindow({
    width: 1280,
    height: 720,
    title: 'True Worship — Live Output',
    fullscreen: true,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
    },
  })
  loadLive(liveWindow)
  liveWindow.on('closed', () => {
    liveWindow = null
  })
  return liveWindow
}

ipcMain.on('open-live-window', () => {
  createLiveWindow()
})

ipcMain.on('live-update', (_event, payload) => {
  if (liveWindow && !liveWindow.isDestroyed()) {
    liveWindow.webContents.send('live-update', payload)
  }
})

app.whenReady().then(() => {
  createOperatorWindow()
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createOperatorWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
