import { useRef } from 'react'

/**
 * Draggable divider between two panes. `vertical` is a bar between
 * side-by-side panes (drag left and right); `horizontal` sits between
 * stacked panes (drag up and down). It reports the pointer movement in
 * pixels and the owner clamps the size. Double-click resets, and the
 * arrow keys nudge it for keyboard users.
 */
export function Splitter({
  orientation,
  label,
  onDrag,
  onReset,
}: {
  orientation: 'vertical' | 'horizontal'
  label: string
  onDrag: (deltaPx: number) => void
  onReset?: () => void
}) {
  const vertical = orientation === 'vertical'
  const position = (event: { clientX: number; clientY: number }) =>
    vertical ? event.clientX : event.clientY
  const last = useRef(0)

  return (
    <div
      role="separator"
      aria-orientation={orientation}
      aria-label={label}
      tabIndex={0}
      title="Drag to resize, double-click to reset"
      onPointerDown={(event) => {
        event.currentTarget.setPointerCapture(event.pointerId)
        last.current = position(event)
      }}
      onPointerMove={(event) => {
        if (!event.currentTarget.hasPointerCapture(event.pointerId)) return
        const now = position(event)
        onDrag(now - last.current)
        last.current = now
      }}
      onDoubleClick={onReset}
      onKeyDown={(event) => {
        const step = event.shiftKey ? 48 : 16
        const back = vertical ? 'ArrowLeft' : 'ArrowUp'
        const forward = vertical ? 'ArrowRight' : 'ArrowDown'
        if (event.key === back) onDrag(-step)
        else if (event.key === forward) onDrag(step)
        else return
        event.preventDefault()
      }}
      className={`group flex shrink-0 touch-none select-none items-center justify-center outline-none ${
        vertical ? 'w-3 cursor-col-resize' : 'h-3 cursor-row-resize'
      }`}
    >
      <span
        className={`rounded-full bg-transparent group-hover:bg-blue-500 group-focus-visible:bg-blue-500 group-active:bg-blue-500 ${
          vertical ? 'h-12 w-1' : 'h-1 w-12'
        }`}
      />
    </div>
  )
}
