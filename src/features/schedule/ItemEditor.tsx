import { useState } from 'react'
import type { ScheduleItem } from '../../shared/lib/types'
import { Modal } from '../../shared/components/Modal'
import { Button } from '../../shared/components/ui'

/**
 * Feature: schedule — edit a schedule item that is not a library song:
 * a scripture or a custom item such as the welcome slide. The title and
 * the words of each slide can be changed; a blank line starts the next
 * slide. Songs are edited in the song editor.
 */
const FIELD =
  'w-full rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-900'

export function ItemEditor({
  item,
  slides,
  onSave,
  onClose,
}: {
  item: ScheduleItem
  /** The slides the item shows now, one entry of lines each. */
  slides: string[][]
  onSave: (title: string, slides: string[][]) => void
  onClose: () => void
}) {
  const [title, setTitle] = useState(item.title)
  const [words, setWords] = useState(slides.map((lines) => lines.join('\n')).join('\n\n'))
  const parsed = words
    .split(/\n\s*\n/)
    .map((block) =>
      block
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean),
    )
    .filter((lines) => lines.length > 0)
  const ready = title.trim() !== '' && parsed.length > 0

  return (
    <Modal title="Edit Item" onClose={onClose} widthClass="max-w-xl">
      <div className="grid gap-3">
        <label className="text-sm">
          Title
          <input value={title} onChange={(event) => setTitle(event.target.value)} className={`${FIELD} mt-1`} autoFocus />
        </label>
        <label className="text-sm">
          Words
          <textarea
            value={words}
            onChange={(event) => setWords(event.target.value)}
            rows={10}
            className={`${FIELD} mt-1`}
          />
        </label>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          A blank line starts the next slide. {parsed.length} {parsed.length === 1 ? 'slide' : 'slides'}.
        </p>
        <div className="flex justify-end gap-2">
          <Button onClick={onClose}>Cancel</Button>
          <Button primary disabled={!ready} onClick={() => onSave(title.trim(), parsed)}>
            OK
          </Button>
        </div>
      </div>
    </Modal>
  )
}
