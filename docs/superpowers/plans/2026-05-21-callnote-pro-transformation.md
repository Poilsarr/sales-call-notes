# CallNote Pro — Best-in-Class Transformation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform CallNote Pro into a best-in-class sales call analysis product with accurate transcription, rich analysis, and premium UI.

**Architecture:** Three parallel workstreams — Transcription Pipeline (A), Analysis Engine (B), UI/UX Transformation (C) — integrated in Wave 3.

**Tech Stack:** Next.js 14, TypeScript, OpenAI Whisper, GPT-4o, AssemblyAI (fallback), Framer Motion, GSAP, Tailwind CSS, Prisma, Neon PostgreSQL, Clerk Auth, Sonner (toasts)

---

## Wave 1: Foundation (Parallel Execution)

### Workstream A: Transcription Pipeline

#### Task A1: Audio Preprocessing Service

**Files:**
- Create: `src/services/ai/audio-preprocessing.ts`
- Modify: `package.json` (add `fluent-ffmpeg`, `@types/fluent-ffmpeg`)

- [ ] **Step 1: Install dependencies**

Run: `npm install fluent-ffmpeg`
Run: `npm install -D @types/fluent-ffmpeg`

- [ ] **Step 2: Create audio preprocessing service**

Create `src/services/ai/audio-preprocessing.ts`:

```typescript
import ffmpeg from 'fluent-ffmpeg';
import { Readable } from 'stream';

export interface AudioInfo {
  buffer: Buffer;
  format: string;
  duration: number;
  sampleRate: number;
  channels: number;
}

export class AudioPreprocessingService {
  async preprocess(audioBuffer: Buffer): Promise<AudioInfo> {
    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];
      
      ffmpeg(Readable.from(audioBuffer))
        .audioFilters([
          'highpass=f=80',
          'lowpass=f=8000',
          'afftdn=nf=-20',
          'loudnorm=I=-16:TP=-1.5:LRA=11'
        ])
        .audioCodec('pcm_s16le')
        .audioFrequency(16000)
        .audioChannels(1)
        .format('wav')
        .on('error', reject)
        .on('end', () => {
          const buffer = Buffer.concat(chunks);
          resolve({
            buffer,
            format: 'wav',
            duration: 0, // Will be calculated from buffer
            sampleRate: 16000,
            channels: 1
          });
        })
        .pipe()
        .on('data', (chunk: Buffer) => chunks.push(chunk));
    });
  }

  selectModel(duration: number): 'whisper-1' | 'whisper-large-v3' {
    return duration < 300 ? 'whisper-1' : 'whisper-large-v3';
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add src/services/ai/audio-preprocessing.ts package.json
git commit -m "feat: add audio preprocessing service with FFmpeg filters"
```

#### Task A2: Multi-Model Transcription Service

**Files:**
- Create: `src/services/ai/transcription-v2.ts`
- Modify: `src/types/index.ts` (add TranscriptionResult type)

- [ ] **Step 1: Add types**

Add to `src/types/index.ts`:

```typescript
export interface WordTimestamp {
  word: string;
  start: number;
  end: number;
  confidence: number;
}

export interface TranscriptionSegment {
  id: number;
  text: string;
  start: number;
  end: number;
  speaker?: string;
  words?: WordTimestamp[];
}

export interface TranscriptionResult {
  text: string;
  segments: TranscriptionSegment[];
  wordTimestamps: WordTimestamp[];
  language: string;
  duration: number;
  confidence: number;
  model: string;
}

export interface Correction {
  original: string;
  corrected: string;
  type: 'name' | 'company' | 'number' | 'address' | 'email';
  confidence: number;
}
```

- [ ] **Step 2: Create transcription service**

Create `src/services/ai/transcription-v2.ts`:

```typescript
import OpenAI from 'openai';
import { TranscriptionResult, TranscriptionSegment, WordTimestamp } from '@/types';

const TRANSCRIPTION_PROMPT = `This is a sales enrollment call. A representative is enrolling a customer in an energy or insurance plan. Pay special attention to: customer names, addresses, account numbers, utility company names, plan names, rates/prices, phone numbers, email addresses, dates. Spell out numbers clearly.`;

export class TranscriptionServiceV2 {
  private openai: OpenAI;
  private groqOpenai: OpenAI;

  constructor() {
    this.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    this.groqOpenai = new OpenAI({
      apiKey: process.env.GROQ_API_KEY,
      baseURL: 'https://api.groq.com/openai/v1'
    });
  }

  async transcribe(audioBuffer: Buffer, model: 'whisper-1' | 'whisper-large-v3' = 'whisper-1'): Promise<TranscriptionResult> {
    const client = model === 'whisper-1' ? this.openai : this.groqOpenai;
    
    try {
      const blob = new Blob([audioBuffer], { type: 'audio/wav' });
      const file = new File([blob], 'audio.wav', { type: 'audio/wav' });
      
      const response = await client.audio.transcriptions.create({
        file,
        model,
        prompt: TRANSCRIPTION_PROMPT,
        response_format: 'verbose_json',
        timestamp_granularities: ['word']
      } as any);

      return this.parseVerboseJson(response);
    } catch (error) {
      if (model === 'whisper-1') {
        return this.transcribe(audioBuffer, 'whisper-large-v3');
      }
      throw error;
    }
  }

  private parseVerboseJson(response: any): TranscriptionResult {
    const words: WordTimestamp[] = (response.words || []).map((w: any) => ({
      word: w.word,
      start: w.start,
      end: w.end,
      confidence: w.probability || 0
    }));

    const segments: TranscriptionSegment[] = (response.segments || []).map((s: any, i: number) => ({
      id: i,
      text: s.text,
      start: s.start,
      end: s.end,
      words: words.filter(w => w.start >= s.start && w.end <= s.end)
    }));

    return {
      text: response.text,
      segments,
      wordTimestamps: words,
      language: response.language,
      duration: response.duration,
      confidence: this.calculateConfidence(words),
      model: response.model || 'whisper-1'
    };
  }

  private calculateConfidence(words: WordTimestamp[]): number {
    if (words.length === 0) return 0;
    const avg = words.reduce((sum, w) => sum + w.confidence, 0) / words.length;
    return Math.round(avg * 100) / 100;
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add src/services/ai/transcription-v2.ts src/types/index.ts
git commit -m "feat: add multi-model transcription service with OpenAI + Groq fallback"
```

