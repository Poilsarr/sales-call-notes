# Brand Migration: CallNote Pro → Gauge

> **For Hermes:** Use subagent-driven-development skill to implement this plan task-by-task.

**Goal:** Rename the application brand from "CallNote Pro" to "Gauge" across the entire repository — package metadata, SEO, UI components, copywriting, docs, and the Chrome extension — while leaving all API routes, Prisma schema, and Clerk auth logic untouched.

**Architecture:** Precise, case-sensitive find-and-replace targeting only the exact strings `CallNote Pro`, `CallNotePro`, `CallNote`, `callnote`, `call-note-pro`, and `sales-call-notes`. No standalone "call" or "note" replacements. No API endpoint path changes. No database model renames.

**Tech Stack:** Next.js 15 (App Router), TypeScript, Clerk, Prisma, Vitest, Chrome Extension (MV3)

---

## CRITICAL CONSTRAINTS — READ BEFORE EVERY TASK

```
DO NOT  replace the standalone words "call" or "note"
DO NOT  touch /api/calls, /api/calls/*, or the Prisma `Call` model
DO NOT  modify Clerk authentication logic
DO NOT  change any URL pathname (e.g. /api/calls stays /api/calls)
DO NOT  touch the /callnote Slack slash command string (it's an API contract)

TARGET STRINGS (exact, case-sensitive):
  "CallNote Pro"     → "Gauge"
  "CallNotePro"      → "Gauge"         (only in code identifiers like User-Agent)
  "CallNote"         → "Gauge"         (only as standalone brand, NOT in /callnote slash command)
  "callnotepro.com"  → "gaugeapp.com"  (domain placeholder)
  "callnote_pro"     → see task notes   (graph IDs only)
  "sales-call-notes" → "gauge"         (package name only)
  "call-note-pro"    → "gauge"
```

**Exception list — do NOT rename these `callnote` strings:**
- `src/app/api/slack/commands/route.ts` — the `/callnote` slash command is a user-facing API contract
- `src/app/onboarding/page.tsx:9` — `callnote_onboarding_step` is a localStorage key used by existing client sessions; renaming it would break onboarding for current users
- `docker-compose.yml` — `callnote-postgres`, `callnote-redis`, `callnote`, `callnote_dev`, `callnote_pro` are local Docker container/resource names; renaming requires users to rebuild containers. Defer to infra task.
- `graphify-out/*` — auto-generated graph artifacts; not shipped to production. Skip.

---

## Full Occurrence Inventory (pre-scan results)

### Production source files to edit (29 files):

**Package & Config (3 files):**
1. `package.json:2` — `"name": "sales-call-notes"` → `"name": "gauge"`
2. `package-lock.json:2` — `"name": "sales-call-notes"` → `"name": "gauge"`
3. `.env.example` — header comment `CallNote Pro` and `NEXT_PUBLIC_APP_URL="https://sales-call-notes.vercel.app"`

**Next.js Metadata / SEO (5 files):**
4. `src/app/layout.tsx` — lines 24, 25, 48, 50, 58, 64, 68, 70 (title, template, openGraph, twitter, appleWebApp, canonical)
5. `src/app/sitemap.ts:3` — `const SITE_URL = "https://callnotepro.com"`
6. `src/lib/seo.ts` — lines 6, 17, 23, 24, 58, 59 (structured data / JSON-LD)
7. `src/app/no-bot/page.tsx` — lines 6, 99, 184 (metadata title, heading, body copy)
8. `src/app/blog/page.tsx:40` — `mailto:hello@callnotepro.com`

**Marketing Pages (5 files):**
9. `src/app/pricing/page.tsx` — lines 82, 362, 396
10. `src/app/features/page.tsx` — lines 521, 526, 542, 707
11. `src/app/extension/page.tsx` — lines 35, 42, 49, 85, 88, 188, 231, 278, 380, 440
12. `src/app/offline/page.tsx:23` — brand name in copy
13. `src/app/status/page.tsx` — lines 7, 28, 40, 43

**Auth-gated Pages (2 files):**
14. `src/app/onboarding/page.tsx` — lines 54, 153 (NOT line 9 localStorage key)
15. `src/app/settings/page.tsx` — lines 293, 495
16. `src/app/terms/page.tsx` — lines 17, 21, 45, 53

