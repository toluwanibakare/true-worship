import { SHORTCUT_LIST } from './shortcuts'

/**
 * Feature: shortcuts help.
 * A plain list of every keyboard shortcut, grouped the way
 * EasyWorship groups them. Opens with ? and closes with Esc.
 */
export function ShortcutsDialog({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}) {
  if (!open) return null
  const groups = [...new Set(SHORTCUT_LIST.map((entry) => entry.group))]
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="max-h-full w-full max-w-2xl overflow-auto rounded-lg border border-slate-300 bg-white p-4 text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-bold">Keyboard Shortcuts</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md bg-slate-200 px-3 py-1.5 text-sm font-medium text-slate-800 hover:bg-slate-300 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
          >
            Close
          </button>
        </div>
        <p className="mb-4 text-sm text-slate-500">
          EasyWorship 7&apos;s shortcuts, as listed in EasyWorship&apos;s own
          support article. Shortcuts never fire while you are typing in
          a field.
        </p>
        {groups.map((group) => (
          <div key={group} className="mb-4">
            <h3 className="mb-1 text-sm font-semibold">{group}</h3>
            <ul className="space-y-1">
              {SHORTCUT_LIST.filter((entry) => entry.group === group).map((entry) => (
                <li key={`${entry.keys}-${entry.does}`} className="flex gap-3 text-sm">
                  <span className="w-40 shrink-0 font-medium">{entry.keys}</span>
                  <span>
                    {entry.does}
                    {entry.note ? ` (${entry.note})` : ''}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  )
}
