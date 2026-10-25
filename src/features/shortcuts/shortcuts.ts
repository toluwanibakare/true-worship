/**
 * Keyboard shortcuts: the key set worship operators already know,
 * grouped into Editor Keys, Schedule Keys and Show Control Keys. The
 * "also active" group at the end adds N and Space to step forward and
 * P, Backspace and Page Up to step back. Shortcuts marked desktop-only cannot fire in a browser tab
 * because the browser claims the key first; they work in the
 * packaged desktop app.
 */

export type ShortcutDef = {
  keys: string
  does: string
  group: 'File' | 'Schedule' | 'Show control' | 'Jump to slide' | 'Also active by default' | 'True Worship'
  note?: string
}

export const SHORTCUT_LIST: ShortcutDef[] = [
  { keys: 'Ctrl + O', does: 'Open a service file', group: 'File' },
  { keys: 'Ctrl + S', does: 'Save the current service', group: 'File' },
  { keys: 'Ctrl + F', does: 'Open the Alerts tab', group: 'File' },
  { keys: 'Ctrl + M', does: 'Open the Alerts tab', group: 'File' },
  {
    keys: 'Ctrl + N',
    does: 'Open the Alerts tab',
    group: 'File',
    note: 'Desktop app only: in a browser tab Ctrl + N opens a new window.',
  },
  { keys: 'Ctrl + Del', does: 'Delete the selected schedule item', group: 'Schedule' },
  { keys: 'Right Arrow', does: 'Next verse on the screen when live, otherwise the next schedule item', group: 'Schedule' },
  { keys: 'Left Arrow', does: 'Previous verse on the screen when live, otherwise the previous schedule item', group: 'Schedule' },
  { keys: 'Page Down', does: 'Go Live with the selected slide', group: 'Show control' },
  { keys: 'Ctrl + C', does: 'Toggle the live text on and off', group: 'Show control', note: 'Never hijacks Copy: it only fires when nothing is selected and you are not typing.' },
  { keys: 'Ctrl + B', does: 'Toggle the black screen on and off', group: 'Show control' },
  { keys: 'Ctrl + L', does: 'Toggle the logo on and off', group: 'Show control' },
  { keys: 'Down Arrow', does: 'Select the next slide', group: 'Show control' },
  { keys: 'Up Arrow', does: 'Select the previous slide', group: 'Show control' },
  { keys: 'Home', does: 'Select the first slide', group: 'Show control' },
  { keys: 'End', does: 'Select the last slide', group: 'Show control' },
  { keys: 'V + Enter', does: 'Select the first verse of the song', group: 'Jump to slide' },
  { keys: 'C + Enter', does: 'Select the first chorus of the song', group: 'Jump to slide' },
  { keys: 'Number + Enter', does: 'Select that slide number (3 + Enter selects slide 3)', group: 'Jump to slide' },
  { keys: 'V + Number + Enter', does: 'Select that verse (V + 6 + Enter selects verse 6)', group: 'Jump to slide' },
  { keys: 'C + Number + Enter', does: 'Select that chorus (C + 2 + Enter selects chorus 2)', group: 'Jump to slide' },
  { keys: 'N', does: 'Select the next slide', group: 'Also active by default' },
  { keys: 'P', does: 'Select the previous slide', group: 'Also active by default' },
  { keys: 'Space', does: 'Select the next slide', group: 'Also active by default', note: 'Only when no button or field has focus, so Space still activates buttons.' },
  { keys: 'Backspace', does: 'Select the previous slide', group: 'Also active by default' },
  { keys: 'Page Up', does: 'Select the previous slide', group: 'Also active by default' },
  { keys: '?', does: 'Open this shortcut list', group: 'True Worship' },
  { keys: 'Esc', does: 'Close this shortcut list', group: 'True Worship' },
]

/** True when the keypress belongs to a text field, a select, or an
 *  editable area. Shortcuts never fire there: typing must stay typing. */
export function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  return (
    target.tagName === 'INPUT' ||
    target.tagName === 'TEXTAREA' ||
    target.tagName === 'SELECT' ||
    target.isContentEditable
  )
}

/**
 * Resolve a jump-to-slide key sequence (the letters and digits typed
 * before Enter) against the current slide labels. Returns the slide
 * index, or null when the sequence matches nothing.
 */
export function resolveJumpSequence(sequence: string, labels: string[]): number | null {
  const match = sequence.match(/^(v|c)?(\d*)$/)
  if (!match) return null
  const [, letter, digits] = match
  const lower = labels.map((label) => label.toLowerCase())
  if (letter === 'v' && digits === '') {
    const index = lower.findIndex((label) => label.startsWith('verse'))
    return index === -1 ? null : index
  }
  if (letter === 'c' && digits === '') {
    const index = lower.findIndex((label) => label.startsWith('chorus'))
    return index === -1 ? null : index
  }
  if (letter === 'v' && digits !== '') {
    const index = lower.findIndex((label) => label === `verse ${Number(digits)}`)
    return index === -1 ? null : index
  }
  if (letter === 'c' && digits !== '') {
    const index = lower.findIndex((label) => label === `chorus ${Number(digits)}`)
    return index === -1 ? null : index
  }
  if (digits !== '') {
    const index = Number(digits) - 1
    return index >= 0 && index < labels.length ? index : null
  }
  return null
}
