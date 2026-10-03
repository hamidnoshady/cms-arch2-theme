import { NextResponse } from 'next/server'

import { cmsEnv } from '@/lib/cms/client'

export const dynamic = 'force-dynamic'

/**
 * CMS-owned public paths, proxied for the `direct` deployment mode (the customer's DNS
 * points at the theme container, so `/api/*` would otherwise 404 here).
 *
 * Security posture:
 * - **Allowlist only.** A fixed set of public content collections; anything else
 *   (orders, users, api-keys, sites, platform endpoints, deployments) is refused before
 *   a socket is opened, so the proxy cannot be steered at a privileged CMS route.
 * - **No credential is attached.** The site key never leaves the server-side client;
 *   visitor `authorization`/`cookie` headers are dropped on the way out.
 * - **No recursion.** If `ESHOBE_CMS_URL` resolves to this same origin, the request is
 *   refused instead of looping back into this container.
 * - `POST` is not proxied here at all; the one public write path
 *   (`/api/form-submissions`) has its own handler with a body limit.
 */
const ALLOWED_EXACT = new Set([
  'categories',
  'footer',
  'forms',
  'header',
  'media',
  'pages',
  'posts',
  'redirects',
  'search',
  'site',
])

const ALLOWED_PREFIXES = ['media/file']

const isAllowed = (segments: string[]): boolean => {
  if (segments.length === 0) return false
  const joined = segments.join('/')
  if (ALLOWED_EXACT.has(joined)) return true
  return ALLOWED_PREFIXES.some((prefix) => joined === prefix || joined.startsWith(`${prefix}/`))
}

const forward = async (request: Request, segments: string[]): Promise<Response> => {
  const env = cmsEnv()
  if (!env.cmsUrl) return NextResponse.json({ error: 'cms-unconfigured' }, { status: 503 })
  if (request.method !== 'GET') {
    return NextResponse.json({ error: 'method-not-allowed' }, { status: 405 })
  }
  if (!isAllowed(segments)) {
    return NextResponse.json({ error: 'path-not-proxied' }, { status: 403 })
  }

  const cms = new URL(env.cmsUrl)
  const incoming = new URL(request.url)
  if (cms.host === incoming.host) {
    return NextResponse.json({ error: 'proxy-recursion-refused' }, { status: 508 })
  }

  const target = new URL(`${cms.origin}/api/${segments.join('/')}`)
  target.search = incoming.search

  const upstream = await fetch(target, {
    cache: 'no-store',
    headers: {
      accept: request.headers.get('accept') ?? 'application/json',
      // The CMS resolves the tenant from Host (or the key, which is never attached
      // here). The original Host is preserved verbatim.
      ...(request.headers.get('host') ? { 'x-forwarded-host': request.headers.get('host') as string } : {}),
    },
    redirect: 'manual',
  })

  const headers = new Headers()
  for (const name of ['cache-control', 'content-type', 'etag', 'last-modified', 'vary']) {
    const value = upstream.headers.get(name)
    if (value) headers.set(name, value)
  }
  headers.set('x-content-type-options', 'nosniff')

  return new NextResponse(upstream.body, { headers, status: upstream.status })
}

type Context = { params: Promise<{ path?: string[] }> }

export const GET = async (request: Request, context: Context): Promise<Response> => {
  const { path = [] } = await context.params
  return forward(request, path)
}

export const POST = async (): Promise<Response> =>
  NextResponse.json({ error: 'method-not-allowed' }, { status: 405 })
