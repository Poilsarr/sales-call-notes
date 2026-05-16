# Sales Call Notes - Product Requirements Document

## 1. Product Overview

**Product Name:** CallNote Pro
**Target Users:** SDRs/BDRs at early-stage startups (2-10 person sales teams)
**Core Value:** Turn sales call recordings into actionable notes in seconds - no manual note-taking, fast handoff to AEs

## 2. User Stories

| Story | Priority |
|-------|----------|
| As an SDR, I want to upload an audio file and get extracted action items so I don't forget follow-ups | P0 |
| As an SDR, I want one-click copy to CRM format so I can paste directly into HubSpot/Salesforce | P0 |
| As an SDR, I want to see my call history so I can review past conversations | P1 |
| As an SDR, I want multiple speakers identified so I know who said what | P1 |
| As a sales manager, I want team sharing so I can see all SDR notes in one place | P2 |
| As an SDR, I want recording directly from browser so I don't need to transfer files | P2 |

## 3. Feature Requirements

### P0 - Must Have

1. **Audio Upload & Transcription**
   - Drag-drop or click to upload (MP3, WAV, M4A, WebM)
   - Local Whisper for free transcription
   - Progress indicator during transcription

2. **AI-Powered Analysis**
   - Extract summary (2-3 sentences)
   - Extract action items (task, owner, due date)
   - Extract key decisions made
   - Extract next steps with dates
   - Handle both discovery calls and enrollment calls

3. **One-Click Export**
   - Copy formatted text for CRM (HubSpot/Salesforce compatible)
   - JSON export for API integrations

### P1 - Should Have

4. **Call History**
   - Store past transcripts + summaries in localStorage
   - Search/filter by date, customer name
   - Delete individual entries

5. **Speaker Diarization** (if Whisper supports)
   - Label different speakers (Speaker 1, Speaker 2)

6. **Improved UI/UX**
   - Empty states handled gracefully
   - Better loading states
   - Mobile responsive

### P2 - Nice to Have

7. **Team Features**
   - Simple sharing via link (no auth initially)
   - Team dashboard view

8. **Browser Recording**
   - Record directly from browser microphone

## 4. Technical Architecture

### Stack
- **Frontend:** Next.js 14 + React + TailwindCSS
- **Transcription:** Local Whisper (Python via spawn)
- **Summarization:** Ollama (local free models)
- **Storage:** localStorage (for MVP), Prisma/Postgres (future)
- **Auth:** Optional (Clerk ready in package.json)

### API Routes
```
POST /api/transcribe  - Audio → transcript text
POST /api/summarize   - Transcript → structured JSON
GET  /api/history     - List past calls
POST /api/history     - Save call to history
DELETE /api/history/[id] - Delete call
```

### Data Model (localStorage)
```typescript
interface CallRecord {
  id: string;
  createdAt: string;
  filename: string;
  transcript: string;
  summary: string;
  actionItems: ActionItem[];
  keyDecisions: string[];
  nextSteps: NextStep[];
}
```

## 5. UI/UX Design

### Layout
- **Header:** Logo + "CallNote Pro" + History button
- **Main:** Upload area (hero) + Results panel
- **Footer:** Minimal - "Free for SDRs"

### Color Scheme
- Primary: `#2563EB` (blue-600)
- Background: `#F9FAFB` (gray-50)
- Cards: White with subtle shadows
- Success: `#16A34A` (green-600)

### Typography
- Headings: Inter Bold
- Body: Inter Regular
- Monospace (for JSON): JetBrains Mono

## 6. Success Metrics

| Metric | Target |
|--------|--------|
| Transcription time | < 30s for 5-min audio |
| Summarization time | < 10s |
| Action items accuracy | > 80% (user confirmed) |
| Time saved per call | 5-10 minutes |

## 7. Roadmap

### Phase 1 (Current - MVP)
- [x] Audio upload
- [x] Transcription (Whisper)
- [x] Summarization (Ollama)
- [x] Copy to clipboard
- [x] Empty state handling

### Phase 2 (This Sprint)
- [ ] Call history with localStorage
- [ ] Search/filter history
- [ ] Delete history entries
- [ ] Better loading states
- [ ] Mobile responsive

### Phase 3 (Future)
- [ ] Browser microphone recording
- [ ] Team sharing
- [ ] CRM integrations (HubSpot, Salesforce)
- [ ] Auth (Clerk)
- [ ] Cloud storage (Prisma + Postgres)