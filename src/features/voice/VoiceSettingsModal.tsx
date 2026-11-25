import { useEffect, useState } from 'react'
import { Modal } from '../../shared/components/Modal'
import type { VoiceSensitivity } from './useVoiceListener'

const VOICE_TRANSLATIONS = [
  { abbr: 'NKJV', name: 'New King James Version (NKJV)' },
  { abbr: 'KJV', name: 'King James Version (KJV)' },
  { abbr: 'NLT', name: 'New Living Translation (NLT)' },
  { abbr: 'NIV', name: 'New International Version (NIV)' },
  { abbr: 'ESV', name: 'English Standard Version (ESV)' },
  { abbr: 'NASB', name: 'New American Standard Bible (NASB)' },
  { abbr: 'CSB', name: 'Christian Standard Bible (CSB)' },
  { abbr: 'AMP', name: 'Amplified Bible (AMP)' },
  { abbr: 'ASV', name: 'American Standard Version (ASV)' },
  { abbr: 'BSB', name: 'Berean Standard Bible (BSB)' },
  { abbr: 'CEV', name: 'Contemporary English Version (CEV)' },
  { abbr: 'Darby', name: 'Darby Bible (1889)' },
  { abbr: 'DRC', name: 'Douay-Rheims (DRC)' },
  { abbr: 'FBV', name: 'Free Bible Version (FBV)' },
  { abbr: 'Geneva', name: 'Geneva Bible (1599)' },
  { abbr: 'GNT', name: 'Good News Translation (GNT)' },
  { abbr: 'LEB', name: 'Lexham English Bible (LEB)' },
  { abbr: 'LSV', name: 'Literal Standard Version (LSV)' },
  { abbr: 'BBE', name: 'Bible in Basic English (BBE)' },
  { abbr: 'WEB', name: 'World English Bible (WEB)' },
  { abbr: 'YLT', name: "Young's Literal Translation (YLT)" },
]

