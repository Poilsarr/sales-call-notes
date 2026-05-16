# Development

## Project Structure

```
sales-call-notes/
├── src/
│   └── app/
│       ├── page.tsx          # Main UI
│       ├── layout.tsx        # Root layout
│       ├── globals.css       # Global styles
│       └── api/
│           ├── transcribe/   # Whisper integration
│           ├── summarize/    # Ollama integration
│           ├── history/      # Call history CRUD
│           └── upload/       # File upload
├── public/                   # Static assets
├── SPEC.md                   # Product requirements
└── package.json
```

## Key Files

| File | Purpose |
|------|---------|
| `src/app/page.tsx` | Landing page + AppInterface component |
| `src/app/api/transcribe/route.ts` | Spawns Whisper for transcription |
| `src/app/api/summarize/route.ts` | Calls Ollama for analysis |

## Running Locally

```bash
# Required: Whisper server on port 9000
whisper-server --port 9000 &

# Required: Ollama on port 11434
ollama serve &

# Start Next.js
npm run dev
```

## Environment Variables

Copy `.env.example` to `.env.local`:

```
# No API keys required for local Whisper + Ollama
# Production would need:
OPENAI_API_KEY=sk-...
```

## Building

```bash
npm run build   # Production build
npm run lint    # ESLint check
```

## Dependencies

- `next`: 14.2.3
- `react`: 18
- `tailwindcss`: 3.4.1
- `lucide-react`: Icons
- `clsx`, `tailwind-merge`: Utility functions