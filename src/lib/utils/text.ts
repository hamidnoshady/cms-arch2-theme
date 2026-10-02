/** Text helpers that are honest about what they can and cannot derive. */

/** Whole minutes of reading, from the real word count of the rendered copy. */
export const readingMinutes = (text: string, wordsPerMinute = 200): number => {
  const words = text.trim().split(/\s+/u).filter(Boolean).length
  if (words === 0) return 0
  return Math.max(1, Math.round(words / wordsPerMinute))
}

export const truncate = (value: string, max: number): string =>
  value.length <= max ? value : `${value.slice(0, Math.max(0, max - 1)).trimEnd()}…`

/** Digits-only string comparison, used to decide whether a label is redundant. */
export const compactStrings = (values: (null | string | undefined)[]): string[] =>
  values.map((v) => (v ?? '').trim()).filter((v) => v.length > 0)
