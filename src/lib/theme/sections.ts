/**
 * Pure section-resolution rules. No fetch, no React, no `headers()` — so the same
 * rules drive routes, navigation, breadcrumbs and the sitemap, and a unit test can
 * prove the precedence without a CMS.
 *
 * ## Content slots: the customer chooses the document, the theme keeps the URL
 * `GET /api/site` → `themeRuntime.bindings.<slot>` resolves a slot to
 * `{ id, type, slug, title }` (or `null` when unbound). A bound id wins. The slug
 * fallback (`about`, `projects`, …) is a **first-run hint**, used only when the slot
 * has no binding — never as a second opinion beside one, and never to substitute a
 * different document that happens to share a slug in another locale.
 */

export type SectionKey = 'about' | 'blog' | 'contact' | 'education' | 'home' | 'projects'

export type SectionKind = 'category' | 'page'

export type SectionRule = {
  kind: SectionKind
  /** Slug used only when the slot is unbound (freshly provisioned site). */
  hint: null | string
  /** `contentSlots` key declared in `eshobe.theme.json`. */
  slot: string
}

export const SECTIONS: Record<SectionKey, SectionRule> = {
  home: { kind: 'page', slot: 'home', hint: 'home' },
  about: { kind: 'page', slot: 'about', hint: 'about' },
  contact: { kind: 'page', slot: 'contact', hint: 'contact' },
  projects: { kind: 'category', slot: 'projectsCategory', hint: 'projects' },
  education: { kind: 'category', slot: 'educationCategory', hint: 'education' },
  blog: { kind: 'category', slot: 'blogCategory', hint: null },
}

export type BindingValue = null | { id: string; slug: null | string; title: null | string }

export type SectionRef =
  | { by: 'binding'; id: string; slug: null | string; source: 'bound' }
  | { by: 'slug'; slug: string; source: 'hint' }
  | { by: 'none'; source: 'unbound' }

/**
 * Precedence: a saved binding → the slug hint (only when the slot is unbound) →
 * nothing (the route renders its empty state rather than guessing).
 */
export const resolveSectionRef = (
  section: SectionKey,
  bindings: Record<string, BindingValue> | null | undefined,
): SectionRef => {
  const rule = SECTIONS[section]
  const binding = bindings?.[rule.slot]
  if (binding && binding.id) {
    return { by: 'binding', id: binding.id, slug: binding.slug ?? null, source: 'bound' }
  }
  if (rule.hint) return { by: 'slug', slug: rule.hint, source: 'hint' }
  return { by: 'none', source: 'unbound' }
}

/**
 * Descendants of a category, from the flat list the CMS returns (`parent` links).
 * A malformed tree (a category that is its own ancestor, or two categories pointing at
 * each other) is survived rather than recursed into: every id is visited at most once.
 */
export const categorySubtree = (root: CategoryDocLike, all: CategoryDocLike[]): CategoryDocLike[] => {
  const seen = new Set<string>([String(root.id)])
  const walk = (parent: CategoryDocLike): CategoryDocLike[] =>
    all
      .filter((candidate) => idOf(candidate.parent) === String(parent.id))
      .flatMap((child) => {
        const id = String(child.id)
        if (seen.has(id)) return []
        seen.add(id)
        return [child, ...walk(child)]
      })
  return walk(root)
}

type CategoryDocLike = { id: string; parent?: unknown }

const idOf = (value: unknown): null | string => {
  if (!value) return null
  if (typeof value === 'string') return value
  if (typeof value === 'object' && 'id' in (value as Record<string, unknown>)) {
    const id = (value as Record<string, unknown>).id
    return typeof id === 'string' ? id : null
  }
  return null
}

export const categoryIds = (categories: CategoryDocLike[]): string[] => categories.map((c) => String(c.id))

/**
 * Blog membership when no `blogCategory` slot is bound: every post that is not inside
 * the projects/education subtrees, plus posts with no category at all.
 */
export const blogExclusion = (categories: CategoryDocLike[], excludedRootIds: string[]): string[] => {
  const roots = categories.filter((category) => excludedRootIds.includes(String(category.id)))
  return roots.flatMap((root) => [String(root.id), ...categoryIds(categorySubtree(root, categories))])
}

export const sectionPath = (section: SectionKey): string => `/${section}`

export const sectionRouteForKind = (
  kind: 'article' | 'educationEntry' | 'page' | 'project',
): SectionKey | null =>
  kind === 'project' ? 'projects' : kind === 'educationEntry' ? 'education' : kind === 'article' ? 'blog' : null
