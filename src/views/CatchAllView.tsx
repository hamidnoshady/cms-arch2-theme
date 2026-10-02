import { notFound, redirect } from 'next/navigation'

import { getSiteOrNull } from '@/lib/cms/endpoints'
import { href } from '@/lib/routing/locale'
import { canonicalRedirect } from '@/lib/routing/canonical'
import { resolveThemeRoute } from '@/lib/routing/resolve'
import type { Locale } from '@/lib/cms/types'
import { PageView } from '@/views/PageView'
import { StateView } from '@/views/StateView'

/**
 * The catch-all resolves everything that is not a fixed section route: CMS pages, the
 * CMS's reserved `/posts…` paths (aliased onto the theme's `/blog`), and the
 * canonical-URL redirect for a bound page reached through its own slug.
 *
 * Fixed sections have real route files, so if one of them arrives here it is simply
 * redirected to that route rather than rendered twice.
 */
export const CatchAllView = async ({ locale, segments }: { locale: Locale; segments: string[] }) => {
  const site = await getSiteOrNull()
  if (!site) return <StateView locale={locale} outcome={{ ok: false, state: 'unreachable' }} />

  const route = resolveThemeRoute(segments, site)

  if (route.kind === 'alias') redirect(href(route.to, locale, site))
  if (route.kind === 'notFound') notFound()

  if (route.kind === 'page') {
    const target = await canonicalRedirect(route, await contextFor(locale, route.slug))
    if (target) redirect(target)
    return <PageView locale={locale} slug={route.slug} />
  }

  // Sections reached through the catch-all (should be handled by their own route files)
  // are redirected so there is exactly one URL shape per section.
  const sectionPath =
    route.kind === 'projects'
      ? '/projects'
      : route.kind === 'education'
        ? '/education'
        : route.kind === 'blog'
          ? '/blog'
          : route.kind === 'about'
            ? '/about'
            : route.kind === 'contact'
              ? '/contact'
              : route.kind === 'search'
                ? '/search'
                : null

  if (sectionPath) redirect(href(sectionPath, locale, site))
  if (route.kind === 'home') redirect(href('/', locale, site))

  notFound()
}

const contextFor = async (locale: Locale, slug: string) => {
  const { getSiteContext } = await import('@/lib/cms/context')
  return getSiteContext(locale, `/${slug}`)
}

/**
 * Metadata runs **before** the streamed shell is flushed, so this is the one place a
 * missing document can still produce a real HTTP 404 instead of a soft 200. The body
 * (below) repeats the same guard for the rendered case.
 */
export const catchAllMetadata = async (locale: Locale, segments: string[]) => {
  const site = await getSiteOrNull()
  if (!site) return { robots: { follow: false, index: false } }
  const route = resolveThemeRoute(segments, site)
  if (route.kind !== 'page') {
    return { robots: { follow: false, index: true } }
  }
  const { getPageBySlug } = await import('@/lib/cms/endpoints')
  const { getSiteContext } = await import('@/lib/cms/context')
  const ctx = await getSiteContext(locale, `/${route.slug}`)
  const page = await getPageBySlug(route.slug, locale, ctx.draft)
  if (!page) notFound()
  return { title: page.title }
}
