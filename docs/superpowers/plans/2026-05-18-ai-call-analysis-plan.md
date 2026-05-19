# AI-Powered Call Analysis Pipeline — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace vague call analysis with cloud transcription + structured AI pipeline that produces rich, actionable insights.

**Architecture:** 3-stage pipeline: (1) Cloud transcription with OpenAI/Groq Whisper, (2) Single GPT-4o call with JSON schema for structured extraction, (3) Store insights in new CallInsight model and display on dashboard.

**Tech Stack:** Next.js 14, TypeScript, OpenAI SDK, Prisma, PostgreSQL, Tailwind CSS

---

### File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `prisma/schema.prisma` | Modify | Add CallInsight model |
| `src/services/ai/transcription.ts` | Create | Cloud transcription with OpenAI/Groq fallback |
| `src/services/ai/analysis.ts` | Create | Structured AI analysis with JSON schema validation |
| `src/lib/prompts.ts` | Create | Sales analysis system prompt |
| `src/app/api/analyze/route.ts` | Rewrite | Orchestrate new pipeline |
| `src/app/api/history/[id]/route.ts` | Modify | Add GET endpoint returning insights |
| `src/app/dashboard/page.tsx` | Modify | Add new insight cards (close probability, coaching, objections) |
| `src/services/ai/transcription.test.ts` | Create | Tests for transcription service |
| `src/services/ai/analysis.test.ts` | Create | Tests for analysis service |

---

### Task 1: Add CallInsight Model to Prisma Schema

**Files:**
- Modify: `prisma/schema.prisma`

- [ ] **Step 1: Add CallInsight model to schema**

Append to `prisma/schema.prisma` after the `RateLimit` model:

```prisma
model CallInsight {
  id               String   @id @default(cuid())
  callId           String   @unique
  call             Call     @relation(fields: [callId], references: [id], onDelete: Cascade)
  sentimentScore   Float?
  talkRatio        Json?
  objections       Json?
  coachingNotes    Json?
  closeProbability Float?
  topics           Json?
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt

  @@index([callId])
}
```

Also add to the `Call` model (inside the `Call` block, after `analytics     Analytics?`):

```prisma
  insight         CallInsight?
```

- [ ] **Step 2: Run Prisma migration**

```bash
npx prisma migrate dev --name add_call_insights
npx prisma generate
```

- [ ] **Step 3: Commit**

```bash
git add prisma/schema.prisma
git commit -m "feat: add CallInsight model for AI analysis results"
```

---

### Task 2: Create Transcription Service

**Files:**
- Create: `src/services/ai/transcription.ts`
- Create: `src/services/ai/transcription.test.ts`

- [ ] **Step 1: Write tests for transcription service**

Create `src/services/ai/transcription.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('openai', () => ({
  OpenAI: vi.fn().mockImplementation(() => ({
    audio: {
      transcriptions: {
        create: vi.fn(),
      },
    },
  })),
}));

describe('TranscriptionService', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('should use OpenAI when API key is available', async () => {
    vi.stubEnv('OPENAI_API_KEY', 'test-key');
    const { OpenAI } = await import('openai');
    const mockCreate = vi.fn().mockResolvedValue({ text: 'Hello world transcript' });
    (OpenAI as any).mockReturnValue({
      audio: { transcriptions: { create: mockCreate } },
    });

    const { TranscriptionService } = await import('./transcription');
    const service = new TranscriptionService();
    const mockFile = new File(['test'], 'test.mp3', { type: 'audio/mp3' });
    const result = await service.transcribe(mockFile);

    expect(result.text).toBe('Hello world transcript');
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({ model: 'whisper-1', timestamp_granularities: ['word'] })
    );
  });

  it('should fallback to Groq when OpenAI key missing', async () => {
    vi.stubEnv('OPENAI_API_KEY', '');
    vi.stubEnv('GROQ_API_KEY', 'groq-key');
    const { OpenAI } = await import('openai');
    const mockCreate = vi.fn().mockResolvedValue({ text: 'Groq transcript' });
    (OpenAI as any).mockImplementation(() => ({
      audio: { transcriptions: { create: mockCreate } },
    }));

    const { TranscriptionService } = await import('./transcription');
    const service = new TranscriptionService();
    const mockFile = new File(['test'], 'test.mp3', { type: 'audio/mp3' });
    const result = await service.transcribe(mockFile);

    expect(result.text).toBe('Groq transcript');
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({ model: 'whisper-large-v3' })
    );
  });

  it('should throw when no API keys available', async () => {
    vi.stubEnv('OPENAI_API_KEY', '');
    vi.stubEnv('GROQ_API_KEY', '');

    const { TranscriptionService } = await import('./transcription');
    const service = new TranscriptionService();
    const mockFile = new File(['test'], 'test.mp3', { type: 'audio/mp3' });

    await expect(service.transcribe(mockFile)).rejects.toThrow('No transcription API key available');
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx vitest run src/services/ai/transcription.test.ts
```
Expected: FAIL with "Cannot find module './transcription'"

