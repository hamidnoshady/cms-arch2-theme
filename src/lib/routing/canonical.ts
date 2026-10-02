import 'server-only'

import type { SiteContext } from '@/lib/cms/context'
import { getSectionRef, getSectionCategories, getPostContext } from '@/lib/cms/content'
import { getPageBySlug } from '@/lib/cms/endpoints'

import { href } from './locale'
import { THEME_ROUTES } from './paths'
import type { ResolvedRoute } from './resolve'

/**
 * One canonical URL per document.
 *
 * The routes belong to the theme, so a document reached through its own editable slug
 * — an old bookmark, a rich-text link — is redirected to the section route that owns
 * it. Navigation already links by id, so this only closes the second-URL hole; it is
 * skipped entirely in preview so an editor can still open a document by slug.
 */
export const canonicalRedirect = async (
  route: ResolvedRoute,
  ctx: SiteContext,
): Promise<null | string> => {
  if (ctx.draft) return null

  if (route.kind === 'page') {
    const page = await getPageBySlug(route.slug, ctx.locale, ctx.draft)
    if (!page) return null
    const id = String(page.id)
    for (const section of ['home', 'about', 'contact'] as const) {
      const ref = getSectionRef(section, ctx)
      if (ref.by === 'binding' && ref.id === id) {
        const path = section === 'home' ? THEME_ROUTES.home : section === 'about' ? THEME_ROUTES.about : THEME_ROUTES.contact
        return href(path, ctx.locale, ctx.site)
      }
    }
    return null
  }

  if (route.kind === 'article' || route.kind === 'project' || route.kind === 'educationEntry') {
    const data = await getPostContext(route.slug, ctx)
    if (!data) return null
    const [projects, education] = await Promise.all([
      getSectionCategories('projects', ctx),
      getSectionCategories('education', ctx),
    ])
    const trueSection = data.section
    const canonical =
      trueSection === 'projects'
        ? `${THEME_ROUTES.projects}/${encodeURIComponent(route.slug)}`
        : trueSection === 'education'
          ? `${THEME_ROUTES.education}/${encodeURIComponent(route.slug)}`
          : `${THEME_ROUTES.blog}/${encodeURIComponent(route.slug)}`

    if (route.kind === 'article' && trueSection === 'blog') return null
    if (route.kind === 'project' && trueSection === 'projects' && projects.root) return null
    if (route.kind === 'educationEntry' && trueSection === 'education' && education.root) return null
    void projects
    void education
    return href(canonical, ctx.locale, ctx.site)
  }

  return null
}
