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
  searchFields,
  searchField,
  onSearchField,
  onSearchSubmit,
  sourcesTitle,
  sources,
  activeSource,
  onSelectSource,
  footer,
  sideFooter,
  children,
}: {
  query: string
  onQuery: (value: string) => void
  placeholder: string
  /** Fields the search can be limited to ("Any Field" first); adds a field menu to the search box. */
  searchFields?: string[]
  searchField?: string
  onSearchField?: (field: string) => void
  /** Called when Enter is pressed in the search box. */
  onSearchSubmit?: () => void
  sourcesTitle: string
  /** The sources on offer; the first is the one in use unless activeSource says otherwise. */
  sources: string[]
  activeSource?: string
  /** Makes the sources clickable. */
  onSelectSource?: (source: string) => void
  footer: string
  /** Optional action row at the bottom of the side panel. */
  sideFooter?: ReactNode
  /** The table. */
  children: ReactNode
}) {
  return (
    <div className="grid h-full min-h-0 grid-cols-[200px_minmax(0,1fr)] overflow-hidden rounded-md border border-slate-300 bg-white dark:border-slate-700 dark:bg-slate-900">
      <div className="flex min-h-0 flex-col border-r border-slate-300 bg-slate-100 dark:border-slate-700 dark:bg-slate-950">
        <div className="p-2">
          {searchFields && onSearchField ? (
            <div className="flex items-center rounded-md border border-slate-300 bg-slate-200 pl-1.5 dark:border-slate-700 dark:bg-slate-800">
              <span className="relative flex shrink-0 items-center gap-0.5 text-slate-500 dark:text-slate-400" title={`Search field: ${searchField ?? searchFields[0]}`}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                  <circle cx="11" cy="11" r="7" />
                  <path d="M20 20l-4-4" />
                </svg>
                <span className="text-[8px]">▼</span>
                <select
                  aria-label="Search field"
                  value={searchField ?? searchFields[0]}
                  onChange={(event) => onSearchField(event.target.value)}
                  className="absolute inset-0 w-full cursor-pointer opacity-0"
                >
                  {searchFields.map((field) => (
                    <option key={field} value={field}>
                      {field}
                    </option>
                  ))}
                </select>
              </span>
              <input
                type="text"
                value={query}
                onChange={(event) => onQuery(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') onSearchSubmit?.()
                }}
                placeholder={placeholder}
                className="min-w-0 flex-1 bg-transparent px-1.5 py-1.5 text-sm text-slate-900 outline-none placeholder:text-slate-400 dark:text-slate-100 dark:placeholder:text-slate-500"
              />
              {query && (
                <button
                  type="button"
                  aria-label="Clear search"
                  onClick={() => onQuery('')}
                  className="mr-1 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-slate-400 text-[10px] leading-none text-white hover:bg-slate-500 dark:bg-slate-600"
                >
                  ×
                </button>
              )}
            </div>
          ) : (
            <SearchInput value={query} onChange={onQuery} placeholder={placeholder} />
          )}
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
                {icon && <span className="shrink-0 opacity-80">{icon}</span>}
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
        {sideFooter && (
          <div className="flex shrink-0 justify-end border-t border-slate-300 px-2 py-1.5 dark:border-slate-700">
            {sideFooter}
          </div>
        )}
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
