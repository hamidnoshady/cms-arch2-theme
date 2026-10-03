import { ArticleView, articleMetadata } from '@/views/ArticleView'

type Params = Promise<{ slug: string }>

export const generateMetadata = async ({ params }: { params: Params }) =>
  articleMetadata('en', 'article', decodeURIComponent((await params).slug))

export default async function Page({ params }: { params: Params }) {
  return <ArticleView kind="article" locale="en" slug={decodeURIComponent((await params).slug)} />
}
