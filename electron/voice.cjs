/**
 * Voice: the offline speech engine (main process only).
 * Runs whisper.cpp's server on this computer, on a local port, and turns
 * short audio clips from the operator window into text. Nothing leaves the
 * machine and no key is needed. The model (a ggml Whisper file, "base" by
 * default) and the whisper-server program are looked for in the app's own
 * folder first, then in the places another install may have left them.
 */
const { spawn } = require('node:child_process')
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')

const crypto = require('node:crypto')

const PORT = 18181
/** Words the model is nudged towards, so "Psalm 23" is not heard as "some 23". */
const PROMPT = 'Scripture reading: John 3:16, Psalm 23, Romans 8:28, 1 Corinthians 13, Genesis 1:1, Revelation 21.'

/**
 * The models the app can fetch. They are the MIT-licensed ggml Whisper files
 * published with whisper.cpp; the size and SHA-1 are checked after download.
 */
const MODELS = {
  base: {
    url: 'https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-base.bin',
    bytes: 147951465,
    sha1: '465707469ff3a37a2b9b8d8f89f2f99de7299dac',
  },
}

const exe = process.platform === 'win32' ? 'whisper-server.exe' : 'whisper-server'
/** Folder name of this platform's engine build, e.g. linux-x64, win32-x64, darwin-arm64. */
const platformDir = `${process.platform}-${process.arch}`

function firstExisting(paths) {
  return paths.find((candidate) => candidate && fs.existsSync(candidate)) ?? null
}

/**
 * The engine ships inside the installer (resources/whisper/<platform>/), built
 * by .github/workflows/whisper-engine.yml. A copy in the app's data folder wins,
 * so it can be replaced without a new installer. From source (not packaged)
 * a build in whisper/<platform>/ or an engine another app left is used.
 */
function findServer(userData, packaged) {
  return firstExisting([
    process.env.TW_WHISPER_SERVER,
    path.join(userData, 'whisper', platformDir, exe),
    path.join(process.resourcesPath ?? '', 'whisper', platformDir, exe),
    ...(packaged
      ? []
      : [
          path.join(__dirname, '..', 'whisper', platformDir, exe),
          '/opt/OpenWhispr/resources/bin/whisper-server-linux-x64',
        ]),
  ])
}

const modelDir = (userData) => path.join(userData, 'whisper-models')
const modelFile = (name) => `ggml-${name}.bin`

function findModel(userData, name) {
  return firstExisting([
    process.env.TW_WHISPER_MODEL,
    path.join(modelDir(userData), modelFile(name)),
    path.join(process.resourcesPath ?? '', 'whisper', modelFile(name)),
  ])
}

/** Whether the model for `name` is on this computer. */
function modelStatus(userData, name = 'base') {
  return { present: findModel(userData, name) !== null, model: name, bytes: MODELS[name]?.bytes ?? 0 }
}

/**
 * Downloads a model into the app's data folder, reporting progress (0 to 1),
 * then checks its size and checksum before keeping it.
 */
async function downloadModel(userData, name, onProgress) {
  const model = MODELS[name]
  if (!model) return { ok: false, error: `No model called ${name}.` }
  fs.mkdirSync(modelDir(userData), { recursive: true })
  const target = path.join(modelDir(userData), modelFile(name))
  const partial = `${target}.part`
  try {
    const res = await fetch(model.url, { redirect: 'follow' })
    if (!res.ok || !res.body) return { ok: false, error: `The download server answered ${res.status}.` }
    const total = Number(res.headers.get('content-length')) || model.bytes
    const hash = crypto.createHash('sha1')
    const out = fs.createWriteStream(partial)
    let received = 0
    for await (const chunk of res.body) {
      hash.update(chunk)
      received += chunk.length
      if (!out.write(chunk)) await new Promise((resolve) => out.once('drain', resolve))
      onProgress?.(Math.min(1, received / total))
    }
    await new Promise((resolve, reject) => out.end((error) => (error ? reject(error) : resolve())))
    if (received !== model.bytes || hash.digest('hex') !== model.sha1) {
      fs.rmSync(partial, { force: true })
      return { ok: false, error: 'The downloaded model did not match its checksum. Try again.' }
    }
    fs.renameSync(partial, target)
    return { ok: true }
  } catch (error) {
    fs.rmSync(partial, { force: true })
    return {
      ok: false,
      error: error instanceof Error ? `The download failed: ${error.message}` : 'The download failed.',
    }
  }
}

let child = null
let ready = null
let modelName = null

async function waitUntilUp(timeoutMs) {
  const until = Date.now() + timeoutMs
  while (Date.now() < until) {
    if (!child) throw new Error('The speech engine stopped while starting.')
    try {
      await fetch(`http://127.0.0.1:${PORT}/`)
      return
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 250))
    }
  }
  throw new Error('The speech engine did not start in time.')
}

/** Starts the speech engine (once). Resolves to { ok, model } or { ok: false, error }. */
function start(userData, model = 'base', packaged = false) {
  if (child && ready && modelName === model) return ready
  stop()
  const server = findServer(userData, packaged)
  if (!server) {
    return Promise.resolve({
      ok: false,
      needs: 'engine',
      error: `The speech engine for ${platformDir} is missing from this install. Reinstall True Worship.`,
    })
  }
  const weights = findModel(userData, model)
  if (!weights) {
    return Promise.resolve({
      ok: false,
      needs: 'model',
      error: 'The speech model is not on this computer yet.',
    })
  }
  modelName = model
  child = spawn(
    server,
    ['-m', weights, '--host', '127.0.0.1', '--port', String(PORT), '-t', String(Math.max(2, Math.min(6, os.cpus().length - 2))), '-l', 'en', '--prompt', PROMPT],
    { cwd: path.dirname(server), stdio: 'ignore' },
  )
  const mine = child
  mine.on('exit', () => {
    if (child === mine) {
      child = null
      ready = null
    }
  })
  ready = waitUntilUp(30000).then(
    () => ({ ok: true, model }),
    (error) => {
      stop()
      return { ok: false, error: error.message }
    },
  )
  return ready
}

function stop() {
  if (child) {
    child.kill()
    child = null
  }
  ready = null
}

/** Whisper's own markers for silence and noise are not words. */
function clean(text) {
  return text
    .replace(/\[[^\]]*\]|\([^)]*\)|\*[^*]*\*/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/** Turns a 16 kHz mono WAV clip into text. */
async function transcribe(wav) {
  if (!child || !ready) return { ok: false, error: 'The speech engine is not running.' }
  const status = await ready
  if (!status.ok) return status
  try {
    const form = new FormData()
    form.append('file', new Blob([wav], { type: 'audio/wav' }), 'clip.wav')
    form.append('response_format', 'json')
    form.append('temperature', '0')
    const res = await fetch(`http://127.0.0.1:${PORT}/inference`, { method: 'POST', body: form })
    if (!res.ok) return { ok: false, error: `The speech engine answered ${res.status}.` }
    const data = await res.json()
    return { ok: true, text: clean(String(data.text ?? '')) }
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : 'Transcription failed.' }
  }
}

module.exports = { start, stop, transcribe, modelStatus, downloadModel }
