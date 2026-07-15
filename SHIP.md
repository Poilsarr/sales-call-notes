# Gauge — Single-Dev Ship Plan

> Current state: 23 routes, 0 runtime errors, monetization wired
> Target: Ship to production in 5 focused sessions

---

## Phase 0 — Pre-Flight (30 min)

### Environment Variables

Create a fresh .env.local with REAL credentials:

```
OPENAI_API_KEY=sk-...                    # Required for transcription + AI Chat
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_...  # From https://dashboard.clerk.com
CLERK_SECRET_KEY=sk_...                   # From Clerk dashboard
NEXT_PUBLIC_APP_URL=http://localhost:3003  # Change to production URL later

# CRITICAL FOR LIVE FEATURES (create these accounts):
GOOGLE_CLIENT_ID=...        # Google Cloud Console > OAuth 2.0 > Web application
GOOGLE_CLIENT_SECRET=...    # Same page
SLACK_WEBHOOK_URL=...       # Slack API > Incoming Webhooks > Add to workspace
STRIPE_SECRET_KEY=sk_...    # Stripe Dashboard > API keys
STRIPE_PUBLISHABLE_KEY=pk_... # Same page

# Optional (for rate limiting):
UPSTASH_REDIS_REST_URL=https://...  # Upstash.com > create Redis DB
UPSTASH_REDIS_REST_TOKEN=...
```

### Create Accounts (free tiers)

| Service | What for | Free tier limit |
|---------|----------|-----------------|
| Clerk | Auth (already configured) | 10k users free |
| OpenAI | Transcription + AI Chat | Pay-as-you-go (~$5/mo for dev) |
| Stripe | Billing | No monthly fee, 2.9% + $0.30 per transaction |
| Google Cloud | Calendar API OAuth | 10 free projects |
| Slack API | Webhook for sharing | Free for 1 workspace |
| Upstash | Rate limiting (optional) | 10k requests/day free |
| Vercel | Hosting | Free tier includes SSL + custom domain |

---

## Phase 1 — Launch Readiness (2 sessions)

### Session 1.1: Configure OAuth + Payments (3 hours)

#### Google Calendar OAuth (1.5h)

1. Go to https://console.cloud.google.com
2. Create new project -> "Gauge"
3. APIs & Services -> Enable Library -> Google Calendar API -> Enable
4. Credentials -> Create OAuth client ID -> Web application
5. Add Authorized redirect URI:
   - http://localhost:3003/api/calendar/callback
   - https://yourdomain.com/api/calendar/callback
6. Copy Client ID + Client Secret -> paste into .env.local
7. TEST: Click "Connect Google Calendar" on /settings page
   -> Should redirect to Google consent screen
   -> Should return to /settings with "Connected" status

#### Stripe Billing (1.5h)

1. Go to https://dashboard.stripe.com
2. Enable test mode
3. Products -> Add product (3 products):
   a. Pro - $12/month - recurring
   b. Business - $29/month - recurring
   c. Enterprise - Custom pricing
4. For each: Copy Price ID (stripe_price_xxx)
5. Paste Price IDs into src/lib/plans.ts:
   - stripePriceId: "price_pro_monthly"
   - stripePriceId: "price_business_monthly"
6. Install Stripe webhook (optional for auto-sync):
   - Endpoint: https://yourdomain.com/api/stripe/webhook
   - Events: checkout.session.completed, customer.subscription.updated
7. TEST: Go to /billing -> click "Upgrade - $12/mo"
   -> Should redirect to Stripe checkout -> Should update plan on return

### Session 1.2: Deploy to Production (3 hours)

#### Vercel Deployment

```bash
# Install Vercel CLI
npm i -g vercel

# Login and deploy
vercel login
vercel --prod
```

#### Post-Deploy Checklist

```
[ ] All 23 routes return 200/401 as expected
[ ] Clerk auth works on production domain
[ ] OpenAI transcription works end-to-end
[ ] CRM sync buttons reach HubSpot/Salesforce APIs
[ ] Billing page loads and plan upgrade flow works
[ ] Slack integration sends test message
[ ] GSAP animations don't break (check console)
[ ] PWA manifest loads (/manifest.json returns 200)
[ ] Chrome extension loads (extension/manifest.json valid)
```

