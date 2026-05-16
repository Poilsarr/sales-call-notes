# CallNote Pro

Turn sales call recordings into actionable notes in seconds. Free for SDRs.

## Overview

CallNote Pro is a Next.js webapp that transcribes sales call audio and extracts actionable insights using local AI models (Whisper + Ollama).

## Features

- **Audio Upload**: Drag-drop or click to upload MP3, WAV, M4A, WebM files
- **Local Transcription**: Free transcription via local Whisper model
- **AI Summarization**: Extract summary, action items, key decisions, next steps
- **One-Click Export**: Copy formatted text for CRM (HubSpot/Salesforce)
- **Call History**: Store and search past transcripts in localStorage

## Quick Start

```bash
# Install dependencies
npm install

# Start local Whisper server (required for transcription)
# pip install whisper (or use whisper-server)

# Start Ollama (required for summarization)
# ollama serve
# ollama pull minimax-m2:cloud

# Run development server
npm run dev
```

Visit `http://localhost:3003` to use the app.

## Tech Stack

- **Frontend**: Next.js 14, React 18, TailwindCSS
- **Transcription**: Local Whisper (Python)
- **Summarization**: Ollama (local LLM)
- **Storage**: localStorage (MVP)

## License

Private - All rights reserved.