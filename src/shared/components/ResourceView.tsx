import type { ReactNode } from 'react'
import { SearchInput } from './ui'
import { SOURCE_ICONS } from './sourceIcons'

/**
 * The frame every resource tab shares: a search box over a
 * source list on the left (SONGS, SCRIPTURES, ...), the table on the
 * right, and a count line along the bottom. Songs, Scriptures and
 * Backgrounds use it, so it lives in shared. The source list can be
 * clickable (Backgrounds filters by group); where it is not, the first
 * source is simply the one in use.
 */
export function ResourceView({
  query,
  onQuery,
  placeholder,
  sourcesTitle,
  sources,
  activeSource,
  onSelectSource,
  footer,
  children,
}: {
  query: string
  onQuery: (value: string) => void
  placeholder: string
  sourcesTitle: string
  /** The sources on offer; the first is the one in use unless activeSource says otherwise. */
  sources: string[]
  activeSource?: string
  /** Makes the sources clickable. */
  onSelectSource?: (source: string) => void
  footer: string
  /** The table. */
  children: ReactNode
}) {
  return (
    <div className="grid h-full min-h-0 grid-cols-[200px_minmax(0,1fr)] overflow-hidden rounded-md border border-slate-300 bg-white dark:border-slate-700 dark:bg-slate-900">
      <div className="flex min-h-0 flex-col border-r border-slate-300 bg-slate-100 dark:border-slate-700 dark:bg-slate-950">
        <div className="p-2">
          <SearchInput value={query} onChange={onQuery} placeholder={placeholder} />
        </div>
        <div className="min-h-0 flex-1 overflow-auto">
          <p className="px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            {sourcesTitle}
          </p>
          {sources.map((source) => {
            const current = source === (activeSource ?? sources[0])
            const icon = SOURCE_ICONS[source]
            const label = (
              <span className="flex items-center gap-2">
                <span className="shrink-0 opacity-80">{icon}</span>
                {source}
              </span>
            )
            const style = `block w-full px-4 py-1 text-left text-sm ${
              current
                ? 'bg-slate-300 dark:bg-slate-700'
                : 'text-slate-700 dark:text-slate-300'
            }`
            return onSelectSource ? (
              <button
                key={source}
                type="button"
                onClick={() => onSelectSource(source)}
                className={`${style} ${current ? '' : 'hover:bg-slate-200 dark:hover:bg-slate-800'}`}
              >
                {label}
              </button>
            ) : (
              <div key={source} className={style}>
                {label}
              </div>
            )
          })}
        </div>
      </div>
      <div className="flex min-h-0 flex-col">
        <div className="min-h-0 flex-1 overflow-auto">{children}</div>
        <p className="shrink-0 border-t border-slate-300 py-1 text-center text-xs text-slate-500 dark:border-slate-700 dark:text-slate-400">
          {footer}
        </p>
      </div>
    </div>
  )
}
