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

const PORT = 18181
/** Words the model is nudged towards, so "Psalm 23" is not heard as "some 23". */
const PROMPT = 'Scripture reading: John 3:16, Psalm 23, Romans 8:28, 1 Corinthians 13, Genesis 1:1, Revelation 21.'

const exe = process.platform === 'win32' ? 'whisper-server.exe' : 'whisper-server'

function firstExisting(paths) {
  return paths.find((candidate) => candidate && fs.existsSync(candidate)) ?? null
}

function findServer(userData) {
  return firstExisting([
    process.env.TW_WHISPER_SERVER,
    path.join(userData, 'whisper', exe),
    path.join(process.resourcesPath ?? '', 'whisper', exe),
    path.join(__dirname, '..', 'whisper', exe),
    '/opt/OpenWhispr/resources/bin/whisper-server-linux-x64',
  ])
}

function findModel(userData, name) {
  const file = `ggml-${name}.bin`
  return firstExisting([
    process.env.TW_WHISPER_MODEL,
    path.join(userData, 'whisper-models', file),
    path.join(process.resourcesPath ?? '', 'whisper', file),
    path.join(os.homedir(), '.cache', 'openwhispr', 'whisper-models', file),
  ])
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
function start(userData, model = 'base') {
  if (child && ready && modelName === model) return ready
  stop()
  const server = findServer(userData)
  if (!server) {
    return Promise.resolve({
      ok: false,
      error: `The speech engine (${exe}) was not found. Put it in ${path.join(userData, 'whisper')}.`,
    })
  }
  const weights = findModel(userData, model)
  if (!weights) {
    return Promise.resolve({
      ok: false,
      error: `The Whisper model ggml-${model}.bin was not found. Put it in ${path.join(userData, 'whisper-models')}.`,
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

module.exports = { start, stop, transcribe }