- [ ] **Step 3: Implement transcription service**

Create `src/services/ai/transcription.ts`:

```typescript
import { OpenAI } from 'openai';

export interface TranscriptionSegment {
  speaker: string;
  text: string;
  start: number;
  end: number;
}

export interface TranscriptionResult {
  text: string;
  segments: TranscriptionSegment[];
  language: string;
  duration: number;
}

export class TranscriptionService {
  async transcribe(file: File): Promise<TranscriptionResult> {
    const openAIKey = process.env.OPENAI_API_KEY;
    const groqKey = process.env.GROQ_API_KEY;

    if (openAIKey) {
      return this.transcribeWithOpenAI(file, openAIKey);
    }
    if (groqKey) {
      return this.transcribeWithGroq(file, groqKey);
    }

    throw new Error('No transcription API key available. Set OPENAI_API_KEY or GROQ_API_KEY.');
  }

  private async transcribeWithOpenAI(file: File, apiKey: string): Promise<TranscriptionResult> {
    const openai = new OpenAI({ apiKey });
    return this.transcribeWithProvider(openai, file, 'whisper-1');
  }

  private async transcribeWithGroq(file: File, apiKey: string): Promise<TranscriptionResult> {
    const openai = new OpenAI({ apiKey, baseURL: 'https://api.groq.com/openai/v1' });
    return this.transcribeWithProvider(openai, file, 'whisper-large-v3');
  }

  private async transcribeWithProvider(
    openai: OpenAI,
    file: File,
    model: string
  ): Promise<TranscriptionResult> {
    const response = await openai.audio.transcriptions.create({
      file,
      model,
      response_format: 'verbose_json',
      timestamp_granularities: ['word'],
    });

    const text = response.text || '';
    const words = (response as any).words || [];

    // Group words into segments by pause detection (>1.5s gap = new segment)
    const segments: TranscriptionSegment[] = this.groupWordsIntoSegments(words);

    return {
      text,
      segments,
      language: (response as any).language || 'en',
      duration: (response as any).duration || 0,
    };
  }

  private groupWordsIntoSegments(words: any[]): TranscriptionSegment[] {
    if (!words || words.length === 0) {
      return [];
    }

    const segments: TranscriptionSegment[] = [];
    let currentSegment: TranscriptionSegment = {
      speaker: 'Speaker 1',
      text: '',
      start: words[0].start,
      end: words[0].end,
    };

    for (let i = 0; i < words.length; i++) {
      const word = words[i];
      const prevWord = words[i - 1];

      if (prevWord && word.start - prevWord.end > 1.5) {
        // New segment (pause detected)
        segments.push(currentSegment);
        currentSegment = {
          speaker: 'Speaker 1',
          text: '',
          start: word.start,
          end: word.end,
        };
      }

      currentSegment.text += (currentSegment.text ? ' ' : '') + word.word;
      currentSegment.end = word.end;
    }

    if (currentSegment.text) {
      segments.push(currentSegment);
    }

    return segments;
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx vitest run src/services/ai/transcription.test.ts
```
Expected: All 3 tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/services/ai/transcription.ts src/services/ai/transcription.test.ts
git commit -m "feat: add cloud transcription service with OpenAI/Groq fallback"
```

---

### Task 3: Create Analysis Service with JSON Schema

**Files:**
- Create: `src/services/ai/analysis.ts`
- Create: `src/services/ai/analysis.test.ts`

- [ ] **Step 1: Write tests for analysis service**

Create `src/services/ai/analysis.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('openai', () => ({
  OpenAI: vi.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: vi.fn(),
      },
    },
  })),
}));

