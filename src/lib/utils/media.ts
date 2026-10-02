import type { Media, MediaRef } from '@/lib/cms/types'

/** Media resolution and geometry. No component builds a media URL by hand. */

export const MEDIA_SIZES = ['thumbnail', 'small', 'medium', 'large', 'xlarge'] as const
export type MediaSizeName = (typeof MEDIA_SIZES)[number]

export const isMedia = (value: MediaRef): value is Media =>
  Boolean(value) && typeof value === 'object' && 'url' in (value as Media)

export const isSvg = (media: Media): boolean => (media.mimeType ?? '').includes('svg')

/**
 * Allowed media origins. The descriptor's `media.origin` is the CMS's own origin (the
 * object-storage bucket stays private; files stream through `/api/media/file/*`), and
 * `NEXT_PUBLIC_MEDIA_ORIGIN` is an explicit deployment override. Anything else is
 * refused rather than fetched, so a document cannot turn the renderer into an SSRF
 * gadget or a hotlink.
 */
export const mediaOriginAllowed = (candidate: string, allowed: string[]): boolean => {
  try {
    const url = new URL(candidate)
    if (url.protocol !== 'https:' && url.protocol !== 'http:') return false
    return allowed.some((origin) => {
      try {
        return new URL(origin).origin === url.origin
      } catch {
        return false
      }
    })
  } catch {
    return false
  }
}

export type MediaLike = { height?: null | number; url?: null | string; width?: null | number }

export const mediaUrl = (media: MediaLike | null | undefined, origin: string): null | string => {
  const raw = media?.url
  if (!raw) return null
  try {
    const resolved = new URL(raw, origin)
    return resolved.toString()
  } catch {
    return null
  }
}

export const sizeUrl = (
  media: Media | null | undefined,
  size: MediaSizeName,
  origin: string,
): null | string => mediaUrl(media?.sizes?.[size] ?? media ?? null, origin)

/**
 * `srcset` from the CMS-rendered sizes. A viewer on a 390px phone downloads the 600w
 * file for a grid card instead of the 1920w original.
 */
export const mediaSrcSet = (
  media: Media | null | undefined,
  origin: string,
  sizes: MediaSizeName[] = ['small', 'medium', 'large'],
): undefined | string => {
  if (!media || isSvg(media)) return undefined
  const entries = sizes
    .map((size) => {
      const candidate = media.sizes?.[size]
      const url = mediaUrl(candidate ?? null, origin)
      const width = candidate?.width
      return url && width ? `${url} ${width}w` : null
    })
    .filter((value): value is string => Boolean(value))
  const original = mediaUrl(media, origin)
  if (original && media.width) entries.push(`${original} ${media.width}w`)
  return entries.length > 1 ? entries.join(', ') : undefined
}

export const aspectRatio = (media: Media | null | undefined): string => {
  const width = media?.width ?? 4
  const height = media?.height ?? 3
  if (!width || !height) return '4 / 3'
  return `${width} / ${height}`
}

export type Orientation = 'landscape' | 'portrait' | 'square'

export const orientationOf = (media: Media | null | undefined): Orientation => {
  const width = media?.width ?? 0
  const height = media?.height ?? 0
  if (!width || !height) return 'landscape'
  const ratio = width / height
  if (ratio > 1.15) return 'landscape'
  if (ratio < 0.87) return 'portrait'
  return 'square'
}

/** Portrait media keeps a portrait frame (3:4); landscape keeps 3:2. */
export const frameRatioFor = (media: Media | null | undefined): string => {
  switch (orientationOf(media)) {
    case 'portrait':
      return '3 / 4'
    case 'square':
      return '1 / 1'
    default:
      return '3 / 2'
  }
}

export const objectPosition = (media: Media | null | undefined): undefined | string => {
  const x = media?.focalX
  const y = media?.focalY
  if (typeof x !== 'number' || typeof y !== 'number') return undefined
  return `${Math.round(x)}% ${Math.round(y)}%`
}

export const mediaAlt = (media: Media | null | undefined, fallback = ''): string =>
  (media?.alt ?? '').trim() || fallback
