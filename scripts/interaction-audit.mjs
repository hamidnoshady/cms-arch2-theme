import { mkdirSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import puppeteer from 'puppeteer-core'

/**
 * Interaction audit — the behaviours a screenshot cannot prove.
 *
 * The brief asks for specific *behaviour*: a visible Enter control that also works from
 * the keyboard, one bounded transition with no replay, a drawer that traps focus, closes
 * on Escape, restores focus, unlocks scrolling and closes on navigation, and a form that
 * cannot be submitted twice.
 *
 *   node scripts/interaction-audit.mjs [--base http://127.0.0.1:3200] [--out docs/screenshots]
 *
 * Writes `interaction-report.json` and exits non-zero on failure.
 */

const argOf = (name, fallback) => {
  const index = process.argv.indexOf(name)
  return index === -1 ? fallback : process.argv[index + 1]
}

const BASE = argOf('--base', process.env.AUDIT_BASE ?? 'http://127.0.0.1:3200')
const OUT = argOf('--out', 'docs/screenshots')

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

/**
 * Wait until the page is *hydrated*, not merely parsed.
 *
 * Clicking at `domcontentloaded` reaches the server-rendered HTML before React has
 * attached its handlers, so every interaction check fails for a reason that has nothing
 * to do with the theme. The stylesheet is the honest signal available without hooks:
 * `document.readyState === 'complete'` plus a settled frame is when the entrance's
 * client component has taken over in this app.
 */
const loaded = async (page, selector = 'main, .stage', settle = 1200) => {
  await page.waitForSelector(selector, { timeout: 40000, visible: true })
  await page.waitForFunction(() => document.readyState === 'complete', { timeout: 40000 })
  await sleep(settle)
}

/**
 * Fail fast when the page's own assets are not being served.
 *
 * A theme that answers 200 for HTML but 500 for `/_next/static/*` renders an unstyled,
 * unhydrated page — every measurement below then reports a defect that does not exist in
 * the theme at all. The usual cause is a server booted before the last `next build`:
 * the process holds the old asset manifest while the static directory has new hashes.
 */
const assertAssetsServed = async (page, base) => {
  await page.goto(`${base}/`, { waitUntil: 'domcontentloaded' })
  const href = await page.evaluate(() =>
    document.querySelector('link[rel="stylesheet"]')?.getAttribute('href') ?? '',
  )
  if (!href) return
  const response = await page.goto(new URL(href, base).toString(), { waitUntil: 'domcontentloaded' })
  const type = response?.headers()['content-type'] ?? ''
  if (response?.status() !== 200 || !type.includes('text/css')) {
    throw new Error(
      `assets are not being served (${href} → ${response?.status()} ${type}). Restart the theme servers on the current build: bash scripts/qa-servers.sh --reset, then re-run.`,
    )
  }
}

const main = async () => {
  const { default: chromium } = await import('@sparticuz/chromium')
  const browser = await puppeteer.launch({
    args: ['--no-sandbox'],
    env: { ...process.env, LD_LIBRARY_PATH: [join(tmpdir(), 'arch2-chromium-libs', 'lib'), process.env.LIBRARY_PATH].filter(Boolean).join(':') },
    executablePath: await chromium.executablePath(),
    headless: true,
  })
  await assertAssetsServed(await browser.newPage(), BASE)
  const checks = []
  const check = async (name, run) => {
    const page = await browser.newPage()
    page.on('pageerror', (error) => checks.push({ detail: String(error).slice(0, 200), name: `${name} (page error)`, ok: false }))
    try {
      const detail = await run(page)
      checks.push({ detail: detail ?? '', name, ok: true })
    } catch (error) {
      checks.push({ detail: String(error).slice(0, 200), name, ok: false })
    }
    await page.close()
  }

  const waitFor = async (page, selector, timeout = 20000) => {
    await page.waitForSelector(selector, { timeout, visible: true })
  }

  // ------------------------------------------------------------------ entrance
  await check('home: the Enter control is visible before any interaction', async (page) => {
    await page.setViewport({ width: 1440, height: 900 })
    await page.goto(`${BASE}/`, { waitUntil: 'load' })
    await loaded(page, '.stage .btn')
    const box = await page.$eval('.stage .btn', (el) => el.getBoundingClientRect().height)
    if (box < 24) throw new Error(`Enter control is only ${Math.round(box)}px tall`)
    return `Enter control ${Math.round(box)}px tall`
  })

  await check('home: keyboard Enter opens the menu', async (page) => {
    await page.setViewport({ width: 1440, height: 900 })
    await page.goto(`${BASE}/`, { waitUntil: 'load' })
    await loaded(page, '.stage .btn')
    await page.keyboard.press('Enter')
    await waitFor(page, '.menu-row__label')
    const rows = await page.$$eval('.menu-row__label', (els) => els.map((el) => el.textContent.trim()))
    if (rows.length === 0) throw new Error('menu opened with no rows')
    return `${rows.length} rows after a keypress`
  })

  await check('home: clicking Enter opens the menu', async (page) => {
    await page.setViewport({ width: 1440, height: 900 })
    await page.goto(`${BASE}/`, { waitUntil: 'load' })
    await loaded(page, '.stage .btn')
    await page.click('.stage .btn')
    await waitFor(page, '.menu-row__label')
    return 'menu opened'
  })

  await check('home: the intro does not replay (menu shown on the second visit)', async (page) => {
    await page.setViewport({ width: 1440, height: 900 })
    await page.goto(`${BASE}/`, { waitUntil: 'load' })
    await loaded(page, '.stage .btn')
    await page.click('.stage .btn')
    await waitFor(page, '.menu-row__label')
    await page.goto(`${BASE}/about`, { waitUntil: 'load' })
    await loaded(page, 'main')
    await page.goto(`${BASE}/`, { waitUntil: 'load' })
    await waitFor(page, '.menu-row__label')
    const enterControl = await page.$('.stage .btn')
    if (enterControl) throw new Error('the entrance came back after the menu was entered once')
    return 'went straight to the menu'
  })

  // --------------------------------------------------------------------- drawer
  const openDrawer = async (page) => {
    await page.setViewport({ width: 390, height: 844 })
    await page.goto(`${BASE}/projects`, { waitUntil: 'load' })
    await loaded(page, 'header')
    await page.click('.navbar__toggle, button[aria-label]')
    await waitFor(page, '.drawer__row')
    await sleep(400)
  }

  await check('drawer: Tab stays inside (focus trap)', async (page) => {
    await openDrawer(page)
    const inside = []
    for (let index = 0; index < 14; index += 1) {
      await page.keyboard.press('Tab')
      inside.push(await page.evaluate(() => Boolean(document.activeElement?.closest('.drawer')) || Boolean(document.activeElement?.closest('[role="dialog"]'))))
    }
    if (!inside.every(Boolean)) throw new Error(`focus escaped the drawer after ${inside.indexOf(false) + 1} tabs`)
    return `14 tabs stayed inside`
  })

  await check('drawer: Escape closes it and focus returns to the trigger', async (page) => {
    await openDrawer(page)
    await page.keyboard.press('Escape')
    await sleep(500)
    const state = await page.evaluate(() => ({
      bodyOverflow: getComputedStyle(document.body).overflow,
      focused: Boolean(document.activeElement?.closest('header')),
      open: Boolean(document.querySelector('.drawer__row')),
    }))
    if (state.open) throw new Error('drawer is still rendered after Escape')
    if (!state.focused) throw new Error('focus did not return to the header/trigger')
    if (state.bodyOverflow === 'hidden') throw new Error('body scroll lock was left behind')
    return `closed, focus in header, body overflow ${state.bodyOverflow}`
  })

  await check('drawer: navigating from the drawer closes it', async (page) => {
    await openDrawer(page)
    const href = await page.$eval('.drawer__row', (el) => el.getAttribute('href') ?? el.querySelector('a')?.getAttribute('href'))
    await page.evaluate((target) => {
      document.querySelectorAll(`.drawer__row`).forEach((el) => {
        const anchor = el.tagName === 'A' ? el : el.querySelector('a')
        if (anchor?.getAttribute('href') === target) anchor.click()
      })
    }, href)
    await sleep(1500)
    const open = await page.evaluate(() => Boolean(document.querySelector('.drawer__row')))
    if (open) throw new Error('the drawer is still open after navigation')
    return `navigated to ${href} with the drawer closed`
  })

  // ----------------------------------------------------------------------- form
  await check('contact: a double submit is ignored', async (page) => {
    await page.setViewport({ width: 1440, height: 900 })
    const posts = []
    page.on('request', (request) => {
      if (request.url().includes('/api/form-submissions') && request.method() === 'POST') posts.push(request.url())
    })
    await page.goto(`${BASE}/contact`, { waitUntil: 'load' })
    await loaded(page, 'form')
    const values = { email: 'a@example.com', message: 'سلام', name: 'نمونه', phone: '09120000000' }
    for (const [name, value] of Object.entries(values)) {
      const selector = `[name="${name}"]`
      if (await page.$(selector)) await page.type(selector, value)
    }
    const consent = await page.$('[name="consent"]')
    if (consent) await consent.click()
    const submit = await page.$('button[type="submit"]')
    await Promise.all([submit.click(), submit.click().catch(() => {})])
    await waitFor(page, '[aria-live="polite"]')
    await sleep(600)
    if (posts.length !== 1) throw new Error(`${posts.length} POSTs reached the CMS for one submission`)
    return 'exactly one POST'
  })

  await check('contact: a failed submit keeps the entered values', async (page) => {
    await page.setViewport({ width: 1440, height: 900 })
    await page.setRequestInterception(true)
    let first = true
    page.on('request', (request) => {
      if (request.url().includes('/api/form-submissions') && first) {
        first = false
        request.respond({ body: '{"errors":[{"message":"nope"}]}', contentType: 'application/json', status: 500 })
        return
      }
      request.continue()
    })
    await page.goto(`${BASE}/contact`, { waitUntil: 'load' })
    await loaded(page, 'form')
    await page.type('[name="email"]', 'keep@example.com')
    await page.type('[name="message"]', 'متن نمونه برای بررسی')
    const consent = await page.$('[name="consent"]')
    if (consent) await consent.click()
    await page.click('button[type="submit"]')
    await sleep(1500)
    const values = await page.evaluate(() => ({
      email: document.querySelector('[name="email"]')?.value,
      message: document.querySelector('[name="message"]')?.value,
    }))
    if (values.email !== 'keep@example.com' || values.message !== 'متن نمونه برای بررسی') {
      throw new Error(`values were lost: ${JSON.stringify(values)}`)
    }
    return 'values preserved after a failure'
  })

  await browser.close()
  mkdirSync(OUT, { recursive: true })
  writeFileSync(join(OUT, 'interaction-report.json'), `${JSON.stringify({ base: BASE, results: checks }, null, 2)}\n`)
  for (const entry of checks) console.log(`${entry.ok ? 'ok     ' : 'FAIL   '} ${entry.name}${entry.detail ? ` — ${entry.detail}` : ''}`)
  const failed = checks.filter((entry) => !entry.ok)
  console.log(`\n${checks.length - failed.length}/${checks.length} interaction checks passed`)
  if (failed.length > 0) process.exitCode = 1
}

main()
