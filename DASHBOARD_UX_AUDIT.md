# Dashboard UX Audit — Gauge

> **Scope:** All gated/dashboard route files + shared navigation components.  
> **Date:** July 11, 2026  
> **Method:** Static code review against 9 UX criteria. No runtime testing.  
> **Note:** No source files were modified. This is documentation only.

---

## Summary Table

| Route / Component | P0 | P1 | P2 | Total |
|---|:---:|:---:|:---:|:---:|
| `app/layout.tsx` | 1 | 0 | 2 | 3 |
| `app/page.tsx` (Dashboard) | 0 | 0 | 4 | 4 |
| `app/calls/page.tsx` | 0 | 1 | 4 | 5 |
| `app/calls/[id]/page.tsx` | 0 | 3 | 5 | 8 |
| `app/intelligence/page.tsx` | 0 | 1 | 3 | 4 |
| `app/live/page.tsx` | 0 | 2 | 2 | 4 |
| `app/record/page.tsx` | 0 | 0 | 3 | 3 |
| `dashboard/page.tsx` (Analytics) | 2 | 3 | 4 | 9 |
| `billing/page.tsx` | 1 | 2 | 3 | 6 |
| `settings/page.tsx` | 0 | 2 | 3 | 5 |
| `team/page.tsx` | 0 | 1 | 4 | 5 |
| `integrations/page.tsx` | 1 | 2 | 3 | 6 |
| `app-sidebar.tsx` | 1 | 2 | 2 | 5 |
| `upgrade-prompt.tsx` | 0 | 0 | 2 | 2 |
| **TOTALS** | **6** | **17** | **44** | **67** |

---

## Cross-Cutting Issues

These affect multiple routes and are the highest-leverage fixes.

### P0 — Critical

| # | Issue | Affected Routes |
|---|---|---|
| X1 | **Two navigation systems.** `/app/*` routes use a fixed `AppSidebar` (left sidebar). `/dashboard`, `/billing`, `/settings`, `/team`, `/integrations` use `Nav` (top nav bar). Users experience completely different chrome depending on which gated page they land on. | All gated routes |
| X2 | **Theme inconsistency.** `/integrations` uses `bg-white text-gray-900` (light theme). Every other gated page uses `bg-linear-black text-white` (dark theme). | `/integrations` |
| X3 | **AppSidebar has no mobile collapse.** Fixed `w-64` (256px) with no responsive breakpoint, hamburger, or drawer. On mobile, the sidebar consumes a third of the viewport. | All `/app/*` routes |
| X4 | **Broken call links in /dashboard.** Recent calls link to `href="/calls/${call.id}"` — missing the `/app` prefix. Clicking a call from Analytics hits a 404 or wrong route. | `/dashboard` |

### P1 — Should Fix

| # | Issue | Affected Routes |
|---|---|---|
| X5 | **Design token split.** `/app/*` routes use `doppel-outer`/`doppel-inner`/`text-zinc-*`. `/dashboard`/`/billing`/`/settings`/`/team` use `linear-surface`/`linear-secondary`/`linear-indigo`/`text-white/*`. Two visual languages for the same product. | All |
| X6 | **Font weight inconsistency.** `/app/*` h1: `text-3xl font-semibold`. Standalone routes h1: `text-3xl font-medium tracking-tight`. | All |
| X7 | **Padding inconsistency.** `/app/*` gets `p-8` from layout wrapper. Standalone routes use `pt-32 pb-20` or `px-6 py-12`. | All |
| X8 | **Spacing rhythm varies.** Some pages use `space-y-6`, others `space-y-8`, with no documented standard. | All `/app/*` |
| X9 | **No skeleton loaders anywhere.** Loading states are a mix of text ("Loading..."), spinners, `…` placeholders, and a custom Brain spinner. No page uses skeleton cards. | All |
| X10 | **Settings tabs lack ARIA roles.** Tab buttons are plain `<button>` with no `role="tab"`, `aria-selected`, or `role="tabpanel"`. | `/settings` |

---

## Per-Route Audit

### 1. `src/app/app/layout.tsx`

The shared layout for all `/app/*` routes. Wraps children in a sidebar + motion div with `p-8` padding.