**UI Components (7 files):**
17. `src/components/site-footer.tsx` — lines 36, 60, 100, 105
18. `src/components/app-sidebar.tsx:42` — brand name in sidebar
19. `src/components/vs-comparison.tsx` — lines 31, 214
20. `src/components/status-client.tsx:21` — description string
21. `src/components/api-keys-settings.tsx:283` — API docs URL
22. `src/components/nav` — no brand string found (logo is likely an image/SVG)
23. `src/app/page.tsx` — lines 32, 38 (hero section brand name)

**Service Layer (4 files):**
24. `src/services/email.ts` — lines 18, 19, 37, 40, 63, 84 (from email, subject lines, body copy)
25. `src/services/slack.ts` — lines 177, 213 (Slack message footer brand attribution)
26. `src/services/slack-digest.ts:100` — digest message heading
27. `src/services/webhooks.ts:48` — User-Agent header `CallNotePro-Webhook/1.0`

**Chrome Extension (6 files):**
28. `extension/manifest.json:3` — `"name": "CallNote Pro - Meeting Notes"` and line 7 host permissions
29. `extension/shared.js` — lines 1, 77
30. `extension/content.js` — lines 1, 2, 12, 41
31. `extension/background.js` — lines 86, 101, 121, 125, 201, 214, 234, 247, 307, 309, 313, 315
32. `extension/popup.html` — lines 50, 59, 70
33. `extension/popup.js` — lines 39, 44, 94, 99

**Copywriting & Docs (4 files):**
34. `README.md` — lines 1, 6, 7, 8, 75, 76, 97, 130, 153
35. `CHANGELOG.md` — lines 3, 28, 61, 104
36. `CONTEXT.md` — lines 1, 4, 7, 48, 83, 90, 117
37. `CLAUDE.md` — line 1

### Files NOT to edit (exceptions):
- `src/app/api/slack/commands/route.ts` — `/callnote` slash command contract
- `src/app/onboarding/page.tsx:9` — localStorage key `callnote_onboarding_step`
- `docker-compose.yml` — local infra container names (defer to separate task)
- `graphify-out/*` — auto-generated graph artifacts
- `docs/roadmap/levels/LEVEL_0.md`, `LEVEL_3.md` — historical docs referencing `/callnote` slash command
- `docs/superpowers/specs/2026-05-21-callnote-pro-transformation-design.md` — historical design spec
- `CallNote-Pro-Project-Audit.md` — historical audit doc
- All Prisma schema files, API route files (except string literals in service layer)

---

## Task Breakdown

### Task 1: Package Metadata Rename

**Objective:** Update package name in package.json and package-lock.json from "sales-call-notes" to "gauge".

**Files:**
- Modify: `package.json:2`
- Modify: `package-lock.json:2`

**Step 1: Update package.json**

Change line 2 from:
```json
  "name": "sales-call-notes",
```
to:
```json
  "name": "gauge",
```

**Step 2: Update package-lock.json**

Change line 2 from:
```json
  "name": "sales-call-notes",
```
to:
```json
  "name": "gauge",
```

**Step 3: Verify build still resolves**

Run: `npx next build`
Expected: Build succeeds (package name is metadata only, no import paths affected)