#### Task A3: Post-Processing Correction

**Files:**
- Create: `src/services/ai/post-processing.ts`

- [ ] **Step 1: Create post-processing service**

Create `src/services/ai/post-processing.ts`:

```typescript
import OpenAI from 'openai';
import { Correction } from '@/types';

export class PostProcessingService {
  private openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }

  async correctEntities(transcript: string): Promise<{ correctedText: string; corrections: Correction[]; confidence: number }> {
    const response = await this.openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `You are a transcript correction specialist. Fix obvious errors in sales call transcripts:
1. Capitalize proper names (janine → Janine)
2. Normalize company names (clean sky energy → Clean Sky Energy)
3. Format numbers correctly (20 point 99 → 20.99)
4. Fix phone numbers, emails, addresses
5. Fix obvious mishearings based on context

Return JSON: { correctedText: string, corrections: [{original, corrected, type, confidence}] }`
        },
        { role: 'user', content: transcript }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.1
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');
    return {
      correctedText: result.correctedText || transcript,
      corrections: result.corrections || [],
      confidence: this.calculateConfidence(result.corrections || [])
    };
  }

  private calculateConfidence(corrections: Correction[]): number {
    if (corrections.length === 0) return 1;
    const avg = corrections.reduce((sum, c) => sum + (c.confidence || 0.8), 0) / corrections.length;
    return Math.round(avg * 100) / 100;
  }

  validateEntities(text: string): { phones: string[]; emails: string[]; zipCodes: string[] } {
    const phones = text.match(/\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g) || [];
    const emails = text.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g) || [];
    const zipCodes = text.match(/\b\d{5}\b/g) || [];
    return { phones, emails, zipCodes };
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/services/ai/post-processing.ts
git commit -m "feat: add post-processing correction service with LLM entity correction"
```

#### Task A4: Update Analyze Route

**Files:**
- Modify: `src/app/api/analyze/route.ts`

- [ ] **Step 1: Update analyze route to use new services**

Modify `src/app/api/analyze/route.ts` to integrate the new pipeline:

```typescript
import { AudioPreprocessingService } from '@/services/ai/audio-preprocessing';
import { TranscriptionServiceV2 } from '@/services/ai/transcription-v2';
import { PostProcessingService } from '@/services/ai/post-processing';
import { AnalysisService } from '@/services/ai/analysis';

// In the POST handler:
const audioPreprocessing = new AudioPreprocessingService();
const transcriptionService = new TranscriptionServiceV2();
const postProcessing = new PostProcessingService();
const analysisService = new AnalysisService();

// 1. Preprocess audio
const { buffer, duration } = await audioPreprocessing.preprocess(fileBuffer);
const model = audioPreprocessing.selectModel(duration);

// 2. Transcribe
const transcription = await transcriptionService.transcribe(buffer, model);

// 3. Post-process
const { correctedText, corrections, confidence } = await postProcessing.correctEntities(transcription.text);

// 4. Analyze
const analysis = await analysisService.analyze(correctedText, transcription.segments);

// Save to DB with corrected text and analysis
```

- [ ] **Step 2: Commit**

```bash
git add src/app/api/analyze/route.ts
git commit -m "feat: integrate new transcription pipeline into analyze route"
```

---

### Workstream B: Analysis Engine

#### Task B1: Prompt System

**Files:**
- Create: `src/lib/prompts/enrollment-calls.md`
- Create: `src/lib/prompts/b2b-sales.md`
- Create: `src/lib/prompts/discovery-calls.md`

- [ ] **Step 1: Create enrollment calls prompt**

Create `src/lib/prompts/enrollment-calls.md`:

