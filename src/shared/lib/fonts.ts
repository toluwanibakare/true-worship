/**
 * Display font choices. Calibri and Arial lead the list, followed by
 * the usual Windows presentation fonts churches pick from. Calibri and Segoe UI are Microsoft fonts, so they are
 * named here, never bundled; on machines without them the stack
 * falls back to the next font in line.
 */
export const DISPLAY_FONTS = [
  { label: 'Calibri', value: "'Calibri', 'Carlito', Arial, sans-serif" },
  { label: 'Arial', value: 'Arial, sans-serif' },
  { label: 'Segoe UI', value: "'Segoe UI', system-ui, sans-serif" },
  { label: 'Verdana', value: 'Verdana, sans-serif' },
  { label: 'Tahoma', value: 'Tahoma, sans-serif' },
  { label: 'Trebuchet MS', value: "'Trebuchet MS', sans-serif" },
  { label: 'Georgia', value: 'Georgia, serif' },
  { label: 'Times New Roman', value: "'Times New Roman', serif" },
]
