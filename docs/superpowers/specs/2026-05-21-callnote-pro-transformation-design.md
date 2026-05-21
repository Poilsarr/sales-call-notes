# CallNote Pro — Best-in-Class Transformation Design Spec

**Date:** 2026-05-21
**Status:** Approved for Implementation
**Author:** Vanguard_UI_Architect + AI Analysis Team

---

## Overview

Transform CallNote Pro from a functional but generic sales call analysis tool into a best-in-class product that rivals Otter.ai in transcription accuracy, summary depth, and UI polish.

**Three pillars:**
1. **Transcription Pipeline** — Audio preprocessing, multi-model strategy, speaker diarization, post-processing correction
2. **Analysis Engine** — Unified analysis service, domain-specific prompts, rich structured output, interactive chat
3. **UI/UX** — Professional page architecture, premium design system, Otter.ai-rivaling call detail page

---

## 1. Transcription Pipeline

### 1.1 Audio Preprocessing

**Service:** `src/services/ai/audio-preprocessing.ts`

**Responsibilities:**
- Noise reduction via FFmpeg filters (high-pass 80Hz, low-pass 8kHz, noise gate)
- Loudness normalization to -16 LUFS (broadcast standard)
- Format conversion to 16kHz mono WAV (optimal for Whisper)
- Duration-based model selection logic
- Returns: `{ buffer: Buffer, format: string, duration: number, sampleRate: number }`

**Implementation:**
- Use `fluent-ffmpeg` package for audio processing
- All processing happens in-memory (no temp files)
- Processing time target: <3 seconds for 10-minute audio

### 1.2 Multi-Model Transcription

**Service:** `src/services/ai/transcription-v2.ts`

**Model Strategy:**
- **Primary:** OpenAI `whisper-1` with `response_format: "verbose_json"` + `word_timestamps: true`
- **Secondary:** Groq `whisper-large-v3` (fallback on OpenAI failure)
- **Tertiary:** AssemblyAI API (fallback if both fail — requires `ASSEMBLYAI_API_KEY`)

**Custom Prompt:**
```
This is a sales enrollment call. A representative is enrolling a customer in an energy or insurance plan. Pay special attention to: customer names, addresses, account numbers, utility company names, plan names, rates/prices, phone numbers, email addresses, dates. Spell out numbers clearly.
```

**Output:** `TranscriptionResult` with `text`, `segments` (with speaker labels), `wordTimestamps`, `language`, `duration`, `confidence`

### 1.3 Speaker Diarization

**Approach:** Use AssemblyAI's built-in diarization (most accurate for sales calls) or fallback to silence-gap-based detection.

**Service:** Extend `src/services/ai/diarization.ts`

**Output:** `SpeakerSegment[]` with `{ speaker: "Speaker A"|"Speaker B", start: number, end: number, text: string }`

### 1.4 Post-Processing Correction

**Service:** `src/services/ai/post-processing.ts`

**Responsibilities:**
- LLM-based entity correction: Extract names, addresses, numbers, companies → verify patterns → correct errors
- Regex validation: Phone numbers (US format), zip codes (5-digit), account numbers (alphanumeric), emails
- Confidence scoring per segment (0-1 confidence)
- Returns: `{ correctedText: string, corrections: Correction[], confidence: number }`

**Correction Types:**
- Name capitalization (janine → Janine)
- Company name normalization (clean sky energy → Clean Sky Energy)
- Number formatting (20 point 99 → $0.2099 or 20.99¢)
- Address standardization

---

## 2. Analysis Engine

### 2.1 Unified Analysis Service

**Service:** `src/services/ai/analysis.ts` (complete rewrite)

**Multi-Pass Architecture:**
1. **Pass 1 — Entity Extraction:** Names, companies, products, prices, dates, commitments
2. **Pass 2 — Sales Methodology:** MEDDIC scoring, BANT scoring, SPIN question detection
3. **Pass 3 — Objection Analysis:** Type classification, severity, resolution status
4. **Pass 4 — Sentiment & Talk Ratio:** Per-segment sentiment, overall talk ratio
5. **Pass 5 — Insight Generation:** Action items, next steps, coaching notes, risk flags

