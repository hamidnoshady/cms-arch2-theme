import type { Metadata } from 'next'

import { ContentContainer } from '@/components/design/Container'
import { Rule } from '@/components/design/Rule'
import { SectionHeader } from '@/components/design/SectionHeader'
import { ArticleRow, LatestNote, LeadStory } from '@/components/blog/PostRows'
import { Pagination } from '@/components/design/Pagination'
import { EmptyState } from '@/components/states/States'
import { getArchive, getSectionCategories, postHref } from '@/lib/cms/content'
import { loadPageContext } from '@/lib/cms/pageContext'
import { breadcrumbsFor } from '@/lib/routing/breadcrumbs'
import { href } from '@/lib/routing/locale'
import { blogPath, THEME_ROUTES } from '@/lib/routing/paths'
import { resolveThemeRoute } from '@/lib/routing/resolve'
import { metadataFor } from '@/lib/seo/metadata'
import { labels as dictionary } from '@/lib/theme/labels'
import { lexicalText } from '@/lib/utils/lexical'
import { readingMinutes } from '@/lib/utils/text'
import { InteriorPage } from '@/views/InteriorPage'
import { StateView } from '@/views/StateView'
import type { Locale } from '@/lib/cms/types'

/**
 * Blog index — text-led, structurally different from Projects and Education:
 * a lead story, a "latest notes" column divided from it by a fine vertical rule, then
 * article rows with small thumbnails and hairline separators.
 */
export const blogMetadata = async (locale: Locale, page: number): Promise<Metadata> => {
  const outcome = await loadPageContext(locale, THEME_ROUTES.blog)
  if (!outcome.ok) return { robots: { follow: false, index: false } }
  const t = dictionary(locale)
  return metadataFor({
    context: outcome.ctx,
    noindex: page > 1,
    path: blogPath(page),
    title: `${t.blog} — ${outcome.ctx.site.name}`,
  })
}

export const BlogIndexView = async ({ locale, page }: { locale: Locale; page: number }) => {
  const outcome = await loadPageContext(locale, THEME_ROUTES.blog)
  if (!outcome.ok) return <StateView locale={locale} outcome={outcome} />
  const ctx = outcome.ctx
  const t = dictionary(locale)

  const [archive, section] = await Promise.all([
    getArchive(ctx, { limit: 13, page, section: 'blog' }),
    getSectionCategories('blog', ctx),
  ])
  const [lead, ...others] = archive.docs
  const latest = others.slice(0, 4)
  const rows = others.slice(4)
  const route = resolveThemeRoute(['blog'], ctx.site)
  const crumbs = breadcrumbsFor(route, ctx.site)

  const hrefFor = async (post: (typeof archive.docs)[number]): Promise<string> =>
    href(await postHref(post, ctx), locale, ctx.site)

  return (
    <InteriorPage context={ctx} crumbs={crumbs} currentPath={THEME_ROUTES.blog} label={t.breadcrumb} locale={locale}>
      <SectionHeader
        actions={
          section.children.length > 0 ? (
            <div className="filter-group">
              <span className="type-label me-2">{t.filterLabel}</span>
              {section.children.map((child) => (
                <a className="filter-chip" href={`${THEME_ROUTES.blog}?category=${encodeURIComponent(child.slug)}`} key={child.id}>
                  {child.title}
                </a>
              ))}
            </div>
          ) : null
        }
        mark="pair"
        title={t.blog}
      />

      {!lead ? (
        <ContentContainer>
          <EmptyState locale={locale} />
        </ContentContainer>
      ) : (
        <ContentContainer>
          <div className="split">
            <div>
              <LeadStory
                category={null}
                context={ctx}
                href={await hrefFor(lead)}
                minutes={readingMinutes(lexicalText(lead.content as never))}
                post={lead}
              />
            </div>
            <span aria-hidden="true" className="split__divider rule-v" />
            <div>
              <h2 className="type-label mb-2">{t.latestNotes}</h2>
              <ul>
                {latest.map((post) => (
                  <LatestNote context={ctx} href={articleHref(ctx, post)} key={post.id} post={post} />
                ))}
              </ul>
            </div>
          </div>

          {rows.length > 0 ? (
            <>
              <Rule className="mt-12" />
              <ul className="mt-2">
                {rows.map((post) => (
                  <ArticleRow
                    category={null}
                    context={ctx}
                    href={articleHref(ctx, post)}
                    key={post.id}
                    minutes={readingMinutes(lexicalText(post.content as never))}
                    post={post}
                  />
                ))}
              </ul>
            </>
          ) : null}

          <Pagination
            basePath={THEME_ROUTES.blog}
            currentPage={page}
            labels={{ next: t.next, previous: t.previous }}
            totalPages={archive.totalPages}
          />
        </ContentContainer>
      )}
    </InteriorPage>
  )
}

/** Synchronous link for list items: the blog route is canonical for plain posts. */
const articleHref = (
  ctx: { locale: Locale; site: { defaultLocale: Locale } },
  post: { slug: string },
): string => href(`/blog/${encodeURIComponent(post.slug)}`, ctx.locale, ctx.site)