```markdown
# Enrollment Calls Analysis Prompt

## System Role
You are an expert sales call analyst specializing in utility and insurance enrollment calls. Analyze the transcript and extract structured insights using MEDDIC, BANT, and SPIN methodologies.

## Output Schema
Return ONLY valid JSON with this exact structure:

```json
{
  "executiveSummary": "string (2-3 sentences)",
  "callType": "enrollment",
  "participants": [{"role": "rep|prospect", "name": "string", "talkTime": "percentage"}],
  "keyEntities": {
    "customer": "string",
    "company": "string",
    "product": "string",
    "price": "string",
    "address": "string",
    "accountNumber": "string",
    "utilityCompany": "string"
  },
  "salesScorecard": {
    "meddic": {"metrics": 0-10, "economicBuyer": 0-10, "decisionCriteria": 0-10, "decisionProcess": 0-10, "identifyPain": 0-10, "champion": 0-10},
    "bant": {"budget": 0-10, "authority": 0-10, "need": 0-10, "timeline": 0-10},
    "overallScore": 0-100
  },
  "objections": [{"type": "price|timing|features|competition|trust", "quote": "string", "handled": boolean, "resolution": "string"}],
  "commitments": [{"who": "string", "what": "string", "by": "string"}],
  "actionItems": [{"task": "string", "owner": "string", "priority": "high|medium|low", "due": "string"}],
  "nextSteps": [{"step": "string", "date": "string", "owner": "string"}],
  "coachingNotes": {"strengths": ["string"], "improvements": ["string"], "tips": ["string"]},
  "riskFlags": ["string"],
  "closeProbability": 0-100,
  "talkRatio": {"rep": 0-1, "prospect": 0-1},
  "sentimentTimeline": [{"timestamp": number, "sentiment": "positive|neutral|negative"}]
}
```

## Examples

### Example 1: Successful Enrollment
[Annotated transcript showing key extraction points]

### Example 2: Objection Handling
[Annotated transcript showing objection resolution]

## Edge Cases
- If customer declines: Set closeProbability to 0-20, add riskFlags
- If incomplete info: Note missing fields in riskFlags
- If multiple products: Extract all product details
```

- [ ] **Step 2: Create B2B sales prompt**

Create `src/lib/prompts/b2b-sales.md` (similar structure, B2B-focused)

- [ ] **Step 3: Create discovery calls prompt**

Create `src/lib/prompts/discovery-calls.md` (similar structure, discovery-focused)

- [ ] **Step 4: Commit**

```bash
git add src/lib/prompts/
git commit -m "feat: add domain-specific prompt templates for analysis"
```

#### Task B2: Unified Analysis Service

**Files:**
- Modify: `src/services/ai/analysis.ts`

- [ ] **Step 1: Rewrite analysis service**

Modify `src/services/ai/analysis.ts`:

```typescript
import OpenAI from 'openai';
import { CallAnalysis, TranscriptionSegment } from '@/types';
import fs from 'fs';
import path from 'path';

export class AnalysisService {
  private openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }

  async analyze(transcript: string, segments?: TranscriptionSegment[]): Promise<CallAnalysis> {
    const prompt = await this.loadPrompt('enrollment-calls');
    
    const response = await this.openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: prompt },
        { role: 'user', content: transcript }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3
    });

    const analysis = JSON.parse(response.choices[0].message.content || '{}');
    
    // Enrich with segment-level data
    if (segments) {
      analysis.sentimentTimeline = this.analyzeSentiment(segments);
      analysis.talkRatio = this.calculateTalkRatio(segments);
    }

    return analysis;
  }

  private async loadPrompt(domain: string): Promise<string> {
    const promptPath = path.join(process.cwd(), 'src/lib/prompts', `${domain}.md`);
    return fs.readFileSync(promptPath, 'utf-8');
  }

  private analyzeSentiment(segments: TranscriptionSegment[]): { timestamp: number; sentiment: string }[] {
    // Simple sentiment analysis based on keywords
    const positiveWords = ['great', 'perfect', 'excellent', 'yes', 'agree', 'happy', 'good'];
    const negativeWords = ['no', 'expensive', 'problem', 'issue', 'difficult', 'concern'];
    
    return segments.map(segment => {
      const text = segment.text.toLowerCase();
      const posCount = positiveWords.filter(w => text.includes(w)).length;
      const negCount = negativeWords.filter(w => text.includes(w)).length;
      
      let sentiment = 'neutral';
      if (posCount > negCount) sentiment = 'positive';
      if (negCount > posCount) sentiment = 'negative';
      
      return { timestamp: segment.start, sentiment };
    });
  }

  private calculateTalkRatio(segments: TranscriptionSegment[]): { rep: number; prospect: number } {
    // Assuming alternating speakers: even = rep, odd = prospect
    let repTime = 0;
    let prospectTime = 0;
    
    segments.forEach((segment, index) => {
      const duration = segment.end - segment.start;
      if (index % 2 === 0) {
        repTime += duration;
      } else {
        prospectTime += duration;
      }
    });
    
    const total = repTime + prospectTime;
    return {
      rep: total > 0 ? Math.round((repTime / total) * 100) / 100 : 0.5,
      prospect: total > 0 ? Math.round((prospectTime / total) * 100) / 100 : 0.5
    };
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/services/ai/analysis.ts
git commit -m "feat: rewrite analysis service with multi-pass architecture and prompt system"
```

#### Task B3: Update Types

**Files:**
- Modify: `src/types/index.ts`

- [ ] **Step 1: Add CallAnalysis types**

Add to `src/types/index.ts`:

