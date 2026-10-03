// @vitest-environment jsdom
import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { DecorativeMark } from '@/components/design/DecorativeMark'
import { Rule } from '@/components/design/Rule'
import { Skeleton } from '@/components/ui/skeleton'

/**
 * The line system's accessibility contract: decorations are never interactive, never
 * announced and never part of the layout tree that shifts; structural rules carry no
 * content of their own.
 */
describe('DecorativeMark', () => {
  it('is hidden from assistive technology and cannot be focused or clicked', () => {
    const { container } = render(<DecorativeMark variant="crosshair" />)
    const mark = container.querySelector('[data-mark="crosshair"]')
    expect(mark).not.toBeNull()
    expect(mark?.getAttribute('aria-hidden')).toBe('true')
    expect(mark?.querySelector('svg')?.getAttribute('stroke')).toBe('currentColor')
    expect(mark?.querySelector('svg')?.getAttribute('vector-effect')).toBe('non-scaling-stroke')
  })

  it('renders all six documented variants deterministically', () => {
    const variants = ['corner', 'crosshair', 'dash', 'offset-l', 'pair', 'tick'] as const
    for (const variant of variants) {
      const { container } = render(<DecorativeMark variant={variant} />)
      expect(container.querySelector(`[data-mark="${variant}"]`)).not.toBeNull()
    }
  })
})

describe('structural rules', () => {
  it('are presentational only', () => {
    const { container } = render(<Rule />)
    const rule = container.querySelector('.rule-h')
    expect(rule).not.toBeNull()
    expect(rule?.getAttribute('aria-hidden')).toBe('true')
    expect(container.querySelector('.rule-h--emphasis')).toBeNull()
    const { container: emphasised } = render(<Rule tone="emphasis" />)
    expect(emphasised.querySelector('.rule-h--emphasis')).not.toBeNull()
  })
})

describe('Skeleton', () => {
  it('hides placeholder geometry from screen readers', () => {
    const { container } = render(<Skeleton className="h-4 w-10" />)
    const skeleton = container.querySelector('.skeleton')
    expect(skeleton?.getAttribute('aria-hidden')).toBe('true')
  })
})
