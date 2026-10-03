import { ArticleView, articleMetadata } from '@/views/ArticleView'

type Params = Promise<{ slug: string }>

export const generateMetadata = async ({ params }: { params: Params }) =>
  articleMetadata('fa', 'educationEntry', decodeURIComponent((await params).slug))

export default async function Page({ params }: { params: Params }) {
  return <ArticleView kind="educationEntry" locale="fa" slug={decodeURIComponent((await params).slug)} />
}