| Severity | Issue | Criterion |
|---|---|---|
| **P0** | AppSidebar is `w-64` fixed with no mobile collapse (X3). No hamburger, no drawer, no responsive hide. On a 375px mobile viewport the sidebar eats 68% of the width. | Mobile breakpoints |
| **P2** | `if (!isLoaded \|\| !isSignedIn) return null;` — blank white flash before Clerk hydrates. No skeleton or branded loading state. | Loading states |
| **P2** | TrialBanner fetch: `.catch(() => {})` silently swallows errors. If the billing API is down, the trial banner never appears and the user gets no indication their trial status is unknown. | Error states |

**Color contrast:** `bg-linear-black` with `text-white` — consistent dark theme. ✓  
**Font scale:** N/A (layout wrapper).  
**Spacing:** `p-8` consistent for all child routes.

---

### 2. `src/app/app/page.tsx` — Dashboard

The main `/app` dashboard with stat cards and recent calls list.

| Severity | Issue | Criterion |
|---|---|---|
| **P2** | Loading state shows `…` for stat cards and `"Loading..."` text for recent calls — two different loading patterns on the same page. No skeleton. | Loading states |
| **P2** | `space-y-8` here vs `space-y-6` on calls page — spacing rhythm is inconsistent across `/app/*` routes (X8). | Spacing rhythm |
| **P2** | Empty state links: `<Link href="/extension">` — this route exists but the link text says "Capture live from Google Meet" which could be clearer about requiring the Chrome extension. | Upgrade dead-ends |
| **P2** | No `aria-label` on any of the stat cards or recent call links. Screen readers get raw numbers with no context. | Accessibility |

**Color contrast:** `text-white` on `bg-linear-black`, `text-zinc-400` for subtitles. Good contrast. ✓  
**Font scale:** `text-3xl font-semibold` h1, `text-lg font-medium` h2 — consistent within `/app/*`. ✓  
**Empty state:** Excellent. 3-step onboarding with numbered list, icon, and time estimates. ✓  
**Error state:** Shows `text-red-400` error text inline. ✓  
**Mobile:** BentoGrid handles responsive collapse. ✓  
**Upgrade dead-ends:** No paywall on this page. ✓

---

### 3. `src/app/app/calls/page.tsx` — Calls List

Searchable call history with CSV export and onboarding empty state.

| Severity | Issue | Criterion |
|---|---|---|
| **P1** | Search bar + filter button row: `flex items-center gap-3` with no `flex-wrap` or responsive breakpoint. On narrow screens the filter button could overflow or compress the search input awkwardly. | Mobile breakpoints |
| **P2** | Loading state: `"Loading calls..."` plain text, no skeleton cards. | Loading states |
| **P2** | Filter button has `onClick={() => searchRef.current?.focus()}` but no `aria-label`. Screen readers announce "Filter" with no indication of what it does. | Accessibility |
| **P2** | Error handling: `toast.error()` on fetch failure, but no inline error state. If the user dismisses the toast, there's no persistent indicator that the list failed to load. | Error states |
| **P2** | `space-y-6` vs dashboard's `space-y-8` (X8). | Spacing rhythm |

**Color contrast:** `text-white` on dark, `text-zinc-400/500` for meta. Good. ✓  
**Font scale:** `text-3xl font-semibold` h1 — consistent. ✓  
**Empty state:** Excellent. Distinguishes "no calls yet" (onboarding steps) from "no search results" (try shorter search). ✓  
**Mobile:** Search input is `flex-1` which adapts, but no `flex-wrap` on the container.  
**Upgrade dead-ends:** `<UpgradePrompt feature="crm_sync" minimal />` — provides upgrade path. ✓

---

### 4. `src/app/app/calls/[id]/page.tsx` — Call Detail

Three-column layout: transcript viewer, analysis panel, chat sidebar.

