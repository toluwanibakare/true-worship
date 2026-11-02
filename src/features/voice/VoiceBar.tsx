import { useEffect, useMemo, useRef, useState } from 'react'
import type { Song } from '../../shared/lib/types'
import { buildSongIndex, matchPhrase, nextVerse } from './songMatcher'
import { parseSpoken, referenceOf, type ScriptureCall } from './scriptureParser'
import { useVoiceListener } from './useVoiceListener'

/**
 * Feature: voice — the listening bar.
 * Shown under the toolbar while the app is listening. It says what it
 * heard and what it understood. In Auto it acts straight away (a
 * scripture goes live, "next verse" steps on); in Manual it holds the
 * match with Go Live and Dismiss, so nothing reaches the screen until
 * the operator says so. The mode is remembered.
 *
 * It also follows singing: a phrase that matches a song in the library
 * starts that song, and as the singing goes on the slides move with it
 * (a line ahead, once the last line of a slide is heard). Pause stops the
 * slides moving; changing what is live by hand ends the following.
 */
type Mode = 'auto' | 'manual'

const MODE_KEY = 'tw-voice-mode'

function loadMode(): Mode {
  try {
    return localStorage.getItem(MODE_KEY) === 'manual' ? 'manual' : 'auto'
  } catch {
    return 'auto'
  }
}

