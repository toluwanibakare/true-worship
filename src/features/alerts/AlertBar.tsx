import { useState } from 'react'
import { Button, Panel, SearchInput } from '../../shared/components/ui'
import { Marquee, type MarqueeAlert, type MarqueeSpeed } from '../../shared/components/Marquee'

/**
 * Feature: alerts.
 * Owns short messages shown over the live output, independent of the
 * schedule. The marquee scrolls across the top of the preview and the
 * projector until it is hidden. State lives in the app so it can reach
 * the second window; this panel only edits it.
 */
export function AlertBar({
  alert,
  onShow,
  onHide,
}: {
  alert: MarqueeAlert | null
  onShow: (alert: MarqueeAlert) => void
  onHide: () => void
}) {
  const [message, setMessage] = useState('')
  const [speed, setSpeed] = useState<MarqueeSpeed>('normal')

  return (
    <Panel title="Alerts" className="h-full">
      <div className="flex gap-2">
        <SearchInput
          value={message}
          onChange={setMessage}
          placeholder="Alert message..."
        />
        <select
          value={speed}
          onChange={(event) => setSpeed(event.target.value as MarqueeSpeed)}
          className="rounded-md border border-slate-700 bg-slate-800 px-2 py-1.5 text-sm text-slate-100"
          aria-label="Marquee speed"
        >
          <option value="slow">Slow</option>
          <option value="normal">Normal</option>
          <option value="fast">Fast</option>
        </select>
      </div>
      <div className="mt-2 flex gap-2">
        <Button
          primary
          onClick={() => {
            const text = message.trim()
            if (text) onShow({ text, speed })
          }}
        >
          Show marquee
        </Button>
        <Button onClick={onHide}>Hide</Button>
      </div>
      {alert && (
        <div className="mt-3 overflow-hidden rounded-md">
          <Marquee alert={alert} />
        </div>
      )}
      <p className="mt-3 text-xs text-slate-500">
        The marquee scrolls across the top of the live output until you
        hide it. It keeps scrolling even when slides change.
      </p>
    </Panel>
  )
}
