import type { ReactNode } from 'react'

export function Panel({
  title,
  children,
  className = '',
}: {
  title: string
  children: ReactNode
  className?: string
}) {
  return (
    <section className={`flex min-h-0 flex-col rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 ${className}`}>
      <h2 className="border-b border-slate-300 dark:border-slate-700 px-3 py-2 text-sm font-semibold text-slate-800 dark:text-slate-200">
        {title}
      </h2>
      <div className="min-h-0 flex-1 overflow-auto p-3">{children}</div>
    </section>
  )
}

export function Button({
  children,
  onClick,
  primary = false,
  active = false,
}: {
  children: ReactNode
  onClick: () => void
  primary?: boolean
  active?: boolean
}) {
  const base = 'rounded-md px-3 py-1.5 text-sm font-medium transition-colors'
  const style = primary
    ? 'bg-blue-600 text-white hover:bg-blue-500'
    : active
      ? 'bg-blue-500 text-white'
      : 'bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-700'
  return (
    <button type="button" className={`${base} ${style}`} onClick={onClick}>
      {children}
    </button>
  )
}

export function SearchInput({
  value,
  onChange,
  placeholder,
}: {
  value: string
  onChange: (value: string) => void
  placeholder: string
}) {
  return (
    <input
      type="search"
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      className="w-full rounded-md border border-slate-300 dark:border-slate-700 bg-slate-200 dark:bg-slate-800 px-3 py-1.5 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500"
    />
  )
}
