# BiznesBola

Live site: https://biznesbola-mvp.vercel.app/

The current source also includes projects, practice simulations, a 12-lesson curriculum, account and organization APIs, immutable finance records, storefront review versions, and Supabase migrations. These cloud features require separately configured Supabase and service credentials; their presence in the code does not mean the complete SaaS specification has been verified in production. Without credentials, the application uses the guest learning mode and clearly labelled educational AI fallback.

The dream savings card now supports a small real product catalog with matching photos, model selection and seller prices. If the retailer cannot be reached from Vercel, the UI explicitly shows the last verified price and its original verification date. See [catalog implementation and verification](docs/PRODUCT_CATALOG.md).

All `/api/*` paths use a single `api/router.ts` serverless entry point with handlers in `server/handlers/`, fitting Vercel Hobby's function limit. Local development uses the same handlers through Vite middleware. Environment files, deployment credentials, generated reports and dependency directories are excluded from Git.

**Kichik g‘oyadan — birinchi daromadgacha.** An Uzbek/Russian educational entrepreneurship MVP for children ages 8–16 and their parents.

The application works locally without cloud credentials. It contains three onboarding slides, a profile, dashboard, Robert mentor, business calculator, separate training/real ledgers, savings allocations, seven learning lessons, achievements, a storefront editor, private previews, and a parent overview. Cloud publishing is gated by authenticated, administratively verified parent identities.

## Run

```sh
npm ci
npm run dev
```

Open the Vite URL shown in the terminal. Node 22+ is recommended; this build was tested with Node 24.18.1. The development server includes real `/api` handlers through Vite middleware. You do not need a separate server for local development.

```sh
npm run typecheck
npm run lint
npm test
npm run build
npx playwright install chromium
npm run test:e2e -- --workers=2
```

For a production frontend preview use `npx vite preview`. Vite preview serves static assets only; live API behavior is provided by Vercel, or by `npm run dev` locally. On this Windows host, Vitest's worker temporary files required running outside the filesystem sandbox. This is an execution-host issue, not a failing assertion.

## Server configuration

Copy `.env.example` to `.env.local`, fill it privately, and restart development. Never use a `VITE_` prefix for a secret. No API keys, parent passwords, or auth tokens are persisted in localStorage. Account sessions use server-managed HttpOnly cookies; the older standalone parent publishing flow uses an in-memory session.

| Variable                                              | Used for                                                                        |
| ----------------------------------------------------- | ------------------------------------------------------------------------------- |
| `ANTHROPIC_API_KEY`                                   | Real Anthropic mentor calls                                                     |
| `ANTHROPIC_MODEL`                                     | Explicit model ID; no assumed default                                           |
| `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` | Atomic distributed request limits; required for live AI and parent writes/login |
| `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY`          | Server-side PostgreSQL, Auth, and Storage                                       |
| `APP_ORIGIN`                                          | Exact permitted browser origin, including scheme and development port           |

Loopback development origins and the current Vercel deployment and production hostname are allowed automatically. Set `APP_ORIGIN` for an additional exact custom domain, including its scheme. Other origins are rejected.

Robert calls the actual Anthropic API using the installed `@ai-sdk/anthropic` provider. The supplied system prompt is preserved verbatim. The API retrieves the configured model to check account availability, consumes the provider stream, validates the complete answer, runs a separate safety review, and independently generates schema-validated calculator JSON. Price estimates are labelled. Output is buffered before delivery to avoid showing children unchecked partial output; this MVP does not expose raw token-by-token generation. It does not fabricate a live response. Any unavailable model, timeout, rate limit, safety failure, or unconfigured service produces a visibly labelled bilingual educational fallback.

Verify your account's model and optionally perform a small billable generation probe:

```sh
node --env-file=.env.local scripts/check-model.mjs
node --env-file=.env.local scripts/check-model.mjs --probe
```

