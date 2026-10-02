# Shazde — drop-in slot (NOT bundled)

The theme is designed for **Shazde** as the Persian product family across weights
**100–900**. Those files are licensed and are **not** redistributed with this repository,
so the theme ships without them and falls back to Vazirmatn (variable 100–900).

To activate Shazde, drop nine real static/variable weight files here using exactly these
names (any of `.woff2`, `.woff`):

```text
public/fonts/shazde/Shazde-Thin.woff2        /* 100 */
public/fonts/shazde/Shazde-ExtraLight.woff2  /* 200 */
public/fonts/shazde/Shazde-Light.woff2       /* 300 */
public/fonts/shazde/Shazde-Regular.woff2     /* 400 */
public/fonts/shazde/Shazde-Medium.woff2      /* 500 */
public/fonts/shazde/Shazde-SemiBold.woff2    /* 600 */
public/fonts/shazde/Shazde-Bold.woff2        /* 700 */
public/fonts/shazde/Shazde-ExtraBold.woff2   /* 800 */
public/fonts/shazde/Shazde-Black.woff2       /* 900 */
```

Rules the loader enforces (`src/lib/theme/fonts.ts`):

- A missing file is **not** substituted with another weight. The theme reports the exact
  missing filenames (`GET /api/health` → `fonts.missing`, and a build-time warning) and
  falls back to Vazirmatn for Persian. No weight is ever synthesized.
- Shazde is used for Persian UI and for the brand lockup in both languages. English body
  text stays on Inter; Shazde's Latin glyphs are not used for English body copy.
- Declare Latin quality before switching English to Shazde: change
  `ENGLISH_USES_BRAND_FONT` in `src/lib/theme/fonts.ts`.
