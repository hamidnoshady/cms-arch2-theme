import { EducationIndexView, educationMetadata } from '@/views/EducationIndexView'

type SearchParams = Promise<{ category?: string; page?: string }>

export const generateMetadata = async ({ searchParams }: { searchParams: SearchParams }) => {
  const { category, page } = await searchParams
  return educationMetadata('fa', Number(page ?? 1) || 1, category)
}

export default async function Page({ searchParams }: { searchParams: SearchParams }) {
  const { category, page } = await searchParams
  return <EducationIndexView category={category ?? null} locale="fa" page={Number(page ?? 1) || 1} />
}
