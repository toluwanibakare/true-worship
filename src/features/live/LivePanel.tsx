import type { Theme } from '../../shared/lib/types'
import { Button, Panel } from '../../shared/components/ui'

/**
 * Feature: live — the output column.
 * EasyWorship gives live its own full-height column next to the
 * preview: the output monitor on top, Go Live and the Logo, Black
 * and Clear controls under it, and the live item's slides below so
 * the operator can step through the service from here. The monitor
 * is 16:9 at the column's full width, the same shape as the
 * projector output, not a thumbnail squeezed beside something else.
 */
export function LivePanel({
  title,
  lines,
  theme,
  live,
  slides,
  slideLabels,
  liveSlideIndex,
  onSelectLiveSlide,
  onGoLive,
  onBlack,
  onLogo,
  onClear,
}: {
  title: string
  lines: string[]
  theme: Theme
  live: boolean
  slides: string[][]
  slideLabels: string[]
  liveSlideIndex: number
  onSelectLiveSlide: (index: number) => void
  onGoLive: () => void
  onBlack: () => void
  onLogo: () => void
  onClear: () => void
}) {
  return (
    <Panel title="Live Output" className="h-full">
      <div className="flex h-full flex-col gap-3">
        <div className="flex shrink-0 items-center gap-2">
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
          className="flex aspect-video w-full shrink-0 flex-col items-center justify-center overflow-hidden rounded-md p-4 text-center"
          style={{ background: theme.background, color: theme.textColor }}
        >
          {lines.map((line) => (
            <p key={line} className="leading-snug" style={{ fontSize: theme.fontSize * 0.5 }}>
              {line}
            </p>
          ))}
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <Button primary onClick={onGoLive}>
            GO LIVE &gt;&gt;&gt;
          </Button>
          <Button onClick={onLogo}>Logo</Button>
          <Button onClick={onBlack}>Black</Button>
          <Button onClick={onClear}>Clear</Button>
        </div>
        <div className="min-h-0 flex-1 overflow-auto">
          {live && slides.length > 1 ? (
            <div className="space-y-1">
              {slideLabels.map((label, index) => (
                <button
                  key={`${label}-${index}`}
                  type="button"
                  onClick={() => onSelectLiveSlide(index)}
                  className={`block w-full rounded-md px-2 py-1.5 text-left text-sm ${
                    index === liveSlideIndex
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-800 hover:bg-slate-200 dark:text-slate-200 dark:hover:bg-slate-800'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-500">
              Go live, then step through this item&apos;s slides from here.
            </p>
          )}
        </div>
      </div>
    </Panel>
  )
}
