# De-Vibecoding Gauge — Master Implementation Plan

> **For Claude / Subagents:** REQUIRED SUB-SKILL: Use `superpowers:executing-plans` to implement this plan task-by-task.

**Goal:** Refine Gauge's visual and copy architecture to eliminate viral "vibe-coded" (AI-generated) clichés, transforming the interface into a bespoke, authoritative B2B SaaS platform while preserving existing functionality and speed.

**Architecture:** Systematic elimination of 17 identified vibe-coded tropes across 4 phased workstreams (Copy & Glyphs → Visual Polish → Brand & Palette Alignment → Layout Diversification), backed by automated regression tests in `scripts/vibecode-audit.ts`.

**Tech Stack:** Next.js 15, Tailwind CSS, Geist Sans/Mono + Film Serif, Lucide React / SVG, Vitest.

---

## Baseline Scorecard (from `scripts/vibecode-audit.ts`)
- **Total Tropes Audited:** 30
- **Heavy / Flagged:** 17
- **Moderate / Partial:** 5
- **Clean / Avoided Traps:** 8 (Full legal pages, real demos, skeleton loaders, honest testimonials)

---

## Phase 1: High-Impact Tropes (Low Risk, Instant De-Slop)

### Task 1.1: Replace Sparkle Icons (`✨`) with Concrete Engineering Glyphs
- **Trope #24:** Sparkle icons (`Sparkles` from `lucide-react`) are the universal symbol of low-effort AI wrappers.
- **Files to modify:**
  - `src/app/otter-alternative/page.tsx`
  - `src/app/changelog/page.tsx`
  - `src/app/onboarding/page.tsx`
  - `src/components/onboarding-checklist.tsx`
  - `src/components/vs-comparison.tsx`
  - `src/components/upgrade-prompt.tsx`
  - `src/components/features-page-client.tsx`
- **Action:** Replace `Sparkles` with concrete functional icons (`BarChart3`, `ShieldCheck`, `Cpu`, `Target`, `Zap`, `Crosshair`) depending on context (e.g. `Target` for competitor detection, `Cpu` for transcription pipeline).
- **Verification:** Run `npx tsx scripts/vibecode-audit.ts` — Sparkles count drops to 0.

### Task 1.2: Eliminate "It's Not X, It's Y" Copy Clichés
- **Trope #15:** Formulaic contrastive sentences scream template AI marketing.
- **Files to modify:**
  - `src/components/who-we-are.tsx:59` ("managers who need the truth from every call, not another dashboard" → "managers who track competitor intelligence directly from sales conversations")
  - `src/app/vs/otter-ai/page.tsx:63` ("not just generic meeting notes" → "tailored for B2B pipeline intelligence")
  - `src/app/vs/tldv/page.tsx:83` ("extraction, not just generic summaries" → "MEDDIC extraction and deal-risk scoring")
- **Action:** Rewrite sentences into affirmative, concrete capability statements.
- **Verification:** Run `npx tsx scripts/vibecode-audit.ts` — copy trope occurrences reduced.

### Task 1.3: Clean Up Command Menu & Left Stripes
- **Trope #7 & #11:** Remove isolated emoji (`🚀`) in command menu; replace thick colored `border-l-4` stripes with subtle border cards and badge pills.
- **Files to modify:**
  - `src/components/ui/command-menu.tsx:16` (replace `"🚀"` with Lucide `LayoutDashboard`)
  - `src/components/pictorial-app-showcase.tsx:166` (change `border-l-4 border-[#F26522]` to clean border with highlight chip)
  - `src/components/use-cases.tsx:41`
- **Verification:** `npx tsx scripts/vibecode-audit.ts`

---

## Phase 2: Visual Grounding & Elevation

### Task 2.1: Remove Giant Blurred Radial Orbs
- **Trope #22:** 600px blurred radial glow circles (`radial-glow`, `blur-3xl` blobs) that float aimlessly in backgrounds.
- **Files to modify:**
  - `src/app/page.tsx:53,57` (remove/reign in absolute `h-96 w-96 rounded-full bg-[#FFF4ED] blur-3xl`)
  - `src/components/features-page-client.tsx:309,310`
  - `src/app/globals.css:67-75` (deprecate `.radial-glow`)
- **Action:** Replace ambient colored blobs with clean neutral backgrounds and purposeful top-edge subtle line highlights.
- **Verification:** Verify visual clarity on light and dark pages.

