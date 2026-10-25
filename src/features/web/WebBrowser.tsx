import { useEffect, useRef, useState } from 'react'
import { Button } from '../../shared/components/ui'
import { loadDisplaySettings } from '../display/displaySettings'

/**
 * Feature: web — the built-in web browser.
 * A small browser in the centre of the window: back, forward, home,
 * reload, an address bar that also searches, and Go Live. Go Live sends
 * exactly what the page shows to the live output, as it moves (video,
 * animation, scrolling), until Stop, Clear or anything else goes live.
 * The page is shown at 16:9, the shape of the screen, so what is on the
 * operator's page is what the room sees. It needs the desktop app.
 */
const HOME = 'https://duckduckgo.com'

type WebviewElement = HTMLElement & {
  loadURL: (url: string) => Promise<void>
  goBack: () => void
  goForward: () => void
  reload: () => void
  stop: () => void
  canGoBack: () => boolean
  canGoForward: () => boolean
  isLoading: () => boolean
  getURL: () => string
  getTitle: () => string
  getWebContentsId: () => number
}

/** A web address, or a search when the text is not one. */
export function toWebUrl(input: string): string | null {
  const text = input.trim()
  if (!text) return null
  if (/^https?:\/\//i.test(text)) return text
  if (/^localhost(:\d+)?(\/\S*)?$/i.test(text)) return `http://${text}`
  if (!/\s/.test(text) && /^[\w-]+(\.[\w-]+)+(:\d+)?(\/\S*)?$/.test(text)) return `https://${text}`
  return `https://duckduckgo.com/?q=${encodeURIComponent(text)}`
}

export function WebBrowser({
  live,
  onLiveChange,
  onClose,
}: {
  live: boolean
  onLiveChange: (live: boolean) => void
  onClose: () => void
}) {
  const view = useRef<WebviewElement | null>(null)
  const ready = useRef(false)
  // A search or address entered before the page was ready, loaded as soon as it is.
  const pending = useRef<string | null>(null)
  // True while the address box has focus: page events must not overwrite what is being typed.
  const editing = useRef(false)
  const addressBox = useRef<HTMLInputElement | null>(null)
  const liveRef = useRef(live)
  liveRef.current = live
  const [address, setAddress] = useState(HOME)
  const [title, setTitle] = useState('')
  const [loading, setLoading] = useState(false)
  const [canBack, setCanBack] = useState(false)
  const [canForward, setCanForward] = useState(false)
  const [failure, setFailure] = useState<string | null>(null)
  const api = window.electronAPI

  useEffect(() => {
    const element = view.current
    if (!element) return
    const sync = () => {
      if (!ready.current) return
      setCanBack(element.canGoBack())
      setCanForward(element.canGoForward())
      // Do not replace the address while the user is typing in it.
      if (!editing.current && document.activeElement !== addressBox.current) {
        setAddress(element.getURL())
      }
      setTitle(element.getTitle())
    }
    const onReady = () => {
      ready.current = true
      if (pending.current) {
        const url = pending.current
        pending.current = null
        element.loadURL(url).catch(() => undefined)
      }
      sync()
    }
    const onFail = (event: Event) => {
      const failed = event as Event & {
        errorCode: number
        errorDescription: string
        validatedURL: string
        isMainFrame: boolean
      }
      // -3 is a load that was cancelled by starting another one: not an error.
      if (!failed.isMainFrame || failed.errorCode === -3) return
      setFailure(`Could not load ${failed.validatedURL} (${failed.errorDescription}). Check the internet connection and the address.`)
    }
    const onStart = () => {
      setLoading(true)
      setFailure(null)
    }
    const onStop = () => {
      setLoading(false)
      sync()
    }
    element.addEventListener('dom-ready', onReady)
    element.addEventListener('did-fail-load', onFail)
    element.addEventListener('did-start-loading', onStart)
    element.addEventListener('did-stop-loading', onStop)
    element.addEventListener('did-navigate', sync)
    element.addEventListener('did-navigate-in-page', sync)
    element.addEventListener('page-title-updated', sync)
    return () => {
      element.removeEventListener('dom-ready', onReady)
      element.removeEventListener('did-fail-load', onFail)
      element.removeEventListener('did-start-loading', onStart)
      element.removeEventListener('did-stop-loading', onStop)
      element.removeEventListener('did-navigate', sync)
      element.removeEventListener('did-navigate-in-page', sync)
      element.removeEventListener('page-title-updated', sync)
    }
  }, [])

  // Leaving the browser while live would leave a frozen page on screen.
  useEffect(
    () => () => {
      if (liveRef.current) {
        window.electronAPI?.stopWebLive()
        onLiveChange(false)
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  )

  const go = (input: string) => {
    const url = toWebUrl(input)
    if (!url) return
    setFailure(null)
    setAddress(url)
    // A failed load is reported by the did-fail-load message, so the rejection is dropped.
    if (ready.current) view.current?.loadURL(url).catch(() => undefined)
    else pending.current = url
  }

  const toggleLive = () => {
    if (!api || !ready.current || !view.current) return
    if (live) {
      api.stopWebLive()
      onLiveChange(false)
      return
    }
    api.openLiveWindow(loadDisplaySettings())
    api.startWebLive(view.current.getWebContentsId())
    onLiveChange(true)
  }

  const nav =
    'rounded-md px-2 py-1 text-sm text-slate-700 hover:bg-slate-200 disabled:opacity-40 disabled:hover:bg-transparent dark:text-slate-200 dark:hover:bg-slate-800'

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-lg border border-slate-300 bg-white dark:border-slate-700 dark:bg-slate-900">
      <div className="flex shrink-0 items-center gap-1 border-b border-slate-300 bg-slate-200 px-2 py-1.5 dark:border-slate-700 dark:bg-slate-800">
        <button type="button" className={nav} disabled={!canBack} onClick={() => view.current?.goBack()} aria-label="Back" title="Back">
          ←
        </button>
        <button type="button" className={nav} disabled={!canForward} onClick={() => view.current?.goForward()} aria-label="Forward" title="Forward">
          →
        </button>
        <button type="button" className={nav} onClick={() => go(HOME)} aria-label="Home" title="Home">
          ⌂
        </button>
        <button
          type="button"
          className={nav}
          onClick={() => (loading ? view.current?.stop() : view.current?.reload())}
          aria-label={loading ? 'Stop loading' : 'Reload'}
          title={loading ? 'Stop loading' : 'Reload'}
        >
          {loading ? '✕' : '↻'}
        </button>
        <input
          ref={addressBox}
          value={address}
          onChange={(event) => setAddress(event.target.value)}
          onFocus={(event) => {
            editing.current = true
            event.target.select()
          }}
          onBlur={() => {
            editing.current = false
          }}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              // Let the page's address replace the typed text once it loads.
              editing.current = false
              go(address)
            }
          }}
          aria-label="Address"
          placeholder="Type a web address or search"
          className="mx-1 min-w-0 flex-1 rounded-md border border-slate-300 bg-white px-3 py-1 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
        />
        <Button primary={!live} active={live} onClick={toggleLive} title={live ? 'Stop showing this page on the screen' : 'Show this page on the screen'}>
          {live ? '● Stop Live' : 'Go Live'}
        </Button>
        <Button onClick={onClose}>Close</Button>
      </div>
      {failure && (
        <p className="shrink-0 border-b border-red-300 bg-red-50 px-3 py-1 text-xs text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
          {failure}
        </p>
      )}
      {title && (
        <p className="shrink-0 truncate border-b border-slate-200 px-3 py-0.5 text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400">
          {live ? 'On screen: ' : ''}
          {title}
        </p>
      )}
      <div className="flex min-h-0 flex-1 items-center justify-center bg-black p-1">
        {api ? (
          <webview
            ref={view as unknown as React.Ref<HTMLElement>}
            src={HOME}
            partition="persist:tw-web"
            style={{ display: 'inline-flex', aspectRatio: '16 / 9', height: '100%', maxWidth: '100%' }}
          />
        ) : (
          <p className="text-sm text-slate-400">The web browser needs the desktop app.</p>
        )}
      </div>
    </div>
  )
}
