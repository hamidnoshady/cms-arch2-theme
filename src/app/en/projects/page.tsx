import { ProjectsIndexView, projectsMetadata } from '@/views/ProjectsIndexView'

type SearchParams = Promise<{ category?: string; page?: string }>

export const generateMetadata = async ({ searchParams }: { searchParams: SearchParams }) => {
  const { category, page } = await searchParams
  return projectsMetadata('en', Number(page ?? 1) || 1, category)
}

export default async function Page({ searchParams }: { searchParams: SearchParams }) {
  const { category, page } = await searchParams
  return <ProjectsIndexView category={category ?? null} locale="en" page={Number(page ?? 1) || 1} />
}
