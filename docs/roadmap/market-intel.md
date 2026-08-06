# Gauge — Market Intel & Competitive Research

> Generated via Agent Reach (v1.5.0) — Exa semantic search, Jina Reader, yt-dlp subtitles, RSS.
> Date: 2026-08-03 | Scope: what people *actually say* about AI call-notetaker / conversation-intelligence tools, circumstantial cases, and what Gauge must be prepared for.

---

## 1. TL;DR — What the market is telling us

1. **The category is "what happens AFTER the transcript"** — every review says transcription is table stakes now. Winners win on CRM sync, action items, and follow-through. (Salesdorado, Oats feature request, Circleback comparison)
2. **Free tiers are the battleground.** Fathom's unlimited-recording free plan is repeatedly cited as the reason people choose it. Reddit: *"Fathom is the only answer here. Free + video + transcripts + no cap."*
3. **Accuracy with technical jargon is the #1 user complaint** — acronyms, product names, industry terms get mangled. Fireflies users report spending ~1 hr/day fixing transcripts. This is an open wedge.
4. **Gong is hated for its pricing model** — opaque pricing, platform fees, forced add-on bundling, 25–56% effective price increases. Every "alternative" pitch attacks this.
5. **Privacy/consent is now a legal risk, not a feature** — the Otter.ai class action (Aug 2025) changed the game. Buyers (IT/procurement) now run 20-point security checklists.
6. **BYOK / free-LLM cost reduction is a hot, validated approach** — freelm, FreeLLMAPI, OpenRouter free tiers all exist and have traction. Gauge's BYOK plan is aligned with where the market is going.

---

## 2. Competitor landscape — what people actually say

### Fathom (the benchmark)
Source: Salesdorado full review (2026-03), Reddit r/sales, r/buhaydigital

**What reviewers say (positive):**
- "The best AI notetaker on the market for B2B sales teams" — 4.5/5 overall
- Unlimited recordings/transcriptions on **free plan** — the most-praised differentiator
- Native bidirectional HubSpot/Salesforce sync with custom field mapping — "best-in-class"
- Summary ready in **30 seconds** after call ends
- Clickable transcript (every sentence → exact moment in recording)
- Runs in desktop Zoom/Teams apps, not just browser
- "Ask Fathom" — natural-language Q&A over all your calls; search competitor mentions across the call library

**What reviewers say (negative / gaps for us):**
- ❌ **No file import** — Fathom only transcribes live meetings; pre-existing recordings require another tool
- ❌ No mobile app
- ❌ "Visible bot" on free plan (a Join-Meeting-Bot badge)
- 90–95% accuracy, degrades with strong accents / noisy environments
- Summary "may lack nuance in complex meetings or highly implicit exchanges"
- Free plan caps at **5 AI summaries/month** (transcription unlimited, summaries limited)

**Pricing:** Free / Premium $16/user/mo / Team $15/user/mo (min 2) / $25 Business w/ CRM

### Gong (the enterprise incumbent)
Source: Revenue.io cost analysis (2026-07), TechnologyInSales, G2 reviewer patterns

