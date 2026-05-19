# AI-Powered Call Analysis Pipeline — Design Spec

**Date:** 2026-05-18
**Author:** opencode
**Status:** Draft

## Problem

Current call analysis produces vague outputs because:
1. Whisper "base" model has ~50-60% word error rate on sales calls
2. No speaker diarization — AI gets a wall of text
3. Single LLM call tries to extract everything at once
4. Keyword-based analytics miss context
5. Fallback returns first 300 characters of raw transcript

## Solution

Upgrade to cloud transcription + structured AI analysis pipeline with speaker separation.

## Architecture

### Stage 1: Transcription & Diarization
- **Primary:** OpenAI `whisper-1` API with word-level timestamps
- **Fallback:** Groq `whisper-large-v3`
- **Diarization:** Merge Whisper timestamps with pyannote.audio speaker labels
- **Output:** `[{speaker: "Speaker 1", text: "...", start: 0.5, end: 3.2}]`

### Stage 2: Structured Analysis (Single GPT-4o Call)
One well-structured prompt with JSON schema validation extracts:
- `summary`: 2-3 sentence call summary
- `actionItems`: `[{task, owner, due}]`
- `keyDecisions`: `string[]`
- `nextSteps`: `[{step, date}]`
- `topics`: `[{name, sentiment, timestamp}]`
- `talkRatio`: `{rep: number, prospect: number}`
- `objections`: `[{type, quote, timestamp}]`
- `healthScore`: 0-100
- `closeProbability`: 0-100
- `coachingNotes`: `{strengths: string[], improvements: string[], tips: string[]}`

### Stage 3: Storage & Display
- Store full transcript with speaker labels
- Store structured analysis in new `CallInsight` model
- Update dashboard to show rich insights

## Data Model Changes

```prisma
model CallInsight {
  id               String   @id @default(cuid())
  callId           String   @unique
  call             Call     @relation(fields: [callId], references: [id])
  sentimentScore   Float?
  talkRatio        Json?    // {rep: 0.4, prospect: 0.6}
  objections       Json?    // [{type, quote, timestamp}]
  coachingNotes    Json?    // {strengths, improvements, tips}
  closeProbability Float?
  topics           Json?    // [{name, sentiment}]
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt
}
```

## Files to Create/Modify

### New Files
- `src/services/ai/transcription.ts` — Cloud transcription with fallback
- `src/services/ai/diarization.ts` — Speaker separation (merge Whisper + pyannote)
- `src/services/ai/analysis.ts` — Multi-field extraction with JSON schema
- `src/lib/prompts.ts` — Sales analysis prompts with methodology context

### Modified Files
- `src/app/api/analyze/route.ts` — Use new pipeline
- `prisma/schema.prisma` — Add CallInsight model
- `src/app/dashboard/page.tsx` — Display new insights
- `src/app/api/history/[id]/route.ts` — Return insights with call data

## Implementation Order

1. Add `CallInsight` model to Prisma schema + migrate
2. Create `src/services/ai/transcription.ts` with OpenAI/Groq fallback
3. Create `src/services/ai/analysis.ts` with JSON schema validation
4. Create `src/lib/prompts.ts` with sales methodology prompts
5. Rewrite `src/app/api/analyze/route.ts` to use new pipeline
6. Update dashboard to display insights
7. Add tests for transcription and analysis services

## Cost Estimate
- Transcription: $0.006/min (OpenAI whisper-1)
- Analysis: $0.03-0.10/call (GPT-4o)
- Total: ~$0.04-0.12 per call

## Success Criteria
- Transcription accuracy >90% (vs ~50% with base model)
- Analysis returns all fields consistently (no empty summaries)
- Speaker labels present in transcript
- Health score and close probability displayed
- Coaching notes actionable and specific