```typescript
export interface Participant {
  role: 'rep' | 'prospect';
  name: string;
  talkTime: string;
}

export interface KeyEntities {
  customer: string;
  company: string;
  product: string;
  price: string;
  address: string;
  accountNumber: string;
  utilityCompany: string;
}

export interface SalesScorecard {
  meddic: {
    metrics: number;
    economicBuyer: number;
    decisionCriteria: number;
    decisionProcess: number;
    identifyPain: number;
    champion: number;
  };
  bant: {
    budget: number;
    authority: number;
    need: number;
    timeline: number;
  };
  overallScore: number;
}

export interface Objection {
  type: 'price' | 'timing' | 'features' | 'competition' | 'trust';
  quote: string;
  handled: boolean;
  resolution: string;
}

export interface Commitment {
  who: string;
  what: string;
  by: string;
}

export interface CoachingNotes {
  strengths: string[];
  improvements: string[];
  tips: string[];
}

export interface SentimentPoint {
  timestamp: number;
  sentiment: 'positive' | 'neutral' | 'negative';
}

export interface CallAnalysis {
  executiveSummary: string;
  callType: 'enrollment' | 'discovery' | 'follow-up' | 'objection-handling';
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
  talkRatio: { rep: number; prospect: number };
  sentimentTimeline: SentimentPoint[];
}
```

- [ ] **Step 2: Commit**

```bash
git add src/types/index.ts
git commit -m "feat: add comprehensive CallAnalysis types"
```

---

### Workstream C: UI/UX Foundation

#### Task C1: Design System Setup

**Files:**
- Modify: `src/app/globals.css`
- Modify: `tailwind.config.ts`

- [ ] **Step 1: Update global CSS**

Modify `src/app/globals.css`:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: #09090b;
    --surface: #18181b;
    --surface-hover: #27272a;
    --border: #3f3f46;
    --accent: #10b981;
    --accent-hover: #059669;
    --text-primary: #fafafa;
    --text-secondary: #a1a1aa;
    --text-muted: #71717a;
    --danger: #ef4444;
    --warning: #f59e0b;
    --success: #22c55e;
  }

  body {
    @apply bg-zinc-950 text-zinc-50 font-sans antialiased;
  }
}

@layer components {
  .doppel-outer {
    @apply p-1.5 rounded-[2rem] ring-1 ring-white/10 bg-white/5;
  }
  
  .doppel-inner {
    @apply rounded-[calc(2rem-0.375rem)] bg-zinc-900 shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)];
  }
  
  .btn-island {
    @apply rounded-full px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-medium transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.98];
  }
  
  .glass-panel {
    @apply backdrop-blur-2xl bg-black/50 border border-white/10 rounded-2xl;
  }
}
```

- [ ] **Step 2: Update Tailwind config**

Modify `tailwind.config.ts`:

```typescript
import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Geist', 'sans-serif'],
        mono: ['Geist Mono', 'monospace'],
      },
      colors: {
        background: 'var(--background)',
        surface: 'var(--surface)',
        'surface-hover': 'var(--surface-hover)',
        border: 'var(--border)',
        accent: {
          DEFAULT: 'var(--accent)',
          hover: 'var(--accent-hover)',
        },
        text: {
          primary: 'var(--text-primary)',
          secondary: 'var(--text-secondary)',
          muted: 'var(--text-muted)',
        },
      },
      animation: {
        'fade-up': 'fadeUp 0.8s ease-out forwards',
        'stagger-1': 'fadeUp 0.8s ease-out 0.1s forwards',
        'stagger-2': 'fadeUp 0.8s ease-out 0.2s forwards',
        'stagger-3': 'fadeUp 0.8s ease-out 0.3s forwards',
      },
      keyframes: {
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
```

- [ ] **Step 3: Commit**

```bash
git add src/app/globals.css tailwind.config.ts
git commit -m "feat: establish premium design system with double-bezel components"
```

#### Task C2: App Layout & Sidebar

**Files:**
- Create: `src/app/app/layout.tsx`
- Create: `src/components/app-sidebar.tsx`

- [ ] **Step 1: Create app layout**

Create `src/app/app/layout.tsx`:

```typescript
'use client';

import { AppSidebar } from '@/components/app-sidebar';
import { Toaster } from 'sonner';
import { motion } from 'framer-motion';

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen bg-zinc-950">
      <AppSidebar />
      <main className="flex-1 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.32, 0.72, 0, 1] }}
          className="p-8"
        >
          {children}
        </motion.div>
      </main>
      <Toaster
        position="top-right"
        theme="dark"
        toastOptions={{
          style: {
            background: '#18181b',
            color: '#fafafa',
            border: '1px solid #3f3f46',
          },
        }}
      />
    </div>
  );
}
```

- [ ] **Step 2: Create app sidebar**

Create `src/components/app-sidebar.tsx`:

```typescript
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  Phone,
  Mic,
  BarChart3,
  Plug,
  Settings,
  LogOut,
} from 'lucide-react';

const navItems = [
  { href: '/app', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/app/calls', label: 'Calls', icon: Phone },
  { href: '/app/record', label: 'Record', icon: Mic },
  { href: '/app/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/app/integrations', label: 'Integrations', icon: Plug },
  { href: '/app/settings', label: 'Settings', icon: Settings },
];

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-zinc-900 border-r border-zinc-800 flex flex-col">
      <div className="p-6">
        <h1 className="text-xl font-semibold text-white">CallNote Pro</h1>
      </div>
      
      <nav className="flex-1 px-3">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors mb-1
                ${isActive 
                  ? 'bg-zinc-800 text-white' 
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
                }"
            >
              <Icon className="w-5 h-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      
      <div className="p-3 border-t border-zinc-800">
        <button className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-zinc-400 hover:text-white hover:bg-zinc-800/50 w-full transition-colors">
          <LogOut className="w-5 h-5" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
```

- [ ] **Step 3: Install sonner and framer-motion**

Run: `npm install sonner framer-motion`

- [ ] **Step 4: Commit**

```bash
git add src/app/app/layout.tsx src/components/app-sidebar.tsx package.json
git commit -m "feat: create app layout with sidebar and toast notifications"
```

#### Task C3: Dashboard Page

**Files:**
- Create: `src/app/app/page.tsx`
- Create: `src/components/bento-stats.tsx`

- [ ] **Step 1: Create bento stats component**

Create `src/components/bento-stats.tsx`:

```typescript
'use client';

import { motion } from 'framer-motion';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: 'up' | 'down' | 'neutral';
  delay?: number;
}