describe('AnalysisService', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('should return structured analysis from OpenAI', async () => {
    vi.stubEnv('OPENAI_API_KEY', 'test-key');
    const mockResponse = {
      choices: [{
        message: {
          content: JSON.stringify({
            summary: 'Great sales call with qualified prospect',
            actionItems: [{ task: 'Send proposal', owner: 'Rep', due: 'Friday' }],
            keyDecisions: ['Prospect agreed to demo'],
            nextSteps: [{ step: 'Follow-up call', date: 'Next Monday' }],
            healthScore: 75,
            closeProbability: 60,
            talkRatio: { rep: 0.4, prospect: 0.6 },
            objections: [{ type: 'price', quote: 'Too expensive', timestamp: 120 }],
            coachingNotes: { strengths: ['Good discovery'], improvements: ['Ask more questions'], tips: ['Use SPIN framework'] },
            topics: [{ name: 'Budget', sentiment: 'neutral' }],
          }),
        },
      }],
    };

    const { OpenAI } = await import('openai');
    (OpenAI as any).mockReturnValue({
      chat: { completions: { create: vi.fn().mockResolvedValue(mockResponse) } },
    });

    const { AnalysisService } = await import('./analysis');
    const service = new AnalysisService();
    const result = await service.analyze('Transcript text here');

    expect(result.summary).toContain('Great sales call');
    expect(result.actionItems).toHaveLength(1);
    expect(result.healthScore).toBe(75);
    expect(result.closeProbability).toBe(60);
  });

  it('should fallback to Groq when OpenAI fails', async () => {
    vi.stubEnv('OPENAI_API_KEY', '');
    vi.stubEnv('GROQ_API_KEY', 'groq-key');

    const mockResponse = {
      choices: [{
        message: { content: JSON.stringify({ summary: 'Groq summary', actionItems: [], keyDecisions: [], nextSteps: [], healthScore: 50, closeProbability: 40 }) },
      }],
    };

    const { OpenAI } = await import('openai');
    (OpenAI as any).mockReturnValue({
      chat: { completions: { create: vi.fn().mockResolvedValue(mockResponse) } },
    });

    const { AnalysisService } = await import('./analysis');
    const service = new AnalysisService();
    const result = await service.analyze('Transcript text');

    expect(result.summary).toBe('Groq summary');
  });

  it('should throw when no API keys available', async () => {
    vi.stubEnv('OPENAI_API_KEY', '');
    vi.stubEnv('GROQ_API_KEY', '');

    const { AnalysisService } = await import('./analysis');
    const service = new AnalysisService();

    await expect(service.analyze('Transcript')).rejects.toThrow('No analysis API key available');
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx vitest run src/services/ai/analysis.test.ts
```
Expected: FAIL with "Cannot find module './analysis'"

- [ ] **Step 3: Create prompts file**

Create `src/lib/prompts.ts`:

```typescript
export const SALES_ANALYSIS_PROMPT = `You are an expert sales call analyst trained in MEDDIC, BANT, and SPIN methodologies.

Analyze the following sales call transcript and extract structured insights.

Return ONLY valid JSON with this exact structure (no markdown, no code fences, no extra text):

{
  "summary": "2-3 sentence summary of the call outcome and key takeaways",
  "actionItems": [{"task": "specific action", "owner": "who does it", "due": "when"}],
  "keyDecisions": ["decision 1", "decision 2"],
  "nextSteps": [{"step": "next action", "date": "when"}],
  "healthScore": 75,
  "closeProbability": 60,
  "talkRatio": {"rep": 0.4, "prospect": 0.6},
  "objections": [{"type": "price|timing|features|competition|trust", "quote": "exact quote from transcript", "timestamp": 120}],
  "coachingNotes": {
    "strengths": ["what the rep did well"],
    "improvements": ["what the rep could improve"],
    "tips": ["specific actionable tips for next call"]
  },
  "topics": [{"name": "topic discussed", "sentiment": "positive|neutral|negative"}]
}

CRITICAL RULES:
- healthScore: 0-100 based on budget discussed, decision maker present, timeline set, objections handled
- closeProbability: 0-100 likelihood this deal will close based on call signals
- talkRatio: rep vs prospect speaking time (must sum to 1.0)
- objections: extract exact quotes with approximate timestamp in seconds
- coachingNotes: be specific and actionable, not generic
- topics: key subjects discussed with sentiment

If the transcript is too short or unclear, return reasonable defaults with lower scores.`;
```

- [ ] **Step 4: Implement analysis service**

Create `src/services/ai/analysis.ts`:

```typescript
import { OpenAI } from 'openai';
import { SALES_ANALYSIS_PROMPT } from '@/lib/prompts';

export interface AnalysisResult {
  summary: string;
  actionItems: Array<{ task: string; owner: string; due: string }>;
  keyDecisions: string[];
  nextSteps: Array<{ step: string; date: string }>;
  healthScore: number;
  closeProbability: number;
  talkRatio: { rep: number; prospect: number };
  objections: Array<{ type: string; quote: string; timestamp: number }>;
  coachingNotes: { strengths: string[]; improvements: string[]; tips: string[] };
  topics: Array<{ name: string; sentiment: string }>;
}

export class AnalysisService {
  async analyze(transcript: string): Promise<AnalysisResult> {
    const openAIKey = process.env.OPENAI_API_KEY;
    const groqKey = process.env.GROQ_API_KEY;

    if (openAIKey) {
      return this.analyzeWithOpenAI(transcript, openAIKey);
    }
    if (groqKey) {
      return this.analyzeWithGroq(transcript, groqKey);
    }

    throw new Error('No analysis API key available. Set OPENAI_API_KEY or GROQ_API_KEY.');
  }

  private async analyzeWithOpenAI(transcript: string, apiKey: string): Promise<AnalysisResult> {
    const openai = new OpenAI({ apiKey });
    return this.analyzeWithProvider(openai, transcript, 'gpt-4o');
  }

  private async analyzeWithGroq(transcript: string, apiKey: string): Promise<AnalysisResult> {
    const openai = new OpenAI({ apiKey, baseURL: 'https://api.groq.com/openai/v1' });
    return this.analyzeWithProvider(openai, transcript, 'llama-3.3-70b-versatile');
  }

  private async analyzeWithProvider(
    openai: OpenAI,
    transcript: string,
    model: string
  ): Promise<AnalysisResult> {
    const response = await openai.chat.completions.create({
      model,
      messages: [
        { role: 'system', content: SALES_ANALYSIS_PROMPT },
        { role: 'user', content: transcript },
      ],
      temperature: 0.3,
      response_format: { type: 'json_object' },
    });

    const raw = response.choices?.[0]?.message?.content || '';
    return this.parseAndValidate(raw);
  }

  private parseAndValidate(raw: string): AnalysisResult {
    const cleaned = raw.replace(/^```json\s*/i, '').replace(/```$/g, '').trim();
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);

    if (!jsonMatch) {
      throw new Error('Could not parse JSON from analysis response');
    }

    const parsed = JSON.parse(jsonMatch[0]);

    return {
      summary: parsed.summary || 'No summary available',
      actionItems: Array.isArray(parsed.actionItems) ? parsed.actionItems : [],
      keyDecisions: Array.isArray(parsed.keyDecisions) ? parsed.keyDecisions : [],
      nextSteps: Array.isArray(parsed.nextSteps) ? parsed.nextSteps : [],
      healthScore: this.clamp(parsed.healthScore ?? 50, 0, 100),
      closeProbability: this.clamp(parsed.closeProbability ?? 40, 0, 100),
      talkRatio: parsed.talkRatio || { rep: 0.5, prospect: 0.5 },
      objections: Array.isArray(parsed.objections) ? parsed.objections : [],
      coachingNotes: parsed.coachingNotes || { strengths: [], improvements: [], tips: [] },
      topics: Array.isArray(parsed.topics) ? parsed.topics : [],
    };
  }

  private clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value));
  }
}
```

- [ ] **Step 5: Run tests to verify they pass**

```bash
npx vitest run src/services/ai/analysis.test.ts
```
Expected: All 3 tests PASS

- [ ] **Step 6: Commit**

```bash
git add src/services/ai/analysis.ts src/services/ai/analysis.test.ts src/lib/prompts.ts
git commit -m "feat: add AI analysis service with JSON schema validation"
```

---

### Task 4: Rewrite Analyze Route with New Pipeline

**Files:**
- Modify: `src/app/api/analyze/route.ts`

- [ ] **Step 1: Rewrite the analyze route**

Replace entire `src/app/api/analyze/route.ts` with:

```typescript
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { TranscriptionService } from '@/services/ai/transcription';
import { AnalysisService } from '@/services/ai/analysis';

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const userId = formData.get('userId') as string;

    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    if (!userId) return NextResponse.json({ error: 'User ID required' }, { status: 400 });

    // Stage 1: Transcription
    const transcriptionService = new TranscriptionService();
    const transcriptionResult = await transcriptionService.transcribe(file);

    // Stage 2: AI Analysis
    const analysisService = new AnalysisService();
    const analysisResult = await analysisService.analyze(transcriptionResult.text);

    // Stage 3: Store in database
    const call = await prisma.call.create({
      data: {
        userId,
        filename: file.name || 'call_recording.mp3',
        transcript: transcriptionResult.text,
        duration: Math.round(transcriptionResult.duration),
        language: transcriptionResult.language,
        summary: analysisResult.summary,
        healthScore: analysisResult.healthScore / 100,
        sentiment: analysisResult.topics.length > 0
          ? analysisResult.topics[0].sentiment
          : 'neutral',
        actionItems: {
          create: analysisResult.actionItems.map(item => ({
            task: item.task,
            owner: item.owner,
            due: item.due || null,
          })),
        },
        decisions: {
          create: analysisResult.keyDecisions.map(d => ({ content: d })),
        },
        nextSteps: {
          create: analysisResult.nextSteps.map(s => ({
            step: s.step,
            date: s.date || null,
          })),
        },
        insight: {
          create: {
            sentimentScore: analysisResult.topics.reduce((acc, t) => {
              if (t.sentiment === 'positive') return acc + 1;
              if (t.sentiment === 'negative') return acc - 1;
              return acc;
            }, 0) / Math.max(analysisResult.topics.length, 1),
            talkRatio: analysisResult.talkRatio,
            objections: analysisResult.objections,
            coachingNotes: analysisResult.coachingNotes,
            closeProbability: analysisResult.closeProbability,
            topics: analysisResult.topics,
          },
        },
      },
      include: {
        insight: true,
        actionItems: true,
        decisions: true,
        nextSteps: true,
      },
    });

    return NextResponse.json({
      callId: call.id,
      summary: analysisResult.summary,
      actionItems: analysisResult.actionItems,
      keyDecisions: analysisResult.keyDecisions,
      nextSteps: analysisResult.nextSteps,
      healthScore: analysisResult.healthScore,
      closeProbability: analysisResult.closeProbability,
      talkRatio: analysisResult.talkRatio,
      objections: analysisResult.objections,
      coachingNotes: analysisResult.coachingNotes,
      topics: analysisResult.topics,
      transcript: transcriptionResult.text,
      duration: transcriptionResult.duration,
      language: transcriptionResult.language,
    });
  } catch (error: any) {
    console.error('Analyze route error:', error?.message);
    return NextResponse.json(
      { error: error?.message || 'Analysis failed' },
      { status: 500 }
    );
  }
}
```

- [ ] **Step 2: Verify build passes**

```bash
npm run build 2>&1 | tail -20
```

- [ ] **Step 3: Commit**

```bash
git add src/app/api/analyze/route.ts
git commit -m "refactor: rewrite analyze route with new transcription + analysis pipeline"
```

---

### Task 5: Add History GET Endpoint with Insights

**Files:**
- Modify: `src/app/api/history/[id]/route.ts`

- [ ] **Step 1: Add GET endpoint**

Append to `src/app/api/history/[id]/route.ts` (keep the DELETE function, add GET before it):

```typescript
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const call = await prisma.call.findUnique({
      where: { id: params.id },
      include: {
        insight: true,
        actionItems: true,
        decisions: true,
        nextSteps: true,
        speakers: true,
        analytics: true,
      },
    });

    if (!call) {
      return NextResponse.json({ error: 'Call not found' }, { status: 404 });
    }

    return NextResponse.json(call);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch call' }, { status: 500 });
  }
}

