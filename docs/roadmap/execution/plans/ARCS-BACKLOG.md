# ARCS Backlog — post-audit ship path

> Intake doc for all work items from the 2026-08-18/19 Codex audit
> ("suitable for controlled private beta; not broad self-serve") plus
> findings from this session's verification.
> Each arc gets its own `<ARC>-PLAN.md` before execution.

## A. SECURITY-HARDENING (FIRST) — plan: SECURITY-HARDENING-PLAN.md — **SHIPPED 2026-08-19**

Audit blockers 1–3 + trust copy (ship-order item 1).

- A1. Legacy multipart uploads can be public — **DONE** (90d1386: private blobs, validate-before-store, plan caps, failure-path cleanup).
- A2. Deletion does not purge all stored data — **DONE** (4c19608: blob purge on call delete, inline FK-safe hard-delete, BYOK keys nulled).
- A3. Rate limiting fails open + bypass risks — **DONE** (8423975: XFF last-hop, honest 60/600 v1 limits, live limiter, key-creation cap, phantom routes, Sentry observability; fail-open posture kept by design).
- A4. Trust/privacy data-processing page — **DONE** (f4a7935: /privacy with providers by name, no-training statement, retention controls; honest-copy tests green).
- A5. Secure uploads / transcription size-limit hardening — **DONE** (covered by W-A reorder + existing 25MB guard + chunking).

Follow-ups (frontier rows): settings toast copy stale; KG calls[] scrub; presigned path still broken; deploy verified Ready (gauge-knfr7qkm7).

## B. BUNDLE RE-BASELINE + OPTIMIZATION — plan: BUNDLE-PLAN.md — **SHIPPED 2026-08-20**

- B1. Proof regenerated (72→114 lines) + honest budgets re-baselined (old+32 kB floor delta) — **DONE** (4c64e47: / 252 /demo 212 /pricing 242 /features 292 /settings 247 /onboarding 207 /dashboard 242 /billing 252; header documents React 19/Next 15/Clerk 6 inflation).
- B2. Optimization — **DONE** (0f0b421 Sentry lazy 184→105 shared, 43a9833 GSAP lazy /features 279→224, b54ec40 PLANS off dashboard + lazy Toaster + honest delete copy; all 8 routes 73–145 kB under new budgets; 1112 tests; guardian CLEAR).

Status: SHIPPED. Deps: none.

## C. DEPENDENCY UPGRADE (19 high-severity vulns) — plan: DEPS-UPGRADE-PLAN.md — **WAVES 1-4 SHIPPED 2026-08-22 (26→3)**

`npm audit` before: 26 total / 19 high / 0 critical / 4 moderate / 3 low.

- Wave1 (f9a925f) dev-only: `vite@8.0.16`, `esbuild@0.28.2`, `nanoid@3.3.18`, `fast-uri@3.1.5` via `@sentry/nextjs@10.70.0`, `brace-expansion@5.0.9` — `26→18` (15 high).
- Wave2 (c23e593) prod: `@vercel/blob@2.8.0` (`undici@6.28/7.29`), `form-data@4.0.6`, `js-cookie@3.0.8` — `18→13` (10 high).
- Wave3 (4f566dc) Clerk patch-line: `@clerk/backend@1.14.1→1.34.0` — `13→13` (dedupe, no audit DB entry).
- Wave4 (0bfe585) LHCI removal: `npm remove @lhci/cli` (abandoned) — `13→3` (only `next@15.5.23` + `postcss@8.5.14` + `sharp@0.34.5` remain, require `next@16` major).

Status: WAVES 1-4 SHIPPED. Wave5 `next@16`/`postcss`/`sharp` deferred (major, per plan). Effort: L. Deps: none. Ship order: before broad launch.

## D. SANDBOX / LIVE VERIFICATION (BLOCKED on user accounts — D1 Paddle-live PARKED per user)

- D1. Paddle sandbox: upgrade / cancel / refund through `/api/paddle/webhook`
      (+ fix `PADDLE_ENV` / `NEXT_PUBLIC_PADDLE_CLIENT_KEY` to match live).
      **PARKED** — Paddle **live** migration intentionally left parked until ship (per user 2026-08-21: "leave live until ship") — not in progress.
- D2. HubSpot / Salesforce OAuth against sandboxes (ENCRYPTION_KEY now set —
      was audit blocker #4, fixed 08-19).
- D3. 20–30 real end-to-end calls with diarization + analysis (needs OpenAI
      credits for embeddings/analysis; Groq covers transcription).
- D4. Human-reviewed AI accuracy benchmark (audit ship-order item).

Status: BLOCKED / PARKED (D1 live parked). Deps: user's Paddle/HubSpot/Salesforce dashboards, OpenAI
credits, test creds. Not in progress.

## E. FEATURE COMPLETION (audit ship-order items, post-security)

- E1. Action-item editing, assignment, timestamps, CRM follow-through.

Status: NOT STARTED. Effort: M. Deps: A (secure baseline first).

## Evidence rules

All executor reports follow ARC-CONTEXT-GUARDIAN.md: artifact-backed claims,
allowlisted file sets, resolver-checked references, gate outputs attached.