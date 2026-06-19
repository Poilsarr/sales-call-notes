# UI/Frontend Reality Audit — sales-call-notes
_Generated: 2026-06-18 from live code, not from marketing markdown._

## TL;DR
The frontend ships three different visual identities that fight each other.
The marketing landing, the in-app shell, and the in-app terminal all look
like they came from three different codebases. The "Engineering Precision"
narrative in `CallNote_Project_Showcase.md` is fictional — `grep` over `src/`
returns zero hits for "Luminance Stacking", "Cmd+K", or "Revenue Graphs".
The product is positioned three different ways at once (upload tool, live
meeting bot, competitive intelligence OS) and the deepest investments in
the codebase contradict the hero copy.

## 13 findings (full detail in chat reply)

1. **Three brands, one app** — Axion orange on marketing, Linear indigo in
   the app shell, raw hex (`#5e6ad2`, `#22d3a8`) in the AppInterface modal.
2. **`CallNote_Project_Showcase.md` is fiction** — claims GSAP, Cmd+K,
   Revenue Graphs, Luminance Stacking. None are in `src/`.
3. **Landing vs spec positioning mismatch** — "No bots" hero + 690-line
   `/app/live` meeting bot page.
4. **Inconsistent navigation** — marketing nav ≠ app sidebar; two
   "dashboards" (`/dashboard` and `/app`) render the same data differently.
5. **Dead / orphan UI** — `AppInterface` is mounted behind a `showApp` flag
   that is never set to `true`; `LiveTranscriptionPanel` exists but the
   `/app/live` page reimplements it inline.
6. **AppInterface is dead code** — 478 lines, dynamically imported, never
   rendered. The "terminal" shown in screenshots doesn't exist in the
   shipped product.
7. **Lying numbers** — `nav.tsx:83` says "Serving 500+ SDR teams" with
   no source. Pricing is $12/$29 on the site vs $9 in the GTM doc.
8. **Extension vs app = no bridge** — the chrome extension captures
   captions to local storage and never posts to the API. The user has to
   re-record from their own mic.
9. **Unreachable pages** — 9 of 18 built routes have no nav link.
10. **Extension UI ≠ web UI** — three different logo treatments, no shared
    brand mark component.
11. **Two dashboards, two pricing surfaces, no consistency** — see table
    in chat reply.
12. **SPEC vs reality** — P0 met, P1 half-met, P2 absent from positioning.
13. **The real root problem** — three different products (A: upload,
    B: live bot, C: competitive intel) wearing the same name.

## Recommended order of work
1. Pick a single positioning (the GTM doc suggests C: competitive intel)
2. Kill or wire `AppInterface` (it's a 478-line ghost)
3. Unify theme to one accent (orange OR indigo)
4. Rewrite the landing in 3 sections, no "Serving 500+ SDR teams" lie
5. Unify nav: one in-app sidebar, one marketing top bar, no orphan pages
6. Update pricing to match the GTM doc OR vice versa
7. Fix or delete the chrome extension
8. Delete or rewrite `CallNote_Project_Showcase.md` as a real changelog
9. Consolidate live transcription (record page + live page + extension)
10. Small fixes: nav copy, dashboard duplication, /team in wrong place
