import { useEffect, useState } from 'react'
import type { ScheduleItem, Theme } from '../../shared/lib/types'
import { Panel } from '../../shared/components/ui'
import { SlideView } from '../../shared/components/SlideView'
import { RESOURCE_MIME, decodeResource, type ResourceDrag } from '../../shared/lib/resourceDrag'

/**
 * Feature: schedule.
 * Owns the ordered service list. Each item is a row with a real preview
 * of its first slide on the left (drawn with the current theme and
 * background, the way it will look on the screen), the title next to it,
 * and a small italic notes line underneath. An item with several slides
 * expands with the arrow into a thumbnail for each slide, each with its
 * label in a blue bar; click one to select that slide. Double-clicking a
 * row sends it live.
 *
 * Items arrive by dragging a song or a verse from the library onto the
 * list: a blue line shows where it will land, and it can be dropped on
 * an empty schedule. Drag a row up or down to reorder it. The gear menu
 * in the header adds, moves and removes items, the way a schedule is
 * built during the week and reordered on Sunday morning.
 */

export function SchedulePanel({
  items,
  selectedId,
  slideIndex,
  theme,
  backgroundCss,
  layoutId,
  onSelect,
  onSelectSlide,
  onGoLiveItem,
  onAdd,
  onMoveUp,
  onMoveDown,
  onRemove,
  onEditItem,
  onDuplicateItem,
  onReorder,
  onDropResource,
  slideLabelsFor,
  previewFor,
}: {
  items: ScheduleItem[]
  selectedId: string | null
  slideIndex: number
  theme: Theme
  backgroundCss?: string
  layoutId?: string
  onSelect: (id: string) => void
  onSelectSlide: (id: string, index: number) => void
  onGoLiveItem: (id: string) => void
  onAdd: () => void
  onMoveUp: () => void
  onMoveDown: () => void
  onRemove: () => void
  /** Edit an item: a song opens the song editor, anything else the item editor. */
  onEditItem: (id: string) => void
  onDuplicateItem: (id: string) => void
  /** Move an item (by id) to sit before the item at insertIndex. */
  onReorder: (id: string, insertIndex: number) => void
  /** A song or verse dropped from the library, to go in before the item at insertIndex. */
  onDropResource: (resource: ResourceDrag, insertIndex: number) => void
  slideLabelsFor: (item: ScheduleItem) => string[]
  /** The slides an item will show, and its scripture reference if it has one. */
  previewFor: (item: ScheduleItem) => { slides: string[][]; reference?: string }
}) {
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  // The right-click menu: where it opens and which item it is for.
  const [context, setContext] = useState<{ x: number; y: number; id: string } | null>(null)
  useEffect(() => {
    if (!context) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setContext(null)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [context])
  const contextAt = context ? items.findIndex((item) => item.id === context.id) : -1
  const contextItem = contextAt >= 0 ? items[contextAt] : null
  // Drag and drop: the item being dragged (null for something from the library)
  // and the gap it would drop into (0 = before the first item, items.length =
  // after the last).
  const [dragId, setDragId] = useState<string | null>(null)
  const [dropIndex, setDropIndex] = useState<number | null>(null)
  const dragging = dragId !== null || dropIndex !== null
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

  /** True for a drag we can accept: a row of ours, or a song or verse from the library. */
  const acceptable = (event: React.DragEvent) =>
    dragId !== null || event.dataTransfer.types.includes(RESOURCE_MIME)

  /** Carry out a drop at the current gap: a reorder, or a new item from the library. */
  const drop = (event: React.DragEvent, fallbackIndex: number) => {
    event.preventDefault()
    const at = dropIndex ?? fallbackIndex
    const resource = decodeResource(event.dataTransfer.getData(RESOURCE_MIME))
    if (resource) onDropResource(resource, at)
    else if (dragId) onReorder(dragId, at)
    endDrag()
  }

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
      {/* The whole body is a drop target, so a song can be dropped after the last item or on an empty list. */}
      <div
        className="min-h-full"
        onDragOver={(event) => {
          if (!acceptable(event)) return
          event.preventDefault()
          // Below every row: the end of the list.
          if (dropIndex === null) setDropIndex(items.length)
        }}
        onDragLeave={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setDropIndex(null)
        }}
        onDrop={(event) => drop(event, items.length)}
      >
        {items.length === 0 ? (
          <p
            className={`rounded-md border-2 border-dashed px-3 py-6 text-center text-sm ${
              dragging ? 'border-blue-500 text-blue-600 dark:text-blue-400' : 'border-slate-300 text-slate-500 dark:border-slate-700'
            }`}
          >
            Drag songs and scriptures here from the library, or use the + under the
            schedule, or open a service with Ctrl + O.
          </p>
        ) : (
          <ul className="space-y-1">
            {items.map((item, itemIndex) => {
              const labels = slideLabelsFor(item)
              const preview = previewFor(item)
              const expanded = expandedId === item.id
              const selected = item.id === selectedId
              return (
                <li
                  key={item.id}
                  draggable
                  onContextMenu={(event) => {
                    event.preventDefault()
                    onSelect(item.id)
                    setContext({ x: event.clientX, y: event.clientY, id: item.id })
                  }}
                  onDragStart={(event) => {
                    event.dataTransfer.effectAllowed = 'move'
                    event.dataTransfer.setData('text/plain', item.id)
                    setDragId(item.id)
                  }}
                  onDragOver={(event) => {
                    if (!acceptable(event)) return
                    event.preventDefault()
                    event.stopPropagation()
                    const rect = event.currentTarget.getBoundingClientRect()
                    const above = event.clientY < rect.top + rect.height / 2
                    setDropIndex(above ? itemIndex : itemIndex + 1)
                  }}
                  onDrop={(event) => {
                    event.stopPropagation()
                    drop(event, itemIndex)
                  }}
                  onDragEnd={endDrag}
                  className={`rounded-md ${dragId === item.id ? 'opacity-40' : ''} ${
                    dragging && dropIndex === itemIndex
                      ? 'border-t-2 border-blue-500'
                      : dragging && dropIndex === itemIndex + 1
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
                      <SlideView
                        lines={preview.slides[0] ?? []}
                        theme={theme}
                        backgroundCss={backgroundCss}
                        layoutId={layoutId}
                        reference={preview.reference}
                        className="w-16 shrink-0 rounded border border-black/10"
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
                    <ul className="mb-1 ml-8 mt-1 space-y-1">
                      {labels.map((label, index) => {
                        const current = selected && index === slideIndex
                        return (
                          <li key={`${label}-${index}`}>
                            <button
                              type="button"
                              onClick={() => onSelectSlide(item.id, index)}
                              className={`flex w-full items-stretch gap-2 rounded-md p-1 text-left ${
                                current
                                  ? 'bg-blue-600/25 ring-1 ring-blue-500'
                                  : 'hover:bg-slate-200 dark:hover:bg-slate-800'
                              }`}
                            >
                              <SlideView
                                lines={preview.slides[index] ?? []}
                                theme={theme}
                                backgroundCss={backgroundCss}
                                layoutId={layoutId}
                                reference={preview.reference}
                                className="w-20 shrink-0 rounded-sm"
                              />
                              <span className="flex min-w-0 flex-1 items-center bg-blue-600 px-2 text-xs text-white">
                                <span className="truncate">
                                  {index + 1} · {label}
                                </span>
                              </span>
                            </button>
                          </li>
                        )
                      })}
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
      </div>
      {context && contextItem && (
        <>
          <button
            type="button"
            aria-label="Close menu"
            className="fixed inset-0 z-40 cursor-default"
            onClick={() => setContext(null)}
            onContextMenu={(event) => {
              event.preventDefault()
              setContext(null)
            }}
          />
          <div
            role="menu"
            style={{ left: Math.min(context.x, window.innerWidth - 190), top: Math.min(context.y, window.innerHeight - 230) }}
            className="fixed z-50 w-44 rounded-md border border-slate-300 bg-white py-1 text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
          >
            <button type="button" className={menuItem} onClick={() => { setContext(null); onGoLiveItem(contextItem.id) }}>
              Go Live
            </button>
            <button type="button" className={menuItem} onClick={() => { setContext(null); onEditItem(contextItem.id) }}>
              Edit…
            </button>
            <button type="button" className={menuItem} onClick={() => { setContext(null); onDuplicateItem(contextItem.id) }}>
              Duplicate
            </button>
            <button type="button" className={menuItem} disabled={contextAt === 0} onClick={() => { setContext(null); onMoveUp() }}>
              Move Up
            </button>
            <button type="button" className={menuItem} disabled={contextAt === items.length - 1} onClick={() => { setContext(null); onMoveDown() }}>
              Move Down
            </button>
            <button type="button" className={menuItem} onClick={() => { setContext(null); onRemove() }}>
              Remove
            </button>
          </div>
        </>
      )}
    </Panel>
  )
}
