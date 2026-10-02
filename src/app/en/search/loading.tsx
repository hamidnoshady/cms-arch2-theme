import { SectionLoading } from '@/components/states/SectionLoading'

/** Loading boundary for ['en', 'search'] — real shell, geometry-matched skeleton. */
export default function Loading() {
  return <SectionLoading locale="en" path="/search" route={['en', 'search']} variant="search" />
}
