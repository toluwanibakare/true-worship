/**
 * NDI output for the Electron main process.
 *
 * Uses Grandi (modern N-API bindings for the NDI 6 SDK), loaded lazily
 * so the app keeps working on machines without it. Grandi must stay a
 * production dependency with its optional @grandi/* platform packages
 * kept, and outside any ASAR archive when packaging, or the native
 * library cannot load. See docs/ndi-setup.md.
 *
 * Pipeline: the live window is captured with webContents.capturePage(),
 * converted to a BGRA buffer, and sent as NDI video. Audio is not sent
 * in this version; the sender clocks video only.
 */

let grandi = null
let sender = null
let timer = null
let current = { enabled: false, sourceName: 'True Worship', fps: 30 }

async function loadGrandi() {
  if (grandi) return grandi
  const mod = await import('grandi')
  grandi = mod.default ?? mod
  return grandi
}

async function getStatus() {
  try {
    const lib = await loadGrandi()
    if (!lib.initialize()) {
      return {
        available: false,
        reason: 'This CPU is not supported by NDI',
        sending: sender !== null,
        sourceName: current.sourceName,
      }
    }
    return {
      available: true,
      version: lib.version(),
      sending: sender !== null,
      sourceName: current.sourceName,
    }
  } catch {
    return {
      available: false,
      reason: 'NDI library not installed (keep grandi and its optional dependencies installed)',
      sending: false,
      sourceName: current.sourceName,
    }
  }
}

async function stopCapture() {
  if (timer) {
    clearInterval(timer)
    timer = null
  }
  if (sender) {
    try {
      sender.destroy()
    } catch {
      // Already gone; stopping is what matters.
    }
    sender = null
  }
}

/**
 * Start or stop NDI sending. getWindow returns the live BrowserWindow
 * (or null when it is closed); frames are only captured while it exists.
 */
async function setNdi(options, getWindow) {
  current = { ...current, ...options }
  await stopCapture()
  if (!current.enabled) return getStatus()

  const lib = await loadGrandi()
  if (!lib.initialize()) {
    return {
      available: false,
      reason: 'This CPU is not supported by NDI',
      sending: false,
      sourceName: current.sourceName,
    }
  }
  sender = await lib.send({
    name: current.sourceName,
    clockVideo: true,
    clockAudio: false,
  })

  const intervalMs = Math.round(1000 / Math.max(1, current.fps))
  let busy = false
  timer = setInterval(async () => {
    if (busy || !sender) return
    const win = getWindow()
    if (!win || win.isDestroyed()) return
    busy = true
    try {
      const image = await win.webContents.capturePage()
      const size = image.getSize()
      const data = image.toBitmap()
      // capturePage may return device pixels on HiDPI screens while
      // getSize reports DIP size. Recover the real pixel size from the
      // buffer length instead of sending a mismatched frame.
      const pixels = data.length / 4
      const scale = Math.sqrt(pixels / (size.width * size.height))
      const width = Math.round(size.width * scale)
      const height = Math.round(size.height * scale)
      if (width * height !== pixels) return
      await sender.video({
        xres: width,
        yres: height,
        frameRateN: 30000,
        frameRateD: 1001,
        pictureAspectRatio: width / height,
        fourCC: lib.FourCC.BGRA,
        frameFormatType: lib.FrameType.Progressive,
        lineStrideBytes: width * 4,
        data,
        timecode: lib.TIMECODE_SYNTHESIZE,
      })
    } catch {
      // A failed frame must not kill the stream.
    }
    busy = false
  }, intervalMs)
  return getStatus()
}

async function destroyAll() {
  await stopCapture()
  if (grandi) {
    try {
      grandi.destroy()
    } catch {
      // App is quitting anyway.
    }
    grandi = null
  }
}

module.exports = { getStatus, setNdi, destroyAll }
