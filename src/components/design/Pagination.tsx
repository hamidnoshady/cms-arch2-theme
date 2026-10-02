import Link from 'next/link'

import { cn } from '@/lib/utils/cn'

/**
 * Square pagination. Plain links (no client state) so it works without JS, and the
 * page numbers are the only interactive furniture — no "showing X of Y" chrome.
 */
export const Pagination = ({
  basePath,
  className,
  currentPage,
  labels,
  query = '',
  totalPages,
}: {
  basePath: string
  className?: string
  currentPage: number
  labels: { next: string; previous: string }
  query?: string
  totalPages: number
}) => {
  if (totalPages <= 1) return null

  const hrefFor = (page: number): string => {
    const params = new URLSearchParams(query.replace(/^\?/, ''))
    if (page > 1) params.set('page', String(page))
    else params.delete('page')
    const search = params.toString()
    return search ? `${basePath}?${search}` : basePath
  }

  const pages = Array.from({ length: totalPages }, (_, index) => index + 1).filter(
    (page) => page === 1 || page === totalPages || Math.abs(page - currentPage) <= 1,
  )

  return (
    <nav aria-label="pagination" className={cn('pagination', className)}>
      {currentPage > 1 ? (
        <Link className="pagination__item" href={hrefFor(currentPage - 1)} rel="prev">
          {labels.previous}
        </Link>
      ) : (
        <span aria-disabled="true" className="pagination__item">
          {labels.previous}
        </span>
      )}
      {pages.map((page, index) => {
        const previous = pages[index - 1]
        const gap = previous !== undefined && page - previous > 1
        return (
          <span className="flex items-center gap-2" key={page}>
            {gap ? <span aria-hidden="true">…</span> : null}
            <Link
              aria-current={page === currentPage ? 'page' : undefined}
              className="pagination__item"
              href={hrefFor(page)}
            >
              {page}
            </Link>
          </span>
        )
      })}
      {currentPage < totalPages ? (
        <Link className="pagination__item" href={hrefFor(currentPage + 1)} rel="next">
          {labels.next}
        </Link>
      ) : (
        <span aria-disabled="true" className="pagination__item">
          {labels.next}
        </span>
      )}
    </nav>
  )
}
