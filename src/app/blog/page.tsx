import { BlogIndexView, blogMetadata } from '@/views/BlogIndexView'

type SearchParams = Promise<{ page?: string }>

export const generateMetadata = async ({ searchParams }: { searchParams: SearchParams }) =>
  blogMetadata('fa', Number((await searchParams).page ?? 1) || 1)

export default async function Page({ searchParams }: { searchParams: SearchParams }) {
  return <BlogIndexView locale="fa" page={Number((await searchParams).page ?? 1) || 1} />
}
