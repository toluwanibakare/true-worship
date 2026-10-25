import { useState } from 'react'

/**
 * App shell: the EasyWorship-style menu bar.
 * File, Schedule, Live and View menus, every item wired to a real
 * action. Menus are deliberately small: an item that does nothing is
 * worse than no item at all.
 */

export type ThemeMode = 'light' | 'dark' | 'system'

type MenuProps = {
  label: string
  open: boolean
  onToggle: () => void
  onClose: () => void
  children: React.ReactNode
}

function Menu({ label, open, onToggle, onClose, children }: MenuProps) {
  return (
    <div className="relative">
      <button
        type="button"
        onClick={onToggle}
        className={`rounded px-2 py-1 text-sm ${
          open
            ? 'bg-slate-300 dark:bg-slate-700'
            : 'hover:bg-slate-200 dark:hover:bg-slate-800'
        }`}
      >
        {label}
      </button>
      {open && (
        <>
          <button
            type="button"
            aria-label="Close menu"
            className="fixed inset-0 z-40 cursor-default"
            onClick={onClose}
          />
          <div className="absolute left-0 top-full z-50 mt-1 w-56 rounded-md border border-slate-300 bg-white py-1 shadow-lg dark:border-slate-700 dark:bg-slate-900">
            {children}
          </div>
        </>
      )}
    </div>
  )
}

function Item({
  label,
  checked,
  onClick,
}: {
  label: string
  checked?: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="block w-full px-3 py-1.5 text-left text-sm hover:bg-slate-200 dark:hover:bg-slate-800"
    >
      {checked ? `✓ ${label}` : label}
    </button>
  )
}

export function MenuBar(props: {
  theme: ThemeMode
  onThemeChange: (mode: ThemeMode) => void
  onNewSchedule: () => void
  onOpenService: () => void
  onSaveService: () => void
  onExportLibrary: () => void
  onAddItem: () => void
  onMoveUp: () => void
  onMoveDown: () => void
  onRemoveSelected: () => void
  onGoLive: () => void
  onLogo: () => void
  onBlack: () => void
  onClear: () => void
  onShowLayouts: () => void
  onShowBackgrounds: () => void
}) {
  const [open, setOpen] = useState<string | null>(null)
  const close = () => setOpen(null)
  const toggle = (name: string) => setOpen((current) => (current === name ? null : name))
  const run = (action: () => void) => () => {
    close()
    action()
  }

  return (
    <nav className="flex items-center gap-1">
      <Menu label="File" open={open === 'file'} onToggle={() => toggle('file')} onClose={close}>
        <Item label="New Schedule" onClick={run(props.onNewSchedule)} />
        <Item label="Open Service…" onClick={run(props.onOpenService)} />
        <Item label="Save Service" onClick={run(props.onSaveService)} />
        <Item label="Export Song Library" onClick={run(props.onExportLibrary)} />
      </Menu>
      <Menu label="Schedule" open={open === 'schedule'} onToggle={() => toggle('schedule')} onClose={close}>
        <Item label="Add Item" onClick={run(props.onAddItem)} />
        <Item label="Move Selected Up" onClick={run(props.onMoveUp)} />
        <Item label="Move Selected Down" onClick={run(props.onMoveDown)} />
        <Item label="Remove Selected" onClick={run(props.onRemoveSelected)} />
      </Menu>
      <Menu label="Live" open={open === 'live'} onToggle={() => toggle('live')} onClose={close}>
        <Item label="Go Live" onClick={run(props.onGoLive)} />
        <Item label="Logo" onClick={run(props.onLogo)} />
        <Item label="Black" onClick={run(props.onBlack)} />
        <Item label="Clear" onClick={run(props.onClear)} />
      </Menu>
      <Menu label="View" open={open === 'view'} onToggle={() => toggle('view')} onClose={close}>
        <Item label="Light Theme" checked={props.theme === 'light'} onClick={run(() => props.onThemeChange('light'))} />
        <Item label="Dark Theme" checked={props.theme === 'dark'} onClick={run(() => props.onThemeChange('dark'))} />
        <Item label="System Theme" checked={props.theme === 'system'} onClick={run(() => props.onThemeChange('system'))} />
        <Item label="Layouts…" onClick={run(props.onShowLayouts)} />
        <Item label="Backgrounds…" onClick={run(props.onShowBackgrounds)} />
      </Menu>
    </nav>
  )
}
