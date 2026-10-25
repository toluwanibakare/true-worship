import type { Theme } from '../../shared/lib/types'
import { Button, Panel } from '../../shared/components/ui'

/**
 * Feature: live.
 * Owns what the congregation sees: the output preview, Go Live, and the
 * Logo / Black / Clear controls. In the desktop shell this panel drives
 * the second window on the projector; here it renders the same output
 * inline so the flow can be tested in a browser.
 */
export function LivePanel({
  title,
  lines,
  theme,
  live,
  onGoLive,
  onBlack,
  onLogo,
  onClear,
}: {
  title: string
  lines: string[]
  theme: Theme
  live: boolean
  onGoLive: () => void
  onBlack: () => void
  onLogo: () => void
  onClear: () => void
}) {
  return (
    <Panel title={live ? 'Live Output — LIVE' : 'Live Output'} className="h-full">
      <div
        className="flex min-h-40 flex-col items-center justify-center rounded-md p-6 text-center"
        style={{ background: theme.background, color: theme.textColor }}
      >
        <p className="text-xs font-semibold tracking-wide opacity-70">{title}</p>
        {lines.map((line) => (
          <p key={line} className="mt-1 leading-snug" style={{ fontSize: theme.fontSize * 0.55 }}>
            {line}
          </p>
        ))}
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <Button primary onClick={onGoLive}>
          Go Live
        </Button>
        <Button onClick={onLogo}>Logo</Button>
        <Button onClick={onBlack}>Black</Button>
        <Button onClick={onClear}>Clear</Button>
      </div>
    </Panel>
  )
}
