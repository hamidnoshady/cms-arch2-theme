import { revalidatePath, revalidateTag } from 'next/cache'
import { NextResponse } from 'next/server'

import { revalidateSecret, verifyRevalidateSignature } from '@/lib/cms/signature'

export const dynamic = 'force-dynamic'

/**
 * Signed revalidation.
 *
 * The CMS signs the **raw body** with the deployment secret
 * (`ESHOBE_REVALIDATE_SECRET`) and sends `x-eshobe-signature`. Verification happens
 * before parsing, on the exact bytes received, in constant time.
 *
 * Cache tags are tenant-partitioned by `src/lib/cms/client.ts`, so `cms:<tenant>` only
 * clears this deployment's tenant. Paths are cleared both bare and, when present, for
 * the site's domain prefix. With several replicas each one must receive the webhook
 * (or share the cache); the bounded TTL on every read (`revalidate: 30`) is the
 * documented fallback for a missed delivery.
 */
export const POST = async (request: Request) => {
  const secret = revalidateSecret()
  if (!secret) return NextResponse.json({ error: 'revalidation-disabled' }, { status: 503 })

  const raw = await request.text()
  if (!verifyRevalidateSignature(secret, raw, request.headers.get('x-eshobe-signature'))) {
    return NextResponse.json({ error: 'invalid-signature' }, { status: 401 })
  }

  let payload: { paths?: string[]; resources?: unknown[]; tags?: string[] } = {}
  try {
    payload = JSON.parse(raw) as typeof payload
  } catch {
    return NextResponse.json({ error: 'invalid-json' }, { status: 400 })
  }

  // The tenant tag is always invalidated; specific tags/paths narrow it further.
  // Next 16 requires a cache-life profile: 'max' expires the entry everywhere at once.
  revalidateTag('cms', 'max')
  for (const tag of payload.tags ?? []) {
    if (typeof tag === 'string' && tag.length > 0) revalidateTag(tag, 'max')
  }
  const paths = (payload.paths ?? []).filter((path): path is string => typeof path === 'string')
  for (const path of paths) revalidatePath(path.startsWith('/') ? path : `/${path}`)

  return NextResponse.json({ revalidated: true, tags: payload.tags?.length ?? 0, paths: paths.length })
}
