# FRONTPAGE-OVERHAUL-PLAN — MNC execution (7 tasks)

> Orchestrator: senior management. Swarm-by-default per CLAUDE.md.
> Goal: `https://usegauge.vercel.app/#demo` front page competes with / outperforms
> reference (Gong-style) on eye-pleasure, color, contrast, accessibility — and the
> same bar applied to every section + `/demo`.

## 1. Org chart (who owns what)

| Squad | Lead role | Owns | Files (disjoint) |
|---|---|---|---|
| Design Systems | Design Systems Architect | Task 1 layout/color/contrast, tokens | `src/app/page.tsx` (hero), `tailwind.config.ts` (no token change — usage only), `src/app/globals.css` (focus system) |
| Accessibility | Accessibility Lead | Task 1 a11y gate (contrast, headings, focus, captions, targets) | same hero files + `hero-cta.tsx` |
| Content | Content Strategist | **Task 2 tagline → "virtual competitor"** + full reframe | `src/lib/homepage-copy.ts`, `src/test/homepage-copy.test.ts` |
| People/Brand | Brand Director + Tech Recruiter (advisory) | **Tasks 3+4 Team showcase + Who we are** (honest, no fake humans — editable slots) | `src/lib/team.ts` (new), `src/components/team-showcase.tsx` (new), `src/components/who-we-are.tsx` (new) |
| Media | Media Engineer + Frontend Dev | **Task 5 video enhanced** (right-column) | `src/components/hero-scrubbable-video.tsx`, `src/components/hero-video-player.tsx` |
| Evidence UX | UX Writer + Frontend Dev | **Task 6 summary + evidence below, presentable** | `src/components/hero-evidence-stack.tsx`, `src/app/page.tsx` (placement) |
| Demo Growth | Full-stack Eng + Growth/SEO | **Task 7 proper demo page** (static+dynamic glimpse) | `src/app/demo/page.tsx` (server only, no bundle growth) |
| Quality | QA Lead + 2 testers | Gate: tsc, eslint, vitest, build, keyboard/contrast smoke | tests only (updates where copy truth changed) |
| Release | DevOps / Deployment Eng | **Automation: event → whole project awakens** | `.github/workflows/frontpage-guard.yml` (new), docs row |

## 2. Task dedication (the 7 asks)

1. **Layout change (frontal).** Eye-pleasing, color-fixed, contrast-clean full page.
   Fix: heroSub `gray-500→gray-700`, eyebrow tracking, CTA `focus-visible` rings +
   44px targets, `Play` `aria-hidden`, tertiary link target, mobile CTA overlap.
   Same contrast rule applied to capabilities/pricing/film sections.
2. **Tagline → virtual competitor.** H1 B becomes
   `AI notetaker for sales calls that flags virtual competitors.` with
   "virtual competitors" rendered in accent/underline. heroSub + 3 bullets +
   wedge H2 reframed around the virtual-competitor idea. Tests updated in lockstep.
3. **Team showcase (advisory board).** New `TeamShowcase` section on `/` after
   proof: Founder / CEO / CTO / CFO / Engineering / Design / GTM slots as
   **editable placeholders** (no invented humans, no fake photos — initials
   avatars + "Your Name — update in src/lib/team.ts"). Honest by design.
4. **Who we are.** New `WhoWeAre` section: what Gauge is, goal, what we achieve
   (3 pillars + honest beta numbers 12 teams / 500+ calls, no fake logos).
5. **Video enhanced (right).** Scrubbable player: captions `default`, solid
   `bg-black/65` pills (no image-dependent contrast), `focus-visible` rings,
   44px mute/play targets, keyboard-operable, `aria-hidden` icons, kept 39s/VTT
   truth + zero-byte facade. Film player: captions note + focus + aria-hidden.
6. **Summary + evidence below.** `HeroEvidenceStack` leaves the cramped right
   column → full-width `Deal evidence` section (transcript / Slack / CRM as
   3 readable cards + proper `h2` so AT heading nav finds it). Summary lines
   stay tappable; footer metadata `gray-400→gray-600`.
7. **Proper demo page.** `/demo` becomes the glimpse-of-everything: 3-step
   "what you'll see", existing interactive carousel (dynamic), static evidence
   example, workflow strip (upload→alert→coach→CRM), pricing teaser + FAQ/CTA.
   All new blocks server-rendered (bundle budget untouched).

## 3. Automation — "any event awakens the project"

New `frontpage-guard.yml` triggers on: `push`/`pull_request` touching frontpage
paths, `workflow_dispatch`, `schedule` (weekly Mon 06:00 UTC), `issue_comment`
(`/frontpage-check`). Jobs: typecheck → homepage-copy pin tests → hero/video
tests → production build → bundle-budget note. CI (`ci.yml`) untouched.
Docs row in `DEVELOPMENT_FRONTIER.md` after ship.

## 4. Gate

`npx tsc --noEmit` → `npx vitest run src/test/homepage-copy.test.ts
src/test/hero-scrubbable-video.test.tsx` → full `npx vitest run` →
`npm run build`. Keyboard + contrast spot-check on `/` and `/demo`.

## 5. Risks

- Copy-truth tests pin exact H1 — updated together, never silently.
- No real team photos/names exist — placeholders only, clearly marked.
- `/demo` bundle cap 212KB — new demo blocks are server components.