**The cost story (this is Gauge's ammo):**
- Foundations tier: $1,300–$1,600/user/**year** PLUS platform fee $5,000–$15,000+/yr PLUS onboarding $2,000–$10,000+
- Effective first-year cost for 50-seat deployment: **~$2,380/user/yr**
- March 2025 restructure unbundled Forecast/Engage/Enable Essentials/Data Cloud into paid add-ons → effective cost rose **25–56%** since 2023
- "Renewal escalation is built in" — 5–8% annual increases baked into contracts
- Charges for provisioned (inactive) seats
- Still needs separate dialer (Aircall/Dialpad) + engagement platform (Outreach/Salesloft $120–$220/user/mo) → total stack often $400+/user/mo
- G2: 4.8/5 across 6,500+ reviews, but **cost is the single most common complaint in negative reviews**: "expensive for small teams," "hard to justify at renewal," forced bundling, aggressive add-on pushes at renewal

### Fireflies.ai (the volume player)
Source: Stackinsight community threads (2026-07)

**The complaint pattern (direct user quotes):**
- *"Saved maybe 2 hours a week, but spent 1 hour fixing transcripts"* — net benefit question is real
- **Technical jargon accuracy cliff**: "PostgreSQL" → "post guest SQL", "ETL pipeline" → "E T L pipe line", "IaC" → "I see", "SLO" → "slow"
- Custom vocabulary/glossary exists but users call it "a thin veneer" — marginal improvement
- Butchered terms make **search useless** — you scrub audio anyway, defeating the purpose
- *"Great for English but terrible for accents"*
- Summary useless for vendor calls / complex project reviews → users re-listen anyway

### tl;dv / Avoma / Circleback (the challengers)
Source: The Automations Guide comparison (2026-07)

- **tl;dv**: wins for distributed teams needing searchable multi-meeting intelligence
- **Circleback**: lightweight action-item extraction without bot overhead — "push clean action items to wherever your team already works"
- **Avoma**: positioning = "full conversation intelligence stack without the Gong price tag"; publishes the 20-point security checklist (they win enterprise deals on security posture)
- Category consensus: "The category name flattens real differences in philosophy" — Fathom=CRM accuracy, tl;dv=search/intelligence, Circleback=action items, Avoma=compliance

### Rafiki (startup-priced Gong-alternative)
Source: getrafiki.ai (own site)

- $19/seat/mo, no seat minimums, no annual lock-in — explicitly attacks Gong's "$100+/seat with large minimums"
- Positions against: Gong, Chorus, Clari Copilot, Fireflies, Avoma
- Full conversation intelligence: objections, competitor mentions, deal signals, coaching scorecards, methodology scoring

### The "free native" competitors (context, not direct)
- Zoom AI Companion, Google Meet + Gemini notes — cited on Reddit as "zero-friction" defaults that don't change workflow; people mention them as the reason they *don't* pay for a notetaker

---

## 3. Circumstantial cases — things Gauge must be prepared for

### 3.1 The Otter.ai class action (consent/training)
- Aug 2025: federal class action — recorded conversations **without consent** + used recordings to **train AI models**. Plaintiff wasn't even an account holder.
- Claims under federal wiretap law, CFAA, California Invasion of Privacy Act. Consolidated in CA federal court.
- **Implication for Gauge:** recording consent must be explicit, configurable, and auditable. Org-level exclusions by title keywords (HR/legal/board), participant-domain exclusions, verbal recording announcement when the bot joins.

### 3.2 The 20-point enterprise security checklist (Avoma's list — buyers use this)
1. Encryption at rest + in transit
2. **SOC 2 Type II** (sustained, not a snapshot)
3. GDPR compliance + DPA (data processor under Art. 28)
4. HIPAA BAA (if healthcare) / CCPA / FINRA support
5. **Contractual guarantee data is NEVER used for AI training**
6. Role-based access + granular RBAC (admin ≠ universal access)
7. Configurable data retention (GDPR storage limitation)
8. SSO via SAML 2.0
9. Sub-processor transparency + third-party AI provider restrictions
10. Data residency control
11. Data portability + deletion confirmation on offboarding
12. Meeting-type exclusion (HR, legal, board, attorney-client)
13. Consent mechanisms for ALL participants, not just account holder
14. Red flags buyers are trained to catch: *"We use your data to improve our AI models"*, *"Admins can see all meetings"*, *"We don't offer data deletion"* → **walk away**

### 3.3 Why call-recording tools fail (Sandler's top-10 adoption killers)
1. Purchased as "insurance," not strategy → shelfware
2. Reps don't understand why it exists → skepticism, resistance
3. Managers aren't trained to coach with it → passive archive
4. **Platform creates more work instead of less** → adoption drops
5. Insights interesting but not actionable → no behavior change
6. Leadership doesn't model the behavior → QBRs don't reference call data
7. **Used for surveillance, not enablement** → "gotcha" culture kills adoption
8. No link to revenue outcomes (win rate, velocity, onboarding)
9. (contextual) No framework for what "good" looks like
10. Technology without intent doesn't drive behavior change

### 3.4 Rep-level objections we'll hear (from the above + user threads)
- "I don't want my calls recorded / monitored" (surveillance fear)
- "It's another vendor contract for marginal gain" (Fireflies net-benefit complaint)
- "The summary is useless for technical calls" (jargon failure)
- "I still re-listen to sections anyway" (trust deficit)
- "It doesn't understand OUR vocabulary" (custom glossary skepticism)
- "My CRM already does notes" (native-tool competition)
- "Free plan caps kill me mid-month" (Fathom 5-summary limit, Otter 300 min)
- "I can't import my existing recordings" (Fathom's gap — Gauge opportunity: file import is in the repo)
- "How do I know my transcripts are accurate enough to trust?" (accent/jargon)

### 3.5 Legal/compliance edge cases
- Two-party consent states (CA, IL) + most EU member states → consent notification is mandatory
- EU/UK data → GDPR data-processor obligations, DPA required, data residency matters
- Bots joining customer calls without announcement → wiretap exposure (Otter precedent)
- Card numbers/PII in transcripts → PII redaction should be configurable per call (Gladia pattern)
- Healthcare → HIPAA BAA is a hard legal requirement, "no fix-it-later option"

---

## 4. LLM-cost research (for Gauge's cost-reduction work)

### Free-tier landscape (verified 2026-06/07 numbers)
| Provider | Free tier | Notes |
|---|---|---|
| **Groq** | 30 RPM, 14,400 req/day | Very fast; **Whisper Large v3** free (2,000 req/day) — Gauge already wired for transcription |
| **Google AI Studio** | 250k tokens/min, 500 req/day (Flash-Lite) | Gemini 3 Flash: 20 req/day; strong JSON |
| **OpenRouter** | ~50 req/day (free models), ~1,000/day with $10 lifetime top-up | `:free` model pool |
| **Cerebras** | ~30 RPM, **1M tokens/day** free (8K context) | gpt-oss-120b |
| **Mistral** | 2 RPM, 500K TPM, ~1B tokens/month | Experiment tier, opts into data training |
| **NVIDIA NIM** | 40 RPM | Phone verification; context-window limited |
| **HuggingFace** | $0.10/month credits | Models <10GB mostly |
| **Cloudflare Workers AI** | 10,000 neurons/day | Llama 3.3 70B, gpt-oss-120b available |
| **Scaleway** | 1M tokens + **60 min audio transcription** | Whisper Large v3 |
| **Vercel AI Gateway** | $5/month | Free tier covers subset of catalog |

### Aggregation pattern (validated by two OSS projects)
- **freelm** (GitHub): pools OpenRouter + Gemini + NIM + Groq + Cerebras + Mistral behind one OpenAI-compatible API with automatic key rotation, cross-provider failover, circuit breaking, quota-aware routing
- **FreeLLMAPI**: same idea, 29 providers, ~4B tokens/month, signed catalog updates, encrypted key storage
- **Both are drop-in OpenAI-compatible** — exactly Gauge's `createOpenAIClient({ baseURL })` seam

### What this means for Gauge
- BYOK + free-tier fallback is a validated, competitive feature (not a hack)
- Transcription cost can go to ~$0 via Groq Whisper free tier (already implemented) — the differentiator is post-transcription quality
- **Caveat:** most free tiers train on data → for a sales-transcript product with enterprise ambitions, free tiers are for *personal/dev* use, not customer data. BYOK where customer controls the provider = clean answer.

---

## 5. Content sourcing — RSS feeds for marketing/GTM monitoring

Verified working feeds (feedparser, all returning current entries):

| Source | Feed | Status |
|---|---|---|
| Lenny's Newsletter | `https://www.lennysnewsletter.com/feed` | ✅ 20 entries |
| SaaStr | `https://saastr.com/feed/` | ✅ 10 entries |
| a16z | `https://a16z.com/feed/` | ⚠️ 0 entries (may need different path — check) |

Useful recent SaaStr headlines (context for messaging):
- "The AI Board Member: Should Yours 'Chair' the Next Meeting?"
- "The #1 Most Important Thing to Understand About AI SDRs: They Can't Figure It Out For You"

### Sales-call coaching YouTube intel (yt-dlp subtitles)
Video: **"How To Run A Discovery Call - Strategy Session"** — Patrick Dang (179k views, ~12 min)
Key extractable insight for Gauge's coaching feature (from subtitles):
> Sales is a scientific process. The average rep goes into a meeting, asks some questions, pitches, hopes the prospect buys — "this typically doesn't work because it's very unpredictable." A predictable, step-by-step discovery framework exists; reps who learn it close more regardless of natural talent.

→ This is exactly the coaching/scorecard wedge: Gauge's BANT/MEDDIC scoring already encodes this "scientific process" idea.

---

## 6. Product recommendations for Gauge (synthesis)

**Positioning (what the market is screaming for):**
1. **"The action-item layer, not just notes"** — review step for extracted action items, owner+due dates, link-back to transcript moment, export to task tools. Oats' most-upvoted feature request; Circleback's wedge; Super Intern's contact-linked architecture.
2. **Jargon-proof transcription** — Gauge already uses Groq Whisper; add custom vocabulary/glossary per team (user-editable) — Fireflies' #1 complaint is our opportunity.
3. **CRM-sync is the moat** — Fathom wins on it; Gauge already has HubSpot/Salesforce integrations in repo. Emphasize "30-second summaries + automatic CRM update."
4. **File import** — Fathom famously lacks it; Gauge's pipeline is built for uploaded files already. Marketing line: "Bring your existing recordings."
5. **Startup pricing vs Gong** — no platform fees, no seat minimums, no forced bundles. Gong's 25–56% price increases are free marketing for us.

**Features to prepare for enterprise deals (checklist readiness):**
- SOC 2 Type II, DPA, no-training-on-customer-data contractual clause
- Recording consent announcements + org-level exclusions (HR/legal/board)
- Granular RBAC; data retention controls; export + deletion API (GDPR export is already in repo)
- SSO/SAML (Clerk Enterprise — noted as external-blocked in CLAUDE.md)

**GTM risk radar (circumstantial, monitor quarterly):**
- Otter-style consent lawsuits → keep consent UX ahead of regulation
- Native Zoom/Meet/Gemini notes improving → position on depth (BANT/MEDDIC scoring, coaching), not just transcription
- Free-tier fatigue → BYOK feature lets power users bring their own keys; differentiates from cap-based free plans

---

## 7. Sources

- Salesdorado — Fathom full review (2026-03): salesdorado.com/en/revenue-operations/review-fathom/
- Revenue.io — Gong cost analysis (2026-07): revenue.io/blog/what-does-gong-actually-cost
- TechnologyInSales — Gong Review 2026: technologyinsales.com/tools/gong
- Stackinsight community — Fireflies threads (2026-07): communities.stackinsight.net (2 threads)
- The Automations Guide — Circleback vs Fathom vs tl;dv (2026-07-15): theautomationsguide.com
- Avoma — AI notetaker security & privacy checklist (2026-03): avoma.com/blog/ai-notetaker-security-features
- Gladia — GDPR compliance for meeting transcription (2026-05): gladia.io/blog/data-privacy-compliance-meeting-notes
- Sandler — 10 Reasons Call Recording Software Fails: go.sandler.com
- Rafiki — getrafiki.ai/solutions/startup-founders + /why-rafiki
- Reddit — r/sales "Note taker apps" thread (via Exa index; direct fetch 403-blocked as documented); r/buhaydigital "Best AI Meeting Notetaker"
- GitHub — ariso-ai/oats issue #148 (action-item workflow feature request)
- ClickUp Canny — AI notetaker→tasks feature requests
- GitHub — shihabshahrier/freelm (free-tier LLM gateway)
- GitHub — Panniantong/Agent-Reach (this research tool), tashfeenahmed/freellmapi (from earlier research)
- YouTube — Patrick Dang, "How To Run A Discovery Call" (subtitles via yt-dlp)

---

*Research method: Agent Reach v1.5.0 (Exa semantic search ×8 queries, Jina Reader ×1, yt-dlp subtitle extraction ×1, feedparser RSS ×3 feeds). Reddit direct fetch confirmed 403-blocked (documented limitation); Reddit content captured via Exa index instead.*
