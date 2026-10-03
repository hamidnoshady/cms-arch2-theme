import { ContentContainer, NavbarShell } from '@/components/design/Container'
import { Rule } from '@/components/design/Rule'
import { ArticleRowsSkeleton, PageSkeleton } from '@/components/states/States'

/**
 * Root loading boundary. It keeps the shell's structural anchors (the full-width
 * navbar rule) visible while the page resolves, so a slow CMS does not blank the
 * frame. Segment-level `loading.tsx` files refine this per archive.
 */
export default function Loading() {
  return (
    <div>
      <NavbarShell>
        <div className="h-[68px]" />
        <Rule />
      </NavbarShell>
      <ContentContainer>
        <PageSkeleton />
        <ArticleRowsSkeleton count={3} />
      </ContentContainer>
    </div>
  )
}
