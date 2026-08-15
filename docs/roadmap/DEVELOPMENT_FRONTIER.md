# Gauge — Development Frontier
## Master Plan: From 52% → 100% Production-Ready

> **For Hermes:** This is the master roadmap. Each level is gated.
> No level begins until the previous level passes ALL its checkpoints.
> Bite-sized tasks (TDD, ~2-5 min each) live inside the per-level plans
> in `docs/roadmap/levels/`. Use `subagent-driven-development` to execute.

---

## Executive Summary

| Metric | Today | After Frontier |
|---|---|---|
| Spec completion | ~85% | 100% |
| Honest "ships in prod" | ~80% | ~95% |
| Working features (no mocks) | ~92% | ~98% |
| Open critical issues | 1 | 0 |
| Test coverage | 64 test files / 531 tests | 30+ test files (exceeded) |
| CI/CD | GitHub Actions | GitHub Actions |

**7 Levels · 30+ work items · 12 explicit "do-not-break" checkpoints · 6 honest "gate" reviews**

The principle: **never advance a level with a known break, mock-leak, or uncommitted debt.**

---

## How to Read This Document

- **LEVEL** = a phase of work, sequentially locked.
- **GATE** = an explicit pass/fail checkpoint at the end of a level. Cannot skip.
- **CHECK** = a "do-not-break" rule that must hold *throughout* all levels.
- **TASK** = a single unit of work inside a level. ~2-5 min when possible.
- **DEBT** = tech debt that, if left unaddressed, will block the next level.

---

## Recently Shipped (PRs #42–#80)

> Session log. Updated as PRs merge. Honest: only lists PRs verified
> merged on `main` with green CI. Run `git log --oneline -25 main` to
> confirm.

