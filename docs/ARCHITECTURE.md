# Architecture

## System Overview

CallNote Pro follows a client-server architecture with Next.js App Router.

## Components

### Frontend (src/app/)

- `page.tsx` - Main app with landing page + modal interface
- `layout.tsx` - Root layout with metadata
- `globals.css` - TailwindCSS styles

### API Routes (src/app/api/)

| Route | Purpose |
|-------|---------|
| `/api/transcribe` | Audio file → transcript text (Whisper) |
| `/api/summarize` | Transcript → structured JSON (Ollama) |
| `/api/history` | CRUD operations for call history |
| `/api/upload` | File upload handling |

### External Services

- **Whisper**: Local Python transcription server (localhost:9000)
- **Ollama**: Local LLM server (localhost:11434)

## Data Flow

1. User uploads audio file → `/api/upload`
2. Upload route spawns Whisper process → returns transcript
3. Transcript sent to `/api/summarize` → Ollama processing
4. Results displayed in UI, saved to localStorage

## Storage

- **localStorage**: Call history (transcripts, summaries, action items)
- **In-memory**: API route handlers (demo mode)

## Future Considerations

- Prisma + PostgreSQL for persistent storage
- Clerk for authentication
- Cloud storage for audio files