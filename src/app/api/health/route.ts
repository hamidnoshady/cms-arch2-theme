import { NextResponse } from 'next/server'

import { cmsEnv } from '@/lib/cms/client'
import { getSite } from '@/lib/cms/endpoints'
import { contractVersion } from '@/lib/runtime'
import { fontReport } from '@/lib/theme/fonts'
import { missingFontNotice } from '@/lib/theme/fonts'

export const dynamic = 'force-dynamic'

/**
 * Health check used by the manifest (`build.healthCheckPath`) and by Coolify from
 * inside the container against `127.0.0.1:<port>`.
 *
 * - `GET /api/health?live` → process only; never touches the CMS.
 * - default → asks the CMS for `/api/site` and compares `contractVersion`. A mismatch
 *   is reported as `degraded` (HTTP 200 with `ok: false`) rather than a crash, so the
 *   container keeps serving its holding/error states instead of restarting in a loop.
 */
export const GET = async (request: Request) => {
  const env = cmsEnv()
  const url = new URL(request.url)
  const live = url.searchParams.has('live')
  const fonts = fontReport()

  const base = {
    contractVersion,
    environment: {
      cmsConfigured: env.hasCms,
      hostTenantAllowed: env.allowHostTenant,
      siteKeyPresent: Boolean(env.apiKey),
      tenant: env.tenantKey,
    },
    fonts: {
      missing: fonts.shazdeMissing,
      notice: missingFontNotice(),
      persian: fonts.persianFamily,
    },
    name: 'cms-arch2-theme',
    status: 'ok' as 'degraded' | 'ok',
  }

  if (live) return NextResponse.json(base, { headers: { 'cache-control': 'no-store' } })

  try {
    const site = await getSite()
    const matches = site.contractVersion === contractVersion
    return NextResponse.json(
      {
        ...base,
        cms: { contractVersion: site.contractVersion, serving: site.status === 'active', slug: site.slug },
        status: matches ? 'ok' : 'degraded',
      },
      { headers: { 'cache-control': 'no-store' } },
    )
  } catch (error) {
    return NextResponse.json(
      {
        ...base,
        cms: { error: error instanceof Error ? error.message.slice(0, 160) : 'unreachable' },
        status: 'degraded',
      },
      { headers: { 'cache-control': 'no-store' }, status: 200 },
    )
  }
}
