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
}

export type Theme = {
  id: string
  name: string
  background: string
  textColor: string
  fontSize: number
}

export type LiveState = {
  /** Id of the schedule item currently live, or null. */
  liveId: string | null
  black: boolean
  logo: boolean
}