| Severity | Issue | Criterion |
|---|---|---|
| **P1** | No h1 page title. Every other `/app/*` route has `text-3xl font-semibold` h1. This page jumps straight into the grid layout. | Font scale |
| **P1** | Error state: `<div className="h-screen flex items-center justify-center text-white">{error}</div>` — raw error string, no retry button, no link back to calls list. | Error states |
| **P1** | Collaboration checkbox: `<label>` wraps text + `<input type="checkbox">` but the label text "Share this call with the team" is not associated with the checkbox via `htmlFor`/`id`. Clicking the text toggles it, but screen readers may not announce the relationship. | Accessibility |
| **P2** | Loading state: `h-screen` centered spinner (`border-b-2 border-white`). Different from all other pages' loading patterns (X9). | Loading states |
| **P2** | `"Call not found"` — bare text, no link back to `/app/calls`. Dead-end for the user. | Error states |
| **P2** | Assignee `<select>` has no `aria-label` or associated `<label htmlFor>`. | Accessibility |
| **P2** | Comment `<textarea>` has no label, only `placeholder="Add a note for your team..."`. Placeholder is not a label. | Accessibility |
| **P2** | `any` types used extensively (`actionItems: any[]`, `decisions: any[]`, etc.) — not a UX issue but indicates the data contract is loose, which can cause runtime rendering bugs. | Code quality |
| **P2** | `h-screen` on loading/error/not-found states — these render inside the layout's `overflow-y-auto` main, so `h-screen` may cause double scroll. | Spacing rhythm |

**Color contrast:** Dark theme consistent. `text-emerald-400` on dark for icons — good. ✓  
**Empty state:** Comments: "No comments yet." — minimal but functional. ✓  
**Mobile:** `grid-cols-1 xl:grid-cols-[0.95fr_0.95fr_0.7fr]` — collapses to single column below `xl`. ✓

---

### 5. `src/app/app/intelligence/page.tsx` — Competitive Intelligence

Competitor mention tracking with trend bars and mention feed.

