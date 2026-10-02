import { SearchView, searchMetadata } from '@/views/SearchView'

type SearchParams = Promise<{ q?: string }>

export const generateMetadata = () => searchMetadata('fa')

export default async function Page({ searchParams }: { searchParams: SearchParams }) {
  return <SearchView locale="fa" query={((await searchParams).q ?? '').trim()} />
}
