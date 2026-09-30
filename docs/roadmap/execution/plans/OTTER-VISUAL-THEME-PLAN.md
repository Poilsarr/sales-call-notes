# OTTER-VISUAL-THEME-PLAN — look like Otter, stay Gauge

> Owner: "copy otter.ai, make it work for us." Boundary: visual language mirrored (white base, soft cards, gradient CTAs, screenshot-first, marquee); all copy/assets/code original.
> Mechanism: redefine SHARED classes in globals.css → whole site transforms at once. Class NAMES stay (all pins green); only computed style changes.

## 1. V1 — theme core (owns ONLY src/app/globals.css, tailwind.config.ts, src/test/visual-theme.test.ts new)

- `.doppel-outer`: white → white, keep p-1.5? NO — soften: `rounded-[1.75rem] bg-white shadow-[0_1px_2px_rgba(16,24,40,0.06),0_12px_32px_-12px_rgba(16,24,40,0.18)] ring-1 ring-black/[0.04]` (drop double-shell look by making outer padding transparent? outer has bg-white + inner bg-white — set outer `bg-transparent p-0`? NO: tests count class combos in SOURCE not CSS — safe. But 142 usages incl. dark? dark separate. Keep p-1.5 structure, soften ring+shadow, radius 2rem→1.75rem.)
- `.doppel-inner`: keep radius math, shadow → `shadow-none`, add `border border-black/[0.04]`.
- KEEP `.doppel-outer-dark/.doppel-inner-dark` byte-identical (radar pin + 23 app files).
- `.btn-primary`: `bg-[#F26522]` → gradient `bg-gradient-to-r from-[#F26522] to-[#E8442E]`? Otter hot-gradient is orange-pink: `from-[#F26522] via-[#E8442E] to-[#D6336C]`? Use `from-[#F26522] to-[#E63E7A]`? Keep `bg-[#F26522]` as fallback base (pins check OTHER files' inline classes, not .btn-primary — only 1 definition, no test pins it. Safe.) Gradient + soft shadow `shadow-[0_8px_24px_-8px_rgba(242,101,34,0.5)]`.
- New `.animate-marquee` + `@keyframes marquee-horizontal` (translateX 0→-50%, 40s linear infinite, pause on hover) — contract for V2.
- New pastel section utilities: `.section-tint-blue {bg #EFF4FF}`, `.section-tint-peach {#FFF4ED}`, `.section-tint-mint {#EDFAF5}` for alternating rhythm (class-only additions, no existing edits).
- tailwind.config: add `pastel:{blue,peach,mint,lavender}`, `shadow.soft`, keep everything else. NO token renames.
- test: source-scan asserts (doppel class names still emitted? they're CSS — instead assert: globals.css contains new gradient/marquee/pastel markers; tailwind config has pastel keys; bento/product/radar/pricing/vs/intelligence/personas tests untouched).
- VERIFY: full vitest (only proof-openai may fail), eslint files.

## 2. V2 — apply (owns ONLY src/components/hero-cta.tsx, src/components/trust-strip.tsx, src/components/final-cta.tsx, src/app/page.tsx hero section classes + bento/product sections bg ONLY, + test additions to visual-theme.test.ts? NO — V1 owns test file. V2 asserts via existing tests.)

- hero-cta.tsx: primary pill → gradient (`bg-gradient-to-r from-[#F26522] to-[#E8442E]` + gradient shadow). homepage-events.test asserts id/section/signedIn/label ONLY (verified §2B) — colors free.
- page.tsx hero `<section>`: `from-film-paper via-[#EFEFEF]` → `bg-white` + decorative blobs (two absolute rounded-full blur-3xl peach/blue, pointer-events-none). Copy untouched.
- trust-strip.tsx: logo row → marquee (duplicate list x2, `.animate-marquee`, `aria-hidden` on dup). trust-strip.test asserts logos render (getAllBy* tolerant — verify; if exact-count asserts break, adjust within test? NO — V2 must keep counts: use getAll count agnostic. Check test file first: trust-strip.test 18-73 — logos 6(now 9) alts; duplication x2 doubles alt counts → COULD BREAK exact-count asserts. Mitigation: aria-hidden dup + test queries visible only? If test uses getAllByAltText exact numbers, V2 must update test in same change (allowed: same-PR test update, note it). Read the test first.)
- final-cta.tsx: primary → gradient (same as hero-cta).
- Sections bg: product-visuals-section `bg-film-cream` → `bg-white`? product-visuals.test asserts headings/cards, NOT section bg (verified — no bg assert). pricing-visual-proof asserts bg-film-cream IN pricing-client (untouched). Change product-visuals-section + capabilities-bento section bgs to white/pastel? capabilities-bento.test has NO bg assert (only shells/chips/ids). Safe: bento section → white, product section → pastel peach tint? Keep tape (amber pin is on .bg-film-amber/60 element — keep tape element untouched).
- VERIFY: tsc/eslint + trust-strip/vs-teaser/footer-links/homepage-events/otter-template/product-visuals/capabilities tests.

## 3. Gate + ship

tsc, eslint, targeted, full (proof-openai only), build + bundle ≤252, PR + verification + admin merge (owner pre-authorized: "execute it, ill see the end product") + production fetch confirm.
