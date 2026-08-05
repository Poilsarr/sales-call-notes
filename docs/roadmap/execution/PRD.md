# PRD — Post-Verification Execution Arc (Gauge)

> Source of truth for the work executing now. Derived from
> `CALIBRATED_EXECUTABLES.md` (sales-call-notes-gtm) and verified against
> the live codebase after the call-title arc (aa72337, prod).

## 1. Context & Goal

Gauge (usegauge.com) is a sales-call analysis SaaS. A lead-agent verdict
identified 10 executables to win the market. This arc executes them in
dependency order, with a **verify-after-every-sub-task** gate (unit tests →
build → agent verification → only then next sub-task).

**Goal:** Ship the truth-correct, cost-minimized, BYOK-enabled product
state, then grow surface area (vs page, security page, vocabulary,
action items, sitemap, RAG chat).

## 2. Personas / Constraints

- **Free user:** 300 min/mo, 3 lifetime imports, 1 seat, audio deleted
  after processing, 30-min call cap.
- **Pro ($9 flat):** 1200 min/mo, 20 imports, 5 seats. **BYOK gate.**
- **Business ($29 flat):** 6000 min/mo, unlimited imports/seats.
- **Legal:** no false marketing claims (FTC risk). Otter 2025 consent
  lawsuit is our wedge — never fabricate our own numbers.
- **Cost:** Groq free tier is the primary transcription/analysis path;
  OpenAI only as fallback. BYOK shifts marginal cost to the user.

## 3. Requirements by Sub-Task

### S1 — Copy truth pass (DONE, verify)
- R1.1 No page claims "600 free minutes" (true: 300).
- R1.2 No page claims "unlimited imports" on Free (true: 3 lifetime).
- R1.3 Regression test guards both, reading from `plans.ts` truth.

### S2 — Paddle env docs (DONE, verify)
- R2.1 `.env.example` documents all 4 price-ID vars.
- R2.2 (User-blocked) Vercel prod env has 8 Paddle vars + sandbox E2E.

### S3 — BYOK (built, verify)
- R3.1 Pro+ gate via new `byok` FeatureId in `plans.ts`.
- R3.2 Keys encrypted at rest (AES-256-GCM, `BYOK_MASTER_KEY`).
- R3.3 Settings UI: status badges, save/overwrite/remove per provider.
- R3.4 Pipeline wiring: transcription, post-processing, analysis,
      knowledge-graph embeddings use user keys when present.
- R3.5 Groq key present → force whisper-large-v3 (cheap path).
- R3.6 Fail-soft: decryption failure falls back to shared keys.
- R3.7 Validation: OpenAI `sk-…`/`sk_…`, Groq `gsk_…`, min length 20.

### S4 — Transcription hardening
- R4.1 Short-call heuristic flips to Groq whisper-large-v3 (no paid
      whisper-1 for <300s when Groq available).
- R4.2 Fallback chain intact (whisper-1 ↔ whisper-large-v3 retry).
- R4.3 Tests assert model choice + fallback behavior.

### S5 — /vs/gong page
- R5.1 Same `VsComparisonPage` structure as otter-ai/fireflies.
- R5.2 Only verified numbers (Gong ~$1,300-1,600/user/yr + platform
      fees; price hikes 25-56%; no free tier; per-seat minimums).
- R5.3 No unverifiable claims.

### S6 — Security/trust page
- R6.1 20-point checklist (encryption, access, retention, sub-processors).
- R6.2 No-training clause, consent-first, GDPR-first stance.
- R6.3 Consistent with existing /privacy /terms styling.

### S7 — Team custom vocabulary
- R7.1 Glossary model (term + canonical spelling + optional team scope).
- R7.2 Glossary injected into post-processing + analysis prompts.
- R7.3 Team-level storage; team owner can edit.

### S8 — Action items first-class
- R8.1 `ActionItem.timestamp` column (migration, idempotent).
- R8.2 Analysis prompt returns timestamps; route persists them.
- R8.3 Review page renders jump-to-timestamp chips; CSV export includes
      timestamp column.

### S9 — Share-link sitemap
- R9.1 `/share/[id]` pages included in sitemap (public share links only).

### S10 — RAG chat
- R10.1 Top-5 retrieval via knowledge-graph embeddings in chat context.

## 4. Out of Scope (this arc)

- Paddle live E2E (user console access needed).
- Groq quota ceiling product changes (2,000 req/day shared).
- Native mobile apps, live meeting bot.
