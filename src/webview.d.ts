import type { DetailedHTMLProps, HTMLAttributes } from 'react'

/** Electron's <webview> tag, used by the built-in web browser. */
declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      webview: DetailedHTMLProps<
        HTMLAttributes<HTMLElement> & { src?: string; partition?: string },
        HTMLElement
      >
    }
  }
}
