/**
 * Feature: voice — what was said, as a scripture or a command.
 * "Turn with me to John chapter three verse sixteen", "First Corinthians
 * thirteen", "Psalm 23 in the NIV", "next verse". Numbers may arrive as
 * words or digits; Whisper usually writes digits. Pure text in, plain
 * data out, so it is easy to test.
 */

export type ScriptureCall = {
  kind: 'scripture'
  book: string
  chapter: number
  verse: number
  endVerse?: number
  /** A chapter with no verse said: show all of it. */
  wholeChapter?: boolean
  /** The version asked for, as its usual abbreviation (NIV, KJV...). */
  version?: string
}

export type VoiceCommand = { kind: 'command'; action: 'next' | 'previous' }

/** [name, chapters has numbered form (1, 2, 3)] */
const BOOKS: { name: string; aliases: string[]; numbered?: number[]; oneChapter?: boolean }[] = [
  { name: 'Genesis', aliases: ['genesis'] },
  { name: 'Exodus', aliases: ['exodus'] },
  { name: 'Leviticus', aliases: ['leviticus'] },
  { name: 'Numbers', aliases: ['numbers'] },
  { name: 'Deuteronomy', aliases: ['deuteronomy'] },
  { name: 'Joshua', aliases: ['joshua'] },
  { name: 'Judges', aliases: ['judges'] },
  { name: 'Ruth', aliases: ['ruth'] },
  { name: 'Samuel', aliases: ['samuel'], numbered: [1, 2] },
  { name: 'Kings', aliases: ['kings'], numbered: [1, 2] },
  { name: 'Chronicles', aliases: ['chronicles'], numbered: [1, 2] },
  { name: 'Ezra', aliases: ['ezra'] },
  { name: 'Nehemiah', aliases: ['nehemiah'] },
  { name: 'Esther', aliases: ['esther'] },
  { name: 'Job', aliases: ['job'] },
  { name: 'Psalms', aliases: ['psalms', 'psalm'] },
  { name: 'Proverbs', aliases: ['proverbs', 'proverb'] },
  { name: 'Ecclesiastes', aliases: ['ecclesiastes'] },
  { name: 'Song of Solomon', aliases: ['song of solomon', 'song of songs', 'songs of solomon'] },
  { name: 'Isaiah', aliases: ['isaiah'] },
  { name: 'Jeremiah', aliases: ['jeremiah'] },
  { name: 'Lamentations', aliases: ['lamentations'] },
  { name: 'Ezekiel', aliases: ['ezekiel'] },
  { name: 'Daniel', aliases: ['daniel'] },
  { name: 'Hosea', aliases: ['hosea'] },
  { name: 'Joel', aliases: ['joel'] },
  { name: 'Amos', aliases: ['amos'] },
  { name: 'Obadiah', aliases: ['obadiah'], oneChapter: true },
  { name: 'Jonah', aliases: ['jonah'] },
  { name: 'Micah', aliases: ['micah'] },
  { name: 'Nahum', aliases: ['nahum'] },
  { name: 'Habakkuk', aliases: ['habakkuk'] },
  { name: 'Zephaniah', aliases: ['zephaniah'] },
  { name: 'Haggai', aliases: ['haggai'] },
  { name: 'Zechariah', aliases: ['zechariah'] },
  { name: 'Malachi', aliases: ['malachi'] },
  { name: 'Matthew', aliases: ['matthew'] },
  { name: 'Mark', aliases: ['mark'] },
  { name: 'Luke', aliases: ['luke'] },
  { name: 'John', aliases: ['john'], numbered: [1, 2, 3] },
  { name: 'Acts', aliases: ['acts of the apostles', 'acts'] },
  { name: 'Romans', aliases: ['romans'] },
  { name: 'Corinthians', aliases: ['corinthians'], numbered: [1, 2] },
  { name: 'Galatians', aliases: ['galatians'] },
  { name: 'Ephesians', aliases: ['ephesians'] },
  { name: 'Philippians', aliases: ['philippians'] },
  { name: 'Colossians', aliases: ['colossians'] },
  { name: 'Thessalonians', aliases: ['thessalonians'], numbered: [1, 2] },
  { name: 'Timothy', aliases: ['timothy'], numbered: [1, 2] },
  { name: 'Titus', aliases: ['titus'] },
  { name: 'Philemon', aliases: ['philemon'], oneChapter: true },
  { name: 'Hebrews', aliases: ['hebrews'] },
  { name: 'James', aliases: ['james'] },
  { name: 'Peter', aliases: ['peter'], numbered: [1, 2] },
  { name: 'Jude', aliases: ['jude'], oneChapter: true },
  { name: 'Revelation', aliases: ['revelation of john', 'revelations', 'revelation'] },
]