export function VoiceSettingsModal({
  mode,
  onMode,
  defaultVersion,
  onDefaultVersion,
  sensitivity,
  onSensitivity,
  liveLevel,
  isListening,
  onClose,
}: {
  mode: 'auto' | 'manual'
  onMode: (mode: 'auto' | 'manual') => void
  defaultVersion: string
  onDefaultVersion: (abbr: string) => void
  sensitivity: VoiceSensitivity
  onSensitivity: (value: VoiceSensitivity) => void
  liveLevel: number
  isListening: boolean
  onClose: () => void
}) {
  const [testingMic, setTestingMic] = useState(false)
  const [testLevel, setTestLevel] = useState(0)
  const [micError, setMicError] = useState<string | null>(null)

  useEffect(() => {
    if (!testingMic || isListening) {
      setTestLevel(0)
      return
    }
    let cancelled = false
    let stream: MediaStream | null = null
    let context: AudioContext | null = null
    let raf = 0

    ;(async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true },
        })
        if (cancelled) return
        context = new AudioContext()
        const source = context.createMediaStreamSource(stream)
        const analyser = context.createAnalyser()
        analyser.fftSize = 512
        source.connect(analyser)
        const data = new Float32Array(analyser.fftSize)
        const tick = () => {
          if (cancelled) return
          analyser.getFloatTimeDomainData(data)
          let sum = 0
          for (let i = 0; i < data.length; i += 1) sum += data[i] * data[i]
          const rms = Math.sqrt(sum / data.length)
          setTestLevel(Math.min(1, rms * 12))
          raf = requestAnimationFrame(tick)
        }
        tick()
      } catch (err) {
        if (!cancelled) {
          setMicError(err instanceof Error ? err.message : 'Could not access microphone.')
          setTestingMic(false)
        }
      }
    })()

    return () => {
      cancelled = true
      cancelAnimationFrame(raf)
      stream?.getTracks().forEach((track) => track.stop())
      void context?.close()
    }
  }, [testingMic, isListening])

  const meterLevel = isListening ? liveLevel : testLevel
  const meterPct = Math.round(meterLevel * 100)
  const meterColor =
    meterPct > 75 ? 'bg-amber-500' : meterPct > 15 ? 'bg-emerald-500' : 'bg-slate-400'

  return (
    <Modal title="Listen Settings" onClose={onClose}>
      <div className="flex flex-col gap-4 text-sm">
        <label className="flex flex-col gap-1">
          <span className="font-medium">Default voice translation</span>
          <select
            value={defaultVersion}
            onChange={(event) => onDefaultVersion(event.target.value)}
            className="rounded border border-slate-300 bg-white px-2.5 py-1.5 dark:border-slate-700 dark:bg-slate-900"
          >
            {VOICE_TRANSLATIONS.map((item) => (
              <option key={item.abbr} value={item.abbr}>
                {item.name}
              </option>
            ))}
          </select>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            Used when you call a scripture without naming a translation.
          </span>
        </label>

        <div className="flex flex-col gap-1.5">
          <span className="font-medium">Response mode</span>
          <div className="flex gap-2">
            {(['auto', 'manual'] as const).map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => onMode(value)}
                className={`rounded border px-3 py-1 text-xs font-medium capitalize ${
                  mode === value
                    ? 'border-[#1e40af] bg-[#1e40af] text-white'
                    : 'border-slate-300 text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800'
                }`}
              >
                {value}
              </button>
            ))}
          </div>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            Auto puts recognised verses live immediately; Manual waits for Go Live.
          </span>
        </div>

        <div className="flex flex-col gap-1.5">
          <span className="font-medium">Microphone sensitivity</span>
          <div className="flex gap-2">
            {(['low', 'normal', 'high'] as const).map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => onSensitivity(value)}
                className={`rounded border px-3 py-1 text-xs font-medium capitalize ${
                  sensitivity === value
                    ? 'border-[#1e40af] bg-[#1e40af] text-white'
                    : 'border-slate-300 text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800'
                }`}
              >
                {value}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-2 rounded-md border border-slate-200 p-3 dark:border-slate-800">
          <div className="flex items-center justify-between gap-2">
            <span className="font-medium">Microphone test</span>
            {!isListening ? (
              <button
                type="button"
                onClick={() => {
                  setMicError(null)
                  setTestingMic((value) => !value)
                }}
                className="rounded bg-slate-800 px-3 py-1 text-xs font-medium text-white dark:bg-slate-100 dark:text-slate-900"
              >
                {testingMic ? 'Stop test' : 'Test mic'}
              </button>
            ) : (
              <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                Live mic active
              </span>
            )}
          </div>
          <div className="h-3 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
            <div
              className={`h-full transition-all duration-75 ${meterColor}`}
              style={{ width: `${meterPct}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>
              {isListening || testingMic
                ? meterPct > 15
                  ? 'Hearing audio clearly'
                  : 'Speak into your microphone…'
                : 'Press Test mic to check your input level.'}
            </span>
            <span>{meterPct}%</span>
          </div>
          {micError && <span className="text-xs text-red-600 dark:text-red-400">{micError}</span>}
        </div>

        <div className="rounded-md border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600 dark:border-slate-800 dark:bg-slate-900/50 dark:text-slate-300">
          <p className="mb-1 font-semibold text-slate-800 dark:text-slate-100">Tips</p>
          <ul className="list-disc space-y-1 pl-4">
            <li>
              Say simplified references like <strong>“John 11:25”</strong> or{' '}
              <strong>“John 11 25”</strong> without saying “chapter” or “verse”.
            </li>
            <li>
              Call a translation by name, e.g. <strong>“John 3:16 NLT”</strong> or{' '}
              <strong>“Romans 8:28 in the NIV”</strong>.
            </li>
            <li>
              If your Bible API key is saved (under <strong>Scriptures → +</strong>), True
              Worship can fetch translations not yet downloaded from the online directory. If a
              translation is available locally, it will prompt you to download it.
            </li>
          </ul>
        </div>
      </div>
    </Modal>
  )
}
