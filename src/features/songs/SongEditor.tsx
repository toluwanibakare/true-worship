import { useEffect, useRef, useState } from 'react'
import type { Song, Theme, Verse } from '../../shared/lib/types'
import { SlideView } from '../../shared/components/SlideView'

/**
 * Feature: songs — the song editor.
 * A full-window editor for a new song or one in the library, arranged
 * the way operators expect: title across the top, the song's blocks in
 * a list on the left (Words, Slides and Masters tabs) and a large slide
 * preview on the right with a zoom slider. Each block is a named part
 * (Verse 1, Chorus...) with its lines; pasting several paragraphs
 * splits them into blocks. OK saves to the library, Cancel and Esc
 * close without saving.
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

type Block = { key: number; label: string; text: string; style?: Verse['style'] }

const MASTERS = ['Verse', 'Chorus', 'Pre-Chorus', 'Bridge', 'Tag', 'Intro', 'Ending']

let nextKey = 1

function blocksOf(song: Song | null): Block[] {
  if (!song || song.verses.length === 0) return [{ key: nextKey++, label: 'Verse 1', text: '' }]
  return song.verses.map((verse) => ({ key: nextKey++, label: verse.label, text: verse.lines.join('\n'), style: verse.style }))
}

/** The next free name for a master, such as "Verse 3" or "Chorus". */
function nameFor(master: string, blocks: Block[]) {
  const used = blocks.filter((block) => block.label.toLowerCase().startsWith(master.toLowerCase())).length
  return used === 0 && master !== 'Verse' ? master : `${master} ${used + 1}`
}

const FIELD =
  'rounded-md border border-slate-300 bg-white px-2 py-1 text-sm dark:border-slate-600 dark:bg-slate-900'