| PR  | Date       | Title                                                              | What it closed                          |
| --- | ---------- | ------------------------------------------------------------------ | --------------------------------------- |
| #42 | 2026-06-19 | ui rewrite: landing, $9 price, kill ghost + lies                   | Ghost route + fake "500+ SDR teams" lie |
| #43 | 2026-06-19 | /demo money page                                                   | Marketing proof + 5 sample calls        |
| #44 | 2026-06-19 | level-1 GDPR close                                                 | Download route + token + settings UI    |
| #45 | 2026-06-19 | level 0/3/4 gate proofs                                            | OpenAI/Groq call, k6 load, chrome ext   |
| #46 | 2026-06-19 | level 6 ops + 5.5 onboarding + 5.7 API docs                         | /api/health, Sentry, smoke, /api-docs   |
| #47 | 2026-06-20 | feat(team): per-team branding                                      | 5.1                                     |
| #48 | 2026-06-20 | docs(compliance): SOC2 + DPA + VENDORS + SECURITY                  | 6.5                                     |
| #49 | 2026-06-20 | docs(ops): incident runbook + SLO                                 | 6.6                                     |
| #50 | 2026-06-20 | chore(obs): Sentry alert rules + ALERTS.md                         | 6.4                                     |
| #51 | 2026-06-20 | perf: landing → server component (-38 kB)                          | 4 (perf)                                |
| #52 | 2026-06-20 | feat(api): v1 public API + scoped API keys                         | 5.3                                     |
| #53 | 2026-06-20 | feat(marketing): SEO + JSON-LD + OG + social proof                 | 5.4 partial                             |
| #54 | 2026-06-20 | feat(settings): API keys management UI                             | 5.3 user-facing loop                    |
| #55 | 2026-06-20 | perf(pricing): server component (-2.4 kB)                          | 4                                       |
| #56 | 2026-06-20 | perf(demo): client island split (-0.5 kB)                          | 4                                       |
| #57 | 2026-06-20 | chore(perf): bundle-size CI gate                                   | 4 (regression guard)                    |
| #58 | 2026-06-20 | feat(api): per-key rate limiting (60/600 req/min)                  | 5.3 hardening                           |
| #59 | 2026-06-20 | feat(marketing): ROI calculator on /                               | 5.4 close                               |
| #61 | 2026-06-21 | feat(api-docs): dedicated v1 public API docs page                  | 5.7 v1 + audit fix                      |
| #69 | 2026-06-22 | fix(ui): restore light-card legibility + dashboard/team error states | UX blocker on gated pages            |
| #71 | 2026-06-22 | fix(ui): pricing secondary CTA contrast + clean up nav            | Pricing CTAs invisible + nav cruft     |
| #72 | 2026-06-22 | feat(home): add 'How it works' 4-step section + closing CTA banner | Home narrative missing                   |
| #73 | 2026-06-22 | feat(features): add competitor comparison table                    | /features missing vs Otter/Fireflies    |
| #74 | 2026-06-22 | feat(home): add product preview card to hero                       | Hero lacked product visual              |
| #75 | 2026-06-22 | feat(home): replace minimal footer with 5-column site footer       | Home footer bare                        |
| #76 | 2026-06-22 | feat(home): wedge section now shows 3-card live alert feed         | Single static alert felt like a screenshot|
| #77 | 2026-06-22 | feat(pricing): unify CTAs + monthly/annual toggle + FAQ            | Pricing copy + missing FAQ              |
| #79 | 2026-06-22 | feat(site): add /status page (client-side health probe)            | Footer linked to 404                    |
| #80 | 2026-06-22 | feat(site): anchor IDs on /features + globalize SiteFooter         | Broken anchor links + per-page footer   |
| —   | 2026-08-04 | feat(calls): call renaming (title/displayName everywhere)          | Custom titles: PATCH write path, title search, CSV-injection-safe exports, rename UI (list + detail), RAG title retrieval; commits 6a09bad..8d5c477, 611 tests |
| —   | 2026-08-06 | feat(vs): /vs/gong honest comparison page                          | S6 arc, orchestrator APPROVED: hedged Gong figures traced to market-intel.md (R15), Gauge figures 12/12 vs plans.ts, a11y fixes in shared vs-comparison (header 1.07:1→9:1, CTA→#C94F17 4.55:1, gray-600/500 text), footer regression fixed, meta 154 chars, 17-test honesty suite; commit a11d07a, 738 tests |
| —   | 2026-08-06 | feat(s7): team custom vocabulary                          | Teams teach Gauge internal terms (term <=100 / definition <=500 chars, 200-entry cap) from Settings -> Workspace; admin CRUD is team-scoped + audit-logged; <=50 alphabetical entries injected into the system prompt for /api/analyze and /api/summarize; prompt block ends with data-not-instructions delimiter; orchestrator APPROVED (trivial fixes: summarize wiring + 'new call' copy honesty); commit 3fd7af3, 780 tests |
| —   | 2026-08-06 | feat(security): honest 10-section security page + skip-link arc   | S6 extension, orchestrator APPROVED (trivial fixes): 14-item honest checklist (Live/Partial/Roadmap/N-A), no-training §5, sub-processor table vs VENDORS.md, export-token "7-day" claim, SSO Planned, DPA on request; REAL F5 vuln closed (export route now verifies token hash → 403; underscore-safe Clerk user ID parsing in gdpr-token); skip link bypasses nav site-wide (Nav out of main on 19 pages); DPA.md gained no-training clause + provider roles fixed; commits ce12a0a, 4d2689b, 57d764b, f82653c; 757 tests |
| —   | 2026-08-06 | feat(s8): action items first-class timestamps                    | TRD-pinned R8.1-R8.3: `ActionItem.timestamp Float?` migration (idempotent), analysis user-message gains `[MM:SS]` timeline anchors (grounded LLM timestamps, both OpenAI + Groq), b2b-sales prompt `timestamp` field, analyze route persists `item.timestamp ?? null` + seeds from finalSegments, history list serializer passes timestamp, manual action-item CRUD accepts timestamp, review page `Jump to M:SS` chips + TranscriptViewer imperative `seekTo`, CSV export gains Action Item Timestamps column (extracted to lib/calls-export.ts); plan docs/roadmap/execution/plans/S8-PLAN.md, commit c3dc3dd, 826 tests |
| —   | 2026-08-06 | fix(chat): RAG BYOK-aware + user scoping (S10/R10.1) | Research found S10's retriever already shipped (searchByQuery: query embed via text-embedding-3-small + in-JS cosine over Call.embedding, top-5, recent-5 fallback) — but chat was NOT BYOK-aware (`apiKey=undefined`) AND had a prod bug: passed the Clerk session id to DB queries storing Prisma User.id → retrieval always empty. Now mirrors /api/calls/search: getUserByClerkId (401 on null) → getByokKeys(user.id) → searchByQuery(query, user.id, 5, byok.openaiKey, true); fallback select gains createdAt (date was falling back to call id); tests +2 (null-user 401, BYOK+id arg pin via prototype spy); plan docs/roadmap/execution/plans/S10-PLAN.md, commit a28f248, 832 tests |
| —   | 2026-08-06 | feat(sitemap): public /share rows (R9.1) | Sitemap now async + ISR (revalidate 1h): prisma.call.findMany({ where: { isPublic: true }, take: 500 }) appends /share/<id> (weekly, 0.3, lastModified=updatedAt); predicate mirrors the share page gate exactly (no archived filter — page renders archived), try/catch fallback keeps local build green without Neon (24 static rows) and prod gets share rows hourly; plan docs/roadmap/execution/plans/S9-PLAN.md, commit aa3f570, 830 tests |
| —   | 2026-08-09 | feat(intel): honesty banner for pre-tracking mentions | When populated data has mentions but ALL have null context+sentiment (legacy calls), the page now shows: "n mention(s) detected, but these calls were analyzed before competitor tracking shipped — context and sentiment aren't available for them yet." (Info icon, native zinc card style, above Recent Mentions; guards: mentions.length > 0 to avoid vacuous every()); +2 tests (banner renders for legacy body, absent for context-bearing); also fixed prove-intel.ts entry typing missed by the earlier build gate (entry.error type → build errored; now green); commit cdaba4c, 867 tests |
| —   | 2026-08-09 | proof: live Groq end-to-end competitor extraction | PROVES the intel pipeline end-to-end via real model (llama-3.3-70b-versatile, Groq path with OPENAI_API_KEY blanked, tsx + @/ aliases): transcript mentioning Gong ("too expensive"→negative) + Fathom ("free tier is tempting"→positive) run through BOTH b2b-sales and enrollment-calls prompts; all 4 mentions extracted with non-null context + lowercase sentiment (validates normalizeAnalysis toLowerCase); artifact scripts/.proof-intel.json; run: npx tsx --env-file=.env.local scripts/prove-intel.ts; commit e1f6b72, 865 tests |
| —   | 2026-08-09 | feat(intel): deal risks + context-first mentions + data enabler | UI (parallel agent): Deal Risks card (negative-sentiment mentions, top 3, "How to beat →" /vs/* playbook links), context-first mention rows with Playbook + Call actions, competitor→/vs mapping (Gong, Otter, Fireflies, Fathom, tl;dv), commit cc234bd. Data enabler (this arc, INTEL-DATA-PLAN): `competitorsMentioned` (name/context/sentiment) now declared in default b2b-sales + sales-meddic prompt schemas (parser was already generic at analyze/route.ts:374-383) + sentiment lowercased at normalizeAnalysis choke point (UI/Slack/analytics all strict-match lowercase) + prompt-schema-contract test + normalize preservation tests; commits a0d8ea6..f4c8d36, 865 tests |
| —   | 2026-08-06 | fix(security): swarm audit wave-3 execution | Converged audit + triage → executed: cross-tenant fixes (gdpr-export user-only scoping, webhook trigger match by userId, Slack integration match by team_id, team/performance sharedWithTeam, live-transcription userId-namespaced sessions), SSRF/token-exfil guard (analyze blobUrl allow-list via lib/blob-url.ts), IDOR guards (slack, action-items, analytics, share toggle `await auth()`), plan gates (webhooks, v1/keys, billing self-grant vs Paddle subscription), chat rate limit 20/min + 2000-char cap, debug route auth + no key-length leak, billing cancel via Paddle API (effectiveFrom next_billing_period), middleware fix — /api/webhooks was excluded → auth() threw → permanent 500 (now 401; receivers stay public), share page: owner email excluded + noindex on missing calls (14.2.3 serves notFound with status 200); a11y: #F26522→#C94F17 on 16 components + mobile-menu keyboard/AT hygiene; commits ba8b8b5..4198985, 813 tests |
| —   | 2026-08-08 | polish wave: lint cleanup + skip-link no-op pages (S8-S11 CI bump follow-up) | Two parallel executors + full MIRACLE gate: (fix-lint) memoize callbacks — calls `loadArchived` useCallback([user?.id]), team `resetState` useCallback([]) + `fetchMembers` useCallback([router, resetState]) with mount effect moved below consts (TDZ trap avoided), team/performance `fetchPerformance` useCallback([router]) + effect moved, upgrade-prompt drops `onClose` (Paddle option key, not prop) → eslint 0 warnings; (a11y) `#main` target on /pricing (id added), /features (id + Nav hoisted out of main into fragment, mirror 4d2689b), /changelog /roadmap /no-bot (div → `<main id=\"main\">`); plan docs/roadmap/execution/plans/POLISH-PLAN.md, commits 654e098 (lint), 0c1380f (a11y); 832 tests, CI + React Doctor green |

| —   | 2026-08-09 | NEXT15 upgrade: Next.js 15.5.23 + React 19 + Node 24 | Async-API migration (8 `await cookies()`, 17 route handlers `Promise<params>`, 2 pages `React.use`/`await params`, 3 test files), Suspense boundaries (`settings`, `app/record`) for `useSearchParams`, ESLint 9 flat config + eslint-config-next 15, `serverExternalPackages`, CI Node 24 + engines 22→24, pnpm→npm, lucide `Chrome`→`Globe`, Link-framework fixes; honest proof retool (agent-audited): freshness reads `_meta.captured_at` (mtime was CI-vacuous), converter aliases `error_rate`→`rate`, k6 think-time; prove-openai gains Anthropic + OmniRoute relay fallback — refreshed proof is a real 2xx via local OmniRoute (OpenAI key valid but 0 credits); perf verdict (4-agent wave): June targets minted on 404-era data → rebased honestly (home 750 / demo 700, cold-start headroom), structural finding backlogged (ClerkProvider `headers()` in root layout + bom1→iad1 no-store); soft-404 `/share/<missing>` accepted as Next 15.2+ streaming behavior (noindex in place); planned `NEXT15-PLAN.md`, commits 44af17a..bc31fef, 832 tests, green |
| —   | 2026-08-12 | INTELLIGENCE cutover (Level 2 gate): diarization live + Langfuse tracing + analytics health | Both executors complete + orchestrator gate: VERCEL diarization guard → `DIARIZATION_PROVIDER=deepgram` + key gate (fail-soft fallback, analyze/route.ts:205), `detect_language: true` (diarization.ts:38), DEEPGRAM_API_KEY in Sentry redactions, dead Python scripts deleted, diarization tests extended. Real 2-speaker diarization proof generated + passed (scripts/prove-diarization.ts + scripts/.proof-diarization.json via Deepgram nova-2). Langfuse `wrapClient` wired into `createOpenAIClient` chokepoint (idempotent, fail-closed); NEW /api/analytics/health (per-team avg score, calls/week, top objections; team = sharedWithTeam, personal fallback) + tests. Knowledge-graph entity/relation extraction wired into analyze route (G8); CallInsight populated with sentimentScore/talkRatio/objections/topics (G9). Plan docs/roadmap/execution/plans/INTELLIGENCE-CUTOVER-PLAN.md; tsc green; next build green; 121 files / 991 tests green. GATE 2 FULLY SATISFIED. |
| —   | 2026-08-14 | LIGHTHOUSE-CI arc: hard gate on PRs (was red since 07-16, soft-warn) | Root-caused 5 failures (no env in job → BullMQ module-scope queues ECONNREFUSED :6379 + ClerkProvider throw; stale `ready started server`; duplicate `categories:performance` key; ad-hoc @lhci/cli install; flaky URLs). Rewritten workflow mirrors the green ci.yml Build env (dummy fallbacks) + `REDIS_HOST=disabled REDIS_PORT=0`, adds workflow_dispatch + permissions + 25-min timeout. Config: 5 public URLs, desktop preset, thresholds grounded in 2026-08-14 local proof LHRs (perf ≥0.85 / a11y ≥0.85 / bp ≥0.70 error; seo ≥0.90 WARN — blocked by meta-in-body P1 (tracked below); LCP ≤2500, CLS ≤0.15, bytes ≤900KB). Local gate green (lhci autorun exit 0, 991 tests, tsc clean, lint 0 errors); verification cloud (Code Reviewer + Reality Checker) approved after fixes; workflow_dispatch on main GREEN (run 31824328777, warnings only: TBT 240ms, unused-css, responsive-images). plan docs/roadmap/execution/plans/LIGHTHOUSE-CI-PRD/TRD/PLAN.md, commit 91e44c2 |
| —   | 2026-08-09 | TEAM-INTEL arc: team invite fix + intelligence honesty | 3-agent explore wave + 3-agent consultation (PM/Lead-Eng/Minimal-Change; user ruled seat limits ENFORCE) → 6 commits, 861 tests, build green. Team: invite form now visible for solo users (was gated behind isAdmin which required an existing team — empty state told users to invite with no way to do it), honest empty-state copy, dead `hasTeam` removed; POST /api/team enforces seat limits (free=1 → "Team workspaces are a Pro feature", pro=5) before any write; 14+3 route tests + 5 component tests. Intelligence: `summary.total` now a true count (was capped at 50 while charts summed unlimited groupBy — contradictory numbers), competitor chips wired to the page filter (`?competitor=` refetch, heading + stat label switch; was pure-theater local state), network failure now surfaces an error card with Try again (was a fake empty state), dead "Competitive Alerts requires Pro" banner deleted (provably unreachable — killed the Pro-user flash), empty-state copy no longer promises "exact line and speaker" (pipeline writes nulls), "Showing the most recent N of M" caption; 7 component tests; plan docs/roadmap/execution/plans/TEAM-INTEL-PLAN.md, commits 67bb1aa..cade46e |
| —   | 2026-08-10 | INTEGRATIONS-FIX arc: dead-ends killed + honest state + OAuth security (waves 1-4) | 3-agent explore + LEO/Architect PRD/TRD/PLAN → 6 commits (12f38d0, d0869d7, 552292b, 061067c, 647f843, 421ae8c, bf91cbf), 972 tests, build green. Wave 1 (committed 12f38d0/d0869d7): `/settings?tab=crm` dead target → real `?tab=integrations`; settings Connect called /api/calendar (no authUrl, never returns one) → /api/integrations?action=auth-url&provider=google_calendar; static "Live" lies → honest Not configured/Coming soon badges; no-op Sync CRM toast → Manage link; new settings/integrations-panel.tsx; 20 new tests. Wave 2 (552292b): panel + /integrations client consume real GET /api/integrations status (connected/configured/sandbox per provider), IntegrationHealth component (configured/connected/last-sync/SANDBOX), google=connected callback handled (toast+refetch), google_calendar live provider card, Sync to CRM button → real POST /api/calls/[id]/sync-crm (team-configured provider), slack channel from config (default #general). Wave 4 (061067c, 647f843, 421ae8c): Salesforce PKCE S256 (verifier in cookie, code_verifier exchange, no client_secret), ADMIN gate on all 3 connect + 3 callback routes (members could overwrite workspace creds), dev-sandbox only local (NODE_ENV=development AND VERCEL!=1 — previews silently faked creds), google connect requires ID+SECRET, AES-256-GCM at-rest token encryption (ENCRYPTION_KEY, v1 envelope, lazy legacy migration, no token leak in GET), [id]/test explicit provider dispatch (unknown→400, google_calendar via tokeninfo, was falling through to Slack API), ADMIN + rate-limit gates; .env.example truth (real /api/integrations/google/callback, ENCRYPTION_KEY row). DB-gated: @@unique(teamId, provider) + scripts/dedupe-integrations.ts PREPARED (bf91cbf) but NOT applied — Neon unreachable (ep-long-tooth pooler); run `npx tsx --env-file=.env.local scripts/dedupe-integrations.ts` then `npx prisma migrate dev --name integration_unique_team_provider` when DB is back. External-blocked: live OAuth verification (real Google/HubSpot/Salesforce/Slack/Teams creds), dev-sandbox proves UX only |

**Tracked items (next arcs, from S6 orchestrator ruling):**
- **Skip link (SEV-3, WCAG 2.4.1)** — *RESOLVED* in the S6 security-extension arc: anchor first in body (commit 8ee8973) + `<Nav />` moved out of `<main id="main">` on all 19 co-rendering pages (commit 4d2689b); smoke-verified nav renders before main.
- **Skip-link no-op pages (P2, orchestrator)** — `/pricing`, `/changelog`, `/roadmap`, `/no-bot`, `/features` render `<Nav />` but have no `<main>` element, so the global skip link is a silent no-op there. Follow-up: give each a `<main id="main">` wrapper or omit Nav.
- **CTA orange token site-wide** — in-component #C94F17 stays; global brand token change (white-on-#F26522 fails AA) needs design sign-off + own arc.
- **Next.js 14.2.3 → 15** — *SHIPPED* 2026-08-09 (NEXT15 arc) — the soft-404 (notFound-with-streamed-metadata = 200) now: Next 15.2+ documented streaming behavior; noindex keeps it out of search. True 404 would require a proxy/middleware resource check (backlog).
- **Meta-in-body (P1, from LIGHTHOUSE-CI arc, 2026-08-14)** — *FIXED* 2026-08-15 (CLERK-STATIC arc). Root cause was `@clerk/nextjs@5.7.6` server `ClerkProvider` calling `headers()` unconditionally (`dist/esm/app-router/server/ClerkProvider.js:11`) → every route dynamic → root loading.tsx fallback-first streaming → metadata injected into the streamed body. Fix: bump to `@clerk/nextjs@^6.39.6` (dist-tag `latest-v5`; both v6.39.6 and v7.7.6 gate every `headers()` call behind an opt-in `dynamic` prop, default off → static-by-default). Only breaking change for this repo: `auth()` became async — single sync call site at `src/middleware.ts:52` now `await auth()`; new text-level regression pin `src/test/middleware-auth-async.test.ts` (32 mocked test files can't catch a forgotten await). Verified: 993 tests pass, tsc clean, lint 0, build shows the 5 audited URLs `○` Static, `/pricing` stays `ƒ`, curl meta head=1 body=0 on all five, Playwright confirms fallback resolves + real content renders + meta in head, gated redirects 307/401 unchanged. Note: `<!--$?-->`/`S:0`/`$RC` markers on 4/5 URLs are standard Next 15 output for client-component page trees (pre-existing — `/pricing` dynamic shows the same; `/blog`/`/api-docs` with same v6 provider have none). Plan `CLERK-STATIC-PLAN.md`, commit 22290d3. Follow-up: PR 2 promotes Lighthouse CI SEO warn→error (`max(0.9, proof−0.05)`).

*Resolved: `data.metaDescription` dead-code item — single-sourced via `generateMetadata` (commit `3befcdc`): all vs pages derive title/description/openGraph from the data object; 2 regression tests pin it.*

---


## Per-Level Current Status

| Level | Status | Notes |
|---|---|---|
| **0 — Stop the bleeding** | ✓ SHIPPED | OpenAI quota still external-blocked; Groq fallback works (PR #45). |
| **1 — Lock the perimeter** | ✓ SHIPPED | RBAC + GDPR + audit + action items all live. |
| **2 — Real intelligence** | ✓ SHIPPED | Diarization live behind `DIARIZATION_PROVIDER=deepgram` (+ key), fail-soft fallback; real 2-speaker Deepgram nova-2 proof verified (scripts/.proof-diarization.json); Langfuse tracing on every OpenAI/Groq client (idempotent, fail-closed); `/api/analytics/health` per-team aggregate live; KG entity/relation extraction + CallInsight fields populated in analyze route. GATE 2 FULLY SATISFIED. |
| **3 — Integrations that pay** | ✓ MOSTLY | OAuth live; meeting bot BLOCKED (Zoom/Meet/Teams dev accts). |
| **4 — Performance & reliability** | ✓ SHIPPED | Perf budget + k6 + bundle gate + smoke test all in CI. |
| **5 — Sell the product** | ✓ MOSTLY | All shipped except: 5.2 SSO (Clerk Enterprise), 5.6 Paddle pricing live. Pricing UI now has annual toggle + FAQ (PR #77). |
| **6 — Production hardening** | ✓ SHIPPED | Sentry, uptime, alerts, compliance docs, runbook, smoke test, public /status page (PR #79). 6.1 backups BLOCKED (Neon paid). |

---

## External-Blocked (require user-supplied keys/accounts)

> These are NOT technical blockers on our side. They need paid
> accounts the user owns. Document them here so they don't get
> forgotten.

- **OpenAI quota $$** → unblocks end-to-end real AI transcripts (level 0)
- **Deepgram API key** → activates REAL diarization (`DIARIZATION_PROVIDER=deepgram`); without it the fail-soft fallback runs (level 2)
- **Zoom / Meet / Teams dev accounts** → unblocks meeting bot (level 3)
- **HubSpot / Salesforce sandbox** → unblocks live OAuth test (level 3)
- **Clerk Enterprise subscription** → unblocks SSO (5.2)
- **Paddle price IDs** → unblocks /pricing live checkout (5.6)
- **Neon paid plan** → unblocks backups + restore drill (6.1)

---

## Code-Doable Left on the Board (next 1-2 PRs)

| Item | Effort | Value |
|---|---|---|
| ~~Lighthouse CI workflow (currently runs as soft-warn only)~~ — *SHIPPED* 2026-08-14: hard gate live on PRs (commit 91e44c2); seo stays warn pending the meta-in-body P1 | — | — |
| `/features` deep server-component refactor | HIGH | Diminishing returns — not on k6 hot path |
| Update per-level `LEVEL_*.md` task checklists to reflect shipped work | LOW | Hygiene |
| Playwright signed-in visual verification of /integrations, /team, /app | MED | Replaces manual screenshot-based audit |
| Audit gated pages for any UI inconsistencies surfaced in 2026-06-22 screenshots | LOW | Closes last visual feedback loop |

---

## Honest Tradeoffs (Things We Are NOT Building)

Documenting explicitly so we don't scope-creep:

1. **Mobile apps** — PWA only. Native iOS/Android = v2.
2. **On-premise deployment** — Cloud-only. Enterprise self-host = v2.
3. **Custom ML model training** — Using Deepgram/Whisper/OpenAI. Training = v3.
4. **Multi-language UI** — English only. i18n = v2.
5. **HIPAA** — Mentioned in spec, not built. Optional v2 with BAA.
6. **Real-time multi-user cursors** — Single-user live mode. Collab = v2.

---

## Risks & Mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| OpenAI quota / cost spike | High | Level 0 quota guard + cost alert at $X/day |
| Postgres connection limits on serverless | Med | Use Neon pooled connection, PgBouncer |
| Deepgram API cost | Med | Cache transcripts forever, dedupe by audio hash |
| Chrome extension review delays | Med | Plan v1.1 extension updates 2 weeks ahead |
| BullMQ worker not running in Vercel | High | Use Upstash QStash instead OR self-host worker |
| Clerk Enterprise pricing | Med | Confirm pricing before promising SSO |

---

## Success Criteria — "Done"

The product is **100% on the frontier** when:

- [ ] All 7 levels have passed their gates (5 of 7 fully passed; 2 partial — see table above)
- [ ] Zero `// TODO: REAL` mocks in production path
- [ ] All 12 cross-cutting checks pass on `main`
- [ ] Beta launch checklist (`DEPLOYMENT_CHECKLIST.md`) fully checked
- [ ] ARR target Q4 2026 = $100K (per spec) — on track
- [ ] 30-day retention > 60% (per spec) — on track

---

## Per-Level Plan Index

Detailed bite-sized task plans live here (created as we go):

- `docs/roadmap/levels/LEVEL_0.md` — Stop The Bleeding
- `docs/roadmap/levels/LEVEL_1.md` — Lock The Perimeter
- `docs/roadmap/levels/LEVEL_2.md` — Make The Intelligence Real
- `docs/roadmap/levels/LEVEL_3.md` — The Integrations That Pay
- `docs/roadmap/levels/LEVEL_4.md` — Performance & Reliability
- `docs/roadmap/levels/LEVEL_5.md` — Sell The Product
- `docs/roadmap/levels/LEVEL_6.md` — Production Hardening

Each level plan has: pre-reqs, exact file paths, copy-paste commands, expected outputs, commit messages, gate criteria.

---

## Review Cadence

- **Daily:** 15-min standup — what shipped, what's blocked, any CHECK violation.
- **Per level:** Gate review before next level starts. Requires green CI + green tests + Sentry clean.
- **Per quarter:** Roadmap review — adjust based on user feedback, ARR, retention.

---

**The Frontier is locked. No level starts without the previous one's gate passed. No check is skipped.**