const VERSIONS: [string, string[]][] = [
  ['NKJV', ['new king james', 'nkjv']],
  ['KJV', ['king james', 'kjv']],
  ['NIV', ['new international', 'niv']],
  ['NLT', ['new living translation', 'new living', 'nlt']],
  ['AMPC', ['amplified classic', 'ampc']],
  ['AMP', ['amplified', 'amp']],
  ['MSG', ['the message', 'msg']],
  ['GNT', ['good news', 'gnt']],
  ['ESV', ['english standard', 'esv']],
  ['NASB', ['new american standard', 'nasb']],
  ['TPT', ['the passion translation', 'passion translation', 'tpt']],
  ['BSB', ['berean standard', 'berean', 'bsb']],
  ['YLT', ['youngs literal', "young's literal", 'ylt']],
  ['ASV', ['american standard', 'asv']],
  ['WEB', ['world english', 'web']],
]

const UNITS: Record<string, number> = {
  zero: 0, oh: 0, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9,
  ten: 10, eleven: 11, twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15, sixteen: 16,
  seventeen: 17, eighteen: 18, nineteen: 19,
}
const TENS: Record<string, number> = {
  twenty: 20, thirty: 30, forty: 40, fifty: 50, sixty: 60, seventy: 70, eighty: 80, ninety: 90,
}
const ORDINALS: Record<string, number> = {
  first: 1, second: 2, third: 3, '1st': 1, '2nd': 2, '3rd': 3,
}

/** "twenty-three" and "one hundred nineteen" become 23 and 119; other words stay. */
function numberWordsToDigits(tokens: string[]): string[] {
  const out: string[] = []
  let at = 0
  const isNumberWord = (word: string | undefined) =>
    word !== undefined && (word in UNITS || word in TENS || word === 'hundred')
  while (at < tokens.length) {
    const word = tokens[at]
    if (!isNumberWord(word) || (word === 'oh' && !isNumberWord(tokens[at + 1]))) {
      out.push(word)
      at += 1
      continue
    }
    let value = 0
    let used = 0
    // [units] hundred
    if (word in UNITS && tokens[at + 1] === 'hundred') {
      value = UNITS[word] * 100
      used = 2
    } else if (word === 'hundred') {
      value = 100
      used = 1
    }
    if (used > 0 && tokens[at + used] === 'and') used += 1
    const next = tokens[at + used]
    if (next !== undefined && next in TENS) {
      value += TENS[next]
      used += 1
      const unit = tokens[at + used]
      if (unit !== undefined && unit in UNITS && UNITS[unit] > 0 && UNITS[unit] < 10) {
        value += UNITS[unit]
        used += 1
      }
    } else if (next !== undefined && next in UNITS && (value > 0 || false) && next !== 'oh') {
      value += UNITS[next]
      used += 1
    } else if (used === 0) {
      if (word in TENS) {
        value = TENS[word]
        used = 1
        const unit = tokens[at + 1]
        if (unit !== undefined && unit in UNITS && UNITS[unit] > 0 && UNITS[unit] < 10) {
          value += UNITS[unit]
          used += 1
        }
      } else {
        value = UNITS[word]
        used = 1
      }
    }
    out.push(String(value))
    at += used
  }
  return out
}