export function SongEditor({
  song,
  theme,
  backgroundCss,
  layoutId,
  onSave,
  onClose,
}: {
  /** The song being edited, or null for a new one. */
  song: Song | null
  /** The current look, so the preview shows the words as they will appear. */
  theme: Theme
  backgroundCss?: string
  layoutId?: string
  onSave: (draft: { title: string; author: string; copyright: string; verses: Verse[] }) => void
  onClose: () => void
}) {
  const [title, setTitle] = useState(song?.title ?? '')
  const [author, setAuthor] = useState(song?.author ?? '')
  const [copyright, setCopyright] = useState(song?.copyright ?? '')
  const [blocks, setBlocks] = useState<Block[]>(() => blocksOf(song))
  const [selected, setSelected] = useState(() => blocks[0]?.key ?? 0)
  const [tab, setTab] = useState<'Words' | 'Slides' | 'Masters'>('Words')
  const [zoom, setZoom] = useState(70)
  const [adding, setAdding] = useState(false)
  const listRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const linesOf = (block: Block) =>
    block.text
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
  const verses: Verse[] = blocks
    .map((block, index) => ({ label: block.label.trim() || `Verse ${index + 1}`, lines: linesOf(block), style: block.style }))
    .filter((verse) => verse.lines.length > 0)
  const ready = title.trim() !== '' && verses.length > 0
  const current = blocks.find((block) => block.key === selected) ?? blocks[0]

  const update = (key: number, patch: Partial<Block>) =>
    setBlocks((all) => all.map((block) => (block.key === key ? { ...block, ...patch } : block)))

  const addBlock = (master: string) => {
    const block = { key: nextKey++, label: nameFor(master, blocks), text: '' }
    setBlocks((all) => [...all, block])
    setSelected(block.key)
    setAdding(false)
    setTab('Words')
    setTimeout(() => listRef.current?.querySelector<HTMLTextAreaElement>(`[data-block="${block.key}"] textarea`)?.focus(), 0)
  }

  const removeBlock = (key: number) => {
    const rest = blocks.filter((block) => block.key !== key)
    const next = rest.length > 0 ? rest : [{ key: nextKey++, label: 'Verse 1', text: '' }]
    setBlocks(next)
    if (key === selected) setSelected(next[0].key)
  }

  // Ctrl+Enter splits the block at the cursor: everything after it moves to a new block below.
  const splitAt = (block: Block, at: number) => {
    const next = { key: nextKey++, label: '', text: block.text.slice(at).replace(/^\n+/, '') }
    setBlocks((all) => {
      const index = all.findIndex((entry) => entry.key === block.key)
      const out = all.map((entry) => (entry.key === block.key ? { ...entry, text: block.text.slice(0, at).replace(/\s+$/, '') } : entry))
      out.splice(index + 1, 0, next)
      return out
    })
    setSelected(next.key)
    setTimeout(() => {
      const area = listRef.current?.querySelector<HTMLTextAreaElement>(`[data-block="${next.key}"] textarea`)
      area?.focus()
      area?.setSelectionRange(0, 0)
    }, 0)
  }

  // Pasting several paragraphs into one block splits them into blocks.
  const paste = (block: Block, text: string) => {
    if (!/\n\s*\n/.test(text)) return false
    const parsed = parseWords(text)
    if (parsed.length === 0) return false
    setBlocks((all) => {
      const index = all.findIndex((entry) => entry.key === block.key)
      const made = parsed.map((verse) => ({ key: nextKey++, label: verse.label, text: verse.lines.join('\n') }))
      // An empty block is replaced by the pasted ones; otherwise they follow it.
      const out = [...all]
      out.splice(block.text.trim() === '' ? index : index + 1, block.text.trim() === '' ? 1 : 0, ...made)
      return out
    })
    return true
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-label={song ? 'Edit Song' : 'New Song'}
        className="flex h-full max-h-[760px] w-full max-w-6xl flex-col overflow-hidden rounded-lg border border-slate-300 bg-slate-100 text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
      >
        <div className="flex shrink-0 items-center bg-blue-700 px-4 py-2 text-sm font-semibold text-white">
          Song Editor{title.trim() ? ` - ${title.trim()}` : ''}
        </div>

        <div className="flex shrink-0 flex-wrap items-end gap-3 border-b border-slate-300 px-4 py-3 dark:border-slate-700">
          <label className="grid min-w-60 flex-1 gap-1 text-xs font-semibold text-slate-600 dark:text-slate-300">
            Title
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Song title"
              className={`${FIELD} text-base font-semibold`}
              autoFocus
            />
          </label>
          <label className="grid w-56 gap-1 text-xs font-semibold text-slate-600 dark:text-slate-300">
            Author
            <input value={author} onChange={(event) => setAuthor(event.target.value)} className={FIELD} />
          </label>
          <label className="grid w-56 gap-1 text-xs font-semibold text-slate-600 dark:text-slate-300">
            Copyright
            <input
              value={copyright}
              onChange={(event) => setCopyright(event.target.value)}
              placeholder="For example Public Domain"
              className={FIELD}
            />
          </label>
        </div>

        <div className="flex min-h-0 flex-1">
          <div className="flex w-[360px] shrink-0 flex-col border-r border-slate-300 dark:border-slate-700">
            <div className="flex shrink-0 border-b border-slate-300 text-sm dark:border-slate-700">
              {(['Words', 'Slides', 'Masters'] as const).map((name) => (
                <button
                  key={name}
                  type="button"
                  onClick={() => setTab(name)}
                  className={`px-4 py-1.5 ${
                    tab === name
                      ? 'border-b-2 border-blue-600 bg-white font-semibold dark:bg-slate-800'
                      : 'text-slate-600 hover:bg-slate-200 dark:text-slate-400 dark:hover:bg-slate-800'
                  }`}
                >
                  {name}
                </button>
              ))}
            </div>

            <div ref={listRef} className="min-h-0 flex-1 space-y-2 overflow-auto bg-white p-2 dark:bg-slate-950">
              {tab === 'Words' &&
                blocks.map((block, index) => (
                  <div
                    key={block.key}
                    data-block={block.key}
                    onClick={() => setSelected(block.key)}
                    className={`rounded border ${
                      block.key === selected ? 'border-blue-600' : 'border-slate-300 dark:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center bg-blue-600 text-white">
                      <span className="w-6 shrink-0 text-center text-xs opacity-80">{index + 1}</span>
                      <input
                        value={block.label}
                        onChange={(event) => update(block.key, { label: event.target.value })}
                        aria-label="Block label"
                        className="min-w-0 flex-1 bg-transparent py-1 text-sm font-semibold outline-none placeholder:text-white/60"
                        placeholder="label"
                      />
                      <button
                        type="button"
                        title="Remove this block"
                        onClick={() => removeBlock(block.key)}
                        className="px-2 text-sm opacity-80 hover:opacity-100"
                      >
                        ×
                      </button>
                    </div>
                    <textarea
                      value={block.text}
                      rows={Math.max(3, block.text.split('\n').length)}
                      onFocus={() => setSelected(block.key)}
                      onChange={(event) => update(block.key, { text: event.target.value })}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
                          event.preventDefault()
                          splitAt(block, event.currentTarget.selectionStart)
                        }
                      }}
                      onPaste={(event) => {
                        if (paste(block, event.clipboardData.getData('text'))) event.preventDefault()
                      }}
                      placeholder="Type the words, one line per line. Ctrl+Enter starts a new verse."
                      className="block w-full resize-none bg-transparent px-2 py-1 text-sm leading-snug outline-none"
                    />
                  </div>
                ))}

              {tab === 'Slides' &&
                blocks.map((block, index) => (
                  <button
                    key={block.key}
                    type="button"
                    onClick={() => setSelected(block.key)}
                    className={`flex w-full items-stretch gap-2 rounded border text-left ${
                      block.key === selected ? 'border-blue-600' : 'border-slate-300 dark:border-slate-700'
                    }`}
                  >
                    <SlideView
                      lines={linesOf(block)}
                      theme={theme}
                      backgroundCss={backgroundCss}
                      layoutId={layoutId}
                      className="w-32 shrink-0 rounded-l"
                    />
                    <span className="flex min-w-0 flex-1 items-center bg-blue-600 px-2 text-xs font-semibold text-white">
                      <span className="truncate">
                        {index + 1} · {block.label || `Verse ${index + 1}`}
                      </span>
                    </span>
                  </button>
                ))}

              {tab === 'Masters' && (
                <div className="grid gap-1">
                  <p className="px-1 pb-1 text-xs text-slate-500 dark:text-slate-400">
                    Click a part to add it to the end of the song.
                  </p>
                  {MASTERS.map((master) => (
                    <button
                      key={master}
                      type="button"
                      onClick={() => addBlock(master)}
                      className="rounded bg-blue-600 px-3 py-1.5 text-left text-sm font-semibold text-white hover:bg-blue-500"
                    >
                      {master}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="relative flex shrink-0 items-center border-t border-slate-300 bg-slate-100 dark:border-slate-700 dark:bg-slate-900">
              <button
                type="button"
                title="Add a block"
                aria-expanded={adding}
                onClick={() => setAdding((open) => !open)}
                className="px-3 py-1 text-lg font-bold leading-none hover:bg-slate-200 dark:hover:bg-slate-800"
              >
                +
              </button>
              {adding && (
                <div className="absolute bottom-full left-1 mb-1 grid w-36 rounded border border-slate-300 bg-white py-1 text-sm dark:border-slate-600 dark:bg-slate-800">
                  {MASTERS.map((master) => (
                    <button
                      key={master}
                      type="button"
                      onClick={() => addBlock(master)}
                      className="px-3 py-1 text-left hover:bg-blue-600 hover:text-white"
                    >
                      {master}
                    </button>
                  ))}
                </div>
              )}
              <span className="px-2 text-xs text-slate-500 dark:text-slate-400">
                {verses.length} {verses.length === 1 ? 'slide' : 'slides'}
              </span>
            </div>
          </div>

          <div className="flex min-w-0 flex-1 flex-col bg-slate-200 dark:bg-slate-950">
            <div className="flex min-h-0 flex-1 items-center justify-center overflow-auto p-4">
              <div style={{ width: `${zoom}%` }} className="shrink-0">
                <SlideView
                  lines={current ? linesOf(current) : []}
                  theme={theme}
                  backgroundCss={backgroundCss}
                  layoutId={layoutId}
                  className="w-full rounded"
                />
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-3 border-t border-slate-300 bg-slate-100 px-3 py-1 text-xs text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
              <span className="flex-1">{current ? current.label || 'Slide' : ''}</span>
              <span className="w-10 text-right">{zoom}%</span>
              <input
                type="range"
                min={30}
                max={100}
                value={zoom}
                onChange={(event) => setZoom(Number(event.target.value))}
                aria-label="Zoom"
                className="w-40"
              />
            </div>
          </div>
        </div>

        <div className="flex shrink-0 justify-end gap-2 border-t border-slate-300 px-4 py-2 dark:border-slate-700">
          <button
            type="button"
            disabled={!ready}
            title={ready ? undefined : 'Add a title and some words first'}
            onClick={() => onSave({ title: title.trim(), author: author.trim(), copyright: copyright.trim(), verses })}
            className="w-24 rounded bg-blue-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            OK
          </button>
          <button
            type="button"
            onClick={onClose}
            className="w-24 rounded bg-slate-300 px-3 py-1.5 text-sm font-medium text-slate-800 hover:bg-slate-400 dark:bg-slate-700 dark:text-slate-100 dark:hover:bg-slate-600"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}
