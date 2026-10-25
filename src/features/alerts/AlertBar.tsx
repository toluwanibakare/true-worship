import { useState } from 'react'
import { Button, Panel, SearchInput } from '../../shared/components/ui'

/**
 * Feature: alerts.
 * Owns short messages shown over the live output, independent of the
 * schedule. State lives here for now; it moves to the app store once
 * alerts need to reach the second window.
 */
export function AlertBar() {
  const [message, setMessage] = useState('')
  const [shown, setShown] = useState<string | null>(null)

  return (
    <Panel title="Alerts" className="h-full">
      <div className="flex gap-2">
        <SearchInput
          value={message}
          onChange={setMessage}
          placeholder="Alert message..."
        />
        <Button
          primary
          onClick={() => {
            setShown(message.trim() || null)
            setMessage('')
          }}
        >
          Show
        </Button>
        <Button onClick={() => setShown(null)}>Hide</Button>
      </div>
      {shown && (
        <p className="mt-3 rounded-md bg-amber-500 px-3 py-2 text-sm font-medium text-black">
          {shown}
        </p>
      )}
    </Panel>
  )
}
