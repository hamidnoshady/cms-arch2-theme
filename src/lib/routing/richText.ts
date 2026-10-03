import 'server-only'

import type { SiteContext } from '@/lib/cms/context'
import { getPageById, getPostsByIds } from '@/lib/cms/endpoints'
import { pagePath } from '@/lib/runtime'
import type { LexicalNode } from '@/lib/cms/types'

import { href } from './locale'
import { postHref } from '@/lib/cms/content'

/**
 * Internal links inside rich text (and inside inline blocks) are stored as document
 * ids. They are resolved in one batch per rich-text field — never one request per
 * anchor — and always through the same URL helpers the menus use.
 */

export type RichTextLink = {
  href: string
  newTab: boolean
}

const visit = (node: LexicalNode, fn: (node: LexicalNode) => void): void => {
  fn(node)
  for (const child of node.children ?? []) visit(child, fn)
}

/** Resolve every document reference in `content` to a theme URL. */
export const resolveRichTextLinks = async (
  content: null | { root?: { children?: LexicalNode[] } },
  ctx: SiteContext,
): Promise<Map<string, RichTextLink>> => {
  const map = new Map<string, RichTextLink>()
  const pageIds: string[] = []
  const postIds: string[] = []

  for (const child of content?.root?.children ?? []) {
    visit(child, (node) => {
      const fields = (node.fields ?? {}) as Record<string, unknown>
      const doc = fields.doc as { relationTo?: string; value?: string } | undefined
      if (!doc?.value) return
      if (doc.relationTo === 'posts') postIds.push(doc.value)
      else pageIds.push(doc.value)
    })
  }

  const pages = await Promise.all(pageIds.map((id) => getPageById(id, ctx.locale, ctx.draft)))
  for (const page of pages) {
    if (page) map.set(`pages:${page.id}`, { href: href(pagePath(page.slug), ctx.locale, ctx.site), newTab: false })
  }

  for (const post of await getPostsByIds(postIds, ctx.locale, ctx.draft)) {
    map.set(`posts:${post.id}`, { href: href(await postHref(post, ctx), ctx.locale, ctx.site), newTab: false })
  }

  return map
}
