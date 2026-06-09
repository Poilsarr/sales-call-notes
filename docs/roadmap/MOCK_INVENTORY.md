# Mock Inventory

Every mock, stub, fallback, or placeholder in production code.
Generated: 2026-06-07. Last reviewed: never.

---

## HIGH — Produces Incorrect Data in Production

### H1. Placeholder Email on User Creation

**Files:** `src/lib/get-user.ts:9-10`, `src/app/api/team/route.ts:15`
**What it fakes:** New users are upserted with `${clerkId}@placeholder.dev` and `User ${clerkId.slice(0,8)}`.
**Production path:** YES — every authenticated API route calls `getUserByClerkId()`.
**Fix needed:** Store real email from Clerk (`auth().sessionClaims?.email` or webhook).
**Owner:** unassigned | **Ticket:** unassigned

### H2. Dummy Hash Embeddings in Knowledge Graph

**File:** `src/services/ai/knowledge-graph.ts:10-28`
**What it fakes:** Embedding generation uses `simpleHash()` → mod 384 → count → normalize. Produces meaningless similarity scores.
**Production path:** YES — `indexCall()` runs on every call.
**Fix needed:** Integrate a real embedding model (OpenAI `text-embedding-3-small` or local).
**Owner:** unassigned | **Ticket:** unassigned

---

## MEDIUM — Silent Degradation or Misleading Docs

### M1. Hardcoded Zero Defaults in normalizeAnalysis()

**File:** `src/services/ai/analysis.ts:121-166`
**What it fakes:** Missing LLM fields get score 0, empty arrays, "No summary available", `{reP: 0.5, prospect: 0.5}`.
**Production path:** YES — every call analysis.
**Fix needed:** Surface a partial-result flag so UI can show "analysis incomplete" vs legitimate zeros.
**Owner:** unassigned | **Ticket:** unassigned

### M2. Silent Empty Result in Personalization

**File:** `src/services/ai/personalization.ts:59-62`
**What it fakes:** Catches all OpenAI/parse errors, returns `{ hooks: [] }` silently.
**Production path:** YES — called during analysis pipeline.
**Fix needed:** Log to Sentry with `personalization_failed` tag; return error state.
**Owner:** unassigned | **Ticket:** unassigned

### M3. Secrets.ts Comment Describes Non-Existent Vault

**File:** `src/lib/secrets.ts:5`
**What it fakes:** Comment says "integrate with AWS Secrets Manager or HashiCorp Vault" but both branches just return `process.env[key]`.
**Production path:** YES — runs in production.
**Fix needed:** Either implement Vault integration or remove the misleading comment.
**Owner:** unassigned | **Ticket:** unassigned

---

## LOW — Properly Gated or Intentional

### L1. Dev Sandbox OAuth (guarded by NODE_ENV)

**File:** `src/lib/integrations/dev-sandbox.ts`
**Gate:** `process.env.NODE_ENV === "development"`
**Status:** Correct — intentional dev convenience.

### L2. Paddle Sandbox Mode (guarded by NODE_ENV)

**File:** `src/lib/paddle.ts:12-14`
**Gate:** `process.env.NODE_ENV === "production"`
**Status:** Correct — sandbox for dev, live for prod.

### L3. AI Provider Fallback Chains (OpenAI → Groq)

**Files:** `transcription.ts`, `transcription-v2.ts`, `analysis.ts`
**What it does:** Falls back from OpenAI to Groq when primary provider fails.
**Status:** Intentional — legitimate failover, not mock data.

### L4. Rule-Based Analytics (no AI call)

**File:** `src/services/ai/analytics.ts`
**Status:** Design choice — keyword/regex matching for structure extraction.

### L5. Regex PII Redaction Fallback

**File:** `src/services/ai/pii-redactor.ts:46-49`
**Status:** Intentional — degrades gracefully when Python ML script is unavailable.

### L6. Post-Processing Pass-Through on Empty Input

**File:** `src/services/ai/post-processing.ts:17-18, 41-42`
**Status:** Intentional — returns original transcript unchanged when AI fails.

---

## Summary

| Severity | Count | Action Required |
|----------|-------|-----------------|
| HIGH | 2 | Fix before production launch |
| MEDIUM | 3 | Fix during Level 0 or Level 1 |
| LOW | 6 | Monitor, no immediate action |
