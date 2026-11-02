import { useEffect, useRef, useState } from 'react'

/**
 * Feature: voice — the microphone.
 * Listens while `active`, cuts the sound at pauses into phrases, sends each
 * phrase (16 kHz mono WAV) to the offline speech engine in the main
 * process, and hands back the text. Nothing is recorded to disk and
 * nothing leaves this computer.
 */
const SAMPLE_RATE = 16000
const MIN_SPEECH_MS = 350
const PAUSE_MS = 700
const MAX_PHRASE_MS = 12000
const PRE_ROLL_MS = 300

function wavOf(samples: Float32Array): ArrayBuffer {
  const buffer = new ArrayBuffer(44 + samples.length * 2)
  const view = new DataView(buffer)
  const write = (offset: number, text: string) =>
    [...text].forEach((char, i) => view.setUint8(offset + i, char.charCodeAt(0)))
  write(0, 'RIFF')
  view.setUint32(4, 36 + samples.length * 2, true)
  write(8, 'WAVEfmt ')
  view.setUint32(16, 16, true)
  view.setUint16(20, 1, true)
  view.setUint16(22, 1, true)
  view.setUint32(24, SAMPLE_RATE, true)
  view.setUint32(28, SAMPLE_RATE * 2, true)
  view.setUint16(32, 2, true)
  view.setUint16(34, 16, true)
  write(36, 'data')
  view.setUint32(40, samples.length * 2, true)
  samples.forEach((sample, i) => {
    const clipped = Math.max(-1, Math.min(1, sample))
    view.setInt16(44 + i * 2, clipped < 0 ? clipped * 0x8000 : clipped * 0x7fff, true)
  })
  return buffer
}

export type VoiceState = 'off' | 'starting' | 'listening' | 'error'

export function useVoiceListener(active: boolean, onText: (text: string) => void, attempt = 0) {
  const [state, setState] = useState<VoiceState>('off')
  const [needsModel, setNeedsModel] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [level, setLevel] = useState(0)
  const [busy, setBusy] = useState(false)
  const onTextRef = useRef(onText)
  onTextRef.current = onText

  useEffect(() => {
    if (!active) {
      setState('off')
      return
    }
    let cancelled = false
    let stream: MediaStream | null = null
    let context: AudioContext | null = null
    let node: ScriptProcessorNode | null = null
    let source: MediaStreamAudioSourceNode | null = null
    setState('starting')
    setError(null)
    setNeedsModel(false)

    const queue: Float32Array[] = []
    let working = false
    const drain = async () => {
      if (working) return
      working = true
      setBusy(true)
      while (queue.length > 0 && !cancelled) {
        const clip = queue.shift() as Float32Array
        const result = await window.electronAPI?.voiceTranscribe(wavOf(clip))
        if (cancelled) break
        if (result?.ok && result.text) onTextRef.current(result.text)
        else if (result && !result.ok) {
          setError(result.error ?? 'The speech engine failed.')
          setState('error')
        }
      }
      working = false
      setBusy(false)
    }

    ;(async () => {
      try {
        const api = window.electronAPI
        if (!api?.voiceStart) throw new Error('Voice needs the desktop app.')
        const engine = await api.voiceStart('base')
        if (!engine.ok) {
          if (engine.needs === 'model' && !cancelled) setNeedsModel(true)
          throw new Error(engine.error ?? 'The speech engine did not start.')
        }
        if (cancelled) return
        stream = await navigator.mediaDevices.getUserMedia({
          audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true },
        })
        if (cancelled) return
        context = new AudioContext({ sampleRate: SAMPLE_RATE })
        source = context.createMediaStreamSource(stream)
        node = context.createScriptProcessor(4096, 1, 1)
        const mute = context.createGain()
        mute.gain.value = 0
        source.connect(node)
        node.connect(mute)
        mute.connect(context.destination)

        const ms = (samples: number) => (samples / SAMPLE_RATE) * 1000
        let noise = 0.01
        let speaking = false
        let phrase: Float32Array[] = []
        let preRoll: Float32Array[] = []
        let speechSamples = 0
        let silentSamples = 0

        const flush = () => {
          const total = phrase.reduce((sum, part) => sum + part.length, 0)
          if (ms(speechSamples) >= MIN_SPEECH_MS && total > 0) {
            const clip = new Float32Array(total)
            let at = 0
            for (const part of phrase) {
              clip.set(part, at)
              at += part.length
            }
            if (queue.length < 3) queue.push(clip)
            void drain()
          }
          phrase = []
          speechSamples = 0
          silentSamples = 0
          speaking = false
        }

        node.onaudioprocess = (event) => {
          const input = event.inputBuffer.getChannelData(0)
          const chunk = new Float32Array(input)
          let sum = 0
          for (const value of chunk) sum += value * value
          const rms = Math.sqrt(sum / chunk.length)
          setLevel(Math.min(1, rms * 12))
          const threshold = Math.max(0.012, noise * 3)
          if (rms > threshold) {
            if (!speaking) {
              speaking = true
              phrase = [...preRoll]
            }
            phrase.push(chunk)
            speechSamples += chunk.length
            silentSamples = 0
          } else {
            noise = noise * 0.95 + rms * 0.05
            if (speaking) {
              phrase.push(chunk)
              silentSamples += chunk.length
              if (ms(silentSamples) >= PAUSE_MS) flush()
            } else {
              preRoll.push(chunk)
              while (ms(preRoll.reduce((sum2, part) => sum2 + part.length, 0)) > PRE_ROLL_MS) preRoll.shift()
            }
          }
          if (speaking && ms(phrase.reduce((sum2, part) => sum2 + part.length, 0)) >= MAX_PHRASE_MS) flush()
        }
        setState('listening')
      } catch (err) {
        if (cancelled) return
        const denied = err instanceof DOMException && err.name === 'NotAllowedError'
        setError(denied ? 'The microphone is blocked. Allow it for True Worship and try again.' : err instanceof Error ? err.message : 'Could not start listening.')
        setState('error')
      }
    })()

    return () => {
      cancelled = true
      if (node) node.onaudioprocess = null
      node?.disconnect()
      source?.disconnect()
      stream?.getTracks().forEach((track) => track.stop())
      void context?.close()
      void window.electronAPI?.voiceStop()
      setLevel(0)
      setBusy(false)
    }
  }, [active, attempt])

  return { state, error, level, busy, needsModel }
}
