import { ContentContainer } from '@/components/design/Container'
import { Skeleton } from '@/components/ui/skeleton'
import { loadPageContext } from '@/lib/cms/pageContext'
import { breadcrumbsFor } from '@/lib/routing/breadcrumbs'
import { resolveThemeRoute } from '@/lib/routing/resolve'
import { labels as dictionary } from '@/lib/theme/labels'
import { InteriorPage } from '@/views/InteriorPage'
import { ArticleRowsSkeleton, EntryRowsSkeleton, PageSkeleton, ProjectGridSkeleton } from '@/components/states/States'
import type { Locale } from '@/lib/cms/types'

/**
 * Segment-level loading UI.
 *
 * Two rules make this worth its weight:
 *
 * 1. **The shell stays.** The bar the visitor just clicked in, the footer and the
 *    breadcrumb row are the *real* ones — they come from the same chrome the resolved
 *    page renders, so a slow archive never flashes a blank white screen or shifts the
 *    layout when the content lands.
 * 2. **The skeleton is the real geometry.** Each variant mirrors the component it
 *    replaces: the project grid keeps its 4/3/2 columns (two columns at 390px, exactly
 *    like the archive), the article variant keeps the lead-story/rows rhythm, the entry
 *    variant keeps the small inline-start thumbnail. Nothing here is a generic grey box.
 *
 * Chrome data (`/api/site`, header, footer) is cached by the CMS client, so the shell
 * is normally already warm by the time a visitor navigates; only the archive's own
 * collection read is slow.
 */

export type LoadingVariant = 'article' | 'detail' | 'entries' | 'page' | 'projects' | 'search'

const skeletonFor = (variant: LoadingVariant) => {
  switch (variant) {
    case 'projects':
      return <ProjectGridSkeleton />
    case 'entries':
      return <EntryRowsSkeleton />
    case 'article':
      return <ArticleRowsSkeleton />
    case 'search':
      return (
        <div className="py-10">
          <Skeleton className="mb-8 h-9 w-1/3" />
          <ArticleRowsSkeleton count={3} />
        </div>
      )
    case 'detail':
    case 'page':
    default:
      return <PageSkeleton />
  }
}

export const SectionLoading = async ({
  locale,
  path,
  route,
  variant,
}: {
  locale: Locale
  /** Localizable path of the route being loaded, e.g. `/projects`. */
  path: string
  /** Locale-aware segment list for breadcrumb resolution, e.g. `['en', 'projects']`. */
  route: string[]
  variant: LoadingVariant
}) => {
  const outcome = await loadPageContext(locale, path)
  const t = dictionary(locale)
  const skeleton = skeletonFor(variant)

  // Chrome unavailable: the skeleton is still the honest thing to show. It is
  // deliberately not the holding or error state — those belong to a resolved read.
  if (!outcome.ok) {
    return (
      <ContentContainer>
        <div className="py-10">{skeleton}</div>
      </ContentContainer>
    )
  }

  const ctx = outcome.ctx
  const crumbs = breadcrumbsFor(resolveThemeRoute(route, ctx.site), ctx.site)

  return (
    <InteriorPage context={ctx} crumbs={crumbs} currentPath={path} label={t.breadcrumb} locale={locale}>
      <ContentContainer>
        <div className="py-10">{skeleton}</div>
      </ContentContainer>
    </InteriorPage>
  )
}