**Step 4: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: rename package from sales-call-notes to gauge"
```

---

### Task 2: Environment Example File

**Objective:** Update brand name in .env.example header and default app URL.

**Files:**
- Modify: `.env.example`

**Step 1: Edit header comment**

Replace:
```
# CallNote Pro - Environment Variables
```
with:
```
# Gauge - Environment Variables
```

**Step 2: Edit default app URL**

Replace:
```
NEXT_PUBLIC_APP_URL="https://sales-call-notes.vercel.app"
```
with:
```
NEXT_PUBLIC_APP_URL="https://gaugeapp.vercel.app"
```

Note: This is a placeholder. The real URL will be configured in Vercel env vars. The .env.example is only a template — no production runtime reads this literal.

**Step 3: Verify**

Run: `grep -n "sales-call-notes\|CallNote" .env.example`
Expected: no output (all instances replaced)

**Step 4: Commit**

```bash
git add .env.example
git commit -m "chore: update .env.example brand name to Gauge"
```

---

### Task 3: Next.js Root Layout Metadata

**Objective:** Replace all "CallNote Pro" brand strings in src/app/layout.tsx metadata.

**Files:**
- Modify: `src/app/layout.tsx:24,25,48,50,58,64,68,70`

**Step 1: Apply replacements**

Each replacement is case-sensitive, "CallNote Pro" → "Gauge":

- Line 24: `"CallNote Pro — AI Sales Call Notes for SDRs"` → `"Gauge — AI Sales Call Notes for SDRs"`
- Line 25: `"%s · CallNote Pro"` → `"%s · Gauge"`
- Line 48: `"CallNote Pro — AI Sales Call Notes for SDRs"` → `"Gauge — AI Sales Call Notes for SDRs"`
- Line 50: `siteName: "CallNote Pro"` → `siteName: "Gauge"`
- Line 58: `"CallNote Pro — Know the moment a competitor enters the deal."` → `"Gauge — Know the moment a competitor enters the deal."`
- Line 64: `"CallNote Pro — AI Sales Call Notes for SDRs"` → `"Gauge — AI Sales Call Notes for SDRs"`
- Line 68: `title: "CallNote Pro"` → `title: "Gauge"`
- Line 70: `canonical: "https://callnotepro.com"` → `canonical: "https://gaugeapp.com"`

**Step 2: Verify no remaining brand strings**

Run: `grep -n "CallNote" src/app/layout.tsx`
Expected: no output

**Step 3: Verify build**

Run: `npx next build`
Expected: PASS

**Step 4: Commit**

```bash
git add src/app/layout.tsx
git commit -m "refactor(seo): rename brand metadata in layout.tsx to Gauge"
```

---

### Task 4: SEO Library (Structured Data)

**Objective:** Update src/lib/seo.ts JSON-LD product name, URL, and brand references.

**Files:**
- Modify: `src/lib/seo.ts:6,17,23,24,58,59`

**Step 1: Apply replacements**

- Line 6: `"product called CallNote Pro, here's what it costs"` → `"product called Gauge, here's what it costs"`
- Line 17: `name: "CallNote Pro"` → `name: "Gauge"`
- Line 23: `url: "https://callnotepro.com"` → `url: "https://gaugeapp.com"`
- Line 24: `image: "https://callnotepro.com/og.png"` → `image: "https://gaugeapp.com/og.png"`
- Line 58: `name: "CallNote Pro"` → `name: "Gauge"`
- Line 59: `url: "https://callnotepro.com"` → `url: "https://gaugeapp.com"`

**Step 2: Verify**

Run: `grep -n "CallNote\|callnotepro" src/lib/seo.ts`
Expected: no output

**Step 3: Verify tests pass**

Run: `npx vitest run src/lib/seo`
Expected: PASS (or "no tests found" — verify no brand assertion breaks)

**Step 4: Commit**

```bash
git add src/lib/seo.ts
git commit -m "refactor(seo): update JSON-LD structured data brand to Gauge"
```

---

### Task 5: Sitemap

**Objective:** Update sitemap base URL.

**Files:**
- Modify: `src/app/sitemap.ts:3`

**Step 1: Apply replacement**

Replace:
```ts
const SITE_URL = "https://callnotepro.com";
```
with:
```ts
const SITE_URL = "https://gaugeapp.com";
```

**Step 2: Verify**

Run: `grep -n "callnotepro" src/app/sitemap.ts`
Expected: no output

**Step 3: Commit**

```bash
git add src/app/sitemap.ts
git commit -m "refactor(seo): update sitemap URL to gaugeapp.com"
```

---

### Task 6: Home Page Hero Section

**Objective:** Update brand name in the landing page hero.

**Files:**
- Modify: `src/app/page.tsx:32,38`

**Step 1: Apply replacements**

- Line 32: `CallNote Pro` → `Gauge`
- Line 38: `CallNote Pro turns every sales call` → `Gauge turns every sales call`

**Step 2: Verify**

Run: `grep -n "CallNote" src/app/page.tsx`
Expected: no output

**Step 3: Verify build**

Run: `npx next build`
Expected: PASS

**Step 4: Commit**

```bash
git add src/app/page.tsx
git commit -m "refactor(ui): rename brand in home page hero to Gauge"
```

---

### Task 7: Marketing Pages Batch (pricing, features, no-bot, extension, offline, status, blog, terms)

**Objective:** Replace brand strings across all public marketing page files. This is the largest task — each file is independent, so subagent dispatch could parallelize, but sequential is safe.

**Files:**
- Modify: `src/app/pricing/page.tsx:82,362,396`
- Modify: `src/app/features/page.tsx:521,526,542,707`
- Modify: `src/app/no-bot/page.tsx:6,99,184`
- Modify: `src/app/extension/page.tsx:35,42,49,85,88,188,231,278,380,440`
- Modify: `src/app/offline/page.tsx:23`
- Modify: `src/app/status/page.tsx:7,28,40,43`
- Modify: `src/app/blog/page.tsx:40`
- Modify: `src/app/terms/page.tsx:17,21,45,53`

**Step 1: Pricing page**

Replace all `CallNote Pro` → `Gauge` and `callnotepro.com` → `gaugeapp.com`:
- Line 82: `sales@callnotepro.com` → `sales@gaugeapp.com`
- Line 362: `<span>CallNote Pro</span>` → `<span>Gauge</span>`
- Line 396: `hello@callnotepro.com` → `hello@gaugeapp.com`

**Step 2: Features page**

- Line 521: `CallNote Pro vs Otter.ai vs Fireflies.ai` → `Gauge vs Otter.ai vs Fireflies.ai`
- Line 526: `hello@callnotepro.com` → `hello@gaugeapp.com`
- Line 542: `CallNote Pro` → `Gauge`
- Line 707: `CallNote Pro handles` → `Gauge handles`

**Step 3: No-bot page**

- Line 6: `"No Bot, No Auto-Join — CallNote Pro Privacy First"` → `"No Bot, No Auto-Join — Gauge Privacy First"`
- Line 99: `How CallNote Pro works` → `How Gauge works`
- Line 184: `We built CallNote Pro on the opposite principle` → `We built Gauge on the opposite principle`

**Step 4: Extension page**

All "CallNote Pro" → "Gauge", all "callnotepro.com" → "gaugeapp.com", "sales-call-notes" → "gauge":
- Line 35: `CallNote Pro` → `Gauge`
- Line 42: `The CallNote Pro Chrome extension` → `The Gauge Chrome extension`
- Line 49: `callnotepro` in chromewebstore URL → `gauge` (or leave as-is if already published; see Open Questions)
- Line 85: `Acme × CallNote — Discovery` → `Acme × Gauge — Discovery`
- Line 88: `{/* CallNote extension pill` → `{/* Gauge extension pill`
- Line 188: `callnotepro` in chromewebstore URL → same as line 49
- Line 231: `github.com/Poilsarr/sales-call-notes` → leave as-is (repo URL, see Open Questions)
- Line 278: `CallNote Pro login` → `Gauge login`
- Line 380: `existing CallNote Pro login session` → `existing Gauge login session`
- Line 440: `Same CallNote Pro account` → `Same Gauge account`

**Step 5: Offline page**

- Line 23: `CallNote Pro needs an internet connection` → `Gauge needs an internet connection`

**Step 6: Status page**

- Line 7: `"Live operational status of CallNote Pro services."` → `"Live operational status of Gauge services."`
- Line 28: `Real-time operational state for CallNote Pro.` → `Real-time operational state for Gauge.`
- Line 40: `support@callnotepro.com` → `support@gaugeapp.com`
- Line 43: `support@callnotepro.com` → `support@gaugeapp.com`

**Step 7: Blog page**

- Line 40: `hello@callnotepro.com` → `hello@gaugeapp.com`

**Step 8: Terms page**

- Line 17: `CallNote Pro ("the Service")` → `Gauge ("the Service")`
- Line 21: `CallNote Pro provides AI-powered sales call transcription` → `Gauge provides AI-powered sales call transcription`
- Line 45: `CallNote Pro is provided "as is"` → `Gauge is provided "as is"`
- Line 53: `legal@callnotepro.com` → `legal@gaugeapp.com`

**Step 9: Verify all marketing pages clean**

Run: `grep -rn "CallNote\|callnotepro" src/app/pricing/ src/app/features/ src/app/no-bot/ src/app/extension/ src/app/offline/ src/app/status/ src/app/blog/ src/app/terms/`
Expected: no output

**Step 10: Verify build**

Run: `npx next build`
Expected: PASS

**Step 11: Commit**

```bash
git add src/app/pricing/page.tsx src/app/features/page.tsx src/app/no-bot/page.tsx src/app/extension/page.tsx src/app/offline/page.tsx src/app/status/page.tsx src/app/blog/page.tsx src/app/terms/page.tsx
git commit -m "refactor(ui): rename brand across all marketing pages to Gauge"
```

---

### Task 8: Auth-gated Pages (settings, onboarding)

**Objective:** Update brand in settings page and onboarding page (excluding localStorage key).

**Files:**
- Modify: `src/app/settings/page.tsx:293,495`
- Modify: `src/app/onboarding/page.tsx:54,153` (NOT line 9)

**Step 1: Settings page**

- Line 293: `access to your CallNote Pro account` → `access to your Gauge account`
- Line 495: `Customize how CallNote Pro works for you` → `Customize how Gauge works for you`

**Step 2: Onboarding page (skip line 9 localStorage key)**

- Line 54: `CallNote Pro` → `Gauge`
- Line 153: `Welcome to CallNote Pro.` → `Welcome to Gauge.`
- DO NOT touch line 9: `const STORAGE_KEY = "callnote_onboarding_step"` — this is a live client-side localStorage key

**Step 3: Verify**

Run: `grep -n "CallNote" src/app/settings/page.tsx src/app/onboarding/page.tsx`
Expected: no output (the localStorage key uses lowercase `callnote`, not `CallNote`)

**Step 4: Commit**

```bash
git add src/app/settings/page.tsx src/app/onboarding/page.tsx
git commit -m "refactor(ui): rename brand in settings and onboarding pages to Gauge"
```

---

### Task 9: UI Components (footer, sidebar, vs-comparison, status-client, api-keys-settings)

**Objective:** Replace brand strings in shared UI components.

**Files:**
- Modify: `src/components/site-footer.tsx:36,60,100,105`
- Modify: `src/components/app-sidebar.tsx:42`
- Modify: `src/components/vs-comparison.tsx:31,214`
- Modify: `src/components/status-client.tsx:21`
- Modify: `src/components/api-keys-settings.tsx:283`

**Step 1: Site footer**

- Line 36: `hello@callnotepro.com` → `hello@gaugeapp.com`
- Line 60: `CallNote Pro` → `Gauge`
- Line 100: `© {new Date().getFullYear()} CallNote Pro.` → `© {new Date().getFullYear()} Gauge.`
- Line 105: `status.callnotepro.com` → `status.gaugeapp.com`

**Step 2: App sidebar**

- Line 42: `CallNote Pro` → `Gauge`

**Step 3: VS comparison**

- Line 31: `const us = "CallNote Pro"` → `const us = "Gauge"`
- Line 214: `hello@callnotepro.com` → `hello@gaugeapp.com`

**Step 4: Status client**

- Line 21: `"callnotepro.com dashboard and all authenticated pages."` → `"gaugeapp.com dashboard and all authenticated pages."`

**Step 5: API keys settings**

- Line 283: `https://callnotepro.com/api/v1/calls` → `https://gaugeapp.com/api/v1/calls`

**Step 6: Verify**

Run: `grep -rn "CallNote\|callnotepro" src/components/site-footer.tsx src/components/app-sidebar.tsx src/components/vs-comparison.tsx src/components/status-client.tsx src/components/api-keys-settings.tsx`
Expected: no output

**Step 7: Run vitest (may have brand assertions)**

Run: `npx vitest run`
Expected: PASS all 531 tests — if any test asserts the brand string, update the test assertion to "Gauge"

**Step 8: Commit**

```bash
git add src/components/site-footer.tsx src/components/app-sidebar.tsx src/components/vs-comparison.tsx src/components/status-client.tsx src/components/api-keys-settings.tsx
git commit -m "refactor(ui): rename brand in shared components to Gauge"
```

---

### Task 10: Service Layer (email, slack, slack-digest, webhooks)

**Objective:** Replace brand in transactional email subjects/bodies, Slack message footers, and webhook User-Agent.

**Files:**
- Modify: `src/services/email.ts:18,19,37,40,63,84`
- Modify: `src/services/slack.ts:177,213`
- Modify: `src/services/slack-digest.ts:100`
- Modify: `src/services/webhooks.ts:48`

**Step 1: Email service**

- Line 18: `"CallNote Pro <hello@callnotepro.com>"` → `"Gauge <hello@gaugeapp.com>"`
- Line 19: `"https://sales-call-notes.vercel.app"` → `"https://gaugeapp.vercel.app"` (fallback only; production reads env var)
- Line 37: `"Your CallNote Pro account is ready"` → `"Your Gauge account is ready"`
- Line 40: `"Your CallNote Pro account is live"` → `"Your Gauge account is live"`
- Line 63: `` `Your CallNote Pro trial ends in ${daysLeft} days` `` → `` `Your Gauge trial ends in ${daysLeft} days` ``
- Line 84: `"Your weekly CallNote Pro digest"` → `"Your weekly Gauge digest"`

**Step 2: Slack service**

- Line 177: `CallNote Pro` in footer link → `Gauge`, and `callnotepro.com` fallback → `gaugeapp.com`
- Line 213: `CallNote Pro Intelligence` → `Gauge Intelligence`, and `callnotepro.com` fallback → `gaugeapp.com`

**Step 3: Slack digest service**

- Line 100: `📊 *CallNote Pro Weekly Digest*` → `📊 *Gauge Weekly Digest*`

**Step 4: Webhooks service**

- Line 48: `"CallNotePro-Webhook/1.0"` → `"Gauge-Webhook/1.0"`

**Step 5: Verify**

Run: `grep -rn "CallNote\|callnotepro\|sales-call-notes" src/services/`
Expected: no output

**Step 6: Run tests**

Run: `npx vitest run src/services/`
Expected: PASS

**Step 7: Commit**

```bash
git add src/services/email.ts src/services/slack.ts src/services/slack-digest.ts src/services/webhooks.ts
git commit -m "refactor(services): rename brand in email, slack, and webhook services to Gauge"
```

---

### Task 11: Chrome Extension

**Objective:** Update brand name in Chrome extension files.

**Files:**
- Modify: `extension/manifest.json:3,7`
- Modify: `extension/shared.js:1,77`
- Modify: `extension/content.js:1,2,12,41`
- Modify: `extension/background.js:86,101,121,125,201,214,234,247,307,309,313,315`
- Modify: `extension/popup.html:50,59,70`
- Modify: `extension/popup.js:39,44,94,99`

**Step 1: manifest.json**

- Line 3: `"name": "CallNote Pro - Meeting Notes"` → `"name": "Gauge - Meeting Notes"`
- Line 7: `"https://sales-call-notes.vercel.app/*"` → `"https://gaugeapp.vercel.app/*"` (update host permission to match new deployment URL)

**Step 2: shared.js**

- Line 1: `"https://sales-call-notes.vercel.app"` → `"https://gaugeapp.vercel.app"`
- Line 77: `"[CallNote Pro] Failed to read Clerk session cookie"` → `"[Gauge] Failed to read Clerk session cookie"`

**Step 3: content.js**

- Line 1: `// CallNote Pro - Google Meet Content Script` → `// Gauge - Google Meet Content Script`
- Line 2: `// Captures meeting captions and sends to CallNote Pro API` → `// Captures meeting captions and sends to Gauge API`
- Line 12: `"callnote_auto_captions"` — LEAVE AS-IS (localStorage key, existing user sessions)
- Line 41: `"[CallNote Pro] Meeting detected"` → `"[Gauge] Meeting detected"`

**Step 4: background.js**

Replace all `CallNote Pro` → `Gauge` in console.warn strings:
- Lines 86, 101, 214, 234, 247, 309, 315: `[CallNote Pro]` → `[Gauge]`
- Line 101: `Sign in to CallNote Pro to resume uploads` → `Sign in to Gauge to resume uploads`
- Lines 121, 125, 201, 307, 313: `"callnote_live_retry"` and `"callnote_finalize_retry"` — LEAVE AS-IS (Chrome alarm names; renaming breaks active alarms)

**Step 5: popup.html**

- Line 50: `<div class="logo-text">CallNote<span>Pro</span></div>` → `<div class="logo-text">Gauge</div>`
- Line 59: `Sign in to CallNote Pro` → `Sign in to Gauge`
- Line 70: `Open CallNote Pro` → `Open Gauge`

**Step 6: popup.js**

- Line 39: `upload to your CallNote Pro account` → `upload to your Gauge account`
- Line 44: `sync them to CallNote Pro` → `sync them to Gauge`
- Line 94: `streaming to CallNote Pro` → `streaming to Gauge`
- Line 99: `Open CallNote Pro to follow` → `Open Gauge to follow`

**Step 7: Verify**

Run: `grep -rn "CallNote" extension/`
Expected: no output (alarm names and localStorage use lowercase `callnote`, NOT `CallNote`)

**Step 8: Commit**

```bash
git add extension/manifest.json extension/shared.js extension/content.js extension/background.js extension/popup.html extension/popup.js
git commit -m "refactor(extension): rename brand in Chrome extension to Gauge"
```

---

### Task 12: README.md

**Objective:** Update all brand references in the project README.

**Files:**
- Modify: `README.md:1,6,7,8,75,76,97,130,153`

**Step 1: Apply replacements**

- Line 1: `# CallNote Pro` → `# Gauge`
- Line 6: `https://sales-call-notes.vercel.app` → `https://gaugeapp.vercel.app`
- Line 7: `https://callnotepro.com` → `https://gaugeapp.com`
- Line 8: `https://github.com/Poilsarr/sales-call-notes` → leave as-is (GitHub repo URL, see Open Questions)
- Line 75: `git clone https://github.com/Poilsarr/sales-call-notes` → leave as-is
- Line 76: `cd sales-call-notes` → leave as-is if repo not renamed (Open Question)
- Line 97: `https://sales-call-notes.vercel.app` → `https://gaugeapp.vercel.app`
- Line 130: `security@callnotepro.com` → `security@gaugeapp.com`
- Line 153: `© 2026 CallNote Pro.` → `© 2026 Gauge.`

**Step 2: Verify**

Run: `grep -n "CallNote\|callnotepro" README.md`
Expected: no output (except GitHub repo URL lines 8, 75 if left as-is)

**Step 3: Commit**

```bash
git add README.md
git commit -m "docs: update README brand name to Gauge"
```

---

### Task 13: CHANGELOG.md

**Objective:** Update brand name in changelog entries.

**Files:**
- Modify: `CHANGELOG.md:3,28,61,104`

**Step 1: Apply replacements**

- Line 3: `All notable changes to CallNote Pro are recorded here` → `All notable changes to Gauge are recorded here`
- Line 28: `can install CallNote Pro as a stand-alone` → `can install Gauge as a stand-alone`
- Line 61: `CallNote vs Otter vs Fireflies` → `Gauge vs Otter vs Fireflies`
- Line 104: `uses https://callnotepro.com` → `uses https://gaugeapp.com`

**Step 2: Verify**

Run: `grep -n "CallNote\|callnotepro" CHANGELOG.md`
Expected: no output

**Step 3: Commit**

```bash
git add CHANGELOG.md
git commit -m "docs: update CHANGELOG brand name to Gauge"
```

---

### Task 14: Agent Handoff Files (CONTEXT.md, CLAUDE.md)

**Objective:** Update brand name in agent context/handoff files.

**Files:**
- Modify: `CONTEXT.md:1,4,7,48,83,90,117`
- Modify: `CLAUDE.md:1`

**Step 1: CONTEXT.md**

- Line 1: `# CallNote Pro — Session Handoff` → `# Gauge — Session Handoff`
- Line 4: `https://sales-call-notes.vercel.app` → `https://gaugeapp.vercel.app`
- Line 7: `https://github.com/Poilsarr/sales-call-notes` → leave as-is (repo URL)
- Line 48: `/callnote <callId>` — LEAVE AS-IS (slash command contract)
- Line 83: `https://sales-call-notes.vercel.app` → `https://gaugeapp.vercel.app`
- Line 90: `callnotepro.com` → `gaugeapp.com`
- Line 117: `/callnote` slash command — LEAVE AS-IS

**Step 2: CLAUDE.md**

- Line 1: `# Hermes Agent Handoff — sales-call-notes` → `# Hermes Agent Handoff — Gauge`

**Step 3: Verify**

Run: `grep -n "CallNote Pro" CONTEXT.md CLAUDE.md`
Expected: no output (standalone `callnote` in slash command refs is fine)

**Step 4: Commit**

```bash
git add CONTEXT.md CLAUDE.md
git commit -m "docs: update agent handoff files brand name to Gauge"
```

---

### Task 15: Full-repo verification scan

**Objective:** Confirm no `CallNote Pro` or `callnotepro.com` strings remain in production code (excluding intentional exceptions).

**Step 1: Scan for "CallNote Pro"**

Run: `grep -rn "CallNote Pro" --include="*.ts" --include="*.tsx" --include="*.js" --include="*.json" --include="*.html" --include="*.md" src/ extension/ package.json README.md CHANGELOG.md CONTEXT.md CLAUDE.md`
Expected: no output

**Step 2: Scan for "callnotepro.com"**

Run: `grep -rn "callnotepro.com" --include="*.ts" --include="*.tsx" --include="*.js" --include="*.json" --include="*.html" --include="*.md" src/ extension/ package.json README.md CHANGELOG.md`
Expected: no output

**Step 3: Scan for "sales-call-notes" in active code**

Run: `grep -rn "sales-call-notes" --include="*.ts" --include="*.tsx" --include="*.js" --include="*.json" --include="*.html" --include="*.md" src/ extension/ package.json .env.example`
Expected: no output (GitHub repo URL in README lines 8, 75 may remain — see Open Questions)

**Step 4: Verify API routes untouched**

Run: `grep -rn "/api/calls" src/app/api/`
Expected: all routes intact, no changes

**Step 5: Verify Prisma schema untouched**

Run: `grep -n "model Call" prisma/schema.prisma`
Expected: `model Call {` present and unchanged

**Step 6: Run full test suite**

Run: `npx vitest run`
Expected: PASS all tests (update any brand-asserting test expectations to "Gauge")

**Step 7: Run full build**

Run: `npx next build`
Expected: PASS

**Step 8: Final commit (if any test expectations needed updating)**

```bash
git add -A
git commit -m "test: update brand assertions to Gauge"
```

---

## Risks, Tradeoffs, and Open Questions

### Risks

1. **Test brand assertions** — Some Vitest specs may assert `CallNote Pro` in email templates, Slack messages, or SEO output. These tests will fail after renaming. Fix: update the assertions to `Gauge`. This is expected and part of Task 9/15.

2. **Chrome Web Store listing** — The extension `manifest.json` name change means a new Web Store submission/review is needed. The existing published extension keeps the old name until re-published. The `chromewebstore.google.com/search/callnotepro` URL in `src/app/extension/page.tsx` links to the old listing — it should be updated after the new listing is live.

3. **Email deliverability** — The `RESEND_FROM_EMAIL` default in `email.ts` changes from `CallNote Pro <hello@callnotepro.com>` to `Gauge <hello@gaugeapp.com>`. The `gaugeapp.com` domain must have DNS records (SPF/DKIM) configured in Resend before this goes live, or emails will bounce.

4. **Vercel deployment URL** — `sales-call-notes.vercel.app` is the current deployment. Changing the package name to `gauge` does NOT change the Vercel project URL. A new Vercel project or custom domain is a separate infra task.

5. **localStorage keys preserved** — `callnote_onboarding_step` (onboarding page) and `callnote_auto_captions` (extension content.js) intentionally NOT renamed to avoid breaking existing user sessions.

6. **Chrome alarm names preserved** — `callnote_live_retry` and `callnote_finalize_retry` in background.js intentionally NOT renamed to avoid breaking active alarms.

### Open Questions

1. **GitHub repo rename** — Should `github.com/Poilsarr/sales-call-notes` be renamed to `github.com/Poilsarr/gauge`? This affects clone instructions in README, extension page link, and git remotes. Default in this plan: leave repo URL as-is, rename the project description only.

2. **Domain name** — `gaugeapp.com` is used as a placeholder throughout this plan. Has the domain been purchased? If the actual domain is different, all `gaugeapp.com` → actual domain.

3. **Vercel project name** — Should a new Vercel project be created, or just add a custom domain to the existing project? The `.vercel.app` URL references (`gaugeapp.vercel.app` in this plan) are placeholders.

4. **Docker container names** — `docker-compose.yml` uses `callnote-postgres`, `callnote-redis`, etc. Should these be renamed? Default: defer to separate infra task, as it requires `docker compose down -v && docker compose up` to recreate containers.

5. **Webflow / status page** — `status.callnotepro.com` is referenced in site-footer.tsx. Is there an external status page service that needs the domain updated?

6. **Slack slash command** — The `/callnote` command in `src/app/api/slack/commands/route.ts` is deliberately preserved. Should it be changed to `/gauge`? This would require updating the Slack app configuration (slash command URL), not just the code. Default: preserve `/callnote` to avoid breaking existing integrations.