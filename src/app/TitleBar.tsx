import type { ReactNode } from 'react'
import type { ThemeMode } from './MenuBar'

/**
 * App shell: the one bar across the top of the operator window. Window
 * controls on the left, then the menus, the app name centred, and the
 * shortcuts and theme switch on the right. The window is frameless in Electron, so
 * this bar is also the drag handle (double-click toggles maximize).
 * In a plain browser the window controls are hidden.
 */

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
      className="tw-drag relative flex h-9 items-center gap-3 bg-[#1e40af] px-3 text-white"
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
          className="tw-no-drag rounded px-2 py-0.5 text-xs hover:bg-white/20"
        >
          Shortcuts (?)
        </button>
        <div
          className="tw-no-drag relative grid grid-cols-[repeat(3,4rem)] rounded-full bg-white/15 p-0.5"
          role="group"
          aria-label="Theme"
          onDoubleClick={(event) => event.stopPropagation()}
        >
          <span
            aria-hidden="true"
            className="absolute bottom-0.5 left-0.5 top-0.5 w-[calc((100%-0.25rem)/3)] rounded-full bg-white transition-transform duration-200 ease-out motion-reduce:transition-none"
            style={{ transform: `translateX(${THEME_MODES.indexOf(theme) * 100}%)` }}
          />
          {THEME_MODES.map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => onThemeChange(mode)}
              className={`relative rounded-full py-0.5 text-xs capitalize transition-colors ${
                theme === mode ? 'font-semibold text-[#1e40af]' : 'opacity-80 hover:opacity-100'
              }`}
            >
              {mode}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
