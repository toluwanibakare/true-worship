import type { ScheduleItem } from '../../shared/lib/types'
import { Button, Panel } from '../../shared/components/ui'

/**
 * Feature: schedule.
 * Owns the ordered service list, EasyWorship-style: one row per item
 * with a coloured type mark, title, and type line underneath, the
 * selected row in blue. The toolbar above the list moves and removes
 * the selected item, the way a schedule is actually built during the
 * week and reordered on Sunday morning.
 */

const TYPE_STYLE: Record<ScheduleItem['type'], string> = {
  song: 'bg-blue-600',
  scripture: 'bg-violet-600',
  media: 'bg-emerald-600',
  custom: 'bg-slate-500',
}

const TYPE_LETTER: Record<ScheduleItem['type'], string> = {
  song: 'S',
  scripture: 'B',
  media: 'M',
  custom: 'C',
}

export function SchedulePanel({
  items,
  selectedId,
  onSelect,
  onAdd,
  onMoveUp,
  onMoveDown,
  onRemove,
}: {
  items: ScheduleItem[]
  selectedId: string | null
  onSelect: (id: string) => void
  onAdd: () => void
  onMoveUp: () => void
  onMoveDown: () => void
  onRemove: () => void
}) {
  return (
    <Panel title="Schedule" className="h-full">
      <div className="mb-2 flex flex-wrap gap-1">
        <Button onClick={onAdd}>Add item</Button>
        <Button onClick={onMoveUp}>↑</Button>
        <Button onClick={onMoveDown}>↓</Button>
        <Button onClick={onRemove}>Remove</Button>
      </div>
      <ul className="space-y-1">
        {items.map((item) => (
          <li key={item.id}>
            <button
              type="button"
              onClick={() => onSelect(item.id)}
              className={`flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm ${
                item.id === selectedId
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-800 hover:bg-slate-200 dark:text-slate-200 dark:hover:bg-slate-800'
              }`}
            >
              <span
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded text-sm font-bold text-white ${TYPE_STYLE[item.type]}`}
              >
                {TYPE_LETTER[item.type]}
              </span>
              <span className="min-w-0">
                <span className="block truncate font-medium">{item.title}</span>
                <span className="block text-xs opacity-70">
                  {item.type}
                  {item.ref ? ` · ${item.ref}` : ''}
                </span>
              </span>
            </button>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-xs text-slate-500">
        Saving and loading schedules to disk comes with the SQLite store.
      </p>
    </Panel>
  )
}
