import { useEffect, useMemo, useRef, useState, type MouseEvent } from 'react'

/**
 * The table every resource list uses (Songs, Scriptures): compact
 * single-line rows, clickable column headers that sort (a caret marks the
 * sorted column), and a blue selected row. Only the rows on screen are
 * drawn, so a whole Bible of 31,000 verses scrolls as smoothly as a short
 * song list. Songs and Scriptures both use it, so it lives in shared.
 */
export type Column<T> = {
  key: string
  label: string
  /** CSS grid width: "90px", "30%", "1fr". */
  width: string
  value: (row: T) => string
  /** Sort by this instead of the shown text, e.g. canonical Bible order. */
  sortValue?: (row: T) => string | number
  className?: string
}

const ROW_HEIGHT = 24

export function ResourceTable<T>({
  columns,
  rows,
  rowKey,
  selectedKey,
  onSelect,
  onActivate,
  onContextMenu,
  scrollToKey,
  empty,
}: {
  columns: Column<T>[]
  rows: T[]
  rowKey: (row: T) => string
  selectedKey: string | null
  onSelect: (row: T) => void
  /** Double-click. */
  onActivate?: (row: T) => void
  onContextMenu?: (row: T, event: MouseEvent) => void
  /** Scrolls this row into view when it changes (and the rows are known). */
  scrollToKey?: string | null
  empty?: string
}) {
  const [sort, setSort] = useState<{ key: string; direction: 1 | -1 } | null>(null)
  const [scrollTop, setScrollTop] = useState(0)
  const [viewHeight, setViewHeight] = useState(300)
  const scroller = useRef<HTMLDivElement>(null)

  const sorted = useMemo(() => {
    if (!sort) return rows
    const column = columns.find((entry) => entry.key === sort.key)
    if (!column) return rows
    const by = column.sortValue ?? ((row: T) => column.value(row).toLowerCase())
    return [...rows].sort((a, b) => {
      const x = by(a)
      const y = by(b)
      return (x < y ? -1 : x > y ? 1 : 0) * sort.direction
    })
  }, [rows, columns, sort])

  // Scroll the wanted row into view. A table on a hidden tab has no size and
  // cannot scroll, so the request is kept and carried out when it is shown.
  const pendingScroll = useRef<string | null>(null)
  const applyScroll = () => {
    const element = scroller.current
    const key = pendingScroll.current
    if (!element || !key || element.clientHeight === 0) return
    const index = sortedRef.current.findIndex((row) => rowKey(row) === key)
    if (index < 0) return
    const top = index * ROW_HEIGHT
    // Leave the row a few lines below the top, not hard against the header.
    if (top < element.scrollTop || top > element.scrollTop + element.clientHeight - 2 * ROW_HEIGHT) {
      element.scrollTop = Math.max(0, top - 3 * ROW_HEIGHT)
    }
    pendingScroll.current = null
  }
  const sortedRef = useRef(sorted)
  sortedRef.current = sorted
  const applyScrollRef = useRef(applyScroll)
  applyScrollRef.current = applyScroll

  useEffect(() => {
    const element = scroller.current
    if (!element) return
    const update = () => {
      setViewHeight(element.clientHeight)
      applyScrollRef.current()
    }
    update()
    const observer = new ResizeObserver(update)
    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  // A new set of rows (a search, a different version) starts at the top.
  useEffect(() => {
    if (scroller.current) scroller.current.scrollTop = 0
  }, [rows])

  useEffect(() => {
    pendingScroll.current = scrollToKey ?? null
    applyScroll()
    // Only when the target or the rows change, not on every re-sort.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scrollToKey, sorted.length])

  const template = columns.map((column) => column.width).join(' ')
  const first = Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - 6)
  const last = Math.min(sorted.length, Math.ceil((scrollTop + viewHeight) / ROW_HEIGHT) + 6)

  const toggleSort = (key: string) =>
    setSort((current) =>
      current?.key === key
        ? current.direction === 1
          ? { key, direction: -1 }
          : null
        : { key, direction: 1 },
    )

  return (
    <div
      ref={scroller}
      onScroll={(event) => setScrollTop(event.currentTarget.scrollTop)}
      className="h-full min-h-0 overflow-auto text-[13px]"
      role="grid"
      aria-rowcount={sorted.length}
    >
      <div
        role="row"
        className="sticky top-0 z-10 grid border-b border-slate-300 bg-slate-200 font-semibold dark:border-slate-700 dark:bg-slate-800"
        style={{ gridTemplateColumns: template }}
      >
        {columns.map((column) => (
          <button
            key={column.key}
            type="button"
            role="columnheader"
            onClick={() => toggleSort(column.key)}
            title={`Sort by ${column.label}`}
            className="flex items-center gap-1 truncate px-3 py-1 text-left hover:bg-slate-300 dark:hover:bg-slate-700"
          >
            <span className="truncate">{column.label}</span>
            {sort?.key === column.key && (
              <span className="text-[9px] opacity-70">{sort.direction === 1 ? '▲' : '▼'}</span>
            )}
          </button>
        ))}
      </div>
      <div className="relative" style={{ height: sorted.length * ROW_HEIGHT }}>
        {sorted.slice(first, last).map((row, offset) => {
          const key = rowKey(row)
          const selected = key === selectedKey
          return (
            <div
              key={key}
              role="row"
              aria-selected={selected}
              onClick={() => onSelect(row)}
              onDoubleClick={() => onActivate?.(row)}
              onContextMenu={onContextMenu ? (event) => onContextMenu(row, event) : undefined}
              title={onActivate ? 'Double-click to go live' : undefined}
              className={`absolute inset-x-0 grid cursor-default items-center ${
                selected
                  ? 'bg-blue-600 text-white'
                  : 'hover:bg-slate-200 dark:hover:bg-slate-800'
              }`}
              style={{
                top: (first + offset) * ROW_HEIGHT,
                height: ROW_HEIGHT,
                gridTemplateColumns: template,
              }}
            >
              {columns.map((column) => (
                <span
                  key={column.key}
                  role="gridcell"
                  className={`truncate px-3 ${column.className ?? ''}`}
                >
                  {column.value(row)}
                </span>
              ))}
            </div>
          )
        })}
      </div>
      {sorted.length === 0 && empty && (
        <p className="px-3 py-4 text-sm text-slate-500">{empty}</p>
      )}
    </div>
  )
}