| Severity | Issue | Criterion |
|---|---|---|
| **P1** | `text-zinc-600` used for subtitle text ("Last {days} days", "Unique names detected"). `zinc-600` (#3f3f46) on `bg-linear-black` is ~4.5:1 contrast — borderline WCAG AA for small text. | Color contrast |
| **P2** | Stat card value `text-3xl font-semibold` matches h1 size — the stat numbers visually compete with the page title. | Font scale |
| **P2** | `space-y-8` at page level but `gap-4` in stat grid — inconsistent with dashboard's `gap-6`. | Spacing rhythm |
| **P2** | Upgrade prompt `<UpgradePrompt feature="competitive_alerts" minimal />` appears between stat cards and trend chart — position is slightly jarring as it interrupts the visual flow. | Upgrade dead-ends |

**Color contrast:** Overall good. `text-red-400`, `text-emerald-400`, `text-yellow-400` for sentiment badges on dark — good contrast. ✓  
**Font scale:** `text-3xl font-semibold` h1 — consistent. ✓  
**Empty state:** Well-designed. Icon + heading + description + two CTA buttons ("Upload a call", "Set up the extension"). ✓  
**Loading:** Spinner (`border-b-2 border-white`) — functional but different pattern (X9).  
**Error states:** **Best-in-class.** Handles 401 (session expired → sign-in CTA), 403 PLAN_REQUIRED (upgrade prompt), 4xx/5xx (error card with message). ✓✓✓  
**Mobile:** `grid-cols-1 md:grid-cols-3` — collapses. ✓  
**Accessibility:** `role="listitem"` on mention entries. Trend items are `<button>` elements. ✓

---

### 6. `src/app/app/live/page.tsx` — Live Transcription

Real-time microphone capture with streaming captions.

| Severity | Issue | Criterion |
|---|---|---|
| **P1** | `statusClasses` for idle state: `bg-black/[0.04] text-zinc-500` — `black/[0.04]` is nearly invisible on a dark background, and `text-zinc-500` on near-transparent black is very low contrast. The idle status badge is almost unreadable. | Color contrast |
| **P1** | `text-red-600` and `text-amber-700` used for status labels on dark background. These are dark colors designed for light backgrounds. `red-600` (#dc2626) on `bg-linear-black` is ~3.5:1 — below WCAG AA for text. | Color contrast |
| **P2** | No empty state for when recording is active but no captions have arrived yet beyond "Listening for the first caption…" — could add a waveform or visual indicator. | Empty states |
| **P2** | `max-w-5xl mx-auto` constrains width — good for readability, but different from other `/app/*` routes that use full width. | Spacing rhythm |

**Color contrast:** `text-[#F26522]` accent for recording state — good. `text-zinc-200` for transcript text — good.  
**Font scale:** `text-3xl font-semibold` h1, `text-lg font-medium` h2 — consistent. ✓  
**Loading:** Multiple states: idle, connecting (spinner), listening (spinner), active (ping animation). ✓  
**Error states:** `micError` displayed inline with `AlertCircle` icon. Toast errors for speech recognition failures with specific messages per error code. ✓✓  
**Mobile:** `flex-wrap` on header section. `max-w-5xl` container. ✓  
**Accessibility:** Buttons have `type="button"`. ✓  
**Upgrade dead-ends:** No paywall — appears to be a free feature. N/A.

---

### 7. `src/app/app/record/page.tsx` — Record Call

Browser recording + file upload with language picker.

| Severity | Issue | Criterion |
|---|---|---|
| **P2** | `removeFillers` checkbox state appears twice — once in the recording card and once in the upload card. Both control the same state, but a user might not realize they're linked. Toggling one silently changes the other. | UX clarity |
| **P2** | No loading skeleton or disabled state for the page while a previous upload is processing. The `toast.promise` handles feedback, but the UI doesn't prevent starting a second upload. | Loading states |
| **P2** | `LanguagePicker` `<select>` has no `aria-label` — only wrapped in a `<label>` with text "Transcription language:". Association works via wrapping, but explicit `htmlFor`/`id` is more robust. | Accessibility |

**Color contrast:** `text-emerald-400` for mic icon, `text-red-400` for stop — good on dark. ✓  
**Font scale:** `text-3xl font-semibold` h1, `text-lg font-medium` h2 — consistent. ✓  
**Empty state:** N/A — recording UI is always present.  
**Error states:** `toast.error` for mic access, file size, and processing failures. ✓  
**Mobile:** `grid-cols-1 xl:grid-cols-[1.2fr_0.8fr]` — collapses to single column. ✓  
**Upgrade dead-ends:** No paywall visible — appears to be available to all users.

---

### 8. `src/app/dashboard/page.tsx` — Analytics (PR #131 redesign)

Full analytics dashboard with AI chat, stat cards, signals, sentiment, speaker leaderboard, recent calls.

| Severity | Issue | Criterion |
|---|---|---|
| **P0** | Recent calls link to `href="/calls/${call.id}"` — missing `/app` prefix. Clicking from Analytics hits a 404 or wrong route. (X4) | Broken links |
| **P0** | Uses `Nav` (top nav) instead of `AppSidebar`. Users navigating between `/app` (sidebar) and `/dashboard` (top nav) experience a jarring chrome switch. (X1) | Navigation |
| **P1** | Design tokens: `linear-surface`, `linear-secondary`, `linear-indigo`, `doppel-inner-dark` — different from `/app/*` routes' `doppel-outer`/`doppel-inner`/`text-zinc-*`. (X5) | Color contrast |
| **P1** | `px-6 py-12` padding — different from app layout's `p-8`. Creates different content widths and vertical rhythm. (X7) | Spacing rhythm |
| **P1** | `text-3xl font-medium tracking-tight` h1 — different font weight from `/app/*` routes' `font-semibold`. (X6) | Font scale |
| **P2** | Loading state: custom Brain spinner — yet another loading pattern not used anywhere else. (X9) | Loading states |
| **P2** | `text-white/40`, `text-white/50` opacity-based text colors — different from `/app/*` routes' `text-zinc-400/500`. Visually similar but adds to the "two design systems" problem. | Color contrast |
| **P2** | AI Chat: no loading skeleton for results. Shows `chatResult` or nothing — no intermediate state between "asking" and "answered" beyond the send button spinner. | Loading states |
| **P2** | Scope toggle (Personal/Team) buttons have no `aria-label` — screen readers announce "Personal" / "Team" with no context that these are scope filters. | Accessibility |

**Color contrast:** `text-white` on `bg-linear-black` — good. `text-white/40` is ~4.5:1 on black — borderline.  
**Empty state:** "No calls yet" banner with CTA to upload. ✓  
**Error state:** Full error card with "Try again" button and "Go to dashboard" link. ✓✓ — best error recovery in the app.  
**Mobile:** `grid-cols-1 lg:grid-cols-3` — collapses. `flex-wrap` on header. ✓  
**Upgrade dead-ends:** No paywall on this page. ✓

**Note on PR #131:** The redesign introduced the `linear-*` token system, `Nav`-based chrome, and the AI Meeting Assistant widget. The `linear-*` tokens and `Nav` create a visual split from the `/app/*` routes. The broken call links (`/calls/${id}` instead of `/app/calls/${id}`) are a regression introduced by the redesign.

---

### 9. `src/app/billing/page.tsx` — Billing & Plan

Plan cards, usage display, cancellation, plan comparison table.

| Severity | Issue | Criterion |
|---|---|---|
| **P0** | If Paddle fails to initialize (`NEXT_PUBLIC_PADDLE_CLIENT_KEY` missing, network issue, ad blocker), upgrade buttons stay `disabled` forever with `Loader2` spinner. No error message, no fallback link to `/pricing`. The user is stuck on a page they can't act on. | Upgrade dead-ends |
| **P1** | Uses `Nav` instead of `AppSidebar`. (X1) | Navigation |
| **P1** | Billing data fetch: `.catch((err) => console.error("Failed to fetch billing data:", err))` — error is silently logged. User sees stale/empty data with no indication the fetch failed. | Error states |
| **P2** | No page-level loading skeleton. Paddle init and billing fetch race — the page renders immediately with default values ("Free" plan, 0/5 uploads) before data arrives. | Loading states |
| **P2** | `text-3xl font-medium tracking-tight` h1 — consistent with `/dashboard` but different from `/app/*`. (X6) | Font scale |
| **P2** | Plan comparison table: `overflow-x-auto` handles mobile, but table text is `text-xs` — may be hard to read on small screens. | Mobile breakpoints |

**Color contrast:** Dark theme. `text-linear-indigo` for accent. `text-white/40` for metadata. ✓  
**Empty state:** N/A — plans always render.  
**Mobile:** `grid-cols-1 md:grid-cols-3` for plan cards. ✓  
**Accessibility:** Cancel button has two-step confirmation. ✓  
**Upgrade dead-ends:** The Paddle failure scenario is a dead-end. The `UpgradePrompt` component (used on other pages) has a `/pricing` fallback, but the billing page itself does not.

---

### 10. `src/app/settings/page.tsx` — Settings

Tabbed settings: General (calendar, integrations, GDPR), CRM Env Vars, Team branding, API Keys.

| Severity | Issue | Criterion |
|---|---|---|
| **P1** | Tab buttons lack `role="tab"`, `aria-selected`, and the tab panels lack `role="tabpanel"`. Screen readers cannot announce this as a tabbed interface. (X10) | Accessibility |
| **P1** | Uses `Nav` instead of `AppSidebar`. (X1) | Navigation |
| **P2** | No page-level loading state. Settings data (calendar connected, credential status) loads async but the page renders immediately with default "not connected" state — may flash incorrect status. | Loading states |
| **P2** | `text-3xl font-medium tracking-tight` h1 — consistent with `/dashboard`/`/billing` but different from `/app/*`. (X6) | Font scale |
| **P2** | Calendar "Connected" state is initialized to `false` and never fetched from the server — the `calendarConnected` state is always `false` unless set by an action that doesn't exist in this component. The "Connect Google Calendar" button always shows. | Error states |

**Color contrast:** Dark theme consistent. `text-amber-400` for "Not set" warnings. ✓  
**Empty state:** N/A — settings always have content.  
**Mobile:** `grid-cols-1 md:grid-cols-2` for integration cards. Tab buttons in a row may overflow on very narrow screens — no `flex-wrap`. P1 borderline.  
**Accessibility:** GDPR export/delete has two-step confirmation. ✓  
**Upgrade dead-ends:** CRM env var panel links to `/integrations` and Vercel dashboard. ✓

---

### 11. `src/app/team/page.tsx` — Team

Team member management with invite, remove, shared calls list.

| Severity | Issue | Criterion |
|---|---|---|
| **P1** | Uses `Nav` instead of `AppSidebar`. (X1) | Navigation |
| **P2** | Invite button uses `document.querySelector<HTMLInputElement>('input[placeholder="colleague@company.com"]')` to scroll/focus — fragile DOM query. If the placeholder changes, this breaks silently. | Code quality |
| **P2** | Remove member button has no `aria-label` — screen readers announce an unlabelled X icon. | Accessibility |
| **P2** | Invite `<input>` has no `<label>` — only `placeholder="colleague@company.com"`. Placeholder is not a label. | Accessibility |
| **P2** | No plan-gating visible. The Team feature is listed as "Business" plan only in the billing comparison table, but the `/team` page is accessible to all signed-in users with no upgrade prompt. | Upgrade dead-ends |

**Color contrast:** Dark theme. `text-linear-indigo` for accents. `text-white/40` for metadata. ✓  
**Font scale:** `text-3xl font-medium tracking-tight` h1 — consistent with `/dashboard`/`/billing`. ✓  
**Empty state:** "No teammates yet" with invite CTA. ✓✓  
**Loading:** `Loader2` spinner. ✓  
**Error states:** Inline error banner + 401 redirect to `/sign-in`. ✓  
**Mobile:** `grid-cols-1 md:grid-cols-4` for summary cards — collapses. ✓

---

### 12. `src/app/integrations/page.tsx` — Integrations

Integration grid with OAuth callback handling.

| Severity | Issue | Criterion |
|---|---|---|
| **P0** | **Light theme on a gated page.** `bg-white text-gray-900` — every other gated page uses dark theme. A user navigating from `/app` (dark) to `/integrations` (light) experiences a full theme flash. (X2) | Color contrast |
| **P1** | Uses `Nav` instead of `AppSidebar`. (X1) | Navigation |
| **P1** | No upgrade path for Business+ features. REST API, Webhooks, and SSO/SAML cards show "Business+" or "Enterprise" badges but have no upgrade button or link to `/billing`. Free/Pro users hit a dead-end. | Upgrade dead-ends |
| **P2** | CTA at bottom links to `/sign-up` — but the user is already signed in (this is a gated page). Should link to `/billing` or `/app`. | Upgrade dead-ends |
| **P2** | `doppel-outer`/`doppel-inner` classes used on light background — these tokens were designed for dark theme. Visual result may be inconsistent. | Color contrast |
| **P2** | OAuth callback handling is comprehensive but the `useEffect` dependency array is very large (`[router, code, providerParam, searchParams, stateParam, slackConnected, teamsConnected, errorParam]`) — potential for double-firing in React 18 strict mode. | Code quality |

**Color contrast:** `text-gray-500` on `bg-white` — good for light theme. But inconsistent with product.  
**Font scale:** `text-[clamp(2rem,5vw,4.5rem)]` h1 — fluid type, different from all other gated pages.  
**Empty state:** N/A — providers always shown.  
**Loading:** `Suspense` fallback with spinner. ✓  
**Error states:** `toast.error` for OAuth failures. ✓  
**Mobile:** `grid-cols-1 md:grid-cols-2 lg:grid-cols-3` — collapses. ✓  
**Accessibility:** Buttons have `disabled` states with `title` attributes for unconfigured providers. ✓

---

### 13. `src/components/app-sidebar.tsx` — App Sidebar

Left navigation for `/app/*` routes.

| Severity | Issue | Criterion |
|---|---|---|
| **P0** | Fixed `w-64` with no responsive behavior. No mobile hamburger, no drawer, no collapse. On mobile, 256px sidebar on a 375px screen. (X3) | Mobile breakpoints |
| **P1** | Sidebar links mix `/app/*` routes and root routes: `/app`, `/app/calls`, `/app/record`, `/app/live`, `/app/intelligence` → then jumps to `/team`, `/dashboard`, `/integrations`, `/settings`. Clicking "Team" or "Analytics" navigates away from the sidebar layout to a `Nav`-based page — jarring context switch. (X1) | Navigation |
| **P1** | Logo links to `/` (public marketing homepage) instead of `/app` (dashboard). Clicking the logo in a gated app should not send the user to the marketing site. | Navigation |
| **P2** | No trial status indicator. The layout fetches trial data for the `TrialBanner` but the sidebar shows no badge or countdown. | Upgrade dead-ends |
| **P2** | No tooltips on nav items — labels are always visible which is fine at `w-64`, but if a collapse mode were added, icons alone would be ambiguous. | Accessibility |

**Color contrast:** `text-white/40` for inactive items on `bg-linear-surface` — ~4.5:1, borderline AA. `text-white` for active — good. ✓  
**Accessibility:** `aria-current="page"` on active link. ✓✓  
**Semantic HTML:** Uses `<nav>`, `<aside>`, `<button>` for sign-out. ✓

---

### 14. `src/components/upgrade-prompt.tsx` — Upgrade Prompt

Reusable upgrade modal and minimal banner.

| Severity | Issue | Criterion |
|---|---|---|
| **P2** | Full modal: `div` with `onClick={() => plan.features[feature] && openCheckout(tier)}` — clickable div instead of a button. Keyboard inaccessible. The inner `<button>` exists but the outer div is also clickable. | Accessibility |
| **P2** | Full modal close button (`<button onClick={onClose}>`) has no `aria-label` — only contains an `<X>` icon. Screen readers announce "button" with no context. | Accessibility |

**Color contrast:** `text-white/50` on `bg-linear-surface` — good. `text-yellow-400` on `bg-yellow-500/5` for minimal banner — good. ✓  
**Upgrade dead-ends:** Has Paddle fallback to `/pricing` when `paddleError` is true. ✓✓ — this is the pattern that `/billing` should adopt.  
**Loading:** `Loader2` spinner on upgrade buttons. ✓  
**Error:** `paddleError` state shows "Payment system unavailable" message. ✓

---

## Recommendations (Prioritized)

### Immediate (P0)
1. **Fix broken call links in `/dashboard`** — change `/calls/${id}` to `/app/calls/${id}`.
2. **Unify navigation** — decide on sidebar OR top nav for all gated pages. The `/app/*` sidebar approach is more app-like; the `Nav` approach is more marketing-like. Pick one.
3. **Make `/integrations` dark theme** — change `bg-white text-gray-900` to `bg-linear-black text-white` to match all other gated pages.
4. **Add mobile sidebar collapse** — hamburger toggle or drawer pattern for screens < `lg`.
5. **Add Paddle fallback on `/billing`** — if Paddle fails to init, show a "See pricing" link to `/pricing` instead of permanently disabled buttons.

### Short-term (P1)
6. **Unify design tokens** — pick `doppel-*` or `linear-*` and use consistently.
7. **Unify h1 font weight** — pick `font-semibold` or `font-medium tracking-tight` and use everywhere.
8. **Add h1 to call detail page** — currently has no page title.
9. **Add retry + back link to call detail error state.**
10. **Add ARIA tab roles to settings tabs.**
11. **Fix low-contrast status colors on `/app/live`** — replace `text-red-600`/`text-amber-700` with `text-red-400`/`text-amber-400`.
12. **Add upgrade path for Business+/Enterprise features on `/integrations`.**
13. **Fix `/integrations` CTA** — link to `/billing` instead of `/sign-up` (user is already signed in).
14. **Fix sidebar logo link** — change from `/` to `/app`.

### Medium-term (P2)
15. **Add skeleton loaders** — replace text/spinner loading states with skeleton cards matching the final layout.
16. **Unify spacing rhythm** — standardize on `space-y-6` or `space-y-8` across all pages.
17. **Add aria-labels** to icon-only buttons (filter, remove member, close modal, scope toggles).
18. **Add explicit labels** to form inputs that rely on placeholders (invite email, comment textarea, assignee select).
19. **Fix `calendarConnected` in settings** — either fetch the real connection status or remove the "Connected" UI path.
20. **Add trial status badge to sidebar.**
21. **Consolidate `removeFillers` checkbox** in record page — show it once, not twice.
22. **Replace `document.querySelector` hack in team page** with a `ref` or `id`-based approach.

---

*End of audit.*
