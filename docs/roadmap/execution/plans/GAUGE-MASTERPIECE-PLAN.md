# GAUGE-MASTERPIECE-PLAN

> **Arc:** Marketing visual craft upgrade to Otter/Fireflies/Gong tier  
> **Branch concern:** UI / docs (atomic PRs; no Clerk/billing/schema)  
> **Safety:** Preserve `gauge:scrub`, HeroCTA Clerk mount, `plans.ts`, PostHog events, Vitest `data-testid` / track sections.  
> **Live:** https://usegauge.vercel.app · Prior arcs #168–#174 shipped structure + CSS mocks.

## Diagnosis

PRs #168–#174 shipped Otter structure + coded product mocks. Live site still read theoretical: three design languages (film hard-shadow, Otter soft, terracotta leftovers), Acme/Gong fiction tiled ~8×, no product stills, weak human trust.

| Competitor bar | Gauge before masterpiece |
|---|---|
| Full-bleed product hero | Split column + inset film-hard video card |
| Real UI screenshots / cinematic stills | Hand-coded DOM mocks |
| One coherent art direction | Film + Otter soft + `#C94F17` leftovers |
| Human trust | Gradient initials + integration logos |
| Intentional motion | CSS pulse / marquee only |
| Sparse sections | ~25 bands; duplicate pricing; mock reuse |

## Creative lock — “Gauge Radar”

| Token | Rule |
|---|---|
| Shells | Soft `.doppel-outer` / `.doppel-inner` only on light marketing cards |
| Accent | `#F26522` only (retire `#C94F17` / `#A84310` on marketing) |
| Moat | One cinematic dark band (`RadarMoat` + film wedge); no film grain on every section |
| Proof | `public/product/*` stills inside `.product-chrome`; coded minis = fallback only |
| Fiction | `src/lib/demo-call-fiction.ts` SSOT; film wedge shows **one** hero alert |
| Honesty | No fake customer logos; sample alerts labeled; beta stats only |

## Visual Spec (one page)

### Color
- Base: white / `#EFEFEF` / pastel section tints (`.section-tint-*`)
- Accent: `#F26522` → hover `#e05a1a`; CTA gradient `from-[#F26522] to-[#E63E7A]`
- Dark moat: `#0a0a0b` + `.doppel-*-dark`
- Film tokens (`film.*`) reserved for dark radar band; migrate cream bands off marketing

### Type
- Sans: Geist; mono stamps for proof meta; Instrument Serif (`font-film`) sparingly

### Shells
- Marketing: soft doppel — **never** `shadow-[8px_8px_0_#131316]` or washi tape
- Product plane: soft doppel + `.product-chrome` frame

### Motion budget (max 3 site-wide)
1. `.hero-plane-enter` — hero product plane
2. Trust marquee (existing)
3. `.product-still-reveal` **or** radar pulse — not both on every card  
Respect `prefers-reduced-motion` (already in `globals.css`).

### Section jobs (homepage)
Hero → Scrub → Trust → Evidence → Problem → Product stills → Capabilities → How → Radar → Personas → Objections → Social → Live proof → Integrations → Vs → Cases → ROI → **PricingTeaser only** → Film wedge (1 sample alert) → Team → Who → Final → Seo → Extension.

## Phase map

| Phase | Concern | Exit | Status |
|---|---|---|---|
| 0 | Docs + tokens | Spec + soft-shell / accent / motion classes | Done (this file + globals) |
| 1 | Homepage cleanup | No dup pricing; fiction SSOT; objections densified; accent unity; soft shells | Done (#175) |
| 2 | Product stills | ≥6 SVGs in `public/product/`; proof bands image-led | Done (#175 stills) |
| 3 | Hero + motion | Soft product plane; bullets below fold; 2–3 motions | Done (#175 hero-plane-enter) |
| 4 | Trust | Team `photo?` wiring; extension still | Partial — extension still live via capabilities-bento meet still; team `photo?` render SKIPPED — visual-density-d4 forbids `<img>`, needs real photos first |
| 5 | Inherit | Pricing/features/vs/demo stills; frontier row | Done (pricing migration still #175-followup; features/vs/demo verified mock-free) |

Merged: #175 (3 commits: 81fb96c, 7760605, 16a4f74).

## Frozen contracts

- `gauge:scrub` CustomEvent `{ seekS }`
- HeroCTA Clerk hydration
- `PLANS` from `src/lib/plans.ts`
- PostHog / `trackEvent` names
- `data-track-section` values used by analytics + tests
- Product stills map: `PRODUCT_STILLS` in `demo-call-fiction.ts`

## Product still inventory

| Key | Path | Proves |
|---|---|---|
| transcript | `/product/transcript-proof.svg` | Quote / speaker / time |
| slack | `/product/slack-ping.svg` | Rival Slack ping |
| crm | `/product/crm-sync.svg` | HubSpot/SF fields |
| radar | `/product/radar-board.svg` | Moat board |
| coach | `/product/coach-talk.svg` | Talk-time / coach |
| summary | `/product/summary-owners.svg` | Owners + dates |
| meet | `/product/meet-extension.svg` | Meet capture |

## Gate

```bash
npx vitest run
npx next build
```

CI green before merge. Bundle `/` under documented budget (~158–252kB).

## Out of scope

Full homepage rewrite; lifted competitor assets; fake logos; WebGL marketing stacks; Clerk/billing/Prisma changes; dashboard PII in captures.

## Ship order (atomic PRs)

1. Docs + tokens (this plan)  
2. Cleanup + soft shells + stills swap (homepage)  
3. Hero plane polish + bullet move  
4. Team / extension  
5. Pricing / features / vs inherit + `DEVELOPMENT_FRONTIER` row  
