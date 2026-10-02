# QA and verification report

What was actually run, against what, and what the result was. Every screenshot referenced
here is a real browser capture (`docs/screenshots/`, 40 PNGs at 2× device scale) produced by
`scripts/screenshots.mjs` against a **production build**. Pending or aspirational checks are
stated as such — nothing in this file is a plan.

Environment: Node 22.22, Next 16.3.8, headless Chromium 153 (`@sparticuz/chromium`, the only
browser obtainable here — the Playwright CDNs are unreachable from this sandbox).

---

## 1. How to reproduce

```bash
npm ci
npm run verify                     # vendor:build → typecheck → lint → test → build

# --- production QA topology -------------------------------------------------
npm run build
ARCH2_INCLUDE_QA=1 npm run prepare:standalone
node --experimental-strip-types scripts/mock-cms.mjs --port 4011 --origin http://127.0.0.1:3200 &
(cd .next/standalone && PORT=3200 HOSTNAME=0.0.0.0 \
  ESHOBE_CMS_URL=http://127.0.0.1:4011 ESHOBE_PUBLIC_ORIGIN=http://127.0.0.1:3200 node server.js) &

bash scripts/qa-servers.sh            # scenario instances on 3300–3800 (foreground)
node scripts/screenshots.mjs --base http://127.0.0.1:3200 --scale 2
```

`scripts/qa-servers.sh` preflights its own ports and refuses to start half-bound, because a
mock that dies on `EADDRINUSE` leaves the theme talking to whatever still holds the port and
the resulting screenshots look fine while measuring nothing.

## 2. Automated checks

| Check | Command | Result |
| --- | --- | --- |
| Vendored runtime builds | `npm run vendor:build` | passes (8 modules emitted) |
| TypeScript | `npm run typecheck` | clean, `strict` + `noUncheckedIndexedAccess` + `verbatimModuleSyntax` |
| ESLint | `npm run lint` | 0 errors, 0 warnings |
| Unit/integration tests | `npm test` | **9 files, 89 tests, all passing** |
| Production build | `npm run build` | Next 16.3.8, compiles, all routes emitted |
| Browser evidence | `node scripts/screenshots.mjs` | **40 shots, 0 failures**, no page errors, no horizontal overflow |
| Manifest | `tests/manifest.test.ts` + the CMS's own parser | accepted (§5) |

`npm run verify` chains typecheck → lint → test → build. Lint is *inside* verify (it is not
excluded), and any of the four failing fails the chain.

### Test files

| File | Covers |
| --- | --- |
| `tests/contract.test.ts` | `@eshobe/site-runtime` export surface, `contractVersion`, block slugs |
| `tests/routing.test.ts` | locale split, URL helpers, breadcrumbs (archive vs detail, `aria-current`) |
| `tests/sections.test.ts` | slot precedence (binding → hint → none), cyclic/parent-child categories |
| `tests/media.test.ts` | size URLs, `srcSet`, focal points, aspect ratios, origin allowlist |
| `tests/security.test.ts` | tenant resolution, preview gating, signature checks, draft exclusion |
| `tests/fixtures.test.ts` | the fixture encoder's query semantics (`exists=false`, `like`, paging) |
| `tests/content.test.ts` | nav references resolve by **id**; reads are single-locale with `fallbackLocale=false`; the credential travels in a header; the language switch carries a search term |
| `tests/manifest.test.ts` | manifest ↔ code agreement, neutral identifiers, no unclaimed capability |
| `tests/components.test.tsx` | server-rendered component output (marks, rules, skeletons) |

## 3. Browser evidence

`node scripts/screenshots.mjs --base http://127.0.0.1:3200 --scale 2` →
`docs/screenshots/report.json`: 40 entries, all `status=200`, `overflowOk=true`, no
`consoleErrors`, every `expect` assertion satisfied.

