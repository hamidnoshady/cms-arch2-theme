import Link from 'next/link'

/**
 * Language switch. `href` is computed by the caller from the *translated equivalent*
 * document — when a document has no translation in the other locale the caller passes
 * `null` and the switch renders the label without a link rather than fabricating a URL
 * that would 404.
 */
export const LanguageSwitch = ({
  className,
  current,
  hrefs,
  label,
}: {
  className?: string
  current: string
  hrefs: { href: null | string; label: string; locale: string }[]
  label: string
}) => (
  <nav aria-label={label} className={className}>
    <ul className="flex items-center gap-3">
      {hrefs.map((entry) =>
        entry.href ? (
          <li key={entry.locale}>
            <Link
              className="type-ui nav-link"
              href={entry.href}
              hrefLang={entry.locale}
              lang={entry.locale}
            >
              {entry.label}
            </Link>
          </li>
        ) : (
          <li aria-current={entry.label === current ? 'true' : undefined} className="type-ui text-ink-secondary" key={entry.locale}>
            {entry.label}
          </li>
        ),
      )}
    </ul>
  </nav>
)