**Models:** `gpt-4o` (primary), `llama-3.3-70b-versatile` (fallback)
**Temperature:** 0.3 (consistent, deterministic output)
**Response Format:** `json_object`

### 2.2 Prompt System

**Location:** `src/lib/prompts/`

**Files:**
- `enrollment-calls.md` — Utility/insurance enrollment calls
- `b2b-sales.md` — Enterprise B2B sales calls
- `discovery-calls.md` — Discovery/qualification calls

**Each prompt includes:**
- System role definition
- Output JSON schema (strict)
- 3-5 annotated examples
- Edge case handling instructions
- Domain-specific terminology

### 2.3 Rich Output Structure

**Type:** `CallAnalysis` (defined in `src/types/index.ts`)

```typescript
interface CallAnalysis {
  executiveSummary: string;
  callType: "enrollment" | "discovery" | "follow-up" | "objection-handling";
  participants: Participant[];
  keyEntities: KeyEntities;
  salesScorecard: SalesScorecard;
  objections: Objection[];
  commitments: Commitment[];
  actionItems: ActionItem[];
  nextSteps: NextStep[];
  coachingNotes: CoachingNotes;
  riskFlags: string[];
  closeProbability: number;
  talkRatio: TalkRatio;
  sentimentTimeline: SentimentPoint[];
}
```

### 2.4 Interactive Chat Enhancement

**Route:** `src/app/api/chat/route.ts`

**Enhancements:**
- RAG over call history with vector embeddings (store in Neon PostgreSQL using `pgvector`)
- Pre-built query templates: "What objections?", "Show commitments", "Compare talk ratios"
- Streaming responses with SSE
- Context window: Last 5 calls + current call transcript

---

## 3. UI/UX Transformation

### 3.1 Page Architecture

**Restructure:**
- `/` → Landing page only (marketing, features, pricing, CTA)
- `/app` → Dashboard (overview, stats, recent calls)
- `/app/calls` → Call library (searchable, filterable)
- `/app/calls/[id]` → Call detail (transcript + analysis + chat)
- `/app/record` → Live recording interface
- `/app/analytics` → Deep analytics
- `/app/integrations` → Integration management
- `/app/settings` → Account settings

**Auth:** All `/app/*` routes protected by Clerk middleware

### 3.2 Design System

**Typography:**
- Headings: Geist (variable weight)
- Body: Geist
- Data/Numbers: Geist Mono

**Color Palette:**
- Background: `#09090b` (zinc-950)
- Surface: `#18181b` (zinc-900)
- Surface-hover: `#27272a` (zinc-800)
- Border: `#3f3f46` (zinc-700)
- Accent: `#10b981` (emerald-500)
- Accent-hover: `#059669` (emerald-600)
- Text-primary: `#fafafa` (zinc-50)
- Text-secondary: `#a1a1aa` (zinc-400)
- Text-muted: `#71717a` (zinc-500)
- Danger: `#ef4444` (red-500)
- Warning: `#f59e0b` (amber-500)
- Success: `#22c55e` (green-500)

**Component Patterns:**
- Double-bezel cards: Outer shell (`p-1.5`, `rounded-[2rem]`, `ring-1 ring-white/10`) + Inner core (`rounded-[calc(2rem-0.375rem)]`, `shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)]`)
- Pill buttons: `rounded-full`, `px-6 py-3`, nested icon architecture
- Glassmorphism: `backdrop-blur-2xl`, `bg-black/50`, `border-white/10`
- Section spacing: `py-24` minimum

### 3.3 Call Detail Page (Hero Feature)

**Layout:** Three-panel responsive layout

**Left Panel (40%): Transcript**
- Speaker-labeled segments with timestamps
- Click segment → jump to audio playback position
- Search across transcript (Ctrl+K)
- Highlight key entities (names, prices, commitments)
- Export: PDF, DOCX, TXT, CRM format
- Scroll-synced with audio player

