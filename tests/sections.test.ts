import { describe, expect, it } from 'vitest'

import {
  blogExclusion,
  categorySubtree,
  resolveSectionRef,
  SECTIONS,
  sectionRouteForKind,
} from '@/lib/theme/sections'

const categories = [
  { id: '1', parent: null, slug: 'projects' },
  { id: '2', parent: '1', slug: 'residential' },
  { id: '3', parent: '2', slug: 'villas' },
  { id: '4', parent: null, slug: 'education' },
  { id: '5', parent: '4', slug: 'workshops' },
  { id: '6', parent: null, slug: 'notes' },
]

describe('content-slot resolution', () => {
  it('prefers a saved binding over the slug hint', () => {
    const ref = resolveSectionRef('about', { about: { id: '42', slug: 'درباره-ما', title: 'About' } })
    expect(ref).toMatchObject({ by: 'binding', id: '42', source: 'bound' })
  })

  it('falls back to the slug only while the slot is unbound', () => {
    expect(resolveSectionRef('about', {})).toMatchObject({ by: 'slug', slug: 'about', source: 'hint' })
    expect(resolveSectionRef('about', null)).toMatchObject({ by: 'slug', slug: 'about' })
  })

  it('never substitutes an unrelated document when a binding exists but is empty', () => {
    // A binding entry that exists without an id is not usable, but it must not be
    // silently replaced by a same-slug document from another locale either.
    expect(resolveSectionRef('projects', { projectsCategory: null })).toMatchObject({
      by: 'slug',
      slug: 'projects',
    })
  })

  it('reports an unbound slot with no hint as none instead of guessing a slug', () => {
    expect(SECTIONS.blog.hint).toBeNull()
    expect(resolveSectionRef('blog', {})).toEqual({ by: 'none', source: 'unbound' })
  })
})

describe('category math', () => {
  it('collects a whole subtree, at any depth', () => {
    const root = categories[0]!
    expect(categorySubtree(root, categories).map((category) => category.id)).toEqual(['2', '3'])
  })

  it('excludes the projects and education subtrees from the blog', () => {
    const excluded = blogExclusion(categories, ['1', '4'])
    expect(excluded).toEqual(['1', '2', '3', '4', '5'])
    expect(excluded).not.toContain('6')
  })

  it('tolerates cycles in malformed category data', () => {
    const cyclic = [
      { id: 'a', parent: 'b', slug: 'a' },
      { id: 'b', parent: 'a', slug: 'b' },
    ]
    expect(() => categorySubtree(cyclic[0]!, cyclic)).not.toThrow()
  })
})

describe('canonical section per route kind', () => {
  it('maps detail kinds onto their owning section', () => {
    expect(sectionRouteForKind('project')).toBe('projects')
    expect(sectionRouteForKind('educationEntry')).toBe('education')
    expect(sectionRouteForKind('article')).toBe('blog')
    expect(sectionRouteForKind('page')).toBeNull()
  })
})
