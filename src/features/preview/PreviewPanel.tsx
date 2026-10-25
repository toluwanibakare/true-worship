import { Panel } from '../../shared/components/ui'

/**
 * Feature: preview — the verse list.
 * EasyWorship's Preview pane lists the selected item's slides as
 * blocks: a coloured label bar (Chorus in purple, Verse in blue, the
 * way its song editor colours sections) over the words, one block per
 * slide. Click a block to select that slide; the Preview Output below
 * shows it. The list scrolls on its own.
 */
function labelColour(label: string) {
  return /^(chorus|refrain|tag)/i.test(label) ? 'bg-purple-700' : 'bg-blue-600'
}

export function PreviewPanel({
  title,
  slides,
  labels,
  selectedIndex,
  onSelect,
}: {
  title: string
  slides: string[][]
  labels: string[]
  selectedIndex: number
  onSelect: (index: number) => void
}) {
  return (
    <Panel title={`Preview — ${title}`} className="h-full">
      <div className="space-y-1.5">
        {slides.map((lines, index) => {
          const label = labels[index] ?? `Slide ${index + 1}`
          const selected = index === selectedIndex
          return (
            <button
              key={`${label}-${index}`}
              type="button"
              onClick={() => onSelect(index)}
              className={`block w-full overflow-hidden rounded-md border text-left ${
                selected
                  ? 'border-blue-500 ring-2 ring-blue-500'
                  : 'border-slate-300 hover:border-slate-400 dark:border-slate-700 dark:hover:border-slate-500'
              }`}
            >
              <span className={`block px-2 py-0.5 text-xs font-semibold text-white ${labelColour(label)}`}>
                {label}
              </span>
              <span className="block bg-slate-100 px-2 py-1.5 text-sm leading-snug text-slate-700 dark:bg-slate-950 dark:text-slate-300">
                {lines.map((line, lineIndex) => (
                  <span key={lineIndex} className="block">
                    {line}
                  </span>
                ))}
              </span>
            </button>
          )
        })}
      </div>
    </Panel>
  )
}