export function VoiceBar({
  songs,
  liveTitle,
  onScripture,
  onSong,
  onVerse,
  onStep,
  onStop,
}: {
  /** The library, for recognising a song being sung. */
  songs: Song[]
  /** What is live now, so changing it by hand ends the following. */
  liveTitle: string | null
  /** A song was recognised: put it live at this slide. */
  onSong: (songId: string, verse: number) => void
  /** Move the live song to this slide. */
  onVerse: (songId: string, verse: number) => void
  /** A scripture was understood and is to go live. */
  onScripture: (call: ScriptureCall) => void
  /** "Next verse" / "previous verse". */
  onStep: (direction: -1 | 1) => void
  onStop: () => void
}) {
  const [mode, setMode] = useState<Mode>(loadMode)
  const [heard, setHeard] = useState('')
  const [pending, setPending] = useState<ScriptureCall | null>(null)
  const [last, setLast] = useState<string | null>(null)
  const [pendingSong, setPendingSong] = useState<{ id: string; title: string; verse: number } | null>(null)
  // The song being followed, and the slide it is on.
  const [following, setFollowing] = useState<{ id: string; title: string; verse: number } | null>(null)
  const [paused, setPaused] = useState(false)
  const followingRef = useRef(following)
  followingRef.current = following
  const index = useMemo(() => buildSongIndex(songs), [songs])
  const titleOf = (id: string) => songs.find((song) => song.id === id)?.title ?? ''

  // Changing what is live by hand (or a scripture going live) ends the following.
  useEffect(() => {
    const current = followingRef.current
    if (current && liveTitle !== current.title) setFollowing(null)
  }, [liveTitle])

  const startSong = (id: string, verse: number) => {
    setPendingSong(null)
    setPaused(false)
    setFollowing({ id, title: titleOf(id), verse })
    setLast(`“${titleOf(id)}”`)
    onSong(id, verse)
  }

  useEffect(() => {
    try {
      localStorage.setItem(MODE_KEY, mode)
    } catch {
      // Remembering the mode is a convenience.
    }
  }, [mode])

  // The latest handlers and mode, read when speech arrives.
  const handle = (text: string) => {
    setHeard(text)
    const call = parseSpoken(text)
    if (!call) {
      const current = followingRef.current
      if (current && !paused) {
        const match = matchPhrase(index, text, current.id)
        const target = match ? nextVerse(index, current.verse, current.id, match) : null
        if (target !== null) {
          setFollowing({ ...current, verse: target })
          onVerse(current.id, target)
          return
        }
      }
      // A different song, or none yet: it must match clearly.
      const found = matchPhrase(index, text)
      if (!found || found.score < (current ? 0.8 : 0.6) || found.songId === current?.id) return
      if (mode === 'auto') startSong(found.songId, found.verse)
      else setPendingSong({ id: found.songId, title: titleOf(found.songId), verse: found.verse })
      return
    }
    setFollowing(null)
    if (call.kind === 'command') {
      if (mode === 'auto') onStep(call.action === 'next' ? 1 : -1)
      return
    }
    if (mode === 'auto') {
      setPending(null)
      setLast(referenceOf(call) + (call.version ? ` (${call.version})` : ''))
      onScripture(call)
    } else {
      setPending(call)
    }
  }
  const { state, error, level, busy } = useVoiceListener(true, handle)

  const goPending = () => {
    if (!pending) return
    setLast(referenceOf(pending) + (pending.version ? ` (${pending.version})` : ''))
    onScripture(pending)
    setPending(null)
  }

  // Esc dismisses a held match.
  useEffect(() => {
    if (!pending && !pendingSong) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setPending(null)
        setPendingSong(null)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [pending, pendingSong])

  const dot =
    state === 'listening' ? 'bg-red-500' : state === 'error' ? 'bg-amber-500' : 'bg-slate-400'

  return (
    <div
      role="status"
      className="flex shrink-0 flex-wrap items-center gap-x-4 gap-y-1 border-b border-slate-300 bg-slate-100 px-3 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-900"
    >
      <span className="flex items-center gap-2 font-medium">
        <span className="relative flex h-3 w-3 items-center justify-center">
          <span
            className={`absolute inline-flex h-full w-full rounded-full ${dot} opacity-40`}
            style={{ transform: `scale(${1 + level * 1.4})`, transition: 'transform 80ms linear' }}
          />
          <span className={`relative h-2 w-2 rounded-full ${dot}`} />
        </span>
        {state === 'listening' ? 'Listening' : state === 'starting' ? 'Starting the speech engine…' : state === 'error' ? 'Not listening' : 'Off'}
        {busy && <span className="text-xs font-normal text-slate-500">· thinking</span>}
      </span>

      <div
        role="group"
        aria-label="Voice mode"
        className="inline-flex rounded-full border border-slate-300 p-0.5 text-xs dark:border-slate-600"
      >
        {(['auto', 'manual'] as const).map((value) => (
          <button
            key={value}
            type="button"
            aria-pressed={mode === value}
            onClick={() => setMode(value)}
            title={value === 'auto' ? 'Goes live as soon as it understands' : 'Waits for you to press Go Live'}
            className={`rounded-full px-3 py-0.5 capitalize ${
              mode === value
                ? 'bg-[#1e40af] text-white'
                : 'text-slate-600 hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-slate-800'
            }`}
          >
            {value}
          </button>
        ))}
      </div>

      {error && <span className="text-red-600 dark:text-red-400">{error}</span>}

      {!error && (
        <span className="min-w-0 flex-1 truncate text-slate-500 dark:text-slate-400" title={heard}>
          {heard ? `Heard: “${heard}”` : 'Say a scripture, like “John 3:16”, or start singing a song from your library.'}
          {last && !pending ? ` · Showing ${last}` : ''}
        </span>
      )}

      {following && (
        <span className="flex items-center gap-2">
          <span className="font-semibold">
            {paused ? 'Paused on' : 'Following'} “{following.title}”
          </span>
          <button
            type="button"
            onClick={() => setPaused((value) => !value)}
            className="rounded-full border border-slate-300 px-3 py-0.5 text-xs hover:bg-slate-200 dark:border-slate-600 dark:hover:bg-slate-800"
          >
            {paused ? 'Resume' : 'Pause'}
          </button>
        </span>
      )}

      {pendingSong && (
        <span className="flex items-center gap-2">
          <span className="font-semibold">Sounds like “{pendingSong.title}”</span>
          <button
            type="button"
            onClick={() => startSong(pendingSong.id, pendingSong.verse)}
            className="rounded-full bg-[#1e40af] px-3 py-0.5 text-xs font-medium text-white hover:bg-blue-800"
          >
            Go Live
          </button>
          <button
            type="button"
            onClick={() => setPendingSong(null)}
            className="rounded-full border border-slate-300 px-3 py-0.5 text-xs hover:bg-slate-200 dark:border-slate-600 dark:hover:bg-slate-800"
          >
            Dismiss
          </button>
        </span>
      )}

      {pending && (
        <span className="flex items-center gap-2">
          <span className="font-semibold">
            {referenceOf(pending)}
            {pending.version ? ` (${pending.version})` : ''}
          </span>
          <button
            type="button"
            onClick={goPending}
            className="rounded-full bg-[#1e40af] px-3 py-0.5 text-xs font-medium text-white hover:bg-blue-800"
          >
            Go Live
          </button>
          <button
            type="button"
            onClick={() => setPending(null)}
            className="rounded-full border border-slate-300 px-3 py-0.5 text-xs hover:bg-slate-200 dark:border-slate-600 dark:hover:bg-slate-800"
          >
            Dismiss
          </button>
        </span>
      )}

      <button
        type="button"
        onClick={onStop}
        className="ml-auto rounded-full border border-slate-300 px-3 py-0.5 text-xs hover:bg-slate-200 dark:border-slate-600 dark:hover:bg-slate-800"
      >
        Stop listening
      </button>
    </div>
  )
}
