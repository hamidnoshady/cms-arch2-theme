import type { CSSProperties } from 'react'

import type { Media } from '@/lib/cms/types'
import { cn } from '@/lib/utils/cn'
import {
  aspectRatio,
  frameRatioFor,
  isSvg,
  mediaAlt,
  mediaOriginAllowed,
  mediaSrcSet,
  mediaUrl,
  objectPosition,
} from '@/lib/utils/media'

/**
 * CMS media, rendered without Next's image optimizer on purpose: the tenant's media
 * origin is only known at runtime, and an optimizer allowlist wide enough to cover it
 * (`hostname: '**'`) would make `/api/media/file/*` an open proxy. The CMS already
 * produced the size ladder, so `srcset` + explicit `width`/`height` + CSS
 * `aspect-ratio` deliver the same result with no layout shift and no extra surface.
 *
 * The origin is validated against the descriptor's `media.origin` (plus the optional
 * `NEXT_PUBLIC_MEDIA_ORIGIN` override) — a document cannot make the page fetch from
 * an arbitrary host.
 */

export const CmsImage = ({
  alt,
  className,
  media,
  origin,
  overrideOrigin,
  priority = false,
  ratio,
  sizes = '(min-width: 1280px) 25vw, (min-width: 768px) 33vw, 50vw',
  style,
}: {
  alt?: string
  className?: string
  media: Media | null | undefined
  origin: string
  overrideOrigin?: null | string
  priority?: boolean
  ratio?: string
  sizes?: string
  style?: CSSProperties
}) => {
  const allowed = [origin, overrideOrigin].filter((value): value is string => Boolean(value))
  const direct = mediaUrl(media, origin)

  if (!media || !direct || !mediaOriginAllowed(direct, allowed)) {
    return (
      <div
        aria-hidden="true"
        className={cn('skeleton', className)}
        style={{ aspectRatio: ratio ?? frameRatioFor(media), ...style }}
      />
    )
  }

  const vector = isSvg(media)

  return (
    <img
      alt={alt ?? mediaAlt(media)}
      className={className}
      decoding="async"
      fetchPriority={priority ? 'high' : 'auto'}
      height={vector ? undefined : (media.height ?? undefined)}
      loading={priority ? 'eager' : 'lazy'}
      sizes={vector ? undefined : sizes}
      src={direct}
      srcSet={vector ? undefined : mediaSrcSet(media, origin)}
      style={{
        aspectRatio: ratio ?? frameRatioFor(media),
        objectFit: 'cover',
        objectPosition: objectPosition(media),
        ...style,
      }}
      width={vector ? undefined : (media.width ?? undefined)}
    />
  )
}

/** A framed image: the 5px inset structural rectangle lives in `lines.css`. */
export const MediaFrame = ({
  className,
  frameClassName,
  fragmented = false,
  ...props
}: Parameters<typeof CmsImage>[0] & {
  className?: string
  fragmented?: boolean
  frameClassName?: string
}) => (
  <span
    className={cn('frame', fragmented && 'frame--fragmented', className)}
    style={{ aspectRatio: props.ratio ?? aspectRatio(props.media) }}
  >
    <CmsImage className={cn('frame__media', frameClassName)} {...props} />
  </span>
)
