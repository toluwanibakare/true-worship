import { useState } from 'react'
import { ResourceView } from '../../shared/components/ResourceView'

/**
 * Feature: bible.
 * Owns scripture lookup. Laid out the way EasyWorship's Scriptures
 * tab is: search and the SCRIPTURES source list on the left, a table
 * of Translation, Reference and Scripture on the right, a count along
 * the bottom. Click a row to preview it; typing a reference such as
 * John 3:16 narrows the table to it. The demo library holds one
 * passage (KJV); the real version reads from bundled translations
 * (KJV, WEB) and downloadable eBible / SWORD packs held in SQLite.
 */
export function BibleLookup({
  passages,
  onOpen,
}: {
  passages: Record<string, string>
  onOpen: (reference: string, text: string) => void
}) {
  const [query, setQuery] = useState('')
  const [pickedRef, setPickedRef] = useState<string | null>(null)
  const lower = query.toLowerCase()
  const entries = Object.entries(passages)
  const visible = entries.filter(
    ([ref, text]) =>
      ref.toLowerCase().includes(lower) || text.toLowerCase().includes(lower),
  )

  return (
    <ResourceView
      query={query}
      onQuery={setQuery}
      placeholder="Search reference or text"
      sourcesTitle="Scriptures"
      sources={['KJV']}
      footer={`${visible.length} of ${entries.length} ${entries.length === 1 ? 'reference' : 'references'}`}
    >
      <table className="w-full border-collapse text-sm">
        <thead className="sticky top-0 bg-slate-200 dark:bg-slate-800">
          <tr className="text-left">
            <th className="px-3 py-1.5 font-semibold">Translation</th>
            <th className="px-3 py-1.5 font-semibold">Reference</th>
            <th className="px-3 py-1.5 font-semibold">Scripture</th>
          </tr>
        </thead>
        <tbody>
          {visible.map(([ref, text]) => (
            <tr
              key={ref}
              onClick={() => {
                setPickedRef(ref)
                onOpen(ref, text)
              }}
              className={`cursor-pointer border-t border-slate-200 dark:border-slate-800 ${
                ref === pickedRef
                  ? 'bg-slate-300 dark:bg-slate-700'
                  : 'hover:bg-slate-200 dark:hover:bg-slate-800'
              }`}
            >
              <td className="px-3 py-1.5">KJV</td>
              <td className="px-3 py-1.5 font-medium">{ref}</td>
              <td className="px-3 py-1.5 leading-relaxed">{text}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {visible.length === 0 && (
        <p className="px-3 py-4 text-sm text-slate-500">
          No passages match. Bundled translations arrive with the Bible
          packs feature.
        </p>
      )}
    </ResourceView>
  )
}