**Center Panel (35%): Analysis**
- Executive summary (collapsible)
- Health score gauge (animated circular progress)
- Action items (with priority badges, assignee, due date)
- Key decisions (bullet list)
- Next steps (timeline view)
- Objection timeline (visual timeline with sentiment indicators)
- Talk ratio visualization (bar chart)
- Sales scorecard (MEDDIC + BANT scores)
- Coaching notes (strengths, improvements, tips)
- One-click Slack sync, CRM sync

**Right Panel (25%): AI Chat**
- Ask questions about the call
- Pre-built query buttons
- Streaming responses
- Context: current call transcript + last 5 calls

**Mobile:** Single-column stack, tabbed navigation (Transcript | Analysis | Chat)

### 3.4 Dashboard Redesign

**Layout:** Bento grid with perpetual micro-animations

**Cards:**
- Total calls today (with sparkline trend)
- Average health score (animated gauge)
- Pending action items (count + list preview)
- Weekly call volume (bar chart)
- Sentiment breakdown (donut chart)
- Recent calls (list with health score badges)
- Quick actions: Record, Upload, Search

**Animations:**
- Staggered card reveal on load
- Live number counting animation
- Sparkline auto-update simulation
- Hover: card lift + glow

### 3.5 Motion & Micro-interactions

**Landing Page:**
- GSAP ScrollTrigger for section reveals
- Particle canvas background (subtle)
- Hero text scramble effect on load
- Smooth scroll navigation

**App:**
- Framer Motion for page transitions (slide + fade)
- Panel slide animations (call detail page)
- Skeleton loaders for all async states
- Toast notifications (sonner)
- Empty states with illustrations and CTAs
- Button press: `scale-[0.98]` tactile feedback
- Hover: subtle lift + shadow

---

## 4. Execution Strategy

**Three parallel workstreams:**

| Workstream | Agent | Scope | Dependencies |
|---|---|---|---|
| A: Transcription | Agent 1 | Audio preprocessing, multi-model, diarization, post-processing | None |
| B: Analysis | Agent 2 | Prompt system, unified analysis, rich output, chat | Depends on A (diarized segments) |
| C: UI/UX | Agent 3 | Page architecture, design system, call detail, dashboard, components | Depends on B (output types) |

**Wave 1:** A + B start simultaneously
**Wave 2:** C starts after B defines output types
**Wave 3:** Integration — wire all three together, end-to-end testing

---

## 5. Technical Decisions

| Decision | Rationale |
|---|---|
| OpenAI Whisper primary | Best accuracy for sales calls, word-level timestamps |
| AssemblyAI fallback | Industry-leading diarization, worth the cost for quality |
| gpt-4o for analysis | Best reasoning for sales methodology extraction |
| Framer Motion for app | Better React integration than GSAP for UI transitions |
| GSAP for landing | Superior scroll-triggered animations |
| pgvector for RAG | Native PostgreSQL, no separate vector DB needed |
| sonner for toasts | Lightweight, accessible, matches design system |

---

## 6. Success Criteria

**Transcription:**
- <5% word error rate on sales calls
- Correct entity extraction (names, addresses, numbers) 95%+
- Speaker diarization accuracy 90%+

**Analysis:**
- Summary captures all key points (verified by human review)
- Action items match actual commitments made in call
- Sales methodology scores align with expert assessment

**UI/UX:**
- Page load <2s (Lighthouse performance score 90+)
- First contentful paint <1s
- No layout shifts (CLS <0.1)
- Mobile responsive (all features accessible on 375px width)
- Accessibility: WCAG 2.1 AA compliant

---

## 7. Risk Mitigation

| Risk | Mitigation |
|---|---|
| AssemblyAI API cost | Cache results, only use as fallback |
| pgvector migration complexity | Use Prisma extension, test locally first |
| UI redesign breaking existing flows | Feature flag new UI, gradual rollout |
| Prompt engineering iterations | A/B test prompts, measure accuracy |
| Performance regression | Lighthouse CI, bundle analysis |
