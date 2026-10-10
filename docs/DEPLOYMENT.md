# Deploy to Vercel

This project intentionally uses the requested React/Vite frontend and Node serverless API, with Supabase PostgreSQL and Storage. Do not deploy only `dist/` to a static host and expect cloud APIs to work.

Shared server helpers live in `server/` so only request handlers are deployed from `api/`. The Node request/response signatures are documented in the official [Vercel Node runtime reference](https://vercel.com/docs/functions/runtimes/node-js); duration is set in code and the [functions configuration](https://vercel.com/docs/functions/configuring-functions/duration).

1. Push the source to your own Git repository or import this folder through the Vercel CLI.
2. Import it into Vercel as a Vite application. `vercel.json` specifies the build, SPA routes, and response headers.
3. Configure the server environment variables listed in `.env.example`. Set `APP_ORIGIN` to the exact production origin. Apply the database migration before publishing. Configure Redis credentials for distributed limits.
4. Deploy the complete source; Vercel builds `dist/` and the TypeScript handlers under `api/`.
5. Verify `/api/status` returns the configured capabilities, then verify Robert returns a **live** labelled answer. Run the model verification script against the same account/model locally if needed.
6. With the verified demo parent account, submit a draft, inspect its server snapshot, approve it, and copy the actual public URL.
7. Open that URL in a fresh browser or another device. Verify the QR opens exactly that deployed URL. Unpublish, refresh the second device, and verify it becomes inaccessible.

Without server credentials, educational features still work and storefronts remain private. API setup errors must never be relabelled as successful publication.

## Run the real publishing test

Use a dedicated verified demonstration account. Supply `BB_TEST_PARENT_EMAIL` and `BB_TEST_PARENT_PASSWORD` only in your test process environment. Configure `.env.local` with your server service credentials and `APP_ORIGIN=http://127.0.0.1:5177` for the test server. Then run:

```sh
npm run test:e2e -- --grep "verified parent" --workers=1
```

The test creates a fictional library snapshot, publishes it, opens it in a separate browser context, unpublishes it, and checks access is denied. It leaves unpublished records for audit; administrators may remove test records afterward. Tests never place passwords or tokens into frontend state or traces.

## Operational follow-up before a public launch

Provision environment-specific projects and least-privilege administrative processes. Set budget alerts on AI usage. Review storage cleanup and abandoned uploads. Add account recovery, formal consent records, deletion/retention handling, content moderation escalation, and an incident process. The MVP's guards are not a complete compliance certification or age-verification service.