| # | Shot | What it proves |
| --- | --- | --- |
| 01 | `home-entrance-1440` | white viewport, centred CMS logo, drawn rule, Enter control, scroll cue |
| 02 | `home-menu-1440` | the entrance → menu transition: shrinking logo, row rules, staggered labels, mirrored elbow mark |
| 03 | `home-entrance-390` | the same entrance at phone width |
| 04–09 | `projects-{1920,1440,1024,768,390,320}` | 4/3/2 columns, **2 columns at 390 and 320**, mixed 3:2 / 3:4 / 1:1 frames from real dimensions |
| 10 | `project-detail-1440` | breadcrumbs, title, only real facts, controlled hero ratio, gallery, related |
| 11 | `education-1440` | one featured entry + compact rows, honest reading time, thin separators |
| 12 | `blog-1440` | lead story + latest-notes column split by one fine vertical rule + article rows |
| 13 | `article-1440` | narrower prose measure inside 1440, metadata, rich text, related |
| 14 | `about-1440` | sparse composition, ~40–45% studio image in an inset frame, one contact link |
| 15 | `contact-1440` | two columns split by one fine divider, underline fields, real CMS details |
| 16 | `services-blocks-1440` | CMS blocks still render below the theme's own composition |
| 17 | `search-1440` | search results reuse the article-row geometry |
| 18 | `en-blog-1440` | LTR mirror: identity left, controls right, western digits, no letter-spacing |
| 19 | `en-contact-390` | English at phone width |
| 20 | `mobile-drawer-390` | drawer from the correct edge, row lines, ticks, language switch at the bottom |
| 21 | `skeletons-projects-1440` | **real skeleton inside the real shell** during a slow client navigation |
| 22 | `cms-unreachable-1440` | the honest "not connected" state, never a faked studio page |
| 23 | `holding-suspended-1440` | `suspended` → holding page, no portfolio content |
| 24 | `holding-suspended-1440-projects` | negative assertion: no project card element exists at all |
| 25–26 | `empty-{projects,blog}-1440` | empty archives resolve to the empty state, never an endless skeleton |
| 27 | `skeletons-projects-390` | the mobile skeleton is the real two-column project grid |
| 28 | `missing-logo-1440` | no logo in the CMS → site-name wordmark; no mark element is drawn |
| 29 | `long-labels-nav-1440` | long CMS labels wrap inside the navbar instead of overflowing |
| 30 | `invalid-form-390` | untouched submit surfaces field-level errors (`aria-invalid="true"`) |
| 39 | `form-success-1440` | the happy path through the real proxy to the CMS API |
| 31–32 | `zoom200-{home,projects}-1440` | 200% zoom: same layout, no clipping, no overflow |
| 33 | `reduced-motion-home-1440` | `prefers-reduced-motion` → final state immediately, no entrance animation |
| 34–38 | interior pages at 390 | education, article, about, contact, and the English mirror |
| 40 | `no-js-home-1440` | JavaScript disabled: the entrance's `<noscript>` menu offers every CMS destination, and the mark/rule/cue are revealed by the no-script stylesheet instead of staying at `opacity:0` |

### How the hard cases were made observable

Two of the brief's requirements are only *checkable* with deliberate setup, so the harness
does it rather than asserting them in prose:

- **Skeletons.** A warm connection prefetches both the target route's loading boundary and
  its data, so a normal client-side navigation completes instantly and never shows a
  skeleton. The two skeleton shots therefore throttle the network
  (`Network.emulateNetworkConditions`, 500 kbps / 400 ms) *after* the starting page has
  loaded, and wait for the specific selector (`.grid-projects .skeleton`) — not just any
  skeleton, because the root boundary renders first and is replaced a moment later.
- **Slow CMS.** The scenario's mock delays every read by 2.5 s (`--delay 2500`): slow enough
  that a navigation is still in flight when the shot is taken, fast enough that the page the
  shot starts from finishes loading.

## 4. Manual browser checks (beyond the scripted shots)

Performed through the same headless browser, reported here because they are behavioural and
not photographable in a still:

- **Home entrance → menu.** Wheel, `Enter`, `Space`, `ArrowDown` and `PageDown` all open the
  menu; the entrance is one bounded transition and does not replay on back-navigation.
- **Drawer.** Focus is trapped, `Escape` closes, focus returns to the trigger, `body` scroll
  lock is released, clicking a row navigates and the drawer closes on route change.
- **Reduced motion.** With `prefers-reduced-motion: reduce`, the entrance renders its final
  state immediately; the skeleton pulse is static.
- **Long labels.** With `--mode longlabels` (every CMS label stretched ~40 characters), the
  navbar wraps and nothing overflows at 1440, 1024 or 390.
- **No logo.** With `--mode nologo` the wordmark replaces the mark on both the home stage and
  the interior navbar.
- **Form.** Invalid submit → field-level errors; valid submit → pending → success, forwarded
  through `/api/form-submissions` to the CMS.
- **404 / redirects.** `/shop` → real 404 with the designed page; `/posts/<slug>` → 307 to
  `/blog/<slug>`; `/home` → 307 to `/`; an unserved locale prefix → 404.

## 5. Manifest

`eshobe.theme.json` was validated **with the CMS's own parser**, not a re-implementation:
`parseThemeManifestText` from `src/lib/deploy/manifest.ts` (CMS @ `7fde2435`) with
`platformContractVersion` taken from `@eshobe/site-runtime`. Result: `ACCEPTED`, no errors.

```
key arch2-neutral · contractVersion 1 · siteTypes ["portfolio"] · locales ["fa","en"]
proxiesApi true · build nixpacks · port 3000 · health /api/health
env 10 × source "platform" (3 secret) · settings 2 · contentSlots 7
```