### Task 2.2: Refine Soft Corner Radii from "Bubble" to "Engineered"
- **Trope #19:** Oversized `rounded-[1.75rem]` (28px) and `rounded-3xl` give cards a toy-like appearance.
- **Files to modify:**
  - `src/app/globals.css:78` (`.doppel-outer`: change `rounded-[1.75rem]` to `rounded-2xl` or `rounded-xl`)
  - `src/app/globals.css:84` (`.doppel-outer-dark`)
  - Related card wrappers in `src/components/ui/card.tsx`
- **Action:** Transition from 28px bubble corners to 14px–16px precision corners.
- **Verification:** Run visual regression / build test.

### Task 2.3: Moderate Drop Shadows and Button Glow
- **Trope #5:** Multi-stop heavy drop shadows and glowing neon button shadows (`shadow-[0_8px_24px_-8px_rgba(242,101,34,0.5)]`).
- **Files to modify:**
  - `src/app/globals.css:105`
  - `src/components/hero-cta.tsx`
  - `src/components/final-cta.tsx`
- **Action:** Replace fuzzy 24px color-glow drops with crisp 1px borders (`ring-1 ring-black/[0.08]` or subtle `shadow-sm`).
- **Verification:** Confirm button states maintain high contrast and accessibility.

### Task 2.4: Subtly Ground Button Arrow Animations
- **Trope #25:** Arrow buttons with circular badges that spin 45 degrees (`group-hover:rotate-45`).
- **Files to modify:**
  - `src/components/hero-cta.tsx`
  - `src/components/nav.tsx`
  - `src/components/final-cta.tsx`
  - `src/components/features-page-client.tsx`
- **Action:** Replace 45-degree rotation with a crisp, professional 2px horizontal slide (`group-hover:translate-x-1`).

---

## Phase 3: Brand Identity & Palette Unification

### Task 3.1: Resolve Dashboard Split-Personality (Purple vs Orange)
- **Trope #3 & #20:** The marketing site is warm orange (`#F26522`) on white; the app shell is pitch black with electric indigo (`#5e6ad2`) and violet buttons.
- **Files to modify:**
  - `src/app/dashboard/page.tsx`
  - `src/app/team/page.tsx`
  - `src/components/app-sidebar.tsx`
  - `src/components/ui/badge.tsx`
  - `src/components/ui/toggle.tsx`
  - `src/lib/pricing-tiers.ts` / `DESIGN.md`
- **Action:** Unify app primary accents to the core brand token (`#F26522`) and warm neutral slate surfaces (`#18181b`), eliminating disjointed purple/indigo accents.

### Task 3.2: Introduce Editorial Serif Typography for Headings
- **Trope #10:** Pure Geist Sans across every single title, subtitle, and badge creates default SaaS monotony.
- **Files to modify:**
  - `src/app/layout.tsx` (ensure `font-film` / serif font loads properly)
  - `src/app/page.tsx` (apply `font-film tracking-normal` to main hero and section H2s)
  - `src/components/how-it-works.tsx`
  - `src/components/social-proof.tsx`
- **Action:** Pair editorial serif headings with crisp Geist Sans body and Geist Mono metadata for an authoritative, publication-grade feel.

---

## Phase 4: Structural Diversification & Polish

### Task 4.1: Break Up Formulaic 3-Card Columns
- **Trope #6:** 17 sections currently use identical 3-column cards (`grid-cols-1 md:grid-cols-3`).
- **Files to modify:**
  - `src/components/how-it-works.tsx` (convert into an interactive timeline / workflow stepper with real transcription waveform preview)
  - `src/components/problem-section.tsx` (convert into before/after contrast layout)

### Task 4.2: Replace Generic Traffic-Light Chrome
- **Trope #14:** `.product-chrome` with generic macOS red/yellow/green dots.
- **Files to modify:**
  - `src/app/globals.css:864-882`
  - `src/components/capabilities-bento.tsx`
- **Action:** Upgrade `.product-chrome` to display a branded minimal address bar (`usegauge.com/intel/deal-402`) or borderless sleek frame.

---

## What We Deliberately DO NOT Touch (Protected Pillars)
1. **`/terms` and `/privacy` routes:** Preserved for strict compliance and payment provider requirements.
2. **Skeleton loaders:** Preserved across all data-fetching routes to guarantee low CLS and good Core Web Vitals.
3. **Interactive Demo sandbox (`/demo`):** Preserved and celebrated as our strongest conversion asset.
4. **Transparent pricing:** Preserve clear pricing without hiding behind "Book a demo" forms.

---

## Verification & Acceptance Criteria
- [ ] `npx tsx scripts/vibecode-audit.ts` reports drop in FLAGGED tropes from 17 to < 4.
- [ ] Next.js production build passes with 0 errors (`npm run build`).
- [ ] No regression in accessibility, contrast, or mobile responsiveness.
