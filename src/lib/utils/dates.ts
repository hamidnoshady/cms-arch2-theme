import { formatDate } from '@/lib/runtime'
import type { Locale } from '@/lib/cms/types'

/**
 * Date handling for CMS values — deliberately defensive.
 *
 * The contract has two different kinds of "date":
 *
 * - **machine dates** (`publishedAt`, `updatedAt`): ISO strings the CMS generates;
 * - **editor text** (`projectMetadata.date`, fact values): free text such as `۱۴۰۴`,
 *   «بهار ۱۴۰۳» or `2024`. Feeding that to `Intl` throws `RangeError: Invalid time
 *   value`, and one malformed field must never take down a whole page render.
 *
 * So: parse strictly, format only what really is a date, and otherwise show the raw
 * string exactly as the editor wrote it. Nothing is inferred and nothing is invented.
 */

export const parseDate = (value: unknown): Date | null => {
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value
  if (typeof value === 'number') {
    const fromNumber = new Date(value)
    return Number.isNaN(fromNumber.getTime()) ? null : fromNumber
  }
  if (typeof value !== 'string') return null

  const trimmed = value.trim()
  // Only ISO-like values: `2024`, `۱۴۰۴`, `spring` and `بهار` are text, not dates.
  if (!/^\d{4}-\d{2}-\d{2}(?:[T ].*)?$/u.test(trimmed)) return null
  const parsed = new Date(trimmed)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

export type DateStyleOptions = Intl.DateTimeFormatOptions

/** A real date formatted for the locale, or `null` when the value is not a date. */
export const dateText = (
  value: unknown,
  locale: Locale,
  options?: DateStyleOptions,
): null | string => {
  const parsed = parseDate(value)
  if (!parsed) return null
  try {
    return formatDate(parsed, locale, options)
  } catch {
    return null
  }
}

/**
 * A CMS value that may be a date or free text: formatted when it is a date, otherwise
 * returned as the raw string (never dropped, never guessed).
 */
export const dateOrText = (
  value: null | string | undefined,
  locale: Locale,
  options?: DateStyleOptions,
): null | string => {
  const raw = (value ?? '').trim()
  if (!raw) return null
  return dateText(raw, locale, options) ?? raw
}
