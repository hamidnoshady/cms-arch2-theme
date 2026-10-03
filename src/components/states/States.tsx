import Link from 'next/link'
import type { ReactNode } from 'react'

import { ContentContainer } from '@/components/design/Container'
import { DecorativeMark } from '@/components/design/DecorativeMark'
import { Rule } from '@/components/design/Rule'
import { Skeleton } from '@/components/ui/skeleton'
import type { Locale } from '@/lib/cms/types'
import { labels as dictionary } from '@/lib/theme/labels'

/** Shared empty / error / lifecycle states. Skeletons live below them. */

/** The link row shared by `app/not-found.tsx` and the proxy's 404 route. */
export const NotFoundBody = ({ children }: { children: ReactNode }) => <p className="mt-8">{children}</p>

export const EmptyState = ({
  action,
  body,
  locale,
  title,
}: {
  action?: { href: string; label: string }
  body?: string
  locale: Locale
  title?: string
}) => {
  const t = dictionary(locale)
  return (
    <div className="notice notice--plain relative py-16">
      <DecorativeMark className="top-16 -start-1 hidden md:block" variant="offset-l" />
      <h2 className="type-heading ps-4 md:ps-6">{title ?? t.emptyArchiveTitle}</h2>
      <p className="type-body max-w-[46ch] ps-4 text-ink-secondary md:ps-6">{body ?? t.emptyArchiveBody}</p>
      {action ? (
        <p className="ps-4 md:ps-6">
          <Link className="link-inline type-ui target-standalone" href={action.href}>
            {action.label}
          </Link>
        </p>
      ) : null}
    </div>
  )
}

export const ErrorState = ({ locale, retry }: { locale: Locale; retry?: () => void }) => {
  const t = dictionary(locale)
  return (
    <div className="py-16">
      <h2 className="type-heading">{t.errorTitle}</h2>
      <p className="type-body mt-3 max-w-[46ch] text-ink-secondary">{t.errorBody}</p>
      {retry ? (
        <button className="btn btn--quiet mt-6" onClick={retry} type="button">
          {t.reload}
        </button>
      ) : null}
    </div>
  )
}

/**
 * Lifecycle holding page: a `suspended`/`archived` site answers **200 + noindex** with
 * no portfolio content and no customer identity beyond the name the CMS still returns.
 */
export const HoldingState = ({ locale, name }: { locale: Locale; name?: null | string }) => {
  const t = dictionary(locale)
  return (
    <ContentContainer className="flex min-h-svh flex-col justify-center py-24">
      <Rule className="mb-10 max-w-[10rem]" />
      {name ? <p className="type-label">{name}</p> : null}
      <h1 className="type-title mt-4 max-w-[24ch]">{t.holdingTitle}</h1>
      <p className="type-body mt-4 max-w-[46ch] text-ink-secondary">{t.holdingBody}</p>
    </ContentContainer>
  )
}

/**
 * CMS unreachable. Deliberately not a customer-looking page: the theme will not
 * impersonate a studio identity it cannot verify, and it carries `noindex`.
 */
export const UnreachableState = ({ locale }: { locale: Locale }) => {
  const t = dictionary(locale)
  return (
    <ContentContainer className="flex min-h-svh flex-col justify-center py-24">
      <Rule className="mb-10 max-w-[10rem]" />
      <h1 className="type-title max-w-[26ch]">{t.unreachableTitle}</h1>
      <p className="type-body mt-4 max-w-[46ch] text-ink-secondary">{t.unreachableBody}</p>
    </ContentContainer>
  )
}

/* --- skeletons: geometry mirrors the real markup -------------------------- */

export const ProjectGridSkeleton = ({ count = 8 }: { count?: number }) => (
  <div aria-busy="true" className="grid-projects skeleton-region" role="status">
    <span className="sr-only">…</span>
    {Array.from({ length: count }).map((_, index) => (
      <div className="flex flex-col gap-3" key={index}>
        <Skeleton className="w-full" style={{ aspectRatio: index % 3 === 1 ? '3 / 4' : index % 3 === 2 ? '1 / 1' : '3 / 2' }} />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/3" />
      </div>
    ))}
  </div>
)

export const EntryRowsSkeleton = ({ count = 6 }: { count?: number }) => (
  <div aria-busy="true" className="skeleton-region" role="status">
    <span className="sr-only">…</span>
    <ul>
      {Array.from({ length: count }).map((_, index) => (
        <li className="entry-row entry-row--compact" key={index}>
          <Skeleton className="w-full" style={{ aspectRatio: '4 / 3' }} />
          <div className="flex flex-col gap-2">
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-3 w-1/3" />
          </div>
        </li>
      ))}
    </ul>
  </div>
)

export const ArticleRowsSkeleton = ({ count = 4 }: { count?: number }) => (
  <div aria-busy="true" className="skeleton-region" role="status">
    <span className="sr-only">…</span>
    <div className="mb-8 flex flex-col gap-3">
      <Skeleton className="h-6 w-1/2" />
      <Skeleton className="h-4 w-3/4" />
    </div>
    <ul>
      {Array.from({ length: count }).map((_, index) => (
        <li className="entry-row" key={index}>
          <Skeleton className="w-full" style={{ aspectRatio: '1 / 1' }} />
          <div className="flex flex-col gap-2">
            <Skeleton className="h-5 w-3/5" />
            <Skeleton className="h-3 w-4/5" />
            <Skeleton className="h-3 w-1/4" />
          </div>
        </li>
      ))}
    </ul>
  </div>
)

export const PageSkeleton = () => (
  <div aria-busy="true" className="skeleton-region py-10" role="status">
    <span className="sr-only">…</span>
    <Skeleton className="mb-8 h-9 w-2/5" />
    <div className="flex flex-col gap-4">
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-4 w-4/5" />
      <Skeleton className="h-4 w-2/3" />
      <Skeleton className="mt-6 h-64 w-full" />
    </div>
  </div>
)
