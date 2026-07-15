# Hermes Agent Handoff — Gauge

> **For future agent sessions:** read this first. It documents the
> working rules this project has settled on, plus where the
> gotchas are.

## Stack

- Next.js 15 (App Router, mostly server components)
- TypeScript, strict
- Clerk (auth + middleware)
- Prisma + Neon Postgres
- Vercel (Hobby plan)
- Tailwind + custom design tokens (`doppel-outer`, `doppel-inner`)
- Vitest (531 tests across 64 files)
- Playwright (3 e2e specs, all auth-gate checks; +1 signed-in
  smoke spec that requires Clerk test creds to run)

## Workflow conventions

1. **One concern per PR.** A PR is either UI, infra, docs, or
   test — never a mix. Atomic diffs make admin-merges safe.
2. **Every PR must hit `git status --short` cleanly** before push.
3. **Local gate before push:** `npx vitest run && npx next build`.
   Both must be green.
4. **Vercel "context" required-status-check hangs forever** on
   fresh PRs (the bot never reports). Recovery:
   - Wait ~5-10 min and retry `gh pr merge N --admin --squash`
   - If still blocked: merge current main into the PR branch,
     then retry `--admin`
   - Last resort: close + cherry-pick commit onto a new branch
5. **Don't commit secrets.** Vercel env vars in screenshots
   are masked for a reason. Never paste Clerk secret keys,
   OpenAI keys, or DB URLs into chat.

## Hard rules

- **No install of external skill repos without audit first.**
  `obra/superpowers`, `addyosmani/agent-skills`, `affaan-m/ECC`
  etc. — clone to a worktree, read the top-level files, report
  what they actually do, then ask the user before adopting.
- **No guessing at code paths the user can't see.** If they
  say "see screenshot" but the screenshot is in
  `/var/folders/.../NSIRD_screencaptureui_*/` (macOS sandbox),
  the file is locked. Ask for a path under `~/Desktop/`.
- **Don't hallucinate verification.** Vercel dashboard numbers
  (error rates, perf scores) are not accessible via the REST
  API — only via the web UI. If the user references one,
  ask them to look it up.

## Per-page notes

| Route | Access | Notes |
|---|---|---|
| `/` | public | Home. 11 sections, 5 of which shipped in this arc. |
| `/pricing` | public | Client component for billing toggle. Annual = 17% off. |
| `/features` | public | 12 feature cards in 3 categories, comparison table. |
| `/api-docs` `/api-docs/v1` | public | REST docs. v1 keys via /api/v1/keys. |
| `/status` | public | Polls /api/health every 30s. |
| `/integrations` | Clerk-gated | 4 Live providers + 5 Coming Soon. |
| `/dashboard` `/settings` `/team` `/billing` | Clerk-gated | Needs test creds to visually verify. |
| `/sign-in` `/sign-up` | public | Clerk hosted. |
| `/api/*` | mixed | /api/health, /api/webhooks, /api/v1 are public; rest gated. |

## External-blocked (user's keys/accounts needed)

- OpenAI quota $$ → end-to-end real AI transcripts
- pyannote / Deepgram key → real diarization
- Zoom / Meet / Teams dev accounts → meeting bot
- HubSpot / Salesforce sandbox → live OAuth test
- Clerk Enterprise → SSO (5.2)
- Paddle price IDs → live checkout (5.6)
- Neon paid plan → automated backups (6.1)

## Recent arc (PRs #62-#80)

All UI/marketing polish + the public /status page. See
`docs/roadmap/DEVELOPMENT_FRONTIER.md` for the full session log.

## Test running

```bash
# Vitest (unit + integration, 64 files, 531 tests)
npx vitest run

# Playwright (e2e, requires running dev server)
REDIS_HOST=disabled REDIS_PORT=0 npx next start -p 3100 &
npx playwright test

# Signed-in smoke (skips without E2E_TEST_USER_EMAIL/PASSWORD)
E2E_BASE_URL=http://localhost:3100 \
E2E_TEST_USER_EMAIL=you@example.com \
E2E_TEST_USER_PASSWORD=... \
npx playwright test e2e/gated-pages.spec.ts
```

## Don't forget

- `next build` artifacts live in `.next/` — `git clean -fdX` safe.
- The `.hermes/cache/screenshots/` directory is a cache, not a
  source of truth. Verify against the live DOM, not the screenshot.
- When you make changes that touch the public marketing surface,
  also update `docs/roadmap/DEVELOPMENT_FRONTIER.md` "Recently
  Shipped" table so the next agent session has accurate context.