export function StatCard({ title, value, subtitle, trend, delay = 0 }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay, ease: [0.32, 0.72, 0, 1] }}
      className="doppel-outer"
    >
      <div className="doppel-inner p-6">
        <p className="text-sm text-zinc-400 mb-1">{title}</p>
        <p className="text-3xl font-semibold text-white">{value}</p>
        {subtitle && (
          <p className="text-sm text-zinc-500 mt-1">{subtitle}</p>
        )}
        {trend && (
          <span className={`inline-block mt-2 text-xs px-2 py-1 rounded-full ${
            trend === 'up' ? 'bg-emerald-500/10 text-emerald-400' :
            trend === 'down' ? 'bg-red-500/10 text-red-400' :
            'bg-zinc-800 text-zinc-400'
          }`}>
            {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'} Trend
          </span>
        )}
      </div>
    </motion.div>
  );
}

export function BentoGrid({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {children}
    </div>
  );
}
```

- [ ] **Step 2: Create dashboard page**

Create `src/app/app/page.tsx`:

```typescript
'use client';

import { StatCard, BentoGrid } from '@/components/bento-stats';
import { motion } from 'framer-motion';

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold text-white mb-2">Dashboard</h1>
        <p className="text-zinc-400">Overview of your call analytics and performance</p>
      </div>
      
      <BentoGrid>
        <StatCard
          title="Total Calls"
          value={127}
          subtitle="Last 30 days"
          trend="up"
          delay={0}
        />
        <StatCard
          title="Avg Health Score"
          value="78%"
          subtitle="Across all calls"
          trend="up"
          delay={0.1}
        />
        <StatCard
          title="Pending Actions"
          value={12}
          subtitle="Require attention"
          trend="neutral"
          delay={0.2}
        />
        <StatCard
          title="Avg Close Rate"
          value="34%"
          subtitle="Enrollment calls"
          trend="up"
          delay={0.3}
        />
        <StatCard
          title="Avg Talk Ratio"
          value="42/58"
          subtitle="Rep/Prospect"
          trend="neutral"
          delay={0.4}
        />
        <StatCard
          title="Objections Handled"
          value="89%"
          subtitle="Resolution rate"
          trend="up"
          delay={0.5}
        />
      </BentoGrid>
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.6, ease: [0.32, 0.72, 0, 1] }}
        className="doppel-outer"
      >
        <div className="doppel-inner p-6">
          <h2 className="text-lg font-medium text-white mb-4">Recent Calls</h2>
          <div className="space-y-3">
            {/* Placeholder for recent calls list */}
            <div className="flex items-center justify-between py-3 border-b border-zinc-800">
              <div>
                <p className="text-white font-medium">Clean Sky Energy - Janine Corriere</p>
                <p className="text-sm text-zinc-500">Today at 2:15 PM</p>
              </div>
              <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-sm">
                85% Health
              </span>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/app/app/page.tsx src/components/bento-stats.tsx
git commit -m "feat: create dashboard page with bento grid stats"
```

---

## Wave 2: Core Features

### Task C4: Call Detail Page

**Files:**
- Create: `src/app/app/calls/[id]/page.tsx`
- Create: `src/components/transcript-viewer.tsx`
- Create: `src/components/analysis-panel.tsx`
- Create: `src/components/chat-sidebar.tsx`

- [ ] **Step 1: Create transcript viewer**

Create `src/components/transcript-viewer.tsx`:

```typescript
'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Download } from 'lucide-react';

interface TranscriptSegment {
  speaker: string;
  text: string;
  timestamp: number;
}

