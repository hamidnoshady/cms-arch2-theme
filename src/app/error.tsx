'use client'

import { ContentContainer } from '@/components/design/Container'
import { ErrorState } from '@/components/states/States'

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <ContentContainer className="py-24">
      <ErrorState locale="fa" retry={reset} />
    </ContentContainer>
  )
}
