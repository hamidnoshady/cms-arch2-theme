import type { ReactNode } from 'react'

import { CmsImage } from '@/components/media/CmsImage'
import type { SiteContext } from '@/lib/cms/context'
import type { LexicalNode, Media } from '@/lib/cms/types'
import { isMedia } from '@/lib/utils/media'

/**
 * Inline lexical blocks (the `BlocksFeature` inside `posts.content`): `mediaBlock`,
 * `banner` and `code`. Page-level blocks live in `Blocks.tsx`; splitting the two keeps
 * the rich-text renderer free of a circular import.
 */
export const renderBlockNode = (node: LexicalNode, context: SiteContext): ReactNode => {
  const fields = (node.fields ?? {}) as Record<string, unknown>
  const blockType = (fields.blockType as string | undefined) ?? ''

  switch (blockType) {
    case 'mediaBlock': {
      const media = fields.media
      if (!isMedia(media as never)) {
        warnUnknown(`mediaBlock without populated media`)
        return null
      }
      const value = media as Media
      return (
        <figure>
          <span className="frame block" style={{ aspectRatio: `${value.width ?? 3} / ${value.height ?? 2}` }}>
            <CmsImage className="frame__media" media={value} origin={context.site.media.origin} sizes="(min-width: 1024px) 60vw, 100vw" />
          </span>
          {value.alt ? <figcaption className="type-caption mt-2">{value.alt}</figcaption> : null}
        </figure>
      )
    }

    case 'banner': {
      const content = fields.content
      const url = typeof fields.url === 'string' ? fields.url : null
      return (
        <aside className="notice">
          <RichTextContent content={content} context={context} />
          {url ? (
            <a className="link-inline type-ui target-standalone" href={url} rel="noreferrer" target="_blank">
              {url}
            </a>
          ) : null}
        </aside>
      )
    }

    case 'code': {
      const code = typeof fields.code === 'string' ? fields.code : ''
      if (!code) return null
      return (
        <pre className="overflow-x-auto border border-line-structural p-4 text-start" dir="ltr">
          <code>{code}</code>
        </pre>
      )
    }

    default:
      warnUnknown(blockType || String(node.type ?? 'unknown'))
      return null
  }
}

/** Minimal rich-text renderer for inline block payloads (no nested blocks). */
const RichTextContent = ({ content, context }: { content: unknown; context: SiteContext }): ReactNode => {
  const root = (content as { root?: { children?: LexicalNode[]; direction?: string } } | null)?.root
  const children = root?.children ?? []
  if (children.length === 0) return null
  return (
    <div className="prose" dir={root?.direction ?? context.dir}>
      {children.map((child, index) => (
        <p key={`banner-${index}`}>
          {(child.children ?? []).map((text, textIndex) => (
            <span className="bidi-isolate" key={`banner-${index}-${textIndex}`}>
              {text.text ?? ''}
            </span>
          ))}
        </p>
      ))}
    </div>
  )
}

/**
 * Unknown/unsupported blocks are skipped with a diagnostic instead of crashing the
 * page — a customer's page must still render if the CMS offers a block this theme
 * version does not know. Development only: production stays quiet.
 */
export const warnUnknown = (blockType: string): void => {
  if (process.env.NODE_ENV !== 'production') {
    console.warn(`[theme] skipping unsupported block: "${blockType}"`)
  }
}