// ... existing DELETE function below ...
```

Also update the DELETE function to delete insights:

```typescript
export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    await prisma.callInsight.deleteMany({ where: { callId: params.id } });
    await prisma.actionItem.deleteMany({ where: { callId: params.id } });
    await prisma.decision.deleteMany({ where: { callId: params.id } });
    await prisma.nextStep.deleteMany({ where: { callId: params.id } });
    await prisma.speaker.deleteMany({ where: { callId: params.id } });
    await prisma.analytics.deleteMany({ where: { callId: params.id } });
    await prisma.call.delete({ where: { id: params.id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete call" }, { status: 500 });
  }
}
```

- [ ] **Step 2: Verify build passes**

```bash
npm run build 2>&1 | tail -10
```

- [ ] **Step 3: Commit**

```bash
git add src/app/api/history/[id]/route.ts
git commit -m "feat: add GET endpoint for call history with insights"
```

---

### Task 6: Update Dashboard with New Insights

**Files:**
- Modify: `src/app/dashboard/page.tsx`

- [ ] **Step 1: Add new insight cards to dashboard**

Replace the entire dashboard page with:

```typescript
"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { BarChart3, TrendingUp, Target, Brain, Phone, CheckCircle, AlertTriangle, DollarSign, Calendar, Users, ArrowUp, ArrowDown, Lightbulb, Shield, Zap } from "lucide-react";

type AnalyticsData = {
  totalCalls: number;
  totalActionItems: number;
  completionRate: number;
  avgHealthScore: number;
  avgCloseProbability: number;
  callsByDay: Record<string, number>;
  scoresByDay: Record<string, number>;
  sentimentCounts: { positive: number; neutral: number; negative: number };
  signals: { budgetSignals: number; timelineSignals: number; dmSignals: number };
  recentCalls: Array<{
    id: string;
    filename: string;
    date: string;
    healthScore: number | null;
    sentiment: string | null;
    actionItemCount: number;
    closeProbability: number | null;
    topObjection: string | null;
  }>;
};

export default function DashboardPage() {
  const { user } = useUser();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [days, setDays] = useState(30);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;
    setLoading(true);
    fetch(`/api/analytics?userId=${user.id}&days=${days}`)
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [user?.id, days]);

  if (loading) {
    return (
      <div className="min-h-screen bg-linear-black text-white flex items-center justify-center">
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 rounded-full border-t-2 border-linear-indigo animate-spin" />
          <Brain className="absolute inset-0 m-auto w-6 h-6 text-linear-indigo animate-pulse" />
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-linear-black text-white flex items-center justify-center">
        <p className="text-white/40">Sign in to view analytics</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-black text-white">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="flex items-center justify-between mb-10">
          <div>
            <h1 className="text-3xl font-medium tracking-tight">Analytics</h1>
            <p className="text-white/40 text-sm mt-1">Call performance overview</p>
          </div>
          <div className="flex gap-2">
            {[7, 30, 90].map(d => (
              <button
                key={d}
                onClick={() => setDays(d)}
                className={`px-4 py-2 rounded-lg text-xs font-medium transition ${
                  days === d ? 'bg-linear-indigo text-white' : 'bg-white/5 text-white/60 hover:text-white'
                }`}
              >
                {d}d
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          <StatCard icon={<Phone className="w-4 h-4" />} label="Total Calls" value={data.totalCalls.toString()} />
          <StatCard icon={<Target className="w-4 h-4" />} label="Action Items" value={data.totalActionItems.toString()} />
          <StatCard
            icon={<CheckCircle className="w-4 h-4" />}
            label="Completion Rate"
            value={`${Math.round(data.completionRate * 100)}%`}
          />
          <StatCard
            icon={<TrendingUp className="w-4 h-4" />}
            label="Avg Health Score"
            value={`${data.avgHealthScore}%`}
            accent={data.avgHealthScore >= 60 ? "text-green-400" : data.avgHealthScore >= 40 ? "text-yellow-400" : "text-red-400"}
          />
          <StatCard
            icon={<Zap className="w-4 h-4" />}
            label="Avg Close Probability"
            value={`${data.avgCloseProbability}%`}
            accent={data.avgCloseProbability >= 60 ? "text-green-400" : data.avgCloseProbability >= 40 ? "text-yellow-400" : "text-red-400"}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2 p-6 rounded-2xl linear-surface linear-border">
            <h3 className="text-xs font-medium text-white/40 uppercase tracking-widest mb-4">Call Signals</h3>
            <div className="grid grid-cols-3 gap-4">
              <SignalBar label="Budget" count={data.signals.budgetSignals} total={data.totalCalls} icon={<DollarSign className="w-3.5 h-3.5" />} />
              <SignalBar label="Timeline" count={data.signals.timelineSignals} total={data.totalCalls} icon={<Calendar className="w-3.5 h-3.5" />} />
              <SignalBar label="Decision Maker" count={data.signals.dmSignals} total={data.totalCalls} icon={<Users className="w-3.5 h-3.5" />} />
            </div>
          </div>
          <div className="p-6 rounded-2xl linear-surface linear-border">
            <h3 className="text-xs font-medium text-white/40 uppercase tracking-widest mb-4">Sentiment</h3>
            <div className="space-y-3">
              <SentimentRow label="Positive" count={data.sentimentCounts.positive} color="text-green-400" icon={<ArrowUp className="w-3 h-3" />} />
              <SentimentRow label="Neutral" count={data.sentimentCounts.neutral} color="text-yellow-400" icon={<ArrowUp className="w-3 h-3 opacity-0" />} />
              <SentimentRow label="Negative" count={data.sentimentCounts.negative} color="text-red-400" icon={<ArrowDown className="w-3 h-3" />} />
            </div>
          </div>
        </div>

        <div className="p-6 rounded-2xl linear-surface linear-border mb-8">
          <h3 className="text-xs font-medium text-white/40 uppercase tracking-widest mb-4">Recent Calls</h3>
          <div className="space-y-2">
            {data.recentCalls.map(call => (
              <div key={call.id} className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/5 text-xs">
                <div className="flex items-center gap-3">
                  <Phone className="w-3.5 h-3.5 text-white/40" />
                  <span className="font-medium">{call.filename}</span>
                  <span className="text-white/30">{new Date(call.date).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className={`${call.healthScore && call.healthScore >= 60 ? 'text-green-400' : call.healthScore && call.healthScore >= 40 ? 'text-yellow-400' : 'text-red-400'}`}>
                    {call.healthScore ? `${Math.round(call.healthScore * 100)}%` : 'N/A'}
                  </span>
                  <span className="text-white/40">{call.actionItemCount} items</span>
                  {call.closeProbability && (
                    <span className="text-linear-indigo">{Math.round(call.closeProbability)}% close</span>
                  )}
                  {call.topObjection && (
                    <span className="text-red-400/70 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" />
                      {call.topObjection}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, accent }: { icon: React.ReactNode; label: string; value: string; accent?: string }) {
  return (
    <div className="p-5 rounded-2xl linear-surface linear-border">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-white/40">{icon}</span>
        <span className="text-[11px] font-medium text-white/40 uppercase tracking-wider">{label}</span>
      </div>
      <span className={`text-2xl font-semibold tracking-tight ${accent || 'text-white'}`}>{value}</span>
    </div>
  );
}

function SignalBar({ label, count, total, icon }: { label: string; count: number; total: number; icon: React.ReactNode }) {
  const pct = total > 0 ? (count / total) * 100 : 0;
  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <span className="text-white/40">{icon}</span>
        <span className="text-xs font-medium text-white/60">{label}</span>
        <span className="text-xs text-white/40 ml-auto">{count}/{total}</span>
      </div>
      <div className="h-2 rounded-full bg-white/5 overflow-hidden">
        <div className="h-full rounded-full bg-linear-indigo transition-all duration-500" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function SentimentRow({ label, count, color, icon }: { label: string; count: number; color: string; icon: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between text-xs">
      <span className="flex items-center gap-2">
        <span className={color}>{icon}</span>
        <span className="text-white/60">{label}</span>
      </span>
      <span className={`font-medium ${color}`}>{count}</span>
    </div>
  );
}
```

- [ ] **Step 2: Update analytics API to return new fields**

Modify `src/app/api/analytics/route.ts`:

1. Add `include: { insight: true }` to the `prisma.call.findMany` call (line 20-28):
```typescript
    const calls = await prisma.call.findMany({
      where: { userId, createdAt: { gte: since } },
      include: {
        actionItems: true,
        decisions: true,
        nextSteps: true,
        analytics: true,
        insight: true,
      },
      orderBy: { createdAt: 'desc' },
    });
```

2. Add avgCloseProbability calculation after avgHealthScore (line 37):
```typescript
    const avgCloseProbability = calls.length > 0
      ? calls.reduce((sum, c) => sum + (c.insight?.closeProbability || 0), 0) / calls.length
      : 0;
```

3. Add `avgCloseProbability` to the return object (line 58):
```typescript
    return NextResponse.json({
      totalCalls,
      totalActionItems,
      completionRate: totalActionItems > 0 ? completedItems / totalActionItems : 0,
      avgHealthScore: Math.round(avgHealthScore * 100),
      avgCloseProbability: Math.round(avgCloseProbability),
      callsByDay,
      scoresByDay,
      sentimentCounts,
      signals: { budgetSignals, timelineSignals, dmSignals },
      recentCalls: calls.slice(0, 5).map(c => ({
        id: c.id,
        filename: c.filename,
        date: c.createdAt,
        healthScore: c.healthScore,
        sentiment: c.sentiment,
        actionItemCount: c.actionItems.length,
        closeProbability: c.insight?.closeProbability || null,
        topObjection: c.insight?.objections?.[0]?.type || null,
      })),
    });
```

- [ ] **Step 3: Verify build passes**

```bash
npm run build 2>&1 | tail -10
```

- [ ] **Step 4: Commit**

```bash
git add src/app/dashboard/page.tsx src/app/api/analytics/route.ts
git commit -m "feat: update dashboard with close probability and objection insights"
```

---

### Task 7: Run Full Test Suite and Deploy

- [ ] **Step 1: Run all tests**

```bash
npx vitest run
```
Expected: All tests PASS (existing + new transcription/analysis tests)

- [ ] **Step 2: Run full build**

```bash
npm run build
```
Expected: Build succeeds with no errors

- [ ] **Step 3: Push to trigger CI/CD**

```bash
git push
```

Note: If branch protection blocks direct push, create a PR branch:
```bash
git checkout -b feat/ai-call-analysis
git push -u origin feat/ai-call-analysis
```
