import type { Metadata } from 'next'

import { ContentContainer } from '@/components/design/Container'
import { SectionHeader } from '@/components/design/SectionHeader'
import { EmptyState } from '@/components/states/States'
import { searchPosts } from '@/lib/cms/endpoints'
import { loadPageContext } from '@/lib/cms/pageContext'
import { breadcrumbsFor } from '@/lib/routing/breadcrumbs'
import { href } from '@/lib/routing/locale'
import { articlePath, THEME_ROUTES } from '@/lib/routing/paths'
import { resolveThemeRoute } from '@/lib/routing/resolve'
import { metadataFor } from '@/lib/seo/metadata'
import { labels as dictionary } from '@/lib/theme/labels'
import { InteriorPage } from '@/views/InteriorPage'
import { StateView } from '@/views/StateView'
import type { Locale } from '@/lib/cms/types'

/** `/search` — the CMS search index over posts. Always `noindex`. */
export const searchMetadata = async (locale: Locale): Promise<Metadata> => {
  const outcome = await loadPageContext(locale, THEME_ROUTES.search)
  if (!outcome.ok) return { robots: { follow: false, index: false } }
  const t = dictionary(locale)
  return metadataFor({
    context: outcome.ctx,
    noindex: true,
    path: THEME_ROUTES.search,
    title: `${t.search} — ${outcome.ctx.site.name}`,
  })
}

export const SearchView = async ({ locale, query }: { locale: Locale; query: string }) => {
  const outcome = await loadPageContext(locale, THEME_ROUTES.search)
  if (!outcome.ok) return <StateView locale={locale} outcome={outcome} />
  const ctx = outcome.ctx
  const t = dictionary(locale)
  const hits = query ? await searchPosts(query, locale, ctx.draft) : []
  const route = resolveThemeRoute(['search'], ctx.site)
  const crumbs = breadcrumbsFor(route, ctx.site)

  return (
    <InteriorPage
      context={ctx}
      crumbs={crumbs}
      currentPath={THEME_ROUTES.search}
      label={t.breadcrumb}
      locale={locale}
      // The term is what the visitor typed, so it survives a language switch.
      switchQuery={query ? `?q=${encodeURIComponent(query)}` : ''}
    >
      <SectionHeader title={t.search} />
      <ContentContainer>
        <form action={THEME_ROUTES.search} className="mb-10 flex max-w-[36rem] items-end gap-3" method="get" role="search">
          <div className="field flex-1">
            <label className="field__label" htmlFor="q">
              {t.search}
            </label>
            <input
              className="field__control"
              defaultValue={query}
              id="q"
              name="q"
              placeholder={t.searchPlaceholder}
              type="search"
            />
          </div>
          <button className="btn" type="submit">
            {t.search}
          </button>
        </form>

        {query && hits.length === 0 ? (
          <EmptyState body={t.searchEmpty} locale={locale} title={t.search} />
        ) : (
          <ul>
            {hits.map((hit) => (
              <li className="entry-row" key={hit.id}>
                <div className="min-w-0">
                  <a className="link-inline type-subheading" href={href(articlePath(hit.slug), locale, ctx.site)}>
                    {hit.title}
                  </a>
                  {hit.meta?.description ? (
                    <p className="type-body mt-2 text-ink-secondary">{hit.meta.description}</p>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        )}
      </ContentContainer>
    </InteriorPage>
  )
}