function normalise(text: string): string {
  return text
    .toLowerCase()
    .replace(/’/g, "'")
    .replace(/(\d)\s*[:.]\s*(\d)/g, '$1 verse $2')
    .replace(/(\d)\s*[-–]\s*(\d)/g, '$1 to $2')
    .replace(/[^a-z0-9' ]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/** Reads one scripture or command out of what was said; null when it is neither. */
export function parseSpoken(text: string): ScriptureCall | VoiceCommand | null {
  let said = normalise(text)
  if (!said) return null

  // The version, named anywhere ("in the NIV", "King James version").
  let version: string | undefined
  for (const [abbr, names] of VERSIONS) {
    for (const name of names) {
      const found = new RegExp(`\\b${name}\\b( version| translation| bible)?`).exec(said)
      if (found) {
        version = abbr
        said = said.replace(found[0], ' ')
        break
      }
    }
    if (version) break
  }
  said = said.replace(/\b(version|translation)\b/g, ' ').replace(/\s+/g, ' ').trim()

  const tokens = numberWordsToDigits(said.split(' '))
  const joined = tokens.join(' ')

  // A book and what follows it.
  let best: { name: string; index: number; length: number; prefix: number | null; oneChapter: boolean } | null = null
  for (const book of BOOKS) {
    for (const alias of book.aliases) {
      const found = new RegExp(`(?:\\b(1|2|3|first|second|third|1st|2nd|3rd)\\s+)?\\b${alias}\\b`).exec(joined)
      if (!found) continue
      let prefix: number | null = null
      if (found[1] && book.numbered) {
        const n = ORDINALS[found[1]] ?? Number(found[1])
        if (book.numbered.includes(n)) prefix = n
      }
      if (book.numbered && prefix === null && found[1]) {
        // The number belongs to something else ("chapter 3 john"): keep the plain book.
      }
      const start = prefix !== null ? found.index : found.index + (found[0].length - alias.length)
      const length = prefix !== null ? found[0].length : alias.length
      if (!best || length > best.length) {
        best = { name: book.name, index: start, length, prefix, oneChapter: Boolean(book.oneChapter) }
      }
    }
  }
  // "John" alone with a number first is 1, 2 or 3 John only when a prefix was spoken.
  if (best) {
    const after = joined.slice(best.index + best.length).trim().split(' ').filter(Boolean)
    const nums: number[] = []
    let sawRange = false
    for (const [i, token] of after.entries()) {
      if (/^\d+$/.test(token)) nums.push(Number(token))
      else if (token === 'to' || token === 'through' || token === 'until') {
        if (nums.length > 0 && /^\d+$/.test(after[i + 1] ?? '')) sawRange = true
      }
    }
    const name = best.prefix !== null ? `${best.prefix} ${best.name}` : best.name
    const single = best.oneChapter || (best.prefix !== null && best.prefix >= 2 && best.name === 'John')
    const call = (chapter: number, verse: number, endVerse?: number, whole?: boolean): ScriptureCall => ({
      kind: 'scripture',
      book: name,
      chapter,
      verse,
      ...(endVerse && endVerse > verse ? { endVerse } : {}),
      ...(whole ? { wholeChapter: true } : {}),
      ...(version ? { version } : {}),
    })
    if (nums.length === 0) return null
    if (single && nums.length <= 2 && !after.includes('chapter')) {
      return call(1, nums[0], sawRange ? nums[1] : undefined)
    }
    if (nums.length === 1) return call(nums[0], 1, undefined, true)
    if (sawRange && nums.length >= 3) return call(nums[0], nums[1], nums[2])
    return call(nums[0], nums[1])
  }

  if (/\b(next|following|forward)( verse| slide| one)?\b/.test(joined) && joined.split(' ').length <= 4) {
    return { kind: 'command', action: 'next' }
  }
  if (/\b(previous|last|back|before)( verse| slide| one)?\b/.test(joined) && joined.split(' ').length <= 4) {
    return { kind: 'command', action: 'previous' }
  }
  return null
}

export function referenceOf(call: ScriptureCall): string {
  const end = call.endVerse ? `-${call.endVerse}` : ''
  return call.wholeChapter ? `${call.book} ${call.chapter}` : `${call.book} ${call.chapter}:${call.verse}${end}`
}
