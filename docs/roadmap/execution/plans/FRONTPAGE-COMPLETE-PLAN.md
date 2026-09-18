# FRONTPAGE-COMPLETE — End-to-end execution plan

> User's 7 tasks → zero-error ship. Orchestrator = management, 4 executors on DISJOINT file sets.

## 0. Audit truth (swarm 2026-09-18)

| # | Task | Status |
|---|---|---|
| 1 | Frontal layout / color / contrast / a11y, beat competitor | PARTIAL — `white/40,white/30` on dark FAIL, CTA `#C94F17` borderline, light doppel on dark, no aria-live, nav focus gaps |
| 2 | `virtual competitor` flag reframe | DONE `homepage-copy.ts:42,49` — keep, verify test |
| 3 | Team showcase | SHELL DONE, content placeholder `team.ts:23-28` — polish without inventing humans |
| 4 | Who We Are | DONE — polish proof |
| 5 | Right video enhanced | TECH DONE `hero-scrubbable-video.tsx` — add chapters, retention, preload |
| 6 | Summary + evidence below | DONE `page.tsx:134,138` — presentability pass |
| 7 | Proper demo page | DONE shell — handoff CTA, end-screen |

## 1. Waves

### Executor A — layout/contrast/a11y (DISJOINT)
Files: `src/app/page.tsx`, `src/components/nav.tsx`, `src/components/hero-cta.tsx`, `src/app/globals.css`
- Dark alert cards: `text-white/40`→`text-white/70`, `white/30`→`white/60`, `white/55`→`white/85` (keep hierarchy, pass 4.5:1 on `#0a0a0b`/`zinc-900`).
- CTA: `bg-[#C94F17]`→`bg-[#A84310]` base (hover `#7C2D0C`) for 4.5:1 with white 13px; keep `#F26522` for large graphics only.
- Add `.doppel-outer-dark/.doppel-inner-dark` usage on dark film section instead of light doppel.
- Tertiary link 44px target; disclaimer `white/60`→`white/75` 12px.
- Nav: Escape closes, focus return to toggle, `aria-label="Mobile"` on inner nav, single `<nav>` landmark fix.
- Scrub: `aria-live="polite"` status region announcing "Scrubbed to {aria}".
- Verify: `npx tsc --noEmit`, eslint on touched files, `npx vitest run src/test/homepage-events.test.tsx`.

### Executor B — team / who-we-are / copy (DISJOINT)
Files: `src/lib/team.ts`, `src/components/team-showcase.tsx`, `src/components/who-we-are.tsx`, `src/lib/homepage-copy.ts`
- NO invented humans/photos. Keep role-forward labels.
- team.ts: expand 6→8 seats (+ GTM, Customer), richer focus lines, ADVISORY_NOTE honest.
- Showcase: eyebrow "Team showcase · building in the open", role chips, `ul role=list` keep, add "Hiring / contact" card linking `/contact`? use `mailto:hello@usegauge.com`.
- WhoWeAre: add honest proof row (12 teams / 500+ calls / 60s) + link to `/demo`.
- homepage-copy: keep H1, tighten heroSub ≤ 240 chars.
- Verify: `npx vitest run src/test/homepage-copy.test.ts`.

### Executor C — video / evidence / demo (DISJOINT)
Files: `src/components/hero-scrubbable-video.tsx`, `src/components/hero-video-player.tsx`, `src/components/scrub-summary-section.tsx`, `src/components/hero-evidence-stack.tsx`, `src/app/demo/page.tsx`, `src/components/demo-carousel.tsx`
- Hero video: chapter chips (00:02/12/22/32) overlay, `preload="metadata"`, poster `<link rel=preload as=image>` via `src/app/layout.tsx`? NO — only add `loading=eager` already high priority; add visible caption preview line + `aria-describedby`.
- Evidence: convert to 3 doppel-dark? keep light but add Slack/CRM glyphs (lucide `Slack`, `Database`), remove duplicated Health row from scrub (keep in evidence only).
- Demo: film→carousel anchor CTA "↓ Pick a call below", end-screen "Next: try upload" linking `/sign-up`, transcript slice 3→5 segs, keep `?call=` logic untouched.
- Verify: vitest hero/demo tests + `next build` unaffected.

### Executor D — awakening automation (DISJOINT)
Files: `.github/workflows/awaken.yml` (new), `.github/workflows/post-deploy-smoke.yml` (edit trigger), `.github/workflows/lighthouse.yml` (restore minimal gate)
- `awaken.yml` on push/PR/deployment_status/issues/schedule: jobs gate (tsc+vitest+lint+build), a11y note, smoke note. No secrets required; Slack only if `SLACK_WEBHOOK_URL` set (graceful skip).
- `post-deploy-smoke.yml`: add `deployment_status` trigger (only on success, production env).
- `lighthouse.yml`: replace echo with real `treosh/lighthouse-ci-action` on homepage+demo, non-blocking (`continue-on-error`) to avoid red PRs.
- Verify: `npx --yes yaml-lint`? at least `node --check`? Use `python3 -c yaml.safe_load` per file.

## 2. Gate (orchestrator)
`npx tsc --noEmit && npm run lint && npx vitest run && npm run build`. Smoke: `REDIS_HOST=disabled REDIS_PORT=0 npx next start -p 3100 & npx playwright test` (auth-gate specs only).

## 3. Ship
One concern per commit, sequential. No secrets in diffs.
