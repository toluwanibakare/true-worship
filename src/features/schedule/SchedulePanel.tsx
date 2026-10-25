import { useState } from 'react'
import type { ScheduleItem } from '../../shared/lib/types'
import { Panel } from '../../shared/components/ui'

/**
 * Feature: schedule.
 * Owns the ordered service list, arranged the way EasyWorship
 * arranges its schedule: one row per item with a thumbnail on the
 * left, the title next to it, and a notes line underneath (the type
 * and reference, in EasyWorship's small italic notes style). Songs
 * expand with the arrow to show their slides, and clicking a slide
 * selects it in the preview. Double-clicking a row sends it live.
 * Drag a row up or down to reorder it; a blue line shows where it
 * will land. The selected row is blue. The gear menu in the header adds, moves
 * and removes items, the way a schedule is actually built during the
 * week and reordered on Sunday morning.
 */

const THUMBNAIL: Record<ScheduleItem['type'], string> = {
  song: 'linear-gradient(135deg, #1e40af, #0f172a)',
  scripture: 'linear-gradient(135deg, #7c3aed, #312e81)',
  media: 'linear-gradient(135deg, #059669, #064e3b)',
  custom: 'linear-gradient(135deg, #64748b, #334155)',
}

export function SchedulePanel({
  items,
  selectedId,
  slideIndex,
  onSelect,
  onSelectSlide,
  onGoLiveItem,
  onAdd,
  onMoveUp,
  onMoveDown,
  onRemove,
  onReorder,
  slideLabelsFor,
}: {
  items: ScheduleItem[]
  selectedId: string | null
  slideIndex: number
  onSelect: (id: string) => void
  onSelectSlide: (id: string, index: number) => void
  onGoLiveItem: (id: string) => void
  onAdd: () => void
  onMoveUp: () => void
  onMoveDown: () => void
  onRemove: () => void
  /** Move an item (by id) to sit before the item at insertIndex. */
  onReorder: (id: string, insertIndex: number) => void
  slideLabelsFor: (item: ScheduleItem) => string[]
}) {
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  // Drag and drop: the item being dragged and the gap it would drop into
  // (0 = before the first item, items.length = after the last).
  const [dragId, setDragId] = useState<string | null>(null)
  const [dropIndex, setDropIndex] = useState<number | null>(null)
  const endDrag = () => {
    setDragId(null)
    setDropIndex(null)
  }
  const run = (action: () => void) => () => {
    setMenuOpen(false)
    action()
  }
  const menuItem =
    'block w-full px-3 py-1.5 text-left text-sm hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent dark:hover:bg-slate-800'

  const gear = (
    <div className="relative">
      <button
        type="button"
        aria-label="Schedule actions"
        title="Schedule actions"
        onClick={() => setMenuOpen((open) => !open)}
        className="rounded px-1.5 text-base leading-none text-slate-600 hover:bg-slate-300 dark:text-slate-300 dark:hover:bg-slate-700"
      >
        ⚙
      </button>
      {menuOpen && (
        <>
          <button
            type="button"
            aria-label="Close menu"
            className="fixed inset-0 z-40 cursor-default"
            onClick={() => setMenuOpen(false)}
          />
          <div className="absolute right-0 top-full z-50 mt-1 w-44 rounded-md border border-slate-300 bg-white py-1 text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100">
            <button type="button" className={menuItem} onClick={run(onAdd)}>
              Add Item
            </button>
            <button type="button" className={menuItem} disabled={!selectedId} onClick={run(onMoveUp)}>
              Move Item Up
            </button>
            <button type="button" className={menuItem} disabled={!selectedId} onClick={run(onMoveDown)}>
              Move Item Down
            </button>
            <button type="button" className={menuItem} disabled={!selectedId} onClick={run(onRemove)}>
              Remove Item
            </button>
          </div>
        </>
      )}
    </div>
  )

  return (
    <Panel title="Schedule" className="h-full" actions={gear}>
      {items.length === 0 ? (
        <p className="text-sm text-slate-500">
          No items yet. Add one, or open a service with Ctrl + O.
        </p>
      ) : (
        <ul className="space-y-1">
          {items.map((item) => {
            const labels = slideLabelsFor(item)
            const expanded = expandedId === item.id
            const selected = item.id === selectedId
            return (
              <li
                key={item.id}
                draggable
                onDragStart={(event) => {
                  event.dataTransfer.effectAllowed = 'move'
                  event.dataTransfer.setData('text/plain', item.id)
                  setDragId(item.id)
                }}
                onDragOver={(event) => {
                  if (!dragId) return
                  event.preventDefault()
                  const rect = event.currentTarget.getBoundingClientRect()
                  const above = event.clientY < rect.top + rect.height / 2
                  const index = items.findIndex((entry) => entry.id === item.id)
                  setDropIndex(above ? index : index + 1)
                }}
                onDrop={(event) => {
                  event.preventDefault()
                  if (dragId && dropIndex !== null) onReorder(dragId, dropIndex)
                  endDrag()
                }}
                onDragEnd={endDrag}
                className={`rounded-md ${dragId === item.id ? 'opacity-40' : ''} ${
                  dragId && dropIndex === items.indexOf(item)
                    ? 'border-t-2 border-blue-500'
                    : dragId && dropIndex === items.indexOf(item) + 1
                      ? 'border-b-2 border-blue-500'
                      : 'border-y-2 border-transparent'
                }`}
              >
                <div className="flex items-center gap-1">
                  {labels.length > 1 ? (
                    <button
                      type="button"
                      aria-label={expanded ? 'Collapse slides' : 'Expand slides'}
                      onClick={() => {
                        onSelect(item.id)
                        setExpandedId(expanded ? null : item.id)
                      }}
                      className="w-5 shrink-0 rounded text-center text-sm text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800"
                    >
                      {expanded ? '▾' : '▸'}
                    </button>
                  ) : (
                    <span className="w-5 shrink-0" />
                  )}
                  <button
                    type="button"
                    onClick={() => onSelect(item.id)}
                    onDoubleClick={() => onGoLiveItem(item.id)}
                    title="Double-click to go live, drag to reorder"
                    className={`flex min-w-0 flex-1 items-center gap-2 rounded-md px-2 py-2 text-left text-sm ${
                      selected
                        ? 'bg-blue-600 text-white'
                        : 'text-slate-800 hover:bg-slate-200 dark:text-slate-200 dark:hover:bg-slate-800'
                    }`}
                  >
                    <span
                      className="h-9 w-16 shrink-0 rounded border border-black/10"
                      style={{ background: THUMBNAIL[item.type] }}
                    />
                    <span className="min-w-0">
                      <span className="block truncate font-medium">{item.title}</span>
                      <span className="block truncate text-xs italic opacity-70">
                        {item.type}
                        {item.ref ? ` · ${item.ref}` : ''}
                      </span>
                    </span>
                  </button>
                </div>
                {expanded && (
                  <ul className="mb-1 ml-12 space-y-0.5">
                    {labels.map((label, index) => (
                      <li key={`${label}-${index}`}>
                        <button
                          type="button"
                          onClick={() => onSelectSlide(item.id, index)}
                          className={`block w-full rounded-md px-2 py-1 text-left text-sm ${
                            selected && index === slideIndex
                              ? 'bg-blue-500 text-white'
                              : 'text-slate-700 hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-slate-800'
                          }`}
                        >
                          {label}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            )
          })}
        </ul>
      )}
      <p className="mt-3 text-xs text-slate-500">
        {items.length} {items.length === 1 ? 'item' : 'items'} in this schedule.
      </p>
    </Panel>
  )
}
