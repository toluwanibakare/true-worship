import { useEffect, useState } from 'react'
import type { NdiStatus } from '../../shared/lib/types'
import { Button, Panel, SearchInput } from '../../shared/components/ui'

/**
 * Feature: ndi.
 * Owns the NDI output: one named source on the local network that OBS,
 * vMix or any NDI receiver can pick up. The actual sending runs in the
 * Electron main process (see electron/ndi.cjs); this panel only holds
 * the switch, the source name and the status.
 */
export function NdiPanel({ bare = false }: { bare?: boolean }) {
  const [status, setStatus] = useState<NdiStatus | null>(null)
  const [sourceName, setSourceName] = useState('True Worship')
  const [fps, setFps] = useState(30)
  const isElectron = Boolean(window.electronAPI)

  const refresh = () => {
    window.electronAPI
      ?.ndiStatus()
      .then((next) => {
        setStatus(next)
        setSourceName(next.sourceName)
      })
      .catch(() => setStatus(null))
  }

  useEffect(refresh, [])

  const toggle = async (enabled: boolean) => {
    const next = await window.electronAPI?.setNdi({
      enabled,
      sourceName,
      fps,
    })
    if (next) setStatus(next)
  }

  return (
    <Panel title="NDI Output" className="h-full" bare={bare}>
      {!isElectron && (
        <p className="mb-3 text-sm text-amber-400">
          NDI output needs the desktop app. In the browser this panel is
          only a preview of the settings.
        </p>
      )}
      <label className="block text-sm text-slate-700 dark:text-slate-300">
        Source name (as it appears in OBS, vMix, Studio Monitor)
        <span className="mt-1 block">
          <SearchInput
            value={sourceName}
            onChange={setSourceName}
            placeholder="True Worship"
          />
        </span>
      </label>
      <label className="mt-3 block text-sm text-slate-700 dark:text-slate-300">
        Frame rate
        <select
          className="mt-1 block w-full rounded-md border border-slate-300 dark:border-slate-700 bg-slate-200 dark:bg-slate-800 px-2 py-1.5 text-sm"
          value={fps}
          onChange={(event) => setFps(Number(event.target.value))}
        >
          <option value={15}>15 fps (lighter on slow machines)</option>
          <option value={30}>30 fps</option>
          <option value={60}>60 fps (smoother motion backgrounds)</option>
        </select>
      </label>
      <div className="mt-4 flex gap-2">
        <Button primary onClick={() => toggle(true)}>
          Start NDI
        </Button>
        <Button onClick={() => toggle(false)}>Stop NDI</Button>
        <Button onClick={refresh}>Refresh status</Button>
      </div>
      {status && (
        <div className="mt-4 space-y-1 text-sm">
          <p className="text-slate-700 dark:text-slate-300">
            Status:{' '}
            {status.sending ? (
              <span className="text-green-400">Sending as “{status.sourceName}”</span>
            ) : status.available ? (
              <span className="text-slate-500 dark:text-slate-400">Ready, not sending</span>
            ) : (
              <span className="text-red-400">Unavailable: {status.reason}</span>
            )}
          </p>
          {status.version && (
            <p className="text-xs text-slate-500">NDI runtime: {status.version}</p>
          )}
        </div>
      )}
      <p className="mt-3 text-xs text-slate-500">
        The live window is captured and sent as video, so whatever the
        congregation sees is what the stream sees, including lyrics,
        scriptures and motion backgrounds. On Linux, NDI discovery needs
        Avahi running on the machine.
      </p>
    </Panel>
  )
}