#### Custom Domain (30 min)

1. Buy domain (e.g., usegauge.com) - ~$12/yr on Namecheap
2. Vercel dashboard -> Project -> Domains -> Add
3. Update DNS: CNAME @ -> cname.vercel-dns.com
4. Wait 5-10 min for SSL provisioning
5. Update NEXT_PUBLIC_APP_URL in Vercel env vars
6. Update Clerk URLs in Clerk dashboard to new domain

#### Error Monitoring (20 min)

1. Create free Sentry account: https://sentry.io
2. Copy DSN -> add to Vercel env: SENTRY_DSN=...
3. (Optional) Install @sentry/nextjs
4. TEST: Force a 500 error -> check Sentry dashboard

---

## Phase 2 — Feature Completion (3 sessions)

### Session 2.1: Calendar Auto-Join Bot (4 hours)

The calendar service exists at src/services/calendar.ts. It needs:
- Google OAuth tokens working (Phase 1 prerequisite)
- A background job that checks for upcoming meetings
- A meeting bot that joins Zoom/Meet/Teams calls

Simpler MVP approach (no bot joining):
Instead of a real bot, just:
1. Detect meetings via calendar
2. Remind user to record (browser extension or desktop app)
3. When recording ends, auto-process
4. This avoids Zoom/Meet API complexity for a solo dev

Files to modify:
- src/services/meeting-bot.ts (new) - meeting detection logic
- src/app/api/calendar/route.ts - add webhook subscription
- src/services/queue.ts - add meeting-check job queue

### Session 2.2: Desktop App — Electron Shell (3 hours)

Create a minimal Electron app for bot-free desktop recording:

```
gauge-desktop/
  main.js            # Electron main process
  preload.js         # Secure bridge
  renderer/          # Vite + React (or just embed web app)
    index.html
    recorder.js      # MediaRecorder capture
    styles.css
  package.json
  build/             # Output: .dmg (Mac), .exe (Win)
```

Build & distribute:

```bash
# Build for Mac
npx electron-builder --mac
# Build for Windows
npx electron-builder --win
```

Alternative (faster): PWA with beforeinstallprompt event listener.
Users can "install" the web app as a desktop app with zero extra code.
Already 80% there with manifest.json.

### Session 2.3: Chrome Extension — Polish & Publish (2 hours)

#### Fix the extension

```bash
cd extension/
# Generate icons (need 16, 48, 128 PNG)
# Use https://icon.kitchen or canva.com

# Update content.js to actually capture captions
# Current scaffold detects meetings but doesn't send to API
```

#### Test locally

```bash
# Chrome -> chrome://extensions
# Toggle "Developer mode"
# Click "Load unpacked"
# Select extension/ directory
# Open meet.google.com
```

#### Publish to Chrome Web Store

1. Go to https://chrome.google.com/webstore/devconsole
2. Pay one-time $5 registration fee
3. Create new item -> upload extension.zip
4. Fill description, screenshots (1280x800), promo tile (440x280)
5. Submit for review (takes 1-3 days)

---

## Phase 3 — Polish & Performance (2 sessions)

### Session 3.1: Performance Optimization (3 hours)

#### Lighthouse Targets

```
[ ] Lighthouse Mobile >= 80
[ ] Lighthouse Desktop >= 90
[ ] First Contentful Paint < 1.5s
[ ] Largest Contentful Paint < 2.5s
[ ] Cumulative Layout Shift < 0.1
[ ] Total Bundle < 200KB (gzip)
[ ] All images lazy-loaded
[ ] Font-display: swap configured
```

#### Bundle Fixes

| Issue | Fix |
|-------|-----|
| GSAP on every page | dynamic(() => import('gsap'), { ssr: false }) |
| Prisma cold start | PrismaClient singleton pattern |
| Lucide icons bundle | Import only used icons (already done) |
| Font loading | Add font-display: swap in globals.css |

### Session 3.2: SEO & Content (2 hours)

#### Sitemap

