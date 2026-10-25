import { useState } from 'react'
import { Button, Panel, SearchInput } from '../../shared/components/ui'

/**
 * Feature: bible.
 * Owns scripture lookup by reference. The list is a table the way
 * EasyWorship's scripture resource is: Translation, Reference,
 * Scripture, one row per passage, click a row to preview it. The
 * demo library holds one passage (KJV); the real version reads from
 * bundled translations (KJV, WEB) and downloadable eBible / SWORD
 * packs held in SQLite.
 */
export function BibleLookup({
  passages,
  onOpen,
}: {
  passages: Record<string, string>
  onOpen: (reference: string, text: string) => void
}) {
  const [reference, setReference] = useState('')
  const lower = reference.toLowerCase()
  const visible = Object.entries(passages).filter(
    ([ref, text]) =>
      ref.toLowerCase().includes(lower) || text.toLowerCase().includes(lower),
  )
  const exact = passages[reference.trim()]

  return (
    <Panel title="Bible" className="h-full">
      <div className="flex gap-2">
        <SearchInput
          value={reference}
          onChange={setReference}
          placeholder="Search reference or text, e.g. John 3:16"
        />
        <Button
          primary
          disabled={!exact}
          onClick={() => exact && onOpen(reference.trim(), exact)}
        >
          Show
        </Button>
      </div>
      <table className="mt-3 w-full border-collapse text-sm">
        <thead>
          <tr className="bg-slate-200 text-left dark:bg-slate-800">
            <th className="px-2 py-1.5 font-semibold">Translation</th>
            <th className="px-2 py-1.5 font-semibold">Reference</th>
            <th className="px-2 py-1.5 font-semibold">Scripture</th>
          </tr>
        </thead>
        <tbody>
          {visible.map(([ref, text]) => (
            <tr
              key={ref}
              onClick={() => onOpen(ref, text)}
              className="cursor-pointer border-t border-slate-200 hover:bg-slate-200 dark:border-slate-800 dark:hover:bg-slate-800"
            >
              <td className="px-2 py-1.5">KJV</td>
              <td className="px-2 py-1.5 font-medium">{ref}</td>
              <td className="px-2 py-1.5 leading-relaxed">{text}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {visible.length === 0 && (
        <p className="px-2 py-4 text-sm text-slate-500">
          No passages match. Bundled translations arrive with the Bible
          packs feature.
        </p>
      )}
    </Panel>
  )
}
