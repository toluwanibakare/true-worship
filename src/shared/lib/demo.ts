import type { ScheduleItem, Song, Theme } from './types'

/** Amazing Grace is public domain, so it is safe demo content. */
export const demoSongs: Song[] = [
  {
    id: 'amazing-grace',
    title: 'Amazing Grace',
    author: 'John Newton',
    source: 'public-domain',
    verses: [
      {
        label: 'Verse 1',
        lines: [
          'Amazing grace, how sweet the sound',
          'That saved a wretch like me',
          'I once was lost, but now am found',
          'Was blind, but now I see',
        ],
      },
      {
        label: 'Verse 2',
        lines: [
          'Twas grace that taught my heart to fear',
          'And grace my fears relieved',
          'How precious did that grace appear',
          'The hour I first believed',
        ],
      },
    ],
  },
]

export const demoSchedule: ScheduleItem[] = [
  { id: 's1', type: 'song', title: 'Amazing Grace', ref: 'amazing-grace' },
  { id: 's2', type: 'scripture', title: 'John 3:16', ref: 'John 3:16' },
  { id: 's3', type: 'custom', title: 'Welcome and Notices', ref: '' },
]

export const demoThemes: Theme[] = [
  { id: 'dark', name: 'Dark Stage', background: '#0f172a', textColor: '#ffffff', fontSize: 44, fontFamily: "'Calibri', 'Carlito', Arial, sans-serif" },
  { id: 'light', name: 'Light', background: '#f8fafc', textColor: '#0f172a', fontSize: 44, fontFamily: "'Calibri', 'Carlito', Arial, sans-serif" },
]

export const demoPassage: Record<string, string> = {
  'John 3:16':
    'For God so loved the world, that he gave his only begotten Son, ' +
    'that whosoever believeth in him should not perish, but have everlasting life.',
}
