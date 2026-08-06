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
| —   | 2026-08-06 | fix(security): swarm audit wave-3 execution                     | Converged audit + triage → executed: cross-tenant fixes (gdpr-export user-only scoping, webhook trigger team filter, Slack integration match by team_id, team/performance sharedWithTeam, live-transcription userId-namespaced sessions), SSRF/token-exfil guard (analyze blobUrl allow-list via lib/blob-url.ts), IDOR guards (slack, action-items, analytics, share toggle `await auth()`), plan gates (webhooks, v1/keys, billing self-grant vs Paddle subscription), chat rate limit 20/min + 2000-char cap, debug route auth + no key-length leak, billing cancel via Paddle API (effectiveFrom next_billing_period), middleware fix — /api/webhooks was excluded → auth() threw → permanent 500 (now 401; receivers stay public), share page: owner email excluded + noindex on missing calls (14.2.3 serves notFound with status 200); a11y: #F26522→#C94F17 on 16 components + mobile-menu keyboard/AT hygiene; commits ba8b8b5..4198985, 813 tests |

**Tracked items (next arcs, from S6 orchestrator ruling):**
- **Skip link (SEV-3, WCAG 2.4.1)** — *RESOLVED* in the S6 security-extension arc: anchor first in body (commit 8ee8973) + `<Nav />` moved out of `<main id="main">` on all 19 co-rendering pages (commit 4d2689b); smoke-verified nav renders before main.
- **Skip-link no-op pages (P2, orchestrator)** — `/pricing`, `/changelog`, `/roadmap`, `/no-bot`, `/features` render `<Nav />` but have no `<main>` element, so the global skip link is a silent no-op there. Follow-up: give each a `<main id="main">` wrapper or omit Nav.
- **CTA orange token site-wide** — in-component #C94F17 stays; global brand token change (white-on-#F26522 fails AA) needs design sign-off + own arc.
- **Next.js 14.2.3 → 15** — needed for the notFound()-with-generateMetadata 404-status bug (share page serves noindex fallback meanwhile) and middleware-auth CVE fix; tracked backlog item.

*Resolved: `data.metaDescription` dead-code item — single-sourced via `generateMetadata` (commit `3befcdc`): all vs pages derive title/description/openGraph from the data object; 2 regression tests pin it.*

---


## Per-Level Current Status

| Level | Status | Notes |
|---|---|---|
| **0 — Stop the bleeding** | ✓ SHIPPED | OpenAI quota still external-blocked; Groq fallback works (PR #45). |
| **1 — Lock the perimeter** | ✓ SHIPPED | RBAC + GDPR + audit + action items all live. |
| **2 — Real intelligence** | ~ PARTIAL | Knowledge graph + analytics queryable. Real diarization BLOCKED (pyannote/Deepgram key). |
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
- **pyannote / Deepgram key** → unblocks real diarization (level 2)
- **Zoom / Meet / Teams dev accounts** → unblocks meeting bot (level 3)
- **HubSpot / Salesforce sandbox** → unblocks live OAuth test (level 3)
- **Clerk Enterprise subscription** → unblocks SSO (5.2)
- **Paddle price IDs** → unblocks /pricing live checkout (5.6)
- **Neon paid plan** → unblocks backups + restore drill (6.1)

---

## Code-Doable Left on the Board (next 1-2 PRs)

| Item | Effort | Value |
|---|---|---|
| Lighthouse CI workflow (currently runs as soft-warn only) | MED | Catches SEO/perf regressions before merge |
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