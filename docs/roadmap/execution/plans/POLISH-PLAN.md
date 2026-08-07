# POLISH — lint cleanup + skip-link no-op pages

## Concern 1 — Lint cleanup (4 `react-hooks/exhaustive-deps`/`useCallback` warnings)

Full inventory (fresh `npx eslint src` — 373 files, 0 errors): the 4 hooks warnings + 3
`no-img-element` (see separately). Fix ONLY the 4 hooks warnings; defer no-img-element.

### Fix 1 — src/app/app/calls/page.tsx:156 (loadArchived)
- `const loadArchived = () => {...}` (line 53) → `const loadArchived = useCallback(() => {…}, [user?.id]);`
- Effect line 154-156: `useEffect(() => { if (tab === "archived") loadArchived(); }, [tab, loadArchived]);`
- Import `useCallback` in the existing React import.
- Simple wrap; no reordering needed (fn is declared before the effect).

### Fix 2 — src/app/team/page.tsx:100 (fetchMembers) — TDZ trap
- Effect is BEFORE the const at line 98. Must reorder:
  1. `resetState` (line 137) → `const resetState = useCallback(() => {…}, []);`
  2. `fetchMembers` (line 102) → `const fetchMembers = useCallback(async () => {…}, [router, resetState]);`
  3. MOVE the mount effect BELOW the two consts (after fetchMembers' closing) and change deps: `useEffect(() => { fetchMembers(); }, [fetchMembers]);`
- Do NOT just add `[fetchMembers]` in place — TDZ ReferenceError (deps evaluate during render; const declared after).
- `router` from `useRouter()` is stable; `setLoading(false)` etc. are stable setters → identity stable → fires once.

### Fix 3 — src/app/team/performance/page.tsx:50 (fetchPerformance) — same TDZ trap
- `const fetchPerformance = useCallback(async () => {…}, [router]);`
- MOVE the mount effect to immediately after the const definition + deps `[fetchPerformance]`.

### Fix 4 — src/components/upgrade-prompt.tsx:77 (not :43)
- The `useCallback` deps array lists `onClose` but the body's only `onClose` is the Paddle checkout option key (line 72), NOT the prop. Prop consumed at line 138 in JSX.
- Remove `onClose` from the deps array: `}, [paddle, user?.id, feature, paddleError]);`
- Signature `(targetPlan: PlanTier) => void` unchanged; typechecks.

## Concern 2 — Skip-link no-op pages (WCAG 2.4.1)

Skip link: root layout `src/app/layout.tsx:105-107` `<a href="#main" className="skip-link">`. CSS globals.css:37-53. Precedent style to mirror = `src/app/security/page.tsx` (`<>`, `<Nav />`, `<main id="main" className="min-h-screen bg-white text-gray-900">…</main>`, `</>`) and commit 4d2689b (S6 Nav-out-of-main).

No shared wrapper component exists — 5x-local is the only option.

### Fix 1 — `/pricing` (has main, NO id)
- `src/app/pricing/page.tsx` renders `<PricingClient/>`; the `<main>` lives in `src/components/pricing-client.tsx` (server passes Nav; need to confirm exact line ~269 but verify at edit time with `rg -n "<main"`).
- Change `<main className={{provides the current classes}}>` → `<main id="main" same-classes>`. ONE attribute only.

### Fix 2 — `/features` (main, NO id, Nav INSIDE main — two-part)
- `src/components/features-page-client.tsx` line ~689-690: currently `<main className="…overflow-hidden">` wrapping `<Nav />` then content.
- PART A: add `id="main"` to the main.
- PART B: hoist `<Nav />` OUT: wrap in fragment — `<><Nav /><main id="main" …>…content…</main></>` (mirror 4d2689b part 2 exactly; page already closes </main> at ~845).

### Fix 3-5 — `/changelog`, `/roadmap`, `/no-bot` (no main)
- Each currently `<>` → `<Nav />` → `<div className="min-h-screen bg-white text-zinc-900">` → content.
- Wrap: replace the `<div className="min-h-screen bg-white text-zinc-900">` with `<main id="main" className="min-h-screen bg-white text-zinc-900">` and close `</main>` before `</>`. Keep ALL inner divs. Indentation fine (pages use `return (<>`, `<></>` — match security page padding style by re-indenting 2 levels or keep minimal; prefer minimal indentation change: keep inner child indentation and let formatter/lint accept — eslint won't fail on indentation (no indent rule) so keep it simple.)

## Verified safe (research):
- No test pins any of the 4 hook pages or 5 marketing pages DOM (pricing-copy/fixes, footer-links, bundle-gate are text/href/size only; e2e pricing text survives.)
- bundle-gate: `<main>` adds ~0 bytes; limits 210/260 KB unaffected.

## Gate (orchestrator)
1. `npx tsc --noEmit` green
2. `npx eslint src` → 0 errors (warnings drop from 7 → 4; remaining 3 = no-img deferred)
3. `npx vitest run` green (expect 832)
4. `REDIS_HOST=disabled REDIS_PORT=0 npx next build` exit 0 (no new `Warning:` lines beyond pre-existing imgs + Sentry)
5. Smoke 3104: /pricing /features /changelog /roadmap /no-bot → 200; grep page HTML for `<main id="main"` via curl + `rg`
6. Per-commit CI green (push sequential, wait)

## Out of scope
- no-img-element ×3 (deferred), Sentry instrumentation (Next 15 arc), Next 15 upgrade itself.