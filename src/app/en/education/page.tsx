import { EducationIndexView, educationMetadata } from '@/views/EducationIndexView'

type SearchParams = Promise<{ category?: string; page?: string }>

export const generateMetadata = async ({ searchParams }: { searchParams: SearchParams }) => {
  const { category, page } = await searchParams
  return educationMetadata('en', Number(page ?? 1) || 1, category)
}

export default async function Page({ searchParams }: { searchParams: SearchParams }) {
  const { category, page } = await searchParams
  return <EducationIndexView category={category ?? null} locale="en" page={Number(page ?? 1) || 1} />
}
