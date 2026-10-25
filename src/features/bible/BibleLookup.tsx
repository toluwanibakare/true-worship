import { useState } from 'react'
import { Button, Panel, SearchInput } from '../../shared/components/ui'

/**
 * Feature: bible.
 * Owns scripture lookup by reference. The demo library holds one passage;
 * the real version reads from bundled translations (KJV, WEB) and
 * downloadable eBible / SWORD packs held in SQLite.
 */
export function BibleLookup({
  passages,
  onOpen,
}: {
  passages: Record<string, string>
  onOpen: (reference: string, text: string) => void
}) {
  const [reference, setReference] = useState('John 3:16')
  const text = passages[reference.trim()]

  return (
    <Panel title="Bible" className="h-full">
      <div className="flex gap-2">
        <SearchInput
          value={reference}
          onChange={setReference}
          placeholder="e.g. John 3:16"
        />
        <Button
          primary
          onClick={() => text && onOpen(reference.trim(), text)}
        >
          Show
        </Button>
      </div>
      {text ? (
        <p className="mt-3 text-sm leading-relaxed text-slate-800 dark:text-slate-200">{text}</p>
      ) : (
        <p className="mt-3 text-sm text-slate-500">
          Not in the demo library yet. Bundled translations arrive with the
          Bible packs feature.
        </p>
      )}
    </Panel>
  )
}
