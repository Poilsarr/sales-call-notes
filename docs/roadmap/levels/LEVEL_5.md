# LEVEL 5 — Sell The Product
## Detailed Bite-Sized Tasks

**Pre-reqs:** GATE 4 closed.
**Goal:** Team branding, SAML SSO, public API, marketing site polish, onboarding.
**Gate:** See `DEVELOPMENT_FRONTIER.md` GATE 5.

---

## Task 5.1 — Team Branding

**Files:**
- Modify: `prisma/schema.prisma` (add `Team.brandColor`, `Team.logoUrl`)
- Modify: `src/components/app-sidebar.tsx`
- Create: `src/app/api/team/branding/route.ts` (PUT)
- Create: `src/test/team-branding.test.ts`

**Steps:**
1. Test: team A's logo renders only for team A's users.
2. Test: PUT updates team settings.
3. UI: sidebar header dynamic.
4. Commit: `feat(team): per-team branding (logo + color)`.

---

## Task 5.2 — SAML SSO

**Files:**
- Modify: `src/middleware.ts` (Clerk Enterprise SSO)
- Create: `docs/operations/SSO_SETUP.md`

**Steps:**
1. Enable Clerk Enterprise feature.
2. Configure test IdP (e.g. Okta dev).
3. Test: IdP-initiated login works.
4. Test: SP-initiated login works.
5. Commit: `feat(auth): SAML SSO via Clerk Enterprise`.

---

## Task 5.3 — Public API + API Keys

**Files:**
- Create: `src/app/api/v1/` directory (mirror protected routes)
- Create: `src/app/api/v1/keys/route.ts` (CRUD)
- Modify: `src/middleware.ts` (accept API key)
- Modify: `prisma/schema.prisma` (ApiKey model)
- Create: `src/test/api-keys.test.ts`

**Steps:**
1. Test: generate key, use it, revoke, verify revoked fails.
2. Test: scoped keys (read-only vs read-write).
3. Document: `docs/API.md` auto-generated.
4. Commit: `feat(api): v1 public API with scoped API keys`.

---

## Task 5.4 — Marketing Site Polish

**Files:**
- Modify: `src/app/page.tsx`
- Modify: `src/app/pricing/page.tsx`
- Modify: `src/app/features/page.tsx`

**Steps:**
1. Add: customer logos (3-5 placeholder), social proof section.
2. Add: ROI calculator (minutes saved × $/hr × calls/mo).
3. Run Lighthouse, target > 90 perf/SEO.
4. Test: SEO meta tags, OG image, sitemap.xml.
5. Commit: `feat(marketing): social proof + ROI calculator + SEO meta`.

---

## Task 5.5 — Onboarding Flow

**Files:**
- Create: `src/app/onboarding/page.tsx`
- Create: `src/components/onboarding/welcome.tsx`
- Create: `src/components/onboarding/sample-upload.tsx`
- Create: `src/components/onboarding/first-result.tsx`

**Steps:**
1. Test: new user reaches "first transcript" in < 2 min.
2. Three steps: welcome → upload sample → see results.
3. Skip option for users who already uploaded.
4. Commit: `feat(onboarding): 3-step flow with time-to-value target`.

---

## Task 5.6 — Pricing Page Real

**Files:**
- Modify: `src/app/pricing/page.tsx`
- Modify: `src/lib/paddle.ts`
- Create: `src/test/billing-paddle.test.ts`

**Steps:**
1. Test: Paddle webhook → upgrade applied to user.
2. Test: free user hits call limit → blocked + upgrade prompt.
3. Test: overage billing (if supported).
4. Commit: `feat(billing): real Paddle upgrade flow + entitlement enforcement`.

---

## Task 5.7 — Documentation Site

**Files:**
- Create: `docs/API.md` (auto-generated)
- Modify: `docs/INTEGRATIONS.md` (screenshots)
- Create: `scripts/generate-api-docs.ts`

**Steps:**
1. Use `zod-to-openapi` to generate OpenAPI spec from route Zod schemas.
2. Render to markdown with `widdershins` or similar.
3. Test: every public endpoint documented.
4. Commit: `docs: auto-generated API reference`.

---

## GATE 5 — Final Checks

```bash
# 1. Team branding
# Set team A logo, sign in as team A user, verify logo shows

# 2. SSO login
# IdP-initiated login flow completes

# 3. API key auth
curl -H "Authorization: Bearer cn_live_..." /api/v1/calls
# Expected: 200 + calls list

# 4. Lighthouse > 90
npx lighthouse http://localhost:3000 --view
# Expected: perf > 90, SEO > 90

# 5. Onboarding < 2 min
# Time new user from signup to first transcript

# 6. Paddle upgrade flow
# Test mode: upgrade free→pro, verify plan enforced
```

When all 6 pass, **GATE 5 is closed**. Move to LEVEL 6.


---

## Status (post PRs #42–#64)

**PARTIAL** — 5 of 7 tasks shipped (branding, public API, marketing, onboarding, docs). SSO blocked on Clerk Enterprise; pricing live blocked on Paddle IDs.

Last verified: 2026-06-21. See `docs/roadmap/DEVELOPMENT_FRONTIER.md` for the master list of shipped PRs.
