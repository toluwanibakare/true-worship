/**
 * Shared marquee (used by the Alerts panel and by the live output
 * window, which is why it lives in shared, not in the alerts feature).
 * The marquee: a scrolling announcement strip pinned to the top of
 * the output. The track holds the message twice and slides exactly
 * one copy's width, so the loop is seamless with no jump.
 */

export type MarqueeSpeed = 'slow' | 'normal' | 'fast'

export type MarqueeAlert = {
  text: string
  speed: MarqueeSpeed
}

export const MARQUEE_DURATIONS: Record<MarqueeSpeed, string> = {
  slow: '36s',
  normal: '24s',
  fast: '14s',
}

export function Marquee({ alert }: { alert: MarqueeAlert }) {
  const chunk = `${alert.text}   •   `
  return (
    <div className="w-full overflow-hidden bg-black/75 py-2">
      <div
        className="tw-marquee-track flex w-max whitespace-nowrap text-lg font-semibold text-white"
        style={{ animationDuration: MARQUEE_DURATIONS[alert.speed] }}
      >
        <span className="pr-8">{chunk}</span>
        <span className="pr-8">{chunk}</span>
      </div>
    </div>
  )
}
