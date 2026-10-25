import type { ScheduleItem } from '../../shared/lib/types'
import { Button, Panel } from '../../shared/components/ui'

/**
 * Feature: schedule.
 * Owns the ordered service list. A schedule item points at a song, a
 * scripture passage, a media file, or a custom slide, and the live
 * feature renders whichever item is selected here.
 */
export function SchedulePanel({
  items,
  selectedId,
  onSelect,
  onAdd,
}: {
  items: ScheduleItem[]
  selectedId: string | null
  onSelect: (id: string) => void
  onAdd: () => void
}) {
  return (
    <Panel title="Schedule" className="h-full">
      <ul className="space-y-1">
        {items.map((item) => (
          <li key={item.id}>
            <button
              type="button"
              onClick={() => onSelect(item.id)}
              className={`w-full rounded-md px-2 py-2 text-left text-sm ${
                item.id === selectedId
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-200 hover:bg-slate-800'
              }`}
            >
              <span className="block font-medium">{item.title}</span>
              <span className="text-xs opacity-70">{item.type}</span>
            </button>
          </li>
        ))}
      </ul>
      <div className="mt-3">
        <Button onClick={onAdd}>Add item</Button>
      </div>
      <p className="mt-3 text-xs text-slate-500">
        Saving and loading schedules to disk comes with the SQLite store.
      </p>
    </Panel>
  )
}
