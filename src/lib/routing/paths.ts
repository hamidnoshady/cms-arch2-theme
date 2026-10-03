/**
 * One place builds theme URLs. `/posts` exists in the CMS contract as the reserved
 * blog route; this theme's canonical blog route is `/blog`, so `/posts/<slug>` is an
 * alias that redirects (see `resolve.ts`) and `/posts` lands on the blog index.
 */

export const THEME_ROUTES = {
  about: '/about',
  blog: '/blog',
  contact: '/contact',
  education: '/education',
  home: '/',
  projects: '/projects',
  search: '/search',
} as const

export const projectsPath = (page = 1): string =>
  page > 1 ? `${THEME_ROUTES.projects}?page=${page}` : THEME_ROUTES.projects

export const projectPath = (slug: string): string => `${THEME_ROUTES.projects}/${encodeURIComponent(slug)}`

export const educationPath = (page = 1): string =>
  page > 1 ? `${THEME_ROUTES.education}?page=${page}` : THEME_ROUTES.education

export const educationEntryPath = (slug: string): string =>
  `${THEME_ROUTES.education}/${encodeURIComponent(slug)}`

export const blogPath = (page = 1): string =>
  page > 1 ? `${THEME_ROUTES.blog}?page=${page}` : THEME_ROUTES.blog

export const articlePath = (slug: string): string => `${THEME_ROUTES.blog}/${encodeURIComponent(slug)}`

export const searchPath = (query?: string): string =>
  query ? `${THEME_ROUTES.search}?q=${encodeURIComponent(query)}` : THEME_ROUTES.search

/** Query for a category filter inside an archive. */
export const categoryQuery = (slug: string): string => `?category=${encodeURIComponent(slug)}`

export const pageQueryParam = (page: number): string => (page > 1 ? `?page=${page}` : '')
