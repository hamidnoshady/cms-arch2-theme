import Link from 'next/link'

import type { SiteContext } from '@/lib/cms/context'
import { href } from '@/lib/routing/locale'
import { THEME_ROUTES } from '@/lib/routing/paths'
import { cn } from '@/lib/utils/cn'

/**
 * Customer identity in the chrome.
 *
 * The logo is an uploaded file rendered with `<img>` — never inlined markup, so a
 * scripted SVG that slipped past the CMS allowlist still cannot execute. When the
 * customer has uploaded nothing, the theme falls back to the site's real name as a
 * wordmark; it never ships bundled artwork or an invented brand.
 */
export const Logo = ({
  className,
  context,
  mark,
  wordmark = false,
}: {
  className?: string
  context: SiteContext
  /** Resolved URLs from `brandLogo(context)`. */
  mark: { compact: null | string; primary: null | string }
  wordmark?: boolean
}) => {
  const name = context.site.branding?.displayName ?? context.site.name
  const url = mark.compact ?? mark.primary

  return (
    <Link
      aria-label={name}
      className={cn('flex items-center gap-3', className)}
      href={href(THEME_ROUTES.home, context.locale, context.site)}
    >
      {!wordmark && url ? (
        // `data-logo` is a QA hook: the "customer has no logo" case must be provable
        // negatively (no mark element at all), not by eyeballing a screenshot.
        <img alt={name} className="block h-8 w-auto" data-logo="mark" decoding="async" height={32} src={url} width={120} />
      ) : (
        <span className="navbar__wordmark" data-logo="wordmark">
          {name}
        </span>
      )}
    </Link>
  )
}