`tests/manifest.test.ts` additionally pins the parts a type checker cannot: that every
declared slot is one the code resolves (and vice versa), that every declared capability is
implemented, that the build commands are the repository's real scripts, and that the
identifier is neutral.

## 6. Regression list — real defects found and fixed during this work

Each was reproduced in a browser or by a failing test before being fixed (18 items).

1. **CSS layers.** `styles/*.css` were unlayered and outranked Tailwind utilities, so
   `md:hidden` and `md:grid-cols-*` silently did nothing (the hamburger showed at 1440px).
   Fixed by wrapping each file in `@layer base` / `@layer components`.
2. **Server → client function leak.** `readingTime` (a function) was passed into the client
   `MobileMenu` through the labels dictionary; React refused to serialise it and **all**
   client JavaScript on the page died. Now only plain strings cross the boundary.
3. **Date crash.** Project cards threw `RangeError: Invalid time value` on the CMS text date
   `۱۴۰۴`. Added `src/lib/utils/dates.ts` (`parseDate` strict, `dateText`, `dateOrText`) and
   removed a fabricated "now" date from the search view.
4. **Invisible hero.** `HomeStage`'s line wrapper animated to `opacity: 0` and stayed there
   after the entrance. Found by probing hydration, not by reading the code.
5. **Footer year.** The copyright year used `formatNumber`, printing Gregorian `۲٬۰۲۶` on a
   Persian page. Now a *date*: `formatDate` prints the Jalali year (`۱۴۰۵`).
6. **Decorative mark outside the viewport.** In LTR the footer mark sat at x = −4 px because
   its containing block was the content box of a container that touches the viewport edge at
   1440. Repositioned inside an inner wrapper; the overflow report is now clean.
7. **`exists=false` read as truthy.** The fixture encoder turned the *string* `"false"` into
   truthy, which leaked education/project posts into `/blog`.
8. **Navbar overflow with long CMS labels.** A long menu label pushed the page 299 px wide;
   the navbar now shrinks and wraps instead.
9. **Skeleton pulse out of phase.** Each bar animated on its own timeline, so a block and its
   caption pulsed against each other and read as a glitch. One animation per *region* now.
10. **Missing segment loading boundaries.** A slow archive showed the root boundary (or
    nothing) because no `loading.tsx` existed below the root. Added per-segment boundaries
    that render the real chrome plus geometry-matched skeletons.
11. **Unverifiable skeleton claim.** The harness was capturing settled content and calling it
    a skeleton. Replaced with throttled, selector-verified captures.
12. **Phone autofill.** A phone field inherited `autoComplete="name"`; phone-like text fields
    now get `tel`, `inputMode="tel"` and LTR isolation inside the RTL form.
13. **Test-only stubs in production code.** `previewToken` and `fixturesEnabled` were imported
    but unused (lint warnings), caught by moving lint inside `verify`.
14. **Nav reference read by slug.** A `posts` menu reference stores a document *id*; passing it
    to `getPostBySlug` silently dropped the menu item. Added `getPostById` and a fixture menu
    entry whose id and slug differ, so the rule is pinned by a test (`tests/content.test.ts`)
    instead of by luck.
15. **Second, disagreeing link rule on the blog index.** The lead story and the rows below it
    resolved the same archive with two different rules, so a post could link to `/blog/<slug>`
    in one place and `/projects/<slug>` in another. One section-aware href map now serves the
    whole page.
16. **Language switch dropped the search term.** `/search?q=…` switched language to a bare
    `/en/search`. Locale-neutral queries are carried over; category slugs deliberately are not,
    because they belong to one locale.
17. **Double locale prefix on the English home.** The home language switch pre-applied the
    locale before `href` applied it again, so `/en` offered `/en/en` for "English" and pointed
    "فارسی" back at `/en`. The switch now takes the locale-neutral home path; both directions
    are covered by tests and by shots 01/03.
18. **Dead end without JavaScript.** The entrance's menu is a client state change and the logo,
    rule and cue are server-rendered at `opacity: 0`, so a visitor with scripting off saw a
    blank stage and no way into the site. A `<noscript>` menu now lists the same CMS
    destinations and a no-script stylesheet reveals the stage — captured as shot 40.

## 7. What is *not* verified

See `docs/LIMITATIONS.md` for the full list and reasoning. Summary: Shazde typography (not
licensed here — Vazirmatn is used and the switch is drop-in), the real CMS and media CDN
(shape-compatible mock instead), `next dev` hydration (sandbox HMR websocket — production
hydration is verified), the CMS's real preview signature (the HMAC path is unit-tested), and
any deployment (none was requested and none was performed).
