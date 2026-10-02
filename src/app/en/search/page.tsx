import { SearchView, searchMetadata } from '@/views/SearchView'

type SearchParams = Promise<{ q?: string }>

export const generateMetadata = () => searchMetadata('en')

export default async function Page({ searchParams }: { searchParams: SearchParams }) {
  return <SearchView locale="en" query={((await searchParams).q ?? '').trim()} />
}
