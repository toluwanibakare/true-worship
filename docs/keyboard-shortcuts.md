# Keyboard Shortcuts

True Worship's shortcuts follow the key set worship operators already
know, so people moving over from other tools keep their muscle memory.
They are grouped into Editor Keys, Schedule Keys and Show Control Keys.
Press `?` in the app (or Help →
Keyboard Shortcuts) for the same list inside the app.

## File

| Keys | Does |
| --- | --- |
| Ctrl + O | Open a service file |
| Ctrl + S | Save the current service |
| Ctrl + F | Open the Alerts tab |
| Ctrl + M | Open the Alerts tab |
| Ctrl + N | Open the Alerts tab (desktop app only: in a browser tab Ctrl + N opens a new window) |

## Schedule

| Keys | Does |
| --- | --- |
| Ctrl + Del | Delete the selected schedule item |
| Right Arrow | Next verse on the screen when something is live, otherwise the next schedule item |
| Left Arrow | Previous verse on the screen when something is live, otherwise the previous schedule item |

## Show control

| Keys | Does |
| --- | --- |
| Page Down | Go Live with the selected slide |
| Ctrl + C | Toggle the live text on and off (a second press brings back exactly what the first press cleared) |
| Ctrl + B | Toggle the black screen on and off |
| Ctrl + L | Toggle the logo on and off |
| Down Arrow | Select the next slide |
| Up Arrow | Select the previous slide |
| Home | Select the first slide |
| End | Select the last slide |

## Jump to slide

Type the letters and digits, then Enter. These select the slide in
the preview; Page Down sends it live.

| Keys | Does |
| --- | --- |
| V + Enter | Select the first verse of the song |
| C + Enter | Select the first chorus of the song |
| Number + Enter | Select that slide number (3 + Enter selects slide 3) |
| V + Number + Enter | Select that verse (V + 6 + Enter selects verse 6) |
| C + Number + Enter | Select that chorus (C + 2 + Enter selects chorus 2) |

## Also active by default

Extra keys that step through slides:

| Keys | Does |
| --- | --- |
| N | Select the next slide |
| P | Select the previous slide |
| Space | Select the next slide (only when no button or field has focus) |
| Backspace | Select the previous slide |
| Page Up | Select the previous slide |

## Deliberately not hijacked

- **Editor text keys** (Ctrl + A/C/V/X/Z/Y, Tab, Shift + Tab,
  Ctrl + Enter, Ctrl + End): these work natively in the browser and
  in Electron text fields, so True Worship leaves them alone.
  Ctrl + C is the one exception with a guard: it only toggles the
  live text when nothing is selected and you are not typing, so Copy
  always wins when you mean Copy.
- **Ctrl + Space** (switch live output and control screen in single
  monitor mode): True Worship has no single monitor mode; the live
  window is a separate window.
- **Ctrl + Drag** between songs: drag and drop between items is not
  built yet.
- **Foldback alerts** (Ctrl + F): True Worship has no foldback
  screen yet, so Ctrl + F opens the Alerts dialog.
- **Black and Logo are toggles**: pressing
  again returns to whatever was live.

## Safety rules in the implementation

- No shortcut fires while you are typing in a field, a select, or an
  editable area.
- While the shortcut list dialog is open, only Esc fires.
- The jump-to-slide buffer clears after 2 seconds without a key, on
  Esc, or on any other key.
- Menu items show their shortcut on the right.
