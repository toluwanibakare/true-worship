import type { ReactNode } from 'react'
import { Panel } from './ui'

/**
 * A 16:9 output monitor with its slide counter and the Prev / Next
 * steppers underneath, the way EasyWorship pairs "Preview Output" and
 * "Live Output" along the middle of the window. Preview and live both
 * use it, so it lives in shared.
 */
export function OutputPanel({
  title,
  counter,
  canPrev,
  canNext,
  onPrev,
  onNext,
  children,
}: {
  title: string
  counter: string
  canPrev: boolean
  canNext: boolean
  onPrev: () => void
  onNext: () => void
  /** The monitor itself, normally a SlideView. */
  children: ReactNode
}) {
  const step =
    'rounded-md bg-slate-200 px-3 py-0.5 text-sm text-slate-800 hover:bg-slate-300 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700'
  return (
    <Panel title={title} className="h-full">
      <div className="flex h-full flex-col items-center gap-2">
        <div className="flex min-h-0 w-full flex-1 items-center justify-center">
          {children}
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <span className="text-xs text-slate-500 dark:text-slate-400">{counter}</span>
          <button type="button" aria-label="Previous slide" disabled={!canPrev} onClick={onPrev} className={step}>
            ◀
          </button>
          <button type="button" aria-label="Next slide" disabled={!canNext} onClick={onNext} className={step}>
            ▶
          </button>
        </div>
      </div>
    </Panel>
  )
}
