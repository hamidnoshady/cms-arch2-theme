import type { ReactNode } from 'react'

import { Breadcrumbs } from '@/components/design/Breadcrumbs'
import { ContentContainer } from '@/components/design/Container'
import { InteriorShell } from '@/components/layout/InteriorShell'
import type { SiteContext } from '@/lib/cms/context'
import type { Crumb } from '@/lib/routing/breadcrumbs'
import { getChrome } from '@/lib/theme/chrome'
import type { Locale } from '@/lib/cms/types'

/**
 * Interior page wrapper: chrome + breadcrumbs + content. Every interior view uses it,
 * so the full-width navbar / 1440px content relationship is identical everywhere.
 */
export const InteriorPage = async ({
  children,
  context,
  crumbs,
  currentPath,
  label,
  locale,
  switchDoc,
}: {
  children: ReactNode
  context: SiteContext
  crumbs: Crumb[]
  currentPath: string
  label: string
  locale: Locale
  switchDoc?: { id: string; kind: 'page' | 'post'; pathForLocale: (locale: Locale) => string }
}) => {
  const chrome = await getChrome(context, currentPath, switchDoc)

  return (
    <InteriorShell
      context={context}
      footerLinks={chrome.footerLinks}
      headerLinks={chrome.headerLinks}
      logo={chrome.logo}
      switchTargets={chrome.switchTargets}
    >
      <ContentContainer>
        <Breadcrumbs crumbs={crumbs} label={label} />
      </ContentContainer>
      {children}
      <span className="sr-only">{locale}</span>
    </InteriorShell>
  )
}
