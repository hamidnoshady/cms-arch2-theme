import Link from 'next/link'

import type { Crumb } from '@/lib/routing/breadcrumbs'

/**
 * Breadcrumbs beneath the navbar on every interior page (never on the home stage).
 * The parent segments are real links; the leaf carries `aria-current="page"` and
 * truncates rather than overflowing. Order follows the document direction, so the
 * Persian trail reads right-to-left without extra markup.
 */
export const Breadcrumbs = ({ crumbs, label }: { crumbs: Crumb[]; label: string }) => (
  <nav aria-label={label}>
    <ol className="breadcrumbs">
      {crumbs.map((crumb, index) => (
        <li className="flex min-w-0 items-center gap-2" key={`${crumb.label}-${index}`}>
          {index > 0 ? (
            <span aria-hidden="true" className="breadcrumbs__sep">
              /
            </span>
          ) : null}
          {crumb.href && !crumb.current ? (
            <Link href={crumb.href}>{crumb.label}</Link>
          ) : (
            <span aria-current={crumb.current ? 'page' : undefined}>{crumb.label}</span>
          )}
        </li>
      ))}
    </ol>
  </nav>
)
