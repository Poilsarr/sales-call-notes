# Sentry Setup

Optional. The app works fine without Sentry — when `NEXT_PUBLIC_SENTRY_DSN` is not set, the SDK is a no-op.

## 1. Create a Sentry account

1. Go to https://sentry.io/signup/ and create a free account.
2. Create a new organization (or use the default).
3. Create a new project, choose **Next.js** as the platform.
4. Note the auto-generated DSN (Project Settings → Client Keys → DSN).

## 2. Add env vars

Add these to **Vercel** (Project → Settings → Environment Variables) and **GitHub** (Settings → Secrets and variables → Actions):

| Variable | Where to find it |
|---|---|
| `NEXT_PUBLIC_SENTRY_DSN` | Sentry → Project Settings → Client Keys → DSN |
| `SENTRY_AUTH_TOKEN` | Sentry → Settings → Auth Tokens → Create New Token (scopes: `project:releases`, `org:read`) |
| `SENTRY_ORG` | Sentry → Settings → Account → Organization Slug (e.g. `callnote-pro`) |
| `SENTRY_PROJECT` | Sentry → Project Settings → Project Slug (e.g. `sales-call-notes`) |

For Vercel: apply to **Production**, **Preview**, and **Development** environments.

## 3. Redeploy

After saving the env vars, trigger a redeploy on Vercel (or push a commit to main). The next build will:
- Bundle `@sentry/nextjs` only when `NEXT_PUBLIC_SENTRY_DSN` is set
- Upload source maps (improves stack traces)
- Start capturing browser + server errors

## 4. Verify

Pick any page and force an error to confirm it's flowing:

```bash
# in the browser console on any /app/* page
throw new Error("Sentry smoke test from " + location.pathname);
```

Or set a route to throw:

```ts
// src/app/api/transcribe/route.ts (add temporarily at the top of POST)
throw new Error("Sentry smoke test");
```

Within ~10 seconds the error should appear in the Sentry dashboard with:
- Full stack trace
- Source-mapped line numbers
- Request headers (PII redacted)
- Browser + OS info

## 5. PII scrubbing

The Sentry config in `sentry.{client,server,edge}.config.ts` redacts:
- Email addresses → `[redacted-email]`
- Clerk `__session` cookies → `__session=[redacted]`
- `Authorization` / `Cookie` / `x-api-key` headers → `[redacted]`
- 12 server-side secret env var names (DATABASE_URL, CLERK_SECRET_KEY, OPENAI_API_KEY, etc.) → `[redacted]`
- Bearer tokens → `Bearer [redacted]`
- Postgres connection strings (password part) → `[redacted]`
- User IP addresses → deleted

## 6. Source map upload

The `withSentryConfig` wrapper in `next.config.mjs` automatically uploads source maps to Sentry during `next build` when `SENTRY_AUTH_TOKEN`, `SENTRY_ORG`, and `SENTRY_PROJECT` are set. If you see anonymous errors in Sentry ("minified.js:1:1"), source maps aren't uploading — check the build log for the Sentry plugin output.