See the official [Anthropic Models API](https://platform.claude.com/docs/en/api/models) and [AI SDK structured output reference](https://ai-sdk.dev/docs/reference/ai-sdk-core/output). SDK patterns were checked against the installed package's bundled docs and type definitions. Live account verification cannot be performed until a key and model are configured.

## Supabase and parent verification

1. Create a Supabase project and apply `supabase/migrations/001_biznesbola.sql` in its SQL editor.
2. In Supabase Auth, create an email-confirmed adult demo account through the administrator. Use a dedicated fictional demonstration identity; do not collect a child's email.
3. After your adult identity/consent process, add the parent's Auth UUID to `verified_parents` with the SQL editor or a trusted administrative process:

```sql
insert into public.verified_parents(user_id) values ('<adult-auth-user-uuid>');
```

4. Configure the server variables. Do not expose the service role key or enroll parents from browser code.
5. Save a complete local draft. In **Ota-onalar uchun**, sign into the verified account and submit the saved draft to the server. Review the entire immutable snapshot before approving publication.
6. Approval uploads validated compressed WebP images to the private bucket, then changes the reviewed snapshot to `published` and records its approval time. The public API returns only published snapshots. A fresh anonymous visitor can open the actual `/v/:uuid` link.
7. **Nashrni yopish** changes the server state; subsequent public reads return 404. No published-content cache is used. Previously issued image URLs expire after 60 seconds. Already viewed information cannot be recalled from a visitor's device.

Database and storage access is denied to anonymous and authenticated browser roles. All parent actions verify Auth tokens, email confirmation, allowlist membership, and storefront ownership server-side. Parent auth tokens are not placed in URLs or localStorage. A local draft's “review” status is an educational indication, not cloud approval. There is no fake PIN verification or fake publication.

Parent-controlled inquiries are intentionally disabled for this MVP. Public storefronts support browsing only; there are no payments, buyer messaging, addresses, phone fields, or purchase buttons. Administratively enrolling an adult demo account is not a general-purpose legal consent workflow. See `docs/PRIVACY.md` before any real-world launch.

## Financial rules

- `src/lib/calc.ts` is independent of React. Unit cost rounds upward to whole UZS to avoid understating expenses. Suggested price rounds to whole UZS. Markup is relative to cost; margin is relative to price. Expected profit is forecast sales multiplied by unit contribution; unused inventory remains capital at risk. Break-even sales explain recovery of the **entire** production outlay.
- `src/lib/budget.ts` separates revenue, production expenses, capital, and profit. A recorded sale can include its production cost, or the cost can be recorded separately. The UI explicitly warns against entering the same cost twice.
- Allocations apply to positive recorded profit, never unrecovered revenue or starting capital. Largest-remainder rounding guarantees that all integer so‘m are assigned exactly once. Percentages must be integers totalling 100.
- Training and manually recorded real transactions have independent balances. Correcting or undoing a transaction recalculates jars and savings. No money moves through the application.
- Savings projections require at least three income dates over at least seven days and positive recorded savings; otherwise the application explains why a projection is unavailable.
- XP uses one-time milestone flags. Undoing a record does not create another award. Local progress is educational, not an adversarially tamper-proof leaderboard.

## Offline behavior

Educational state persists in this browser. After opening production pages once, the service worker can serve cached educational pages/assets offline. Visit the modules you intend to demonstrate before disconnecting. API calls and public storefront routes are never cached or presented as offline publications. Local progress and draft images can be deleted from the parent overview. Very large image drafts may exceed browser storage; the application reports the failure.

## Documentation and verification

- `docs/DEMO.md`: the three-minute demonstration, including honest offline alternatives.
- `docs/DEPLOYMENT.md`: Vercel deployment and smoke checks.
- `docs/PRIVACY.md`: bilingual explanation and launch obligations.
- `TEST_REPORT.md`: measured checks, results, and limitations.
- `e2e/secure-publishing.spec.ts`: actual configured-backend test for approval, separate-browser access, and unpublishing. It skips without `BB_TEST_PARENT_EMAIL` and `BB_TEST_PARENT_PASSWORD`; these test-only secrets are never bundled and tracing is off for that file.

No deployment URL or live cloud success is claimed without verified external execution.
