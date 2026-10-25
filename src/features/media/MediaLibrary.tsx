import { Panel } from '../../shared/components/ui'

/**
 * Feature: media.
 * Owns images, videos and audio used as backgrounds or standalone items.
 * File picking and playback land with the desktop shell; the web preview
 * keeps this panel as the home for the media library UI.
 */
export function MediaLibrary() {
  return (
    <Panel title="Media" className="h-full">
      <p className="text-sm text-slate-500 dark:text-slate-400">
        Backgrounds, videos and audio live here. Drag files in once the
        desktop shell is connected, and they become available as song
        backgrounds and standalone schedule items.
      </p>
      <ul className="mt-3 space-y-1 text-sm text-slate-500">
        <li>Images — backgrounds and title slides</li>
        <li>Videos — motion backgrounds and clips</li>
        <li>Audio — backing tracks and sound cues</li>
      </ul>
    </Panel>
  )
}
