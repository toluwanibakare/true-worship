export type Verse = {
  label: string
  lines: string[]
}

export type Song = {
  id: string
  title: string
  author: string
  verses: Verse[]
  /** CCLI number, when the church holds a licence for this song. */
  ccli?: string
  /** Copyright line, for example "Public Domain" or a publisher credit. */
  copyright?: string
  /** Where the lyric came from: public domain, owned, licensed, community. */
  source: 'public-domain' | 'owned' | 'licensed' | 'community'
}

export type ScriptureSlide = {
  reference: string
  text: string
}

export type ScheduleItemType = 'song' | 'scripture' | 'media' | 'custom'

export type ScheduleItem = {
  id: string
  type: ScheduleItemType
  title: string
  /** Id of the song, passage reference, or media file behind this item. */
  ref: string
  /** An item can carry its own slides, one entry of lines each: a scripture added from the
   * Scriptures table (its verses), or a custom item such as the welcome and notices... */
  slides?: string[][]
  /** ...and the version they were read from, e.g. KJV. */
  version?: string
}

export type Theme = {
  id: string
  name: string
  background: string
  textColor: string
  fontSize: number
  /** Slide font stack. Calibri first, with open fallbacks. */
  fontFamily: string
  /** Slide text is bold by default, as worship slides usually are. */
  bold: boolean
}

export type LiveState = {
  /** Id of the schedule item currently live, or null. */
  liveId: string | null
  black: boolean
  logo: boolean
}

export type DisplayInfo = {
  id: number
  label: string
  x: number
  y: number
  width: number
  height: number
  scaleFactor: number
  primary: boolean
}

export type DisplaySettings = {
  /** 'auto' = the external display when one exists, else the primary. */
  displayId: number | 'auto'
  fullscreen: boolean
  alwaysOnTop: boolean
}

export type NdiStatus = {
  available: boolean
  reason?: string
  version?: string
  sending: boolean
  sourceName: string
}

export type NdiOptions = {
  enabled: boolean
  sourceName: string
  /** Frames per second for the capture loop. */
  fps: number
}
