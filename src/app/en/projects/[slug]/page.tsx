import { ProjectDetailView, projectMetadata } from '@/views/ProjectDetailView'

type Params = Promise<{ slug: string }>

export const generateMetadata = async ({ params }: { params: Params }) =>
  projectMetadata('en', decodeURIComponent((await params).slug))

export default async function Page({ params }: { params: Params }) {
  return <ProjectDetailView locale="en" slug={decodeURIComponent((await params).slug)} />
}
