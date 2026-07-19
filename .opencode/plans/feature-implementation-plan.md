# Gauge Feature Implementation Plan
## Prioritized by Revenue Impact & Effort

**Created:** 2026-07-16  
**Status:** Planning Phase  
**Goal:** Ship highest-impact features in priority order based on GTM research

---

## Executive Summary

After analyzing the GTM research and current codebase, here's what we found:

### Already Built (No Work Needed)
- **Audio persistence** — Vercel Blob integration exists in `/api/analyze` (lines 65-80)
- **Email service** — Resend installed with 4 templates (welcome, transcript ready, trial expiring, weekly digest)
- **Paddle checkout** — Route exists at `/api/billing/checkout`, SDK configured
- **Onboarding flow** — `hasOnboarded` field exists, redirect logic in `/app/layout.tsx`
- **AI chat** — Route exists but needs RAG implementation

### Missing Features (Priority Order)

| # | Feature | Impact | Effort | Status |
|---|---------|--------|--------|--------|
| 1 | **Paddle Price IDs + Live Checkout** | CRITICAL | 2h | Need real Paddle account |
| 2 | **Download Audio Button** | CRITICAL | 1h | Simple UI addition |
| 3 | **Wire Weekly Digest Cron** | HIGH | 2h | Cron exists, email service exists |
| 4 | **Public Share Links** | HIGH | 6h | SEO growth engine (Fathom's moat) |
| 5 | **Chat RAG (Embedding Retrieval)** | HIGH | 8h | Competitive feature, infra exists |
| 6 | **Manager Scorecard View** | MEDIUM | 4h | Business tier value prop |
| 7 | **Real-Time Transcription (Server)** | MEDIUM | 12h | UX upgrade, Deepgram SDK installed |

---

## Phase 1: Revenue Blockers (Today, 5 hours)

### 1.1 Paddle Price IDs Configuration (2 hours)

**Problem:** Checkout route exists but uses placeholder price IDs (`pri_pro_monthly`, `pri_business_monthly`). Users can't pay.

**Files to modify:**
- `src/lib/plans.ts` (lines 93, 131)
- `.env.local`
- `src/app/api/paddle/webhook/route.ts`

**Steps:**
1. Create Paddle Sandbox account at https://sandbox-vendors.paddle.com
2. Create products: Pro ($9/mo), Business ($29/mo), Pro Annual ($90/yr), Business Annual ($290/yr)
3. Get price IDs from Paddle dashboard
4. Update `src/lib/plans.ts` — replace placeholder IDs with env vars
5. Add annual plans to PLANS config
6. Test checkout flow end-to-end with Paddle Sandbox
7. Test webhook: subscription.activated → update User.plan

**Impact:** Revenue blocker. Cannot make money without this.

---

### 1.2 Download Audio Button (1 hour)

**Problem:** Audio is persisted to Vercel Blob but no UI to download/re-listen.

**Files to modify:**
- `src/app/app/calls/[id]/page.tsx`

**Steps:**
1. Find transcript viewer section
2. Add conditional: if `call.audioUrl`, show download button
3. Button: `<a href={call.audioUrl} download>` with Download icon
4. Style consistent with existing buttons

**Impact:** Trust, re-processing, delivers on "90-day storage" claim.

---

### 1.3 Wire Weekly Digest Cron (2 hours)

**Problem:** Email template exists but cron not wired to send it.

**Files to modify:**
- `src/app/api/cron/weekly-digest/route.ts`

**Steps:**
1. Query users with `hasOnboarded = true`
2. For each user, fetch weekly stats (total calls, pending items, avg health)
3. Call `sendWeeklyDigestEmail(user.email, stats, user.name)`
4. Add Vercel cron schedule: `0 9 * * 1` (Monday 9 AM UTC)
5. Test with single user, then batch

**Impact:** Retention. Keeps users engaged.

---

## Phase 2: Growth Engines (Tomorrow, 14 hours)

### 2.1 Public Share Links (6 hours)

**Problem:** Fathom's #1 growth engine. Zero implementation.

**Files to create/modify:**
- `prisma/schema.prisma` — Add `isPublic` to Call model
- `src/app/share/[id]/page.tsx` — Public share page (no auth)
- `src/app/share/[id]/layout.tsx` — Minimal layout
- `src/app/api/calls/[id]/share/route.ts` — Toggle API
- `src/app/app/calls/[id]/page.tsx` — Add toggle button
- `src/middleware.ts` — Allow `/share/[id]` without auth

**Steps:**
1. Add `isPublic Boolean @default(false)` to Call model
2. Run `prisma migrate dev --name add-call-ispublic`
3. Create `/share/[id]` page — render transcript, summary, action items
4. Add "Powered by Gauge" footer with homepage link
5. Create toggle API: `POST /api/calls/[id]/share`
6. Add toggle button to call detail page
7. Update middleware for `/share/[id]` access
8. Add "Copy share link" button
9. Test: private → public toggle → share link → verify SEO

**Impact:** SEO flywheel. Fathom grew to 1M users partly through this.

---

### 2.2 Chat RAG (Embedding Retrieval) (8 hours)

**Problem:** Sends ALL calls to GPT-4o (breaks at 50+ calls). Infra exists but unused.

**Files to modify:**
- `src/app/api/chat/route.ts` — Replace "send all" with RAG
- `src/services/ai/knowledge-graph.ts` — Add query method

**Steps:**
1. Embed user query via `text-embedding-3-small`
2. Query knowledge graph for top-5 similar calls (cosine similarity)
3. Fetch full data for those 5 calls only
4. Send 5 calls to GPT-4o-mini with query
5. Fallback: if no similar calls, send most recent 5
6. Test with 100+ calls
7. Add "Search across X calls" UI indicator

**Impact:** Competitive feature. Fathom and tl;dv have this.

---

## Phase 3: Business Tier Value (Day 3, 4 hours)

### 3.1 Manager Scorecard View (4 hours)

**Problem:** Business tier needs team performance view. Scores exist but per-user only.

**Files to create/modify:**
- `src/app/team/performance/page.tsx` — New page
- `src/app/api/team/performance/route.ts` — New API route
- `src/components/ui/scorecard-table.tsx` — New component

**Steps:**
1. Create `/team/performance` page
2. Fetch all team members' calls (teamId)
3. Table: Date, Call, Owner, Health Score, Sentiment, Action Items
4. Sort by health score, filter by date/owner/score
5. Add comment thread per call
6. Add CSV export button
7. Gate behind `team_workspace` feature check

**Impact:** Business tier value prop. Justifies $29/mo flat.

---

## Phase 4: UX Upgrade (Day 4-5, 12 hours)

### 4.1 Real-Time Transcription (Server-Side) (12 hours)

**Problem:** Browser Speech Recognition only (Chrome, lower quality). No server streaming.

**Files to create/modify:**
- `src/app/api/transcribe/live/route.ts` — WebSocket endpoint
- `src/services/ai/deepgram-streaming.ts` — Deepgram streaming
- `src/app/app/live/page.tsx` — Connect to WebSocket

**Steps:**
1. Create Deepgram streaming service (WebSocket connect, stream audio, receive partials)
2. Create WebSocket endpoint at `/api/transcribe/live`
3. Modify `/app/live` to stream via WebSocket
4. Display partial hypotheses in real-time
5. Commit on utterance end
6. Fallback to browser Speech API if unavailable
7. Test with 30-minute call
8. Add "Live transcription" badge

**Impact:** Biggest UX upgrade. Differentiator.

---

## Phase 5: Distribution (Day 6, 2 hours)

### 5.1 Affiliate Program Landing Page (2 hours)

**Problem:** No partner/referral program.

**Files to create:**
- `src/app/partners/page.tsx`

**Steps:**
1. Create landing page: "Earn 30% recurring commission"
2. Benefits, how-it-works, FAQ sections
3. Add "Become a Partner" CTA
4. Add link to footer
5. Add SEO metadata

**Impact:** Distribution channel. Low effort, high potential.

---

## Execution Timeline

| Day | Phase | Hours | Deliverables |
|-----|-------|-------|--------------|
| Today | Phase 1 | 5h | Paddle live, download audio, weekly digest |
| Tomorrow | Phase 2 | 14h | Public share links, chat RAG |
| Day 3 | Phase 3 | 4h | Manager scorecard |
| Day 4-5 | Phase 4 | 12h | Real-time transcription |
| Day 6 | Phase 5 | 2h | Affiliate page |

**Total: 37 hours / ~6 days**

---

## Dependencies

### External (User Action Required)
- [ ] Create Paddle Sandbox account → Get price IDs
- [ ] Set PADDLE_API_KEY, PADDLE_PRO_PRICE_ID, PADDLE_BUSINESS_PRICE_ID in Vercel
- [ ] Set RESEND_API_KEY in Vercel (if not already set)
- [ ] Set DEEPGRAM_API_KEY in Vercel (for Phase 4)
- [ ] Create PartnerStack or Rewardful account (for Phase 5)

### Internal (No External Dependencies)
- All other features can be built without external dependencies
- Use existing infrastructure: Vercel Blob, Resend, Deepgram SDK, Prisma

---

## Recommended Execution Order

1. **Phase 1** — Revenue blockers. You literally cannot make money without Paddle.
2. **Phase 2** — Growth engines. Public share links + RAG chat.
3. **Phase 3** — Business tier value. Manager scorecard.
4. **Phase 4** — UX upgrade. Real-time transcription.
5. **Phase 5** — Distribution. Affiliate page.

**Ready to execute Phase 1?**
