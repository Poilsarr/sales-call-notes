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

## B. BUNDLE RE-BASELINE + OPTIMIZATION

Found in this session: 8 routes 7–15% over June budgets (`/features` 279 kB
vs 260, `/dashboard` 237 vs 210, `/settings` 250 vs 215, `/billing` 234 vs
220, `/pricing` 229 vs 210, `/` 222 vs 220, `/demo` 191 vs 180, `/onboarding`
190 vs 175). Proof `scripts/.proof-bundle.txt` last refreshed `ed323a3` (June);
gate only guards the committed snapshot → CI green on stale numbers.

- B1. Commit a fresh proof + honest budget re-baseline, frontier debt row.
- B2. Optimization arc: clerk chunk splitting, route-level code splitting,
      remove client `PLANS` imports from `/billing` `/dashboard` `/settings`
      (placeholder chunk still loaded there per executor C's finding).

Status: NOT STARTED. Effort: M. Deps: none. Ship order: after A or parallel.

## C. DEPENDENCY UPGRADE (19 high-severity vulns)

`npm audit`: 26 total / 19 high / 0 critical / 4 moderate / 3 low.
No blind `audit fix --force`. Requires a deliberate, gated upgrade pass:
lockfile analysis → per-package upgrade with vitest+tsc+build per step →
full Playwright + signed-in smoke.

Status: NOT STARTED. Effort: L. Deps: none. Ship order: before broad launch.

## D. SANDBOX / LIVE VERIFICATION (BLOCKED on user accounts)

- D1. Paddle sandbox: upgrade / cancel / refund through `/api/paddle/webhook`
      (+ fix `PADDLE_ENV` / `NEXT_PUBLIC_PADDLE_CLIENT_KEY` to match live).
- D2. HubSpot / Salesforce OAuth against sandboxes (ENCRYPTION_KEY now set —
      was audit blocker #4, fixed 08-19).
- D3. 20–30 real end-to-end calls with diarization + analysis (needs OpenAI
      credits for embeddings/analysis; Groq covers transcription).
- D4. Human-reviewed AI accuracy benchmark (audit ship-order item).

Status: BLOCKED. Deps: user's Paddle/HubSpot/Salesforce dashboards, OpenAI
credits, test creds.

## E. FEATURE COMPLETION (audit ship-order items, post-security)

- E1. Action-item editing, assignment, timestamps, CRM follow-through.

Status: NOT STARTED. Effort: M. Deps: A (secure baseline first).

## Evidence rules

All executor reports follow ARC-CONTEXT-GUARDIAN.md: artifact-backed claims,
allowlisted file sets, resolver-checked references, gate outputs attached.