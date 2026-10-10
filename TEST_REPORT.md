# BiznesBola verification

Measured on 9 October 2026, Asia/Tashkent. Windows, Node 24.18.1, installed Playwright Chromium. Results are actual executions, not assumed passes.

## Production repair and deployment, 23:35 Asia/Tashkent

At the user's subsequent request, restored `biznesbola.vercel.app` to the pre-change deployment `dpl_U5jWg12LHyLy5T1injWsFQqXxVp1`. This workspace is now linked exclusively to `dev-1eb3/biznesbola-mvp`, project `prj_Fl1Aa5nAV7KqFp8v7mtGnGlDPdts`. The current MVP is published separately at https://biznesbola-mvp.vercel.app, deployment `dpl_2KzWFVuwMAHa1MSLotyuqALtk8NW`. Production browser verification passed on the new domain. The deployment history below is retained for traceability.

Published to https://biznesbola.vercel.app in the existing dev-1eb3/biznesbola project. Deployment dpl_DVxqEo9aVypeFr8G4YGGwFKDQyPX is READY. Fixed Node ESM server imports after observing ERR_MODULE_NOT_FOUND in Vercel runtime logs.

The exact greeting from the user's screenshot now asks for the idea without inventing a bracelet or price. Verified in a clean production browser with `scripts/verify-mentor.mjs`: no plan card; educational response label; `/api/status` HTTP 200 with `{ai:false,publishing:false}`; same-origin `/api/ai/chat` HTTP 503 with `ai_not_configured`. The Vercel project has no configured production environment variables, so no live AI or Supabase publication is claimed.

Current unit suite: 20 tests passed across 5 files, including greeting fallback and exact Vercel origin allowlisting. TypeScript, lint, and Vercel production build passed. The earlier full-browser and Lighthouse results below describe the previous local MVP verification.

| Check | Result |
| --- | --- |
| TypeScript (`npm run typecheck`) | Passed |
| ESLint (`npm run lint`) | Passed |
| Vitest | 17 tests passed across 3 files |
| Production build | Passed; SPA assets and lazy route chunks generated |
| Playwright | 20 passed, 4 explicitly skipped, 0 failed |
| Responsive widths | 360, 390, 768, 1280 px; tested every main route for horizontal overflow |
| Production offline check | Passed with browser networking disabled |
| Translation key parity | No missing keys between Uzbek and Russian |
| Dependency audit | 0 known vulnerabilities in the saved npm audit |

## Coverage

Unit/component tests cover production and unit cost, markup versus margin, suggested/manual selling price, profit and loss, break-even, integer cost rounding, deterministic budget rounding, 50/30/20 and custom splits, invalid splits, revenue/cost/capital separation, practice versus real activity, transaction corrections and undo, one-time XP, structured price validation, public contact-data rejection, currency formatting, learning streaks, savings forecast prerequisites, and onboarding.

Browser checks cover onboarding; immediate language switching and persistence; the default 70 000 so‘m forecast; recording 10 000 so‘m training income; 5 000 / 3 000 / 2 000 allocation; transaction correction and undo; fallback labels and plan transfer; draft saving/review/private preview; fictional-book disclosure; safe parent overview; unavailable public storefronts; rejection of anonymous approval; PNG/WebP compression and the 300 KB bound; rejection of SVG uploads; and image persistence after reloading the draft.

The offline script opens the required production modules, disables browser networking, then verifies calculator results, income allocation, and explicitly labelled Robert educational responses. Public API requests and public storefront navigation are excluded from the service-worker cache.

## Lighthouse

The mobile production-dashboard audit at `http://127.0.0.1:5189` measured:

| Category | Score |
| --- | --- |
| Performance | 90 |
| Accessibility | 100 |
| Best practices | 100 |
| SEO | 100 |

The retained report timestamp is `2026-10-09T18:16:18.103Z` (23:16 in Tashkent). `reports/lighthouse.html`, `reports/lighthouse.json`, and `reports/lighthouse-summary.json` contain the audit evidence. This is a local production-build measurement, not a deployed-network result or a claim that every page scores the same. Performance remains sensitive to the simulated mobile CPU and environment; the score reaches 90, not a claimed score above 90.

Visual QA inspected the original Robert SVG, desktop/mobile dashboard screenshots, the mentor, and the fictional storefront. Screenshots are in `reports/screenshots/`.

## External verification limits

No Anthropic key/model, Supabase project/service credentials, Redis limiter credentials, or verified adult demo account was supplied. Live model access, real PostgreSQL writes, image Storage uploads, secure adult publication, second-device public access, and unpublishing against a real backend remain unverified. No public deployment was created or claimed.

The four skipped tests are the real authenticated parent → approval → separate browser public access → unpublish flow, once for each requested width. They run only when `BB_TEST_PARENT_EMAIL` and `BB_TEST_PARENT_PASSWORD` are supplied together with the configured backend. The app uses real server handlers; these tests do not substitute mocked successful publication. See `docs/DEPLOYMENT.md` for setup.

Browser-local educational records and draft previews work now. Cloud publication fails closed until the secure prerequisites are available. Child-to-stranger inquiries and payment processing are disabled. Optional voice input and extended animations were not included; essential flows were prioritized.

Vitest's worker compilation encountered Windows sandbox temporary-file virtualization; running the suite outside that sandbox passed. The preview watcher was configured to ignore browser audit profiles and generated reports after Chromium's locked cookie-journal file caused a development watcher error. A final preview restart and browser checks verified the running app. Non-fatal Zod annotation warnings during bundling do not affect the successful build.

## Repeat

```sh
npm run typecheck
npm run lint
npm test
npm run build
npm run test:e2e -- --workers=2
```

With the frontend production preview running on port 5189:

```sh
node scripts/check-offline.mjs
node scripts/lighthouse.mjs
```

With the development preview on port 5188:

```sh
node scripts/screenshots.mjs
```

Generated raw outputs are kept under the gitignored `reports/` directory; the human-readable result is this tracked report.
