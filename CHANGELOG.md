# Changelog

All notable changes to CallNote Pro are recorded here. Format follows
[Keep a Changelog](https://keepachangelog.com/). Versions correspond
to merge points on `main`.

## [Unreleased]

### Security
- **GDPR export download token bypass (CVE-class).** The validator
  accepted any 4-segment token of the form `exp_<ms>_<hash>_<userId>`
  as long as the expiry and userId matched — never verifying the
  hash. A malicious caller who knew a victim userId could mint a
  token and download the victim's full export. Now HMAC-SHA256
  signed with `EXPORT_TOKEN_SECRET`, constant-time verified, fails
  closed. (#97)
- **500 error messages no longer leak internal details.** New
  `src/lib/safe-error.ts` helpers (`safeErrorResponse`,
  `logServerError`, `withSafeError`) standardize the pattern of
  server-side log + generic public message. Applied to
  `/api/analyze` first; 19 other routes remain on the old
  pattern but are auth-gated. (#98)

## [PRs #88-#100] — 2026-06-21 → 2026-06-25

### Added
- **PWA installable.** Service worker + `/offline` fallback. Users
  on Chrome / Safari iOS can install CallNote Pro as a stand-alone
  app. (#95)
- **Chrome Web Store launch prep.** Privacy + terms updated with
  extension data flow. New `/extension` landing page. Google Meet
  status on `/integrations` changed from "Coming Soon" to "Live". (#94)
- **Cross-call search.** `/api/calls` and `/api/history` accept
  `?q=` and search across filename, transcript, and summary.
  UI re-fetches on input with % and _ sanitized. (#96)
- **Transcription language picker.** `/app/record` exposes 13
  languages + auto-detect on both upload and record forms. Whisper
  Large V3 already supported 99 languages; the UI control was the
  missing piece. (#92)
- **Transcript snippet sharing.** Click two segments in
  TranscriptViewer to select a range; click "Copy snippet" to
  copy a formatted quote with timestamps + speakers to clipboard.
  Same UX value as Fireflies's soundbites, without the audio
  persistence dependency. (#93)
- **Zapier end-to-end.** `/integrations/zapier` setup page +
  `WebhookService.trigger()` now fires on every analyzed call.
  WebhookPayload extended with Zapier-friendly fields
  (summary, actionItems, competitors, etc). (#91)
- **Weekly digest cron endpoint.** `/api/cron/weekly-digest` with
  Bearer `CRON_SECRET` auth. (#88)

### Changed
- **Pricing tiers unified.** "Start free" / "Contact sales" copy
  applied to all plan CTAs; monthly/annual toggle with 17% discount;
  6-question FAQ accordion; conversion disclosure. (#77)
- **Footer globalized.** SiteFooter now lives in `layout.tsx`,
  visible on every public page. (#80)
- **SiteFooter upgraded to 5 columns.** Brand + Product + Use
  cases + Resources + Legal + status pill. (#75)
- **Pricing comparison table.** 10 rows on `/features` showing
  CallNote vs Otter vs Fireflies. (#73)
- **Home hero upgraded to 2-col with live product preview card**
  (LIVE SUMMARY, dialog chips, action items, stats row). (#74)
- **Home "wedge" section** now shows a 3-card live alert feed
  (Acme/Gong, Vandelay/Otter, Pinnacle/Fireflies). (#76)
- **Home "How it works" 4-step section + closing CTA banner** added
  before the footer. (#72)
- **Nightly Lighthouse run against production** (cron
  `0 6 * * *`). Catches perf regressions on merged code that the
  PR-time workflow misses. (#82, #88)
- **k6 perf budget refreshed against live prod** (2026-06-24).
  Home p95 = 345ms (target 400ms), demo p95 = 285ms (target
  300ms), /api/calls p95 = 82ms, error rate 0% over 60s × 5 RPS.
  (#88)

### Fixed
- **Dashboard zero-state banner** for users with no calls. New
  sign-up CTA → `/app/record`. (#90)
- **HubSpot/Salesforce "Env Vars" button** now uses the same
  primary orange style as Teams/Slack "Connect" buttons, with
  label "Add credentials". (#83)
- **Webhook TODO closed honestly.** `/api/webhooks/hubspot` no
  longer claims "dispatch to CRM-sync worker" without one — the
  comment now explains the shape mismatch (HubSpot event ≠
  crmSyncQueue input) and points at AuditLog as the durable
  trigger. (#88)
- **`/api/analyze` 500 errors** now return generic message
  instead of leaking `error.message` (which could include DB
  credentials from connection strings). (#98)

### Documentation
- **CLAUDE.md** added as agent-handoff doc covering stack,
  workflow, Vercel stall recovery, hard rules, per-page access,
  external-blocked list, test commands. (#85)
- **DEVELOPMENT_FRONTIER.md refreshed** through PR #80. (#81)
- **Per-level LEVEL_*.md files** now have a status banner mirroring
  the master table. (#89)
- **Top-level README.md** added with stack, layout, dev, testing,
  deploy, security posture. (#99)
- **`robots.txt` + dynamic `sitemap.xml`** (14 public routes). (#87)

### Infrastructure
- **Lighthouse workflow** graceful fallback when Vercel bot is
  silent (uses `https://callnotepro.com`), thresholds tightened to
  90/95/90/95. (#82)
- **SEO scaffolding**: robots.txt, sitemap.xml, signed-in e2e
  smoke test (skipped without Clerk creds). (#87)
- **Webhook trigger wired** into the analyze route — was defined
  but never called. Every analyzed call now fires `call.analyzed`
  to all registered webhooks. (#91)
- **GDPR export worker** uses HMAC-signed tokens (was sha256 of
  payload, which leaked validation semantics). (#97)

---

## Earlier versions

See git log + `docs/roadmap/DEVELOPMENT_FRONTIER.md` for the
pre-#88 history.