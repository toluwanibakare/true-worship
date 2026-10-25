import type { ReactNode } from 'react'

/**
 * A centred dialog over a dimmed backdrop: a title, a Close button and
 * scrolling content. Clicking the backdrop closes it; Esc is handled by
 * the app's one keydown listener. Alerts, Live Settings and Import all
 * open in it, so it lives in shared.
 */
export function Modal({
  title,
  onClose,
  children,
  widthClass = 'max-w-2xl',
}: {
  title: string
  onClose: () => void
  children: ReactNode
  widthClass?: string
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(event) => event.stopPropagation()}
        className={`flex max-h-full w-full flex-col rounded-lg border border-slate-300 bg-white text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 ${widthClass}`}
      >
        <div className="flex shrink-0 items-center justify-between border-b border-slate-300 px-4 py-3 dark:border-slate-700">
          <h2 className="text-lg font-bold">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md bg-slate-200 px-3 py-1.5 text-sm font-medium text-slate-800 hover:bg-slate-300 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
          >
            Close
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-auto p-4">{children}</div>
      </div>
    </div>
  )
}