export function TranscriptViewer({ segments }: { segments: TranscriptSegment[] }) {
  const [searchQuery, setSearchQuery] = useState('');
  
  const filteredSegments = segments.filter(s => 
    s.text.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-medium text-white">Transcript</h2>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input
              type="text"
              placeholder="Search transcript..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 w-48"
            />
          </div>
          <button className="p-2 hover:bg-zinc-800 rounded-lg transition-colors">
            <Download className="w-4 h-4 text-zinc-400" />
          </button>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto space-y-4">
        {filteredSegments.map((segment, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="flex gap-3"
          >
            <span className="text-xs text-zinc-500 font-mono mt-1">
              {formatTime(segment.timestamp)}
            </span>
            <div className="flex-1">
              <span className="text-xs font-medium text-emerald-400">{segment.speaker}</span>
              <p className="text-sm text-zinc-300 mt-1">{segment.text}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}
```

- [ ] **Step 2: Create analysis panel**

Create `src/components/analysis-panel.tsx`:

```typescript
'use client';

import { motion } from 'framer-motion';
import { CheckCircle, AlertCircle, TrendingUp } from 'lucide-react';

interface AnalysisPanelProps {
  analysis: {
    executiveSummary: string;
    healthScore: number;
    actionItems: Array<{ task: string; owner: string; priority: string }>;
    keyDecisions: string[];
    nextSteps: Array<{ step: string; date: string }>;
  };
}

export function AnalysisPanel({ analysis }: AnalysisPanelProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-medium text-white mb-3">Executive Summary</h2>
        <p className="text-sm text-zinc-400 leading-relaxed">{analysis.executiveSummary}</p>
      </div>
      
      <div className="doppel-outer">
        <div className="doppel-inner p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-zinc-400">Health Score</span>
            <span className="text-2xl font-semibold text-emerald-400">{analysis.healthScore}%</span>
          </div>
          <div className="mt-2 h-2 bg-zinc-800 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${analysis.healthScore}%` }}
              transition={{ duration: 1, ease: [0.32, 0.72, 0, 1] }}
              className="h-full bg-emerald-500 rounded-full"
            />
          </div>
        </div>
      </div>
      
      <div>
        <h3 className="text-sm font-medium text-white mb-3 flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-400" />
          Action Items
        </h3>
        <div className="space-y-2">
          {analysis.actionItems.map((item, index) => (
            <div key={index} className="flex items-center justify-between py-2 px-3 bg-zinc-800/50 rounded-lg">
              <span className="text-sm text-zinc-300">{item.task}</span>
              <span className={`text-xs px-2 py-1 rounded-full ${
                item.priority === 'high' ? 'bg-red-500/10 text-red-400' :
                item.priority === 'medium' ? 'bg-amber-500/10 text-amber-400' :
                'bg-zinc-700 text-zinc-400'
              }`}>
                {item.priority}
              </span>
            </div>
          ))}
        </div>
      </div>
      
      <div>
        <h3 className="text-sm font-medium text-white mb-3 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-blue-400" />
          Key Decisions
        </h3>
        <ul className="space-y-2">
          {analysis.keyDecisions.map((decision, index) => (
            <li key={index} className="text-sm text-zinc-400 flex items-start gap-2">
              <span className="text-emerald-400 mt-1">•</span>
              {decision}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Create chat sidebar**

Create `src/components/chat-sidebar.tsx`:

```typescript
'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Send, MessageSquare } from 'lucide-react';

export function ChatSidebar() {
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const quickQueries = [
    'What objections were raised?',
    'Show all commitments',
    'What is the talk ratio?',
    'Summarize key decisions',
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    setMessages(prev => [...prev, { role: 'user', content: input }]);
    setInput('');
    setIsLoading(true);

    // Simulate API call
    setTimeout(() => {
      setMessages(prev => [...prev, { role: 'assistant', content: 'This is a simulated response. In production, this would call the /api/chat endpoint.' }]);
      setIsLoading(false);
    }, 1000);
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center gap-2 mb-4">
        <MessageSquare className="w-5 h-5 text-emerald-400" />
        <h2 className="text-lg font-medium text-white">AI Chat</h2>
      </div>
      
      <div className="flex-1 overflow-y-auto space-y-3 mb-4">
        {messages.map((msg, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`p-3 rounded-lg text-sm ${
              msg.role === 'user' 
                ? 'bg-emerald-500/10 text-emerald-100 ml-8' 
                : 'bg-zinc-800 text-zinc-300 mr-8'
            }`}
          >
            {msg.content}
          </motion.div>
        ))}
        {isLoading && (
          <div className="flex items-center gap-2 text-zinc-500 text-sm">
            <div className="w-2 h-2 bg-zinc-500 rounded-full animate-bounce" />
            <div className="w-2 h-2 bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
            <div className="w-2 h-2 bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
          </div>
        )}
      </div>
      
      <div className="space-y-2 mb-4">
        {quickQueries.map((query, index) => (
          <button
            key={index}
            onClick={() => setInput(query)}
            className="w-full text-left text-xs text-zinc-400 hover:text-white hover:bg-zinc-800 px-3 py-2 rounded-lg transition-colors"
          >
            {query}
          </button>
        ))}
      </div>
      
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about this call..."
          className="flex-1 px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
        />
        <button
          type="submit"
          disabled={isLoading}
          className="p-2 bg-emerald-500 hover:bg-emerald-600 rounded-lg transition-colors disabled:opacity-50"
        >
          <Send className="w-4 h-4 text-white" />
        </button>
      </form>
    </div>
  );
}
```

- [ ] **Step 4: Create call detail page**

Create `src/app/app/calls/[id]/page.tsx`:

```typescript
'use client';

import { TranscriptViewer } from '@/components/transcript-viewer';
import { AnalysisPanel } from '@/components/analysis-panel';
import { ChatSidebar } from '@/components/chat-sidebar';
import { motion } from 'framer-motion';

// Mock data - replace with API call
const mockSegments = [
  { speaker: 'Speaker A', text: 'Hello, this is Jesus with Clean Sky Energy.', timestamp: 0 },
  { speaker: 'Speaker B', text: 'Hi, yes this is Janine.', timestamp: 5 },
  { speaker: 'Speaker A', text: 'I am calling about a price protected renewable electricity plan.', timestamp: 10 },
];

const mockAnalysis = {
  executiveSummary: 'The customer, Janine Corriere, was contacted about enrolling in a 12-month renewable electricity plan with Clean Sky Energy. She qualified for the plan and provided necessary information including account number and service address.',
  healthScore: 85,
  actionItems: [
    { task: 'Send welcome package', owner: 'Clean Sky Energy', priority: 'high' },
    { task: 'Process enrollment', owner: 'System', priority: 'medium' },
  ],
  keyDecisions: [
    'Customer enrolled in 12-month renewable electricity plan',
    'Customer qualified for $50 Visa gift card incentive',
  ],
  nextSteps: [
    { step: 'Send welcome package', date: 'Within 5 business days' },
    { step: 'Follow up call', date: '30 days before contract end' },
  ],
};

export default function CallDetailPage({ params }: { params: { id: string } }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="h-[calc(100vh-4rem)] flex gap-6"
    >
      <div className="w-[40%] doppel-outer">
        <div className="doppel-inner p-6 h-full overflow-hidden flex flex-col">
          <TranscriptViewer segments={mockSegments} />
        </div>
      </div>
      
      <div className="w-[35%] doppel-outer">
        <div className="doppel-inner p-6 h-full overflow-y-auto">
          <AnalysisPanel analysis={mockAnalysis} />
        </div>
      </div>
      
      <div className="w-[25%] doppel-outer">
        <div className="doppel-inner p-6 h-full overflow-hidden flex flex-col">
          <ChatSidebar />
        </div>
      </div>
    </motion.div>
  );
}
```

- [ ] **Step 5: Commit**

```bash
git add src/app/app/calls/[id]/page.tsx src/components/transcript-viewer.tsx src/components/analysis-panel.tsx src/components/chat-sidebar.tsx
git commit -m "feat: create call detail page with three-panel layout"
```

---

## Wave 3: Integration & Polish

### Task C5: Calls Library Page

**Files:**
- Create: `src/app/app/calls/page.tsx`

- [ ] **Step 1: Create calls library page**

Create `src/app/app/calls/page.tsx`:

```typescript
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Search, Filter, Phone } from 'lucide-react';

const mockCalls = [
  { id: '1', customer: 'Janine Corriere', company: 'Clean Sky Energy', date: 'Today at 2:15 PM', healthScore: 85, status: 'completed' },
  { id: '2', customer: 'John Smith', company: 'Solar Plus', date: 'Yesterday at 10:30 AM', healthScore: 72, status: 'completed' },
  { id: '3', customer: 'Sarah Johnson', company: 'Green Energy Co', date: '2 days ago', healthScore: 91, status: 'completed' },
];

export default function CallsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  
  const filteredCalls = mockCalls.filter(call =>
    call.customer.toLowerCase().includes(searchQuery.toLowerCase()) ||
    call.company.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-white mb-2">Calls</h1>
          <p className="text-zinc-400">Browse and search your call history</p>
        </div>
        <Link href="/app/record" className="btn-island">
          Record Call
        </Link>
      </div>
      
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
          <input
            type="text"
            placeholder="Search calls..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-zinc-900 border border-zinc-800 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
          />
        </div>
        <button className="p-3 bg-zinc-900 border border-zinc-800 rounded-xl hover:bg-zinc-800 transition-colors">
          <Filter className="w-5 h-5 text-zinc-400" />
        </button>
      </div>
      
      <div className="space-y-3">
        {filteredCalls.map((call, index) => (
          <motion.div
            key={call.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <Link href={`/app/calls/${call.id}`}>
              <div className="doppel-outer hover:ring-emerald-500/30 transition-all cursor-pointer">
                <div className="doppel-inner p-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center">
                      <Phone className="w-5 h-5 text-zinc-400" />
                    </div>
                    <div>
                      <p className="text-white font-medium">{call.customer}</p>
                      <p className="text-sm text-zinc-500">{call.company} • {call.date}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`px-3 py-1 rounded-full text-sm ${
                      call.healthScore >= 80 ? 'bg-emerald-500/10 text-emerald-400' :
                      call.healthScore >= 60 ? 'bg-amber-500/10 text-amber-400' :
                      'bg-red-500/10 text-red-400'
                    }`}>
                      {call.healthScore}% Health
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/app/calls/page.tsx
git commit -m "feat: create calls library page with search and filtering"
```

### Task C6: Record Page

**Files:**
- Create: `src/app/app/record/page.tsx`

- [ ] **Step 1: Create record page**

Create `src/app/app/record/page.tsx`:

```typescript
'use client';

import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Mic, Square, Upload } from 'lucide-react';
import { toast } from 'sonner';

export default function RecordPage() {
  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        await uploadRecording(blob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      
      timerRef.current = setInterval(() => {
        setDuration(prev => prev + 1);
      }, 1000);

      toast.success('Recording started');
    } catch (error) {
      toast.error('Could not access microphone');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
      toast.success('Recording stopped');
    }
  };

  const uploadRecording = async (blob: Blob) => {
    const formData = new FormData();
    formData.append('file', blob, 'recording.webm');
    
    toast.promise(
      fetch('/api/analyze', { method: 'POST', body: formData }).then(res => res.json()),
      {
        loading: 'Processing recording...',
        success: 'Call analyzed successfully',
        error: 'Failed to process recording',
      }
    );
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-semibold text-white mb-2">Record Call</h1>
        <p className="text-zinc-400">Record a sales call directly from your browser</p>
      </div>
      
      <div className="doppel-outer">
        <div className="doppel-inner p-12 flex flex-col items-center justify-center">
          <motion.div
            animate={isRecording ? { scale: [1, 1.1, 1] } : {}}
            transition={{ repeat: Infinity, duration: 1.5 }}
            className="mb-6"
          >
            <div className={`w-24 h-24 rounded-full flex items-center justify-center ${
              isRecording ? 'bg-red-500/20' : 'bg-emerald-500/20'
            }`}>
              {isRecording ? (
                <Square className="w-10 h-10 text-red-400" />
              ) : (
                <Mic className="w-10 h-10 text-emerald-400" />
              )}
            </div>
          </motion.div>
          
          <p className="text-2xl font-mono text-white mb-6">{formatDuration(duration)}</p>
          
          <button
            onClick={isRecording ? stopRecording : startRecording}
            className={`px-8 py-3 rounded-full font-medium transition-all active:scale-[0.98] ${
              isRecording
                ? 'bg-red-500 hover:bg-red-600 text-white'
                : 'bg-emerald-500 hover:bg-emerald-600 text-white'
            }`}
          >
            {isRecording ? 'Stop Recording' : 'Start Recording'}
          </button>
        </div>
      </div>
      
      <div className="doppel-outer">
        <div className="doppel-inner p-6">
          <h2 className="text-lg font-medium text-white mb-4">Or Upload Audio</h2>
          <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-zinc-700 rounded-xl cursor-pointer hover:border-emerald-500/50 transition-colors">
            <Upload className="w-8 h-8 text-zinc-500 mb-2" />
            <span className="text-sm text-zinc-400">Click to upload or drag and drop</span>
            <span className="text-xs text-zinc-600 mt-1">MP3, WAV, M4A up to 50MB</span>
            <input type="file" className="hidden" accept="audio/*" />
          </label>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/app/record/page.tsx
git commit -m "feat: create record page with browser recording and upload"
```

---

## Final Integration

### Task D1: Update Middleware & Routes

**Files:**
- Modify: `src/middleware.ts`
- Modify: `next.config.mjs`

- [ ] **Step 1: Update middleware for app routes**

Modify `src/middleware.ts`:

```typescript
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

const isProtectedRoute = createRouteMatcher(['/app(.*)']);

export default clerkMiddleware((auth, req) => {
  if (isProtectedRoute(req)) {
    auth().protect();
  }
});

export const config = {
  matcher: ['/((?!.*\\..*|_next).*)', '/', '/(api|trpc)(.*)'],
};
```

- [ ] **Step 2: Commit**

```bash
git add src/middleware.ts
git commit -m "feat: protect app routes with Clerk middleware"
```

### Task D2: End-to-End Testing

**Files:**
- Create: `tests/e2e/transcription.test.ts`
- Create: `tests/e2e/analysis.test.ts`

- [ ] **Step 1: Create transcription test**

Create `tests/e2e/transcription.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { AudioPreprocessingService } from '@/services/ai/audio-preprocessing';
import { TranscriptionServiceV2 } from '@/services/ai/transcription-v2';

describe('Transcription Pipeline', () => {
  it('should preprocess audio buffer', async () => {
    const service = new AudioPreprocessingService();
    // Mock audio buffer
    const mockBuffer = Buffer.alloc(1000);
    const result = await service.preprocess(mockBuffer);
    expect(result.format).toBe('wav');
    expect(result.sampleRate).toBe(16000);
  });

  it('should select correct model based on duration', () => {
    const service = new AudioPreprocessingService();
    expect(service.selectModel(120)).toBe('whisper-1');
    expect(service.selectModel(600)).toBe('whisper-large-v3');
  });
});
```

- [ ] **Step 2: Create analysis test**

Create `tests/e2e/analysis.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { AnalysisService } from '@/services/ai/analysis';

describe('Analysis Service', () => {
  it('should analyze transcript and return structured data', async () => {
    const service = new AnalysisService();
    const transcript = 'Hello, this is a test sales call.';
    const result = await service.analyze(transcript);
    expect(result).toHaveProperty('executiveSummary');
    expect(result).toHaveProperty('healthScore');
    expect(result).toHaveProperty('actionItems');
  });
});
```

- [ ] **Step 3: Run tests**

Run: `npm test`
Expected: All tests pass

- [ ] **Step 4: Commit**

```bash
git add tests/e2e/
git commit -m "test: add e2e tests for transcription and analysis"
```

---

## Environment Variables

Add to `.env.local`:

```env
# AssemblyAI (optional fallback)
ASSEMBLYAI_API_KEY=your_assemblyai_key

# Existing vars remain unchanged
DATABASE_URL=...
OPENAI_API_KEY=...
GROQ_API_KEY=...
```

---

## Deployment Checklist

- [ ] Run `npm run build` — verify no TypeScript errors
- [ ] Run `npm test` — all tests pass
- [ ] Run `npm run lint` — no linting errors
- [ ] Test locally: `npm run dev`
- [ ] Deploy: `git push` (triggers CI/CD)
- [ ] Verify deployment at https://sales-call-notes.vercel.app

---

## Summary

**Total Tasks:** 14 tasks across 3 workstreams
**Estimated Time:** 4-6 hours with parallel execution
**Key Deliverables:**
- Accurate transcription pipeline with preprocessing and correction
- Rich analysis with MEDDIC/BANT scoring and actionable insights
- Premium UI with three-panel call detail page rivaling Otter.ai
- Professional dashboard with bento grid layout
- Complete page architecture with protected routes
