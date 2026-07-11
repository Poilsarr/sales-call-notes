# CallNote Pro — App UI Coherence Guide

## 1. The Problem

The app shell is dark (`bg-linear-black` #050505) but several pages rendered harsh white cards because they used the marketing-page `.doppel-outer` / `.doppel-inner` classes. Those classes are explicitly light-themed (`bg-white`, `ring-black/[0.06]`). Inside the dark app they looked cheap, high-contrast, and out of place.

Secondary issues:
- Analytics dashboard active toggle used `bg-white text-black` — jarring against dark cards.
- Live page idle button used `bg-gray-900 hover:bg-black` — too heavy and inconsistent.
- Existing dark card classes (`.doppel-outer-dark`, `.doppel-inner-dark`) had no hover transitions.

## 2. Design Tokens

Use the tokens already defined in `tailwind.config.ts` and `src/app/globals.css`.

| Role | Tailwind token | Hex |
|------|----------------|-----|
| App background | `bg-linear-black` | `#050505` |
| Card surface | `bg-linear-surface` | `#141416` |
| Card border | `border-linear-secondary` | `#1c1c20` |
| App accent | `text-linear-indigo` / `bg-linear-indigo` | `#5e6ad2` |
| Marketing CTA | `text-[#F26522]` / `bg-[#F26522]` | `#F26522` |
| Success | `bg-emerald-500/10 text-emerald-400` | — |
| Warning | `bg-amber-500/10 text-amber-400` | — |
| Danger | `bg-red-500/10 text-red-400` | — |
| Primary text | `text-white` | — |
| Secondary text | `text-zinc-400` | `#a1a1aa` |
| Muted text | `text-zinc-500` | `#71717a` |

Typography: Geist Sans / Geist Mono, tight letter-spacing on headings, `text-sm`/`text-xs` for UI labels.

## 3. Component Recipes

### Dark Card
```tsx
<div className="doppel-outer-dark">
  <div className="doppel-inner-dark p-6">
    {/* content */}
  </div>
</div>
```

### Metric Card
```tsx
<div className="doppel-outer-dark">
  <div className="doppel-inner-dark p-5">
    <div className="text-[11px] uppercase tracking-wider text-white/40 mb-2">Label</div>
    <div className="text-2xl font-semibold text-white">Value</div>
  </div>
</div>
```

### Status Badge
```tsx
<span className="bg-emerald-500/10 text-emerald-400 rounded-full px-3 py-1 text-xs">
  Live
</span>
```

### Toggle Active State
```tsx
"bg-linear-indigo text-white"      // active
"bg-white/5 text-white/60 hover:text-white" // inactive
```

### Ghost Button on Dark
```tsx
"bg-white/5 hover:bg-white/10 border border-white/10 text-white"
```

## 4. What Was Changed

| File | Change |
|------|--------|
| `src/components/bento-stats.tsx` | `doppel-outer` → `doppel-outer-dark`, `doppel-inner` → `doppel-inner-dark` |
| `src/app/app/page.tsx` | same swap |
| `src/app/app/calls/page.tsx` | same swap on call rows |
| `src/app/app/calls/[id]/page.tsx` | same swap on transcript, analysis, collaboration, chat panels |
| `src/components/analysis-panel.tsx` | same swap on scorecard, health, stat cards |
| `src/components/live-transcription-panel.tsx` | same swap |
| `src/app/app/record/page.tsx` | same swap on recorder and upload cards |
| `src/app/app/live/page.tsx` | same swap + idle button `bg-gray-900 hover:bg-black` → `bg-white/5 hover:bg-white/10 border border-white/10` |
| `src/app/dashboard/page.tsx` | active scope toggle `bg-white text-black` → `bg-linear-indigo text-white` |
| `src/app/globals.css` | dark doppel ring bumped to `ring-white/[0.08]`, added `transition-all duration-300 hover:ring-white/[0.14]` and `transition-colors` on inner |

## 5. What to Do Next

1. **Visual QA on real data.** Open `/app`, `/app/calls`, `/app/calls/[id]`, `/app/record`, `/app/live`, `/dashboard` and confirm cards no longer look white.
2. **Screenshots compare.** Take new screenshots and diff against the old ones to verify coherence.
3. **Audit remaining light surfaces.** Search for `bg-white`, `bg-zinc-50`, `bg-slate-50`, `bg-gray-50` inside `src/app/app/**` and `src/components/**` and convert anything that sits on dark backgrounds to `bg-linear-surface` / `bg-white/[0.03..0.08]`.
4. **Unify accent decision.** Decide if app primary actions stay `linear-indigo` or move to marketing orange `#F26522`. Currently the app uses indigo; marketing uses orange. Pick one and apply consistently (CTA buttons, active toggles, highlights).
5. **Run vitest.** `npx vitest run` to confirm no UI component snapshots broke.
6. **Commit.** `git add -A && git commit -m "theme: unify app cards on dark doppel variants"`.

## 6. Script to Re-apply (if needed)

The replacements were done with a Python one-off script. If you need to re-run it on a fresh checkout, see the script in the compaction/context summary or re-apply the same regex swaps manually.
