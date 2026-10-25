import { useState } from 'react'
import type { Song, Verse } from '../../shared/lib/types'
import { Modal } from '../../shared/components/Modal'
import { Button } from '../../shared/components/ui'

/**
 * Feature: songs — the song editor.
 * A dialog for typing a new song or editing one in the library: title,
 * author, copyright, and the words as plain text. A blank line starts a
 * new slide; a line such as "Verse 2" or "Chorus" at the top of a slide
 * names it, and unnamed slides are numbered "Verse 1", "Verse 2" and so
 * on. What the words parse to is listed underneath as you type.
 */
const HEADER = /^(verse|chorus|bridge|pre-chorus|tag|intro|ending)\s*\d*\s*:?\s*$/i

function titleCase(text: string) {
  return text
    .replace(/:$/, '')
    .trim()
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
}

export function parseWords(text: string): Verse[] {
  let unnamed = 0
  return text
    .split(/\n\s*\n/)
    .map((block) =>
      block
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean),
    )
    .filter((lines) => lines.length > 0)
    .map((lines) => {
      if (HEADER.test(lines[0])) {
        return { label: titleCase(lines[0]), lines: lines.slice(1) }
      }
      unnamed += 1
      return { label: `Verse ${unnamed}`, lines }
    })
    .filter((verse) => verse.lines.length > 0)
}

function wordsOf(song: Song | null) {
  return song ? song.verses.map((verse) => `${verse.label}\n${verse.lines.join('\n')}`).join('\n\n') : ''
}

const FIELD =
  'w-full rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-900'

export function SongEditor({
  song,
  onSave,
  onClose,
}: {
  /** The song being edited, or null for a new one. */
  song: Song | null
  onSave: (draft: { title: string; author: string; copyright: string; verses: Verse[] }) => void
  onClose: () => void
}) {
  const [title, setTitle] = useState(song?.title ?? '')
  const [author, setAuthor] = useState(song?.author ?? '')
  const [copyright, setCopyright] = useState(song?.copyright ?? '')
  const [words, setWords] = useState(wordsOf(song))
  const verses = parseWords(words)
  const ready = title.trim() !== '' && verses.length > 0

  return (
    <Modal title={song ? 'Edit Song' : 'New Song'} onClose={onClose} widthClass="max-w-3xl">
      <div className="grid gap-3">
        <label className="text-sm">
          Title
          <input value={title} onChange={(event) => setTitle(event.target.value)} className={`${FIELD} mt-1`} autoFocus />
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="text-sm">
            Author
            <input value={author} onChange={(event) => setAuthor(event.target.value)} className={`${FIELD} mt-1`} />
          </label>
          <label className="text-sm">
            Copyright
            <input
              value={copyright}
              onChange={(event) => setCopyright(event.target.value)}
              placeholder="For example Public Domain"
              className={`${FIELD} mt-1`}
            />
          </label>
        </div>
        <label className="text-sm">
          Words
          <textarea
            value={words}
            onChange={(event) => setWords(event.target.value)}
            rows={12}
            placeholder={'Verse 1\nAmazing grace, how sweet the sound\nThat saved a wretch like me\n\nChorus\n...'}
            className={`${FIELD} mt-1 font-mono`}
          />
        </label>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          A blank line starts a new slide. Start a slide with a line such as
          &quot;Verse 2&quot; or &quot;Chorus&quot; to name it.
          {verses.length > 0
            ? ` ${verses.length} ${verses.length === 1 ? 'slide' : 'slides'}: ${verses.map((verse) => verse.label).join(', ')}.`
            : ''}
        </p>
        <div className="flex justify-end gap-2">
          <Button onClick={onClose}>Cancel</Button>
          <Button
            primary
            disabled={!ready}
            title={ready ? undefined : 'Add a title and some words first'}
            onClick={() => onSave({ title: title.trim(), author: author.trim(), copyright: copyright.trim(), verses })}
          >
            Save
          </Button>
        </div>
      </div>
    </Modal>
  )
}
