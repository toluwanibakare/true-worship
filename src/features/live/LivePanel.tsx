import type { Theme } from '../../shared/lib/types'
import { Button, Panel } from '../../shared/components/ui'

/**
 * Feature: live — the output monitor.
 * Shows what the congregation sees right now, with the LIVE badge and
 * the Logo, Black and Clear controls. Go Live itself lives on the
 * preview and the toolbar, the way EasyWorship puts it between the
 * preview and the live output.
 */
export function LivePanel({
  title,
  lines,
  theme,
  live,
  onBlack,
  onLogo,
  onClear,
}: {
  title: string
  lines: string[]
  theme: Theme
  live: boolean
  onBlack: () => void
  onLogo: () => void
  onClear: () => void
}) {
  return (
    <Panel title="Live Output">
      <div className="mb-2 flex items-center gap-2">
        {live ? (
          <span className="rounded bg-red-600 px-2 py-0.5 text-xs font-bold text-white">
            LIVE
          </span>
        ) : (
          <span className="rounded bg-slate-300 px-2 py-0.5 text-xs font-bold text-slate-700 dark:bg-slate-700 dark:text-slate-200">
            Not live
          </span>
        )}
        <span className="truncate text-sm font-medium">{title}</span>
      </div>
      <div
        className="flex min-h-32 flex-col items-center justify-center rounded-md p-4 text-center"
        style={{ background: theme.background, color: theme.textColor }}
      >
        {lines.map((line) => (
          <p key={line} className="leading-snug" style={{ fontSize: theme.fontSize * 0.45 }}>
            {line}
          </p>
        ))}
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <Button onClick={onLogo}>Logo</Button>
        <Button onClick={onBlack}>Black</Button>
        <Button onClick={onClear}>Clear</Button>
      </div>
    </Panel>
  )
}