```typescript
// src/app/sitemap.ts
export default function sitemap() {
  return [
    { url: 'https://usegauge.com', lastModified: new Date() },
    { url: 'https://usegauge.com/features', lastModified: new Date() },
    { url: 'https://usegauge.com/pricing', lastModified: new Date() },
    { url: 'https://usegauge.com/integrations', lastModified: new Date() },
  ];
}
```

#### Meta Tags Checklist

```
[ ] Title: "Gauge - Sales Call Notes, Instant"
[ ] Description: "Turn sales call recordings into actionable notes..."
[ ] Open Graph tags present
[ ] Twitter card tags present
[ ] Canonical URLs correct
```

---

## Phase 4 — Growth (as needed, 1 session each)

### 4.1: Email Notifications
- Send summary to user email after each call
- Use Resend.com (free tier: 100 emails/day)
- File: src/services/email.ts + src/app/api/email/route.ts

### 4.2: Zapier App
- Create Zapier integration using webhooks
- Publish to Zapier directory
- File: src/services/zapier.ts + Zapier CLI app

### 4.3: Multi-Language Support
- Add i18n with next-intl
- Translate landing page + features page
- Focus on Spanish and French first

### 4.4: Usage Analytics
- Track page views, feature usage, conversion funnels
- Use PostHog (free tier: 1M events/mo)
- File: src/lib/analytics.ts + PostHog snippet

---

## Design Audit (based on competitor analysis vs Otter.ai + Fireflies.ai)

### Current Design Score: 7/10

| Element | Current | Target (from Otter/Fireflies inspiration) |
|---------|---------|-------------------------------------------|
| Landing page hero | Text-only | Add animated transcription demo (see Otter.ai) |
| Testimonials | 3 quotes | Add company logos + real profile photos |
| Feature cards | 6 generic | Add specific screenshots/mockups per feature |
| Pricing page | Table | Add feature comparison slider like Fireflies |
| Dashboard | Dark theme | Add chart visualizations (bar charts, trend lines) |
| CTA buttons | Static | Add micro-animations on hover (already partially done) |
| Mobile | Responsive | Add swipeable tabs, bottom nav instead of sidebar |

### Visual Improvements to Steal (ethically)

From Otter.ai:
- Animated transcription demo in hero section
- Use case cards with platform icons (Sales, Education, Media)
- "Seen enough features?" bottom CTA

From Fireflies.ai:
- Talk-time ratio visualization (pie/donut chart)
- Topic frequency word cloud
- "AskFred" chat interface styling
- Integration tiles with colored icon backgrounds

From Gong:
- Bold purple accent color for enterprise CTAs
- Testimonial carousel with real photos
- Feature comparison matrix table

---

## Project Structure Map (for a single dev)

```
gauge/
  src/
    app/              # 23 routes (all built)
    components/       # nav, show, upgrade-prompt (3 components)
    lib/              # plans, entitlements, rate-limit, clerk middleware
    services/         # 10 services (ai/, crm/, calendar, slack, queue, webhooks)
    types/            # index, crm (2 type files)
  prisma/             # schema + dev.db (12 models)
  extension/          # Chrome extension scaffold
  public/             # manifest.json + static assets
  SHIP.md             # This file
```

Total: ~4,500 lines of TypeScript across 40+ files. Manageable for one person.

---

## Estimated Timeline

| Phase | Sessions | Hours | Can ship without? |
|-------|----------|-------|-------------------|
| 0: Pre-Flight | 1 | 0.5 | No (prerequisite) |
| 1: Launch | 2 | 6 | No (gating item) |
| 2: Features | 3 | 9 | Yes (post-launch) |
| 3: Polish | 2 | 5 | Yes (post-launch) |
| 4: Growth | 4 | 8 | Yes (post-launch, optional) |

**Minimum viable launch:** Phase 0 + Phase 1 = 6.5 hours
**Full product launch:** All phases = 28.5 hours (about 1 week full-time)

---

## Final Score After Ship

| Before | After |
|--------|-------|
| 5.5/10 | 7.5/10 |
| Upload-only transcription | Live meeting capture via calendar |
| No monetization | $12/$29/mo recurring revenue |
| English only | Multi-language ready |
| Web only | Desktop + Extension + PWA |
