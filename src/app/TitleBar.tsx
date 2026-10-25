import type { ReactNode } from 'react'
import type { ThemeMode } from './MenuBar'

/**
 * App shell: the one bar across the top of the operator window. Window
 * controls on the left, then the menus, the app name centred, and the
 * GitHub repo on the right. The window is frameless in Electron, so
 * this bar is also the drag handle (double-click toggles maximize).
 * In a plain browser the window controls are hidden.
 */

const REPO_URL = 'https://github.com/toluwanibakare/true-worship'

/** GitHub's mark (Octicons, MIT). Solar has no brand logos. */
function GithubMark() {
  return (
    <svg viewBox="0 0 16 16" className="h-4 w-4" fill="currentColor" aria-hidden="true">
      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
    </svg>
  )
}

function WindowDot({
  label,
  colour,
  onClick,
}: {
  label: string
  colour: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className={`tw-no-drag h-3.5 w-3.5 rounded-full hover:brightness-110 ${colour}`}
    />
  )
}

const THEME_MODES: ThemeMode[] = ['light', 'dark', 'system']

export function TitleBar({
  menu,
  theme,
  onThemeChange,
  onShowShortcuts,
}: {
  menu: ReactNode
  theme: ThemeMode
  onThemeChange: (mode: ThemeMode) => void
  onShowShortcuts: () => void
}) {
  const api = window.electronAPI

  return (
    <div
      className="tw-drag relative flex h-9 items-center gap-3 bg-black px-3 text-white dark:bg-white dark:text-black"
      onDoubleClick={() => api?.toggleMaximizeWindow()}
    >
      {api && (
        <div className="flex items-center gap-2">
          <WindowDot label="Close" colour="bg-red-500" onClick={api.closeWindow} />
          <WindowDot label="Minimize" colour="bg-amber-400" onClick={api.minimizeWindow} />
          <WindowDot label="Maximize" colour="bg-green-500" onClick={api.toggleMaximizeWindow} />
        </div>
      )}
      <div className="tw-no-drag" onDoubleClick={(event) => event.stopPropagation()}>
        {menu}
      </div>
      <span className="pointer-events-none absolute left-1/2 -translate-x-1/2 text-sm font-semibold">
        True Worship
      </span>
      <div className="ml-auto flex items-center gap-3">
        <button
          type="button"
          onClick={onShowShortcuts}
          onDoubleClick={(event) => event.stopPropagation()}
          className="tw-no-drag rounded px-2 py-0.5 text-xs hover:bg-white/20 dark:hover:bg-black/10"
        >
          Shortcuts (?)
        </button>
        <div
          className="tw-no-drag relative grid grid-cols-[repeat(3,4rem)] rounded-full bg-white/15 p-0.5 dark:bg-black/10"
          role="group"
          aria-label="Theme"
          onDoubleClick={(event) => event.stopPropagation()}
        >
          <span
            aria-hidden="true"
            className="absolute bottom-0.5 left-0.5 top-0.5 w-[calc((100%-0.25rem)/3)] rounded-full bg-blue-600 transition-transform duration-200 ease-out motion-reduce:transition-none"
            style={{ transform: `translateX(${THEME_MODES.indexOf(theme) * 100}%)` }}
          />
          {THEME_MODES.map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => onThemeChange(mode)}
              className={`relative rounded-full py-0.5 text-xs capitalize transition-colors ${
                theme === mode ? 'text-white' : 'opacity-80 hover:opacity-100'
              }`}
            >
              {mode}
            </button>
          ))}
        </div>
        <a
          href={REPO_URL}
          target="_blank"
          rel="noreferrer"
          onDoubleClick={(event) => event.stopPropagation()}
          aria-label="True Worship on GitHub"
          title="True Worship on GitHub"
          className="tw-no-drag flex h-6 w-6 items-center justify-center rounded-full hover:bg-white/20 dark:hover:bg-black/10"
        >
          <GithubMark />
        </a>
      </div>
    </div>
  )
}
