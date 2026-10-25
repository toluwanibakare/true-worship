import type { ReactNode } from 'react'

/**
 * Small outline icons for the side-panel entries in the Media and
 * Backgrounds tabs (Songs and Scriptures stay plain). Drawn here so
 * both tabs use the same set; they take the text colour.
 */
const base = {
  width: 16,
  height: 16,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
}

export const SOURCE_ICONS: Record<string, ReactNode> = {
  // Generic
  All: (
    <svg {...base}>
      <rect x="4" y="4" width="7" height="7" rx="1" />
      <rect x="13" y="4" width="7" height="7" rx="1" />
      <rect x="4" y="13" width="7" height="7" rx="1" />
      <rect x="13" y="13" width="7" height="7" rx="1" />
    </svg>
  ),
  Added: (
    <svg {...base}>
      <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <path d="M12 11v6M9 14h6" />
    </svg>
  ),
  // Media and backgrounds
  Photos: (
    <svg {...base}>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <circle cx="9" cy="10" r="1.5" />
      <path d="M21 17l-5-5-4 4-3-3-6 6" />
    </svg>
  ),
  Images: (
    <svg {...base}>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <circle cx="9" cy="10" r="1.5" />
      <path d="M21 17l-5-5-4 4-3-3-6 6" />
    </svg>
  ),
  Motion: (
    <svg {...base}>
      <circle cx="12" cy="12" r="9" />
      <path d="M10 8.5l5.5 3.5-5.5 3.5z" />
    </svg>
  ),
  Videos: (
    <svg {...base}>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M10 9.5l5 2.5-5 2.5z" />
    </svg>
  ),
  Audio: (
    <svg {...base}>
      <path d="M9 18V6l10-2v12" />
      <circle cx="6.5" cy="18" r="2.5" />
      <circle cx="16.5" cy="16" r="2.5" />
    </svg>
  ),
  Classic: (
    <svg {...base}>
      <path d="M12 3l9 5-9 5-9-5z" />
      <path d="M3 13l9 5 9-5" />
    </svg>
  ),
}
