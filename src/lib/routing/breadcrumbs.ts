import type { Locale, SiteDescriptor } from '@/lib/cms/types'
import { href } from './locale'
import { THEME_ROUTES } from './paths'
import type { ResolvedRoute } from './resolve'

/**
 * Breadcrumbs are derived from the resolved route, not from content slugs: a bound
 * About page may be filed under `درباره-ما` and still breadcrumb as «درباره ما» at
 * `/about`. `aria-current="page"` marks the leaf; parents are real links.
 */

export type Crumb = { current?: boolean; href?: string; label: string }

const LABELS: Record<Locale, Record<string, string>> = {
  fa: {
    about: 'درباره ما',
    blog: 'یادداشت‌ها',
    contact: 'تماس',
    education: 'آموزش',
    home: 'خانه',
    projects: 'پروژه‌ها',
    search: 'جست‌وجو',
  },
  en: {
    about: 'About',
    blog: 'Notes',
    contact: 'Contact',
    education: 'Education',
    home: 'Home',
    projects: 'Projects',
    search: 'Search',
  },
}

export const sectionLabel = (key: keyof (typeof LABELS)['fa'], locale: Locale): string =>
  LABELS[locale][key] ?? String(key)

export const breadcrumbsFor = (
  route: ResolvedRoute,
  site: Pick<SiteDescriptor, 'defaultLocale'>,
  leaf?: null | string,
): Crumb[] => {
  const t = (key: string) => sectionLabel(key as keyof (typeof LABELS)['fa'], route.locale)
  const home: Crumb = { href: href(THEME_ROUTES.home, route.locale, site), label: t('home') }

  /** An archive is its own leaf: the section name is the current page, not a link. */
  const archive = (section: 'about' | 'blog' | 'contact' | 'education' | 'projects' | 'search'): Crumb[] => [
    home,
    { current: true, label: t(section) },
  ]

  /** A detail page keeps a real link to its archive, then the document title. */
  const detail = (
    section: 'blog' | 'education' | 'projects',
    sectionPath: string,
  ): Crumb[] => [
    home,
    { href: href(sectionPath, route.locale, site), label: t(section) },
    { current: true, label: leaf ?? '' },
  ]

  switch (route.kind) {
    case 'projects':
      return archive('projects')
    case 'project':
      return detail('projects', THEME_ROUTES.projects)
    case 'education':
      return archive('education')
    case 'educationEntry':
      return detail('education', THEME_ROUTES.education)
    case 'blog':
      return archive('blog')
    case 'article':
      return detail('blog', THEME_ROUTES.blog)
    case 'about':
      return archive('about')
    case 'contact':
      return archive('contact')
    case 'search':
      return archive('search')
    case 'page':
      return [home, { current: true, label: leaf ?? route.slug }]
    default:
      return [home]
  }
